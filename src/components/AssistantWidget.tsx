import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRestaurant } from "@/lib/restaurants";
import { useAuth } from "@/lib/auth";

type Msg = { role: "user" | "assistant"; content: string };
const SUGGEST = [
  "Date tonight, budget 30 000 ₸ for two — what should we order?",
  "Which table is best for a business meeting?",
  "I'm allergic to nuts — what can I eat?",
];

export function AssistantWidget() {
  const { restaurant } = useRestaurant();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const stop = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(q: string) {
    if (!q.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q.trim() }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setText(""); setBusy(true);
    const ac = new AbortController(); stop.current = ac;
    const put = (c: string) => setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: c }]);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/assistant`.replace("//api", "/api"), {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ac.signal,
        body: JSON.stringify({ restaurantId: restaurant.id, restrictions: auth.user?.restrictions ?? [], favorites: auth.user?.favorites ?? [], messages: next }),
      });
      if (!res.ok || !res.body) { put(`⚠️ ${(await res.text()) || "The assistant is unavailable right now."}`); return; }
      const rd = res.body.getReader(); const dec = new TextDecoder(); let acc = "";
      for (;;) { const { done, value } = await rd.read(); if (done) break; acc += dec.decode(value, { stream: true }); put(acc); endRef.current?.scrollIntoView({ block: "end" }); }
      if (!acc) put("⚠️ No answer this time.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") put("⚠️ The assistant is unavailable right now.");
    } finally { setBusy(false); stop.current = null; }
  }

  return (
    <>
      <button className="ai-fab" aria-label="Open restaurant helper" onClick={() => setOpen((o) => !o)}>{open ? "✕" : "🍽️"}</button>
      {open && (
        <div className="ai-panel" role="dialog" aria-label="Restaurant helper">
          <div className="ai-head"><b>Restaurant helper</b><span>{restaurant.name}</span></div>
          <div className="ai-body">
            {msgs.length === 0 && (
              <div className="ai-empty">
                <p>Tell me your budget, occasion or allergies — I'll build a set and pick a table.</p>
                {SUGGEST.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={"ai-msg " + m.role}>
                {m.role === "assistant" ? (m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="ai-dots">Thinking…</span>) : m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="ai-form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <textarea value={text} rows={2} placeholder="e.g. Date, 30 000 ₸ for two…" onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
            {busy ? <button type="button" className="cta" onClick={() => stop.current?.abort()}>Stop</button> : <button className="cta" disabled={!text.trim()}>Send</button>}
          </form>
        </div>
      )}
    </>
  );
}
