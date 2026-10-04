/* Sample data (replace with real restaurant data later) */
export const OCC = [
  { id: "date", label: "Date", sub: "Calm, easy to talk", lo: 25, hi: 60, headline: "your date" },
  { id: "friends", label: "Friends", sub: "Lively, loud is fine", lo: 60, hi: 95, headline: "your group" },
  { id: "solo", label: "Solo / study", sub: "Quiet, but not empty", lo: 20, hi: 50, headline: "solo time" },
  { id: "family", label: "Family", sub: "Comfortable, room to sit", lo: 35, hi: 70, headline: "a family dinner" },
];
export const ALLERGENS = [
  { id: "nuts", label: "Nuts", sub: ["Peanuts", "Walnuts", "Almonds", "Hazelnuts", "Cashews", "Pistachios"] },
  { id: "gluten", label: "Gluten", sub: ["Wheat", "Rye", "Barley", "Oats"] },
  { id: "dairy", label: "Dairy", sub: ["Milk", "Cheese", "Butter", "Cream", "Lactose"] },
  { id: "seafood", label: "Seafood", sub: ["Shrimp", "Crabs", "Mussels", "Oysters", "Squid", "Fish"] },
  { id: "eggs", label: "Eggs", sub: ["Whole eggs", "Egg whites", "Mayonnaise"] },
];
/** Sub-item restriction id, e.g. "seafood:shrimp". */
export const subId = (cat: string, label: string) => `${cat}:${label.toLowerCase()}`;
/** Category ids touched by a restriction list (whole category or any sub-item). */
export const restrictionCats = (rs: string[]) => [...new Set(rs.map((r) => r.split(":")[0]!))];
export const ZONES = [
  { name: "Quiet room", occ: 35, vibe: "Calm", sound: "soft music", free: 11, total: 16 },
  { name: "Terrace", occ: 50, vibe: "Relaxed", sound: "outdoor chatter", free: 6, total: 12 },
  { name: "Main hall", occ: 72, vibe: "Buzzing", sound: "busy conversation", free: 8, total: 30 },
  { name: "Bar", occ: 92, vibe: "Loud", sound: "DJ from 21:00", free: 1, total: 10 },
];
export const HOURS = [
  { h: "17", occ: 28 }, { h: "18", occ: 42 }, { h: "19", occ: 68, now: true }, { h: "20", occ: 88 },
  { h: "21", occ: 84 }, { h: "22", occ: 58 }, { h: "23", occ: 34 },
];
export const DISHES = [
  { name: "Beef plov", desc: "Rice, carrots, slow-cooked beef", a: [], t: [] },
  { name: "Chicken shashlik", desc: "Grilled skewers, onion, lavash", a: ["gluten"], t: [] },
  { name: "Lagman", desc: "Hand-pulled noodles, beef, vegetables", a: ["gluten"], t: [] },
  { name: "Grilled salmon", desc: "Rice, lemon butter sauce", a: ["seafood", "dairy"], t: [] },
  { name: "Vegetable stir-fry", desc: "Seasonal vegetables, soy glaze", a: ["gluten"], t: ["nuts"] },
  { name: "Caesar salad", desc: "Chicken, parmesan, croutons", a: ["dairy", "gluten", "eggs"], t: ["seafood"] },
  { name: "Pesto pasta", desc: "Basil pesto, parmesan", a: ["gluten", "nuts", "dairy"], t: [] },
  { name: "Baursak with honey", desc: "Fried dough, honey", a: ["gluten", "dairy", "eggs"], t: [] },
  { name: "Pistachio cheesecake", desc: "Pistachio, cream cheese", a: ["nuts", "dairy", "gluten", "eggs"], t: [] },
] as { name: string; desc: string; a: string[]; t: string[] }[];
export const RESTAURANT_NAME = "[Restaurant name]";

/* Sample tables for the waiters' view (replace with real order-system data later).
   Deliberately no spend or bill data — waiters never see how much a guest spends. */
