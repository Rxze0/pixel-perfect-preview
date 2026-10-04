import { useState } from "react";
import { toast } from "sonner";
import { useRestaurant, type FloorTable } from "@/lib/restaurants";
import { useAuth } from "@/lib/auth";

const TIMES = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

export function BookingMap() {
  const { restaurant, statusOf, book } = useRestaurant();
  const { requireUser } = useAuth();
  const [pick, setPick] = useState<FloorTable | null>(null);
  const [hover, setHover] = useState<FloorTable | null>(null);
  const vibeOf = (tb: FloorTable) => restaurant.areas.find((a) => a.name === tb.area)?.vibe;
  const tryPick = (tb: FloorTable) => { if (requireUser("Booking a table")) setPick(tb); };
  const [time, setTime] = useState(TIMES[2]!);
  return (
    <section className="group booking">
      <div className="label">Book a table · {restaurant.name}</div>
      <svg className="book-svg" viewBox="0 -14 320 254" role="group" aria-label={`Table layout of ${restaurant.name}`}>
        {restaurant.areas.map((a) => (
          <g key={a.name}>
            <rect className="book-area" x={a.x} y={a.y} width={a.w} height={a.h} rx="10" />
            <text className="book-area-l" x={a.x + 6} y={a.y - 6}>{a.name}</text>
          </g>
        ))}
        {restaurant.tables.map((tb) => {
          const s = statusOf(tb);
          const label = `Table ${tb.label}, ${tb.seats} seats, ${s}. ${vibeOf(tb) ?? ""}`;
          return (
            <g key={tb.id} className={`book-t ${s}`} role="button" tabIndex={0} aria-label={label} aria-disabled={s !== "free"}
              onMouseEnter={() => setHover(tb)} onFocus={() => setHover(tb)}
              onClick={() => { setHover(tb); if (s === "free") tryPick(tb); }}
              onKeyDown={(e) => { if (s === "free" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); tryPick(tb); } }}>
              <title>{vibeOf(tb)}</title>
              <rect x={tb.x} y={tb.y} width={tb.w} height={tb.h} rx={tb.round ? tb.w / 2 : 7} />
              <text x={tb.x + tb.w / 2} y={tb.y + tb.h / 2 + 4} textAnchor="middle">{tb.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="floor-legend">
        <span><i className="lg free" />Free</span>
        <span><i className="lg booked" />Booked</span>
        <span><i className="lg taken" />Taken</span>
      </div>
      <p className="floor-hint" aria-live="polite">
        {hover ? <><b>Table {hover.label} · {hover.seats} {hover.seats === 1 ? "seat" : "seats"}</b> — {vibeOf(hover)}</> : "Hover or tap a table to see its atmosphere. Tap a free table to book it"}
      </p>
      {pick && (
        <div className="sheet-overlay" onClick={() => setPick(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Book a table" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">Table {pick.label} · {pick.seats} {pick.seats === 1 ? "seat" : "seats"}</div>
            <div className="muted">{restaurant.name} · {pick.area}</div>
            {vibeOf(pick) && <div className="muted">{vibeOf(pick)}</div>}
            <div className="time-grid" role="radiogroup" aria-label="Time">
              {TIMES.map((x) => <button key={x} role="radio" aria-checked={x === time} className={"chip" + (x === time ? " on" : "")} aria-pressed={x === time} onClick={() => setTime(x)}>{x}</button>)}
            </div>
            <button className="cta" onClick={async () => { const err = await book({ restaurantId: restaurant.id, tableId: pick.id, time }); toast(err ?? `Table ${pick.label} booked for ${time} at ${restaurant.name}`); setPick(null); }}>Confirm booking</button>
            <button className="for-rest" onClick={() => setPick(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
