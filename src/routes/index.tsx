import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, Search, Star } from "lucide-react";
import { RESTAURANTS } from "@/lib/data";
import { displayStatus, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Стол и Меню — каталог ресторанов" },
      { name: "description", content: "Найдите ресторан, посмотрите КБЖУ блюд, отфильтруйте аллергены и забронируйте стол онлайн." },
      { property: "og:title", content: "Стол и Меню — каталог ресторанов" },
      { property: "og:description", content: "Меню с КБЖУ, фильтр аллергенов и свободные столы в реальном времени." },
    ],
  }),
  component: Index,
});

function Index() {
  const { tables, now, favRestaurants, toggleFav } = useStore();
  const [q, setQ] = useState("");
  const [onlyFav, setOnlyFav] = useState(false);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return RESTAURANTS.filter((r) => (!s || r.name.toLowerCase().includes(s) || r.cuisine.toLowerCase().includes(s)) && (!onlyFav || favRestaurants.includes(r.id)));
  }, [q, onlyFav, favRestaurants]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Куда пойдём <span className="text-accent italic">сегодня?</span></h1>
      <p className="mt-2 text-muted-foreground">Меню с КБЖУ, фильтр аллергенов и свободные столы прямо сейчас.</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название или кухня…" maxLength={60}
            className="h-12 w-full rounded-xl border bg-card pl-10 pr-3 outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <button onClick={() => setOnlyFav(!onlyFav)} aria-pressed={onlyFav}
          className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-4 font-semibold transition ${onlyFav ? "bg-primary text-primary-foreground" : "bg-card"}`}>
          <Heart className={`h-4 w-4 ${onlyFav ? "fill-current" : ""}`} /> Избранные
        </button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r, i) => {
          const free = r.tables.filter((t) => displayStatus(tables[t.id], now) === "free").length;
          const fav = favRestaurants.includes(r.id);
          return (
            <article key={r.id} className="card-surface group relative overflow-hidden animate-in fade-in slide-in-from-bottom-3" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
              <Link to="/restaurant/$id" params={{ id: r.id }} className="block">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={r.img} alt={r.name} width={1024} height={640} loading={i < 2 ? "eager" : "lazy"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 truncate text-xl font-semibold">{r.name}</h2>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-bold"><Star className="h-4 w-4 fill-accent text-accent" />{r.rating}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.cuisine} · {r.address}</p>
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-free/25 px-3 py-1 text-sm font-semibold">
                    <span className="pulse-dot h-2 w-2 rounded-full bg-free" aria-hidden /> Свободно столов: {free} из {r.tables.length}
                  </p>
                </div>
              </Link>
              <button aria-label={fav ? "Убрать из избранного" : "В избранное"} onClick={() => toggleFav("favRestaurants", r.id)}
                className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-card/90 backdrop-blur transition hover:scale-110">
                <Heart className={`h-5 w-5 ${fav ? "fill-busy text-busy" : ""}`} />
              </button>
            </article>
          );
        })}
        {list.length === 0 && <p className="text-muted-foreground">Ничего не найдено.</p>}
      </div>
    </main>
  );
}
