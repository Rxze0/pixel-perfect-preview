import { createContext, useContext, useEffect, useState, type ReactNode, type Context } from "react";
import type { MenuDish } from "@/lib/menu";

/* Data shape for a venue. Sample data — replace with the real restaurants later. */
export type TableStatus = "free" | "booked" | "taken";
export type FloorTable = { id: string; label: string; seats: number; x: number; y: number; w: number; h: number; round?: boolean; area: string; status: TableStatus };
export type FloorArea = { name: string; x: number; y: number; w: number; h: number; vibe?: string };
export type Restaurant = {
  id: string; name: string; tagline: string; concept: string; accent: string;
  categories: string[]; menu: MenuDish[]; areas: FloorArea[]; tables: FloorTable[];
};

const d = (category: string, name: string, ingredients: string, calories: number, protein: number, fat: number, carbs: number, price: number): MenuDish => ({ category, name, ingredients, calories, protein, fat, carbs, price });
const t = (id: string, area: string, x: number, y: number, seats: number, status: TableStatus, w = 34, h = 34, round = false): FloorTable => ({ id, label: id, area, x, y, w, h, seats, status, round });

export const RESTAURANTS: Restaurant[] = [
  {
    id: "bella", name: "Bella Italia", tagline: "Trattoria · Trastevere style", accent: "#F5A524",
    concept: "A cozy Italian trattoria with a wood-fired oven and fresh homemade pasta.",
    categories: ["All", "Starters", "Pizza", "Pasta", "Desserts"],
    menu: [
      d("Starters", "Beef carpaccio", "Thin raw beef tenderloin, arugula, parmesan, capers, lemon, olive oil.", 260, 22, 17, 3, 4900),
      d("Starters", "Burrata with heirloom tomatoes", "Burrata, heirloom tomatoes, basil, olive oil, sea salt, focaccia.", 380, 16, 28, 14, 5400),
      d("Pizza", "Four cheese pizza with truffle honey", "Wood-fired dough, mozzarella, gorgonzola, parmesan, taleggio, truffle honey.", 820, 34, 38, 86, 6900),
      d("Pizza", "Margherita DOP", "San Marzano tomatoes, fior di latte, basil, olive oil.", 690, 28, 24, 88, 4500),
      d("Pasta", "Lasagna Bolognese", "Fresh egg pasta, slow-cooked beef ragù, béchamel, parmesan.", 640, 34, 32, 52, 5600),
      d("Pasta", "Ricotta and spinach ravioli", "Homemade ravioli, ricotta, spinach, sage butter, parmesan.", 520, 20, 26, 50, 5200),
      d("Desserts", "Passion fruit panna cotta", "Cream, vanilla, gelatin, passion fruit coulis.", 340, 4, 24, 28, 2900),
    ],
    areas: [
      { name: "Window tables", vibe: "Panoramic window — perfect for a romantic date", x: 10, y: 10, w: 300, h: 50 },
      { name: "Communal table", vibe: "Big shared table — great for birthdays and groups", x: 80, y: 80, w: 160, h: 80 },
      { name: "Open kitchen", vibe: "By the open kitchen — lively, dynamic and a bit loud", x: 10, y: 180, w: 300, h: 50 },
    ],
    tables: [
      t("W1", "Window tables", 25, 18, 2, "free"), t("W2", "Window tables", 95, 18, 2, "taken"), t("W3", "Window tables", 165, 18, 2, "free"), t("W4", "Window tables", 235, 18, 4, "booked", 60),
      t("C1", "Communal table", 100, 105, 12, "free", 120, 30),
      t("K1", "Open kitchen", 30, 188, 2, "taken"), t("K2", "Open kitchen", 100, 188, 2, "free"), t("K3", "Open kitchen", 170, 188, 2, "booked"), t("K4", "Open kitchen", 240, 188, 2, "free"),
    ],
  },
  {
    id: "fuego", name: "Fuego & Smoke", tagline: "Steakhouse · Open fire grill", accent: "#FF6B3D",
    concept: "A bold steakhouse with open fire, a dark interior and leather booths.",
    categories: ["All", "Steaks", "Grill", "Desserts"],
    menu: [
      d("Steaks", "Tomahawk steak", "Bone-in ribeye 1.2 kg, sea salt, rosemary butter, charred garlic.", 1650, 120, 128, 2, 38000),
      d("Steaks", "New York strip", "Dry-aged striploin, pepper sauce, smoked salt.", 620, 48, 46, 2, 16500),
      d("Grill", "Marbled beef burger with onion jam", "Marbled beef patty, cheddar, onion marmalade, brioche bun, pickles.", 880, 44, 52, 58, 6900),
      d("Grill", "Pulled beef with pie potatoes", "12-hour smoked beef, BBQ glaze, crispy pie potatoes, slaw.", 760, 46, 40, 54, 7800),
      d("Grill", "Grilled bone marrow with herbs", "Roasted marrow bones, parsley-shallot salad, sourdough toast.", 540, 12, 46, 20, 5900),
      d("Desserts", "Pecan brownie", "Dark chocolate brownie, pecans, vanilla ice cream, caramel.", 560, 7, 34, 58, 3400),
    ],
    areas: [
      { name: "Private booths", vibe: "Secluded leather booth — quiet and private, ideal for business", x: 10, y: 10, w: 90, h: 220 },
      { name: "Central grill", vibe: "Around the fire grill — energetic, the heart of the room", x: 115, y: 60, w: 120, h: 120 },
      { name: "Chef's bar", vibe: "Chef's bar — watch the grill up close, great solo or as a pair", x: 250, y: 10, w: 60, h: 220 },
    ],
    tables: [
      t("B1", "Private booths", 20, 22, 6, "booked", 70, 50), t("B2", "Private booths", 20, 95, 6, "free", 70, 50), t("B3", "Private booths", 20, 168, 8, "taken", 70, 50),
      t("G1", "Central grill", 125, 70, 4, "free", 40, 40), t("G2", "Central grill", 185, 70, 4, "taken", 40, 40), t("G3", "Central grill", 125, 130, 4, "free", 40, 40), t("G4", "Central grill", 185, 130, 4, "booked", 40, 40),
      t("S1", "Chef's bar", 266, 25, 1, "free", 28, 28, true), t("S2", "Chef's bar", 266, 75, 1, "taken", 28, 28, true), t("S3", "Chef's bar", 266, 125, 1, "free", 28, 28, true), t("S4", "Chef's bar", 266, 175, 1, "free", 28, 28, true),
    ],
  },
  {
    id: "sakura", name: "Sakura & Sea", tagline: "Asian fusion · Sushi bar", accent: "#FF7AA8",
    concept: "A minimalist neo-noir spot for Japanese and pan-Asian cuisine.",
    categories: ["All", "Rolls", "Raw", "Hot", "Desserts"],
    menu: [
      d("Rolls", "Philadelphia roll with mango and eel", "Salmon, cream cheese, mango, smoked eel, unagi sauce, rice, nori.", 420, 18, 16, 50, 6400),
      d("Raw", "Salmon sashimi with truffle ponzu", "Salmon, truffle ponzu, chives, sesame.", 230, 24, 14, 3, 7200),
      d("Raw", "Tuna tataki", "Seared tuna, sesame crust, ponzu, daikon, microgreens.", 260, 30, 12, 6, 7900),
      d("Hot", "Ramen with chashu pork", "Tonkotsu broth, wheat noodles, chashu pork, soft egg, nori, scallion.", 690, 34, 28, 72, 5800),
      d("Hot", "Shrimp gyoza", "Pan-fried dumplings, shrimp, cabbage, ginger, soy-vinegar dip.", 320, 16, 12, 36, 4200),
      d("Desserts", "Matcha mochi", "Glutinous rice dough, matcha cream, white bean paste.", 240, 4, 6, 42, 2600),
    ],
    areas: [
      { name: "Low tables", vibe: "Low Japanese tables — calm and cozy for small groups", x: 10, y: 10, w: 180, h: 140 },
      { name: "Sushi bar", vibe: "Sushi bar — watch the chefs work, fun for a casual date", x: 205, y: 10, w: 105, h: 220 },
      { name: "Tables for two", vibe: "Tables for two — intimate and quiet, made for dates", x: 10, y: 165, w: 180, h: 65 },
    ],
    tables: [
      t("L1", "Low tables", 25, 25, 4, "free", 60, 40), t("L2", "Low tables", 115, 25, 4, "booked", 60, 40), t("L3", "Low tables", 25, 95, 4, "taken", 60, 40), t("L4", "Low tables", 115, 95, 4, "free", 60, 40),
      t("S1", "Sushi bar", 222, 25, 1, "taken", 28, 28, true), t("S2", "Sushi bar", 222, 70, 1, "free", 28, 28, true), t("S3", "Sushi bar", 222, 115, 1, "free", 28, 28, true), t("S4", "Sushi bar", 222, 160, 1, "booked", 28, 28, true),
      t("D1", "Tables for two", 30, 180, 2, "free"), t("D2", "Tables for two", 85, 180, 2, "taken"), t("D3", "Tables for two", 140, 180, 2, "free"),
    ],
  },
];

