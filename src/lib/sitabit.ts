/* Sample data (replace with real restaurant data later) */
export const OCC = [
  { id: "date", label: "Date", sub: "Calm, easy to talk", lo: 25, hi: 60, headline: "your date" },
  { id: "friends", label: "Friends", sub: "Lively, loud is fine", lo: 60, hi: 95, headline: "your group" },
  { id: "solo", label: "Solo / study", sub: "Quiet, but not empty", lo: 20, hi: 50, headline: "solo time" },
  { id: "family", label: "Family", sub: "Comfortable, room to sit", lo: 35, hi: 70, headline: "a family dinner" },
];
export const ALLERGENS = [
  { id: "nuts", label: "Nuts" }, { id: "gluten", label: "Gluten" }, { id: "dairy", label: "Dairy" },
  { id: "seafood", label: "Seafood" }, { id: "eggs", label: "Eggs" },
];
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

export type Occ = (typeof OCC)[number];
export type Kind = "ok" | "ask" | "no";
export type Person = { id: string; name: string; restrictions: string[] };

export const lower = (id: string) => ALLERGENS.find((a) => a.id === id)!.label.toLowerCase();

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
    const blocked = people.filter((p) => d.a.some((x) => p.restrictions.includes(x)));
    const traced = people.filter((p) => d.t.some((x) => p.restrictions.includes(x)) && !blocked.includes(p));
    if (blocked.length) {
      const ids = d.a.filter((x) => blocked.some((p) => p.restrictions.includes(x)));
      return { ...d, kind: "no" as Kind, status: "Contains " + ids.map(lower).join(", ") + " · not safe for " + blocked.map((p) => p.name).join(", ") };
    }
    if (traced.length) {
      const ids = d.t.filter((x) => traced.some((p) => p.restrictions.includes(x)));
      return { ...d, kind: "ask" as Kind, status: "May contain traces of " + ids.map(lower).join(", ") + " · ask staff for " + traced.map((p) => p.name).join(", ") };
    }
    const anyRestrictions = people.some((p) => p.restrictions.length);
    return { ...d, kind: "ok" as Kind, status: anyRestrictions ? "Safe for everyone" : "No restrictions set" };
  }).sort((a, b) => rank[a.kind] - rank[b.kind]);
}
