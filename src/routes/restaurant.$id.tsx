import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Heart, Star } from "lucide-react";
import { getRestaurant } from "@/lib/data";
import { useStore } from "@/lib/store";
import { MenuTab } from "@/components/MenuTab";
import { TablesTab } from "@/components/TablesTab";

export const Route = createFileRoute("/restaurant/$id")({
  loader: ({ params }) => {
    const r = getRestaurant(params.id);
    if (!r) throw notFound();
    return { id: r.id, name: r.name, cuisine: r.cuisine };
  },
  head: ({ loaderData }) => loaderData ? {
    meta: [
      { title: `${loaderData.name} — меню с КБЖУ и бронь стола` },
      { name: "description", content: `${loaderData.cuisine} кухня: меню с КБЖУ, аллергены и свободные столы в ${loaderData.name}.` },
      { property: "og:title", content: `${loaderData.name} — Стол и Меню` },
      { property: "og:description", content: `Меню, КБЖУ и бронирование столов в ${loaderData.name}.` },
    ],
  } : { meta: [{ title: "Ресторан не найден" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => <div className="p-10 text-center">Ресторан не найден. <Link to="/" className="underline">На главную</Link></div>,
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
  component: Page,
});

function Page() {
  const { id } = Route.useLoaderData();
  const r = getRestaurant(id)!;
  const { favRestaurants, toggleFav } = useStore();
  const [tab, setTab] = useState<"menu" | "tables">("menu");
  const fav = favRestaurants.includes(r.id);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-4">
      <div className="relative overflow-hidden rounded-2xl">
        <img src={r.img} alt={r.name} width={1024} height={640} className="h-48 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
        <Link to="/" aria-label="Назад" className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-card/90"><ArrowLeft className="h-5 w-5" /></Link>
        <button aria-label="Избранное" onClick={() => toggleFav("favRestaurants", r.id)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-card/90"><Heart className={`h-5 w-5 ${fav ? "fill-busy text-busy" : ""}`} /></button>
        <div className="absolute bottom-4 left-4 right-4 text-background">
          <h1 className="text-3xl font-bold sm:text-5xl">{r.name}</h1>
          <p className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 fill-accent text-accent" />{r.rating} · {r.cuisine} · {r.address}</p>
        </div>
      </div>

      <div role="tablist" className="my-5 inline-flex rounded-full bg-secondary p-1">
        {(["menu", "tables"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full px-6 py-2 font-bold transition ${tab === t ? "bg-card shadow" : "text-muted-foreground"}`}>{t === "menu" ? "Меню" : "Столы"}</button>
        ))}
      </div>
      {tab === "menu" ? <MenuTab r={r} /> : <TablesTab r={r} />}
    </main>
  );
}
