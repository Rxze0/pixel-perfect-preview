import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { RESTAURANTS, type AllergenId } from "./data";

export type TableStatus = "free" | "busy" | "reserved";
export interface TableState { status: TableStatus; until: number } // until = timestamp when busy ends / reservation starts
export interface Booking { id: string; restaurantId: string; tableId: string; tableNumber: number; date: string; time: string; guests: number; name: string; phone: string; createdAt: number }
export interface OrderItem { dishId: string; restaurantId: string; qty: number }

interface State {
  allergens: AllergenId[];
  hideStruck: boolean;
  favRestaurants: string[];
  favDishes: string[];
  order: OrderItem[];
  bookings: Booking[];
  tables: Record<string, TableState>;
  theme: "light" | "dark";
}

const MIN = 60_000;
function seedTables(): Record<string, TableState> {
  const now = Date.now();
  const out: Record<string, TableState> = {};
  for (const r of RESTAURANTS) for (const t of r.tables) {
    const roll = Math.random();
    out[t.id] = roll < 0.45 ? { status: "free", until: 0 }
      : roll < 0.85 ? { status: "busy", until: now + (5 + Math.random() * 80) * MIN }
      : { status: "reserved", until: now + (10 + Math.random() * 50) * MIN };
  }
  return out;
}

const initial = (): State => ({ allergens: [], hideStruck: false, favRestaurants: [], favDishes: [], order: [], bookings: [], tables: {}, theme: "light" });
const KEY = "tablekit-state-v1";

interface Ctx extends State {
  now: number;
  set: (patch: Partial<State> | ((s: State) => Partial<State>)) => void;
  toggleAllergen: (a: AllergenId) => void;
  toggleFav: (kind: "favRestaurants" | "favDishes", id: string) => void;
  addToOrder: (restaurantId: string, dishId: string) => void;
  changeQty: (dishId: string, delta: number) => void;
  setTableStatus: (tableId: string, status: TableStatus) => void;
  addBooking: (b: Omit<Booking, "id" | "createdAt">) => Booking;
  cancelBooking: (id: string) => void;
}
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const [now, setNow] = useState(() => Date.now());
  const loaded = useRef(false);

  useEffect(() => {
    let st = initial();
    try { const raw = localStorage.getItem(KEY); if (raw) st = { ...st, ...JSON.parse(raw) }; } catch { /* ignore */ }
    if (!Object.keys(st.tables).length) st.tables = seedTables();
    setS(st);
    loaded.current = true;
  }, []);

  useEffect(() => { if (loaded.current) localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);
  useEffect(() => { document.documentElement.classList.toggle("dark", s.theme === "dark"); }, [s.theme]);

  // Real-time simulation: every 5–10s, expire timers and randomly change a few tables
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      setS((prev) => {
        if (!Object.keys(prev.tables).length) return prev;
        const tables = { ...prev.tables };
        for (const [id, ts] of Object.entries(tables)) {
          if (ts.status === "busy" && ts.until <= t) tables[id] = { status: "free", until: 0 };
          if (ts.status === "reserved" && ts.until <= t) tables[id] = { status: "busy", until: t + (30 + Math.random() * 60) * MIN };
        }
        const ids = Object.keys(tables);
        for (let i = 0; i < 3; i++) {
          const id = ids[Math.floor(Math.random() * ids.length)];
          const cur = tables[id];
          if (cur.status === "free" && Math.random() < 0.5) tables[id] = { status: "busy", until: t + (20 + Math.random() * 70) * MIN };
          else if (cur.status === "busy") tables[id] = { ...cur, until: cur.until - (1 + Math.random() * 4) * MIN };
        }
        return { ...prev, tables };
      });
      timer = setTimeout(tick, 5000 + Math.random() * 5000);
    };
    timer = setTimeout(tick, 5000);
    return () => clearTimeout(timer);
  }, []);

  const set: Ctx["set"] = (patch) => setS((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));

  const value: Ctx = {
    ...s, now, set,
    toggleAllergen: (a) => set((p) => ({ allergens: p.allergens.includes(a) ? p.allergens.filter((x) => x !== a) : [...p.allergens, a] })),
    toggleFav: (kind, id) => set((p) => ({ [kind]: p[kind].includes(id) ? p[kind].filter((x) => x !== id) : [...p[kind], id] }) as Partial<State>),
    addToOrder: (restaurantId, dishId) => set((p) => {
      const ex = p.order.find((o) => o.dishId === dishId);
      return { order: ex ? p.order.map((o) => (o.dishId === dishId ? { ...o, qty: o.qty + 1 } : o)) : [...p.order, { dishId, restaurantId, qty: 1 }] };
    }),
    changeQty: (dishId, delta) => set((p) => ({ order: p.order.map((o) => (o.dishId === dishId ? { ...o, qty: o.qty + delta } : o)).filter((o) => o.qty > 0) })),
    setTableStatus: (tableId, status) => set((p) => ({
      tables: { ...p.tables, [tableId]: { status, until: status === "free" ? 0 : Date.now() + (status === "busy" ? 60 : 30) * MIN } },
    })),
    addBooking: (b) => {
      const booking: Booking = { ...b, id: Math.random().toString(36).slice(2, 9).toUpperCase(), createdAt: Date.now() };
      set((p) => ({ bookings: [...p.bookings, booking] }));
      return booking;
    },
    cancelBooking: (id) => set((p) => ({ bookings: p.bookings.filter((b) => b.id !== id) })),
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

/** Effective display status: busy ending within 15 min, or reservation within 60 min => "soon" */
export type DisplayStatus = "free" | "busy" | "soon";
export function displayStatus(ts: TableState | undefined, now: number): DisplayStatus {
  if (!ts || ts.status === "free") return "free";
  const mins = (ts.until - now) / MIN;
  if (ts.status === "busy") return mins <= 15 ? "soon" : "busy";
  return mins <= 60 ? "soon" : "free";
}
export const minutesLeft = (ts: TableState | undefined, now: number) => (ts ? Math.max(1, Math.round((ts.until - now) / MIN)) : 0);