export type Booking = { restaurantId: string; tableId: string; time: string };
type Ctx = { restaurant: Restaurant; setRestaurant: (id: string) => void; bookings: Booking[]; book: (b: Booking) => Promise<string | null>; statusOf: (t: FloorTable) => TableStatus };
const rg = globalThis as unknown as { __sitabitRestCtx?: Context<Ctx | null> };
const RCtx = (rg.__sitabitRestCtx ??= createContext<Ctx | null>(null));

/* Demo mode: bookings are kept only in this browser. */
const BOOKINGS_KEY = "sitabit-bookings-v2"; // v2 = fresh start, old test bookings dropped
function readBookings(): Booking[] {
  try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? "[]") as Booking[]; } catch { return []; }
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState(RESTAURANTS[0]!.id);
  const [bookings, setBookings] = useState<Booking[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("sitabit-restaurant");
    if (saved && RESTAURANTS.some((r) => r.id === saved)) setId(saved);
    setBookings(readBookings());
  }, []);
  const restaurant = RESTAURANTS.find((r) => r.id === id)!;
  useEffect(() => { document.documentElement.style.setProperty("--accent", restaurant.accent); }, [restaurant.accent]);
  const value: Ctx = {
    restaurant,
    setRestaurant: (n) => { setId(n); localStorage.setItem("sitabit-restaurant", n); },
    bookings,
    book: async (b) => {
      const all = readBookings();
      if (all.some((x) => x.restaurantId === b.restaurantId && x.tableId === b.tableId && x.time === b.time)) {
        return "Someone just booked this table for that time.";
      }
      const next = [...all, b];
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
      setBookings(next);
      return null;
    },
    statusOf: (tb) => bookings.some((b) => b.restaurantId === id && b.tableId === tb.id) ? "booked" : tb.status,
  };
  return <RCtx.Provider value={value}>{children}</RCtx.Provider>;
}

export function useRestaurant() {
  const c = useContext(RCtx);
  if (!c) throw new Error("useRestaurant must be inside RestaurantProvider");
  return c;
}

export function RestaurantPicker() {
  const { restaurant, setRestaurant } = useRestaurant();
  return (
    <div className="rest-picker" role="radiogroup" aria-label="Choose a restaurant">
      {RESTAURANTS.map((r) => (
        <button key={r.id} role="radio" aria-checked={r.id === restaurant.id} className={"rest-card" + (r.id === restaurant.id ? " on" : "")}
          style={{ ["--ra" as string]: r.accent }} onClick={() => setRestaurant(r.id)}>
          <b>{r.name}</b><span>{r.tagline}</span>
        </button>
      ))}
    </div>
  );
}
