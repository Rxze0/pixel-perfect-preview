import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { RESTAURANTS } from "@/lib/restaurants";

const Body = z.object({
  restaurantId: z.string(),
  restrictions: z.array(z.string()).default([]),
  favorites: z.array(z.string()).default([]),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
});

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
    return res;
  };
}

export const Route = createFileRoute("/api/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const { restaurantId, restrictions, favorites, messages } = parsed.data;
        const r = RESTAURANTS.find((x) => x.id === restaurantId);
        if (!r) return new Response("Unknown restaurant", { status: 400 });
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Assistant is not configured", { status: 500 });

        const menu = r.menu.map((d) => `- ${d.name} [${d.category}] — ${d.price} ₸; ${d.calories} kcal, P${d.protein}/F${d.fat}/C${d.carbs}; ingredients: ${d.ingredients}`).join("\n");
        const seats = r.areas.map((a) => `- ${a.name}: ${a.vibe ?? ""} (tables: ${r.tables.filter((t) => t.area === a.name).map((t) => `${t.label} ${t.seats} seats`).join(", ")})`).join("\n");
        const system = `You are "Restaurant helper" for ${r.name} (${r.tagline}). ${r.concept}
Reply in the same language the guest writes in. Be warm, concise, use markdown.

MENU (prices in tenge, one serving each):
${menu}

SEATING:
${seats}

GUEST PROFILE: restrictions: ${restrictions.join(", ") || "none"}; favorite dishes: ${favorites.join(", ") || "none"}.

BUDGET RULES (critical):
- When the guest gives a budget, build a BALANCED set for the number of people (default 2 for a date): e.g. a starter to share, a different main for each person, plus a dessert if it fits.
- Never let one expensive item (like a huge steak) eat most of the budget if it means someone goes hungry.
- Total must be <= budget, ideally close to it. Only use dishes and exact prices from the menu.
- Output: a list "dish × qty — price", then **Total**, **Change left** (budget − total), and a short "why it's filling and tasty" (mention kcal/protein).
- Double-check the arithmetic before answering.
- Avoid dishes conflicting with the guest's restrictions, and say so if relevant.
SEATING ADVICE: recommend a concrete area/table for the occasion (date, business meeting, birthday) using the seating vibes.
Only talk about this restaurant, its menu and visit planning.`;

        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch(),
        });
        try {
          const result = streamText({
            model: openai.responses("openai/gpt-6-astra"),
            system,
            messages,
            maxRetries: 0,
            abortSignal: request.signal,
            providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
          });
          return result.toTextStreamResponse();
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode ?? 500;
          return new Response(status === 402 ? "Out of AI credits." : status === 429 ? "Too many requests, try again in a moment." : "Assistant error.", { status });
        }
      },
    },
  },
});