export type Table = {
  id: string;
  name: string;
  guests: number;
  occasion: string;
  visits: number; // 0 = first visit
  restrictions: string[]; // allergen ids, combined for everyone at the table
  favorites: string[];
  pairing: string; // one gentle suggestion for the waiter
};
export const TABLES: Table[] = [
  {
    id: "t14", name: "Table 14", guests: 2, occasion: "Date", visits: 4,
    restrictions: ["nuts"],
    favorites: ["Grilled salmon", "Baursak with honey"],
    pairing: "They loved the salmon last time — the lemon butter sauce pairs nicely with a glass of dry white.",
  },
  {
    id: "t7", name: "Table 7", guests: 4, occasion: "Family", visits: 0,
    restrictions: ["gluten", "dairy"],
    favorites: [],
    pairing: "First visit — the beef plov is safe for the whole table and a good start.",
  },
  {
    id: "t21", name: "Table 21", guests: 3, occasion: "Friends", visits: 7,
    restrictions: [],
    favorites: ["Chicken shashlik", "Lagman", "Pistachio cheesecake"],
    pairing: "Regulars who order the shashlik every time — the cheesecake is their usual finish.",
  },
  {
    id: "t3", name: "Table 3", guests: 1, occasion: "Solo / study", visits: 2,
    restrictions: ["seafood"],
    favorites: ["Vegetable stir-fry"],
    pairing: "Usually stays a couple of hours — offer a tea refill around the one-hour mark.",
  },
];

export type Occ = (typeof OCC)[number];
export type Kind = "ok" | "ask" | "no";
export type Person = { id: string; name: string; restrictions: string[] };

export const lower = (id: string) => {
  const [cat, sub] = id.split(":");
  const a = ALLERGENS.find((x) => x.id === cat);
  if (!a) return id;
  return sub ? (a.sub.find((x) => x.toLowerCase() === sub) ?? sub).toLowerCase() : a.label.toLowerCase();
};

export function fitOf(v: number, o: Occ) {
  if (v >= o.lo && v <= o.hi) return 0;
  const d = v < o.lo ? o.lo - v : v - o.hi;
  return d <= 15 ? 1 : 2;
}
export function rankedZones(o: Occ) {
  const mid = (o.lo + o.hi) / 2;
  return ZONES.map((z) => ({ ...z, fit: fitOf(z.occ, o) }))
    .sort((a, b) => a.fit - b.fit || Math.abs(a.occ - mid) - Math.abs(b.occ - mid));
}

/* A dish is safe only if it is safe for EVERY person in the group. */
export function checkedDishes(people: Person[]) {
  const rank: Record<Kind, number> = { ok: 0, ask: 1, no: 2 };
  return DISHES.map((d) => {
    const blocked = people.filter((p) => d.a.some((x) => restrictionCats(p.restrictions).includes(x)));
    const traced = people.filter((p) => d.t.some((x) => restrictionCats(p.restrictions).includes(x)) && !blocked.includes(p));
    if (blocked.length) {
      const ids = d.a.filter((x) => blocked.some((p) => restrictionCats(p.restrictions).includes(x)));
      return { ...d, kind: "no" as Kind, status: "Contains " + ids.map(lower).join(", ") + " · not safe for " + blocked.map((p) => p.name).join(", ") };
    }
    if (traced.length) {
      const ids = d.t.filter((x) => traced.some((p) => restrictionCats(p.restrictions).includes(x)));
      return { ...d, kind: "ask" as Kind, status: "May contain traces of " + ids.map(lower).join(", ") + " · ask staff for " + traced.map((p) => p.name).join(", ") };
    }
    const anyRestrictions = people.some((p) => p.restrictions.length);
    return { ...d, kind: "ok" as Kind, status: anyRestrictions ? "Safe for everyone" : "No restrictions set" };
  }).sort((a, b) => rank[a.kind] - rank[b.kind]);
}
