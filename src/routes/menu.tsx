import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RestaurantPicker, useRestaurant } from "@/lib/restaurants";
import { AccountButton, useAuth } from "@/lib/auth";

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
  const auth = useAuth();
  const { restaurant } = useRestaurant();
  const MENU = restaurant.menu, MENU_CATEGORIES = restaurant.categories;
  const cat2 = MENU_CATEGORIES.includes(cat) ? cat : "All";
  const favs = auth.user?.favorites ?? [];
  const toggleFav = (name: string) => {
    if (!auth.requireUser("Saving favorite dishes")) return;
    auth.updateUser({ favorites: favs.includes(name) ? favs.filter((f) => f !== name) : [...favs, name] });
  };
  const list = cat2 === "All" ? MENU : MENU.filter((d) => d.category === cat2);
  return (
    <div className="menu-page">
      <header className="menu-head">
        <div className="menu-top"><Link to="/" className="for-rest">← Back</Link><AccountButton /></div>
        <div className="eyebrow">{restaurant.tagline}</div>
        <h1>{restaurant.name} menu</h1>
        <p className="muted">Every dish with calories, protein, fat and carbs per serving.</p>
        <div className="menu-picker"><RestaurantPicker /></div>
      </header>
      <div className="menu-filters" role="tablist">
        {MENU_CATEGORIES.map((c) => (
          <button key={c} role="tab" aria-selected={cat2 === c} className={"menu-chip" + (cat2 === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="menu-grid" key={restaurant.id + cat2}>
        {list.map((d, i) => (
          <article className="menu-card" key={d.name} style={{ ["--i" as string]: i }}>
            <div className="menu-card-top">
              <div className="menu-cat">{d.category}</div>
              <button className={"fav-btn" + (favs.includes(d.name) ? " on" : "")} aria-pressed={favs.includes(d.name)} aria-label={`Save ${d.name} to favorites`} onClick={() => toggleFav(d.name)}>{favs.includes(d.name) ? "♥" : "♡"}</button>
            </div>
            <h2>{d.name}</h2>
            <p>{d.ingredients}</p>
            <div className="kbju">
              {d.price != null && <span className="kcal price"><b>{d.price.toLocaleString("ru-RU")}</b> ₸</span>}
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
