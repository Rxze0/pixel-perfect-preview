import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MENU, MENU_CATEGORIES } from "@/lib/menu";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — SitABit" },
      { name: "description", content: "The full menu with calories, protein, fat and carbs for every dish." },
      { property: "og:title", content: "Menu — SitABit" },
      { property: "og:description", content: "The full menu with calories, protein, fat and carbs for every dish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const [cat, setCat] = useState("All");
  const list = cat === "All" ? MENU : MENU.filter((d) => d.category === cat);
  return (
    <div className="menu-page">
      <header className="menu-head">
        <Link to="/" className="for-rest">← Back</Link>
        <div className="eyebrow">Tonight's kitchen</div>
        <h1>The menu</h1>
        <p className="muted">Every dish with calories, protein, fat and carbs per serving.</p>
      </header>
      <div className="menu-filters" role="tablist">
        {MENU_CATEGORIES.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className={"menu-chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="menu-grid" key={cat}>
        {list.map((d, i) => (
          <article className="menu-card" key={d.name} style={{ ["--i" as string]: i }}>
            <div className="menu-cat">{d.category}</div>
            <h2>{d.name}</h2>
            <p>{d.ingredients}</p>
            <div className="kbju">
              <span className="kcal"><b>{d.calories}</b> kcal</span>
              <span><b>{d.protein}</b>g protein</span>
              <span><b>{d.fat}</b>g fat</span>
              <span><b>{d.carbs}</b>g carbs</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
