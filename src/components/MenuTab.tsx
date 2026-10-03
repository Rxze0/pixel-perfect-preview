import { useMemo, useState } from "react";
import { AlertTriangle, Heart, Minus, Plus } from "lucide-react";
import { ALLERGENS, CATEGORIES, type Restaurant } from "@/lib/data";
import { useStore } from "@/lib/store";

type Sort = "none" | "kcal" | "protein" | "price";

export function MenuTab({ r }: { r: Restaurant }) {
  const st = useStore();
  const [sort, setSort] = useState<Sort>("none");
  const [cat, setCat] = useState<string>("all");

  const dishes = useMemo(() => {
    let d = r.dishes.filter((x) => cat === "all" || x.category === cat);
    if (sort === "kcal") d = [...d].sort((a, b) => a.kcal - b.kcal);
    if (sort === "protein") d = [...d].sort((a, b) => b.p - a.p);
    if (sort === "price") d = [...d].sort((a, b) => a.price - b.price);
    return d;
  }, [r, sort, cat]);

  const blocked = (a: string[]) => a.some((x) => st.allergens.includes(x as never));
  const all = RESTAURANT_DISHES();
  const items = st.order.map((o) => ({ ...o, dish: all.get(o.dishId)! })).filter((o) => o.dish);
  const tot = items.reduce((s, o) => ({ price: s.price + o.dish.price * o.qty, kcal: s.kcal + o.dish.kcal * o.qty, p: s.p + o.dish.p * o.qty, f: s.f + o.dish.f * o.qty, c: s.c + o.dish.c * o.qty }), { price: 0, kcal: 0, p: 0, f: 0, c: 0 });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <section className="card-surface p-4">
          <h3 className="text-lg font-semibold">Аллергены — исключить</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALLERGENS.map((a) => {
              const on = st.allergens.includes(a.id);
              return (
                <label key={a.id} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${on ? "border-busy bg-busy/20" : "bg-background"}`}>
                  <input type="checkbox" checked={on} onChange={() => st.toggleAllergen(a.id)} className="accent-[var(--busy)]" />{a.label}
                </label>
              );
            })}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={st.hideStruck} onChange={(e) => st.set({ hideStruck: e.target.checked })} />
            Скрыть вычеркнутые блюда
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          {[{ id: "all", label: "Все" }, ...CATEGORIES].map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{c.label}</button>
          ))}
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Сортировка" className="ml-auto h-10 rounded-full border bg-card px-3 text-sm">
            <option value="none">Без сортировки</option>
            <option value="kcal">Калории ↑</option>
            <option value="protein">Белок ↓</option>
            <option value="price">Цена ↑</option>
          </select>
        </div>

        {CATEGORIES.filter((c) => cat === "all" || c.id === cat).map((c) => {
          const list = dishes.filter((d) => d.category === c.id && !(st.hideStruck && blocked(d.allergens)));
          if (!list.length) return null;
          return (
            <section key={c.id}>
              <h3 className="mb-3 text-2xl font-semibold">{c.label}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {list.map((d) => {
                  const bad = blocked(d.allergens);
                  const fav = st.favDishes.includes(d.id);
                  return (
                    <article key={d.id} className={`card-surface flex gap-3 p-3 transition ${bad ? "opacity-50" : ""}`}>
                      <img src={d.img} alt={d.name} width={96} height={96} loading="lazy" className={`h-24 w-24 shrink-0 rounded-xl object-cover ${bad ? "grayscale" : ""}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-bold leading-tight ${bad ? "line-through" : ""}`}>{bad && <AlertTriangle className="mr-1 inline h-4 w-4 text-busy" aria-label="Содержит аллерген" />}{d.name}</h4>
                          <button aria-label="Избранное" onClick={() => st.toggleFav("favDishes", d.id)}><Heart className={`h-4 w-4 ${fav ? "fill-busy text-busy" : "text-muted-foreground"}`} /></button>
                        </div>
                        <p className={`text-xs text-muted-foreground ${bad ? "line-through" : ""}`}>{d.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1 text-[11px] font-bold text-macro-foreground">
                          <span className="rounded-md bg-kcal px-1.5 py-0.5">{d.kcal} ккал</span>
                          <span className="rounded-md bg-prot px-1.5 py-0.5">Б {d.p}г</span>
                          <span className="rounded-md bg-fat px-1.5 py-0.5">Ж {d.f}г</span>
                          <span className="rounded-md bg-carb px-1.5 py-0.5">У {d.c}г</span>
                        </div>
                        {d.allergens.length > 0 && <p className="mt-1 text-[11px] text-muted-foreground">Аллергены: {d.allergens.map((a) => ALLERGENS.find((x) => x.id === a)!.label.toLowerCase()).join(", ")}</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-bold">{d.price} ₸</span>
                          <button disabled={bad} onClick={() => st.addToOrder(r.id, d.id)}
                            className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground">
                            {bad ? "Недоступно" : "Добавить в мой заказ"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <aside className="card-surface h-fit p-4 lg:sticky lg:top-20">
        <h3 className="text-xl font-semibold">Мой заказ</h3>
        {items.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Пока пусто — добавьте блюда.</p> : (
          <ul className="mt-3 space-y-2">
            {items.map((o) => (
              <li key={o.dishId} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{o.dish.name}</span>
                <button aria-label="Меньше" onClick={() => st.changeQty(o.dishId, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-secondary"><Minus className="h-3 w-3" /></button>
                <span className="w-5 text-center font-bold">{o.qty}</span>
                <button aria-label="Больше" onClick={() => st.changeQty(o.dishId, 1)} className="grid h-7 w-7 place-items-center rounded-full bg-secondary"><Plus className="h-3 w-3" /></button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-macro-foreground">
          <span className="rounded-lg bg-kcal p-2">{tot.kcal} ккал</span>
          <span className="rounded-lg bg-prot p-2">Белки {tot.p} г</span>
          <span className="rounded-lg bg-fat p-2">Жиры {tot.f} г</span>
          <span className="rounded-lg bg-carb p-2">Углеводы {tot.c} г</span>
        </div>
        <p className="mt-4 flex justify-between border-t pt-3 text-lg font-bold"><span>Итого</span><span>{tot.price} ₸</span></p>
        {items.length > 0 && <button onClick={() => st.set({ order: [] })} className="mt-2 text-sm text-muted-foreground underline">Очистить</button>}
      </aside>
    </div>
  );
}

import { RESTAURANTS } from "@/lib/data";
let cache: Map<string, Restaurant["dishes"][number]> | null = null;
function RESTAURANT_DISHES() {
  if (!cache) cache = new Map(RESTAURANTS.flatMap((r) => r.dishes.map((d) => [d.id, d] as const)));
  return cache;
}
