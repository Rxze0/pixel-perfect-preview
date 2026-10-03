import { ZONES } from "@/lib/sitabit";

/* 2.5D isometric floor plan in plain SVG. Layout is sample geometry; table counts match ZONES. */
const U = 15;
const LAYOUT: Record<string, { ox: number; oy: number; cols: number; rows: number }> = {
  "Quiet room": { ox: 0, oy: 0, cols: 4, rows: 4 },
  Terrace: { ox: 5.2, oy: 0, cols: 4, rows: 3 },
  "Main hall": { ox: 0, oy: 5.2, cols: 6, rows: 5 },
  Bar: { ox: 7.2, oy: 4.4, cols: 2, rows: 5 },
};
const iso = (x: number, y: number, z = 0) => [(x - y) * U * 0.866, (x + y) * U * 0.5 - z] as const;
const pts = (a: (readonly [number, number])[]) => a.map((p) => p.join(",")).join(" ");

function box(x: number, y: number, w: number, d: number, h: number) {
  const top = [iso(x, y, h), iso(x + w, y, h), iso(x + w, y + d, h), iso(x, y + d, h)];
  const right = [iso(x + w, y, h), iso(x + w, y + d, h), iso(x + w, y + d, 0), iso(x + w, y, 0)];
  const left = [iso(x, y + d, h), iso(x + w, y + d, h), iso(x + w, y + d, 0), iso(x, y + d, 0)];
  return { top: pts(top), right: pts(right), left: pts(left) };
}

export function FloorPlan({ best, hour, onPick }: { best: string; hour: { h: string; occ: number } | null; onPick: (name: string) => void }) {
  const order = [...ZONES].sort((a, b) => LAYOUT[a.name]!.ox + LAYOUT[a.name]!.oy - (LAYOUT[b.name]!.ox + LAYOUT[b.name]!.oy));
  return (
    <section className="group floor">
      <div className="label">Floor plan, {hour ? `${hour.h}:00` : "right now"}</div>
      <svg className="floor-svg" viewBox="-170 -24 330 200" role="img" aria-label={`Floor plan. Best zone for you: ${best}`}>
        {order.map((z) => {
          const L = LAYOUT[z.name]!;
          const w = L.cols + 0.6, d = L.rows + 0.6;
          const p = box(L.ox, L.oy, w, d, 6);
          // Projected occupancy for a picked hour: scale taken tables by the hour's occupancy vs the zone's current occupancy.
          const taken = hour
            ? Math.max(0, Math.min(z.total, Math.round(((z.total - z.free) / z.occ) * hour.occ)))
            : z.total - z.free;
          const glow = z.name === best;
          const [lx, ly] = iso(L.ox + w / 2, L.oy + d / 2, 6);
          const tables = Array.from({ length: L.cols * L.rows }, (_, i) => i).slice(0, z.total);
          return (
            <g key={z.name} className={`fz${glow ? " glow" : ""}`} role="button" tabIndex={0} aria-label={`${z.name}, ${z.free} of ${z.total} tables free`}
              onClick={() => onPick(z.name)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick(z.name))}>
              <g className="fz-lift">
                <polygon className="fz-side r" points={p.right} />
                <polygon className="fz-side l" points={p.left} />
                <polygon className="fz-top" points={p.top} />
                {tables.map((i) => {
                  const c = i % L.cols, r = Math.floor(i / L.cols);
                  const t = box(L.ox + 0.45 + c, L.oy + 0.45 + r, 0.6, 0.6, 10);
                  const isTaken = (i * 7) % z.total < taken;
                  const cls = isTaken ? "ft taken" : "ft free";
                  return (
                    <g key={i} className={cls} transform="translate(0,-6)">
                      <polygon className="r" points={t.right} />
                      <polygon className="l" points={t.left} />
                      <polygon className="t" points={t.top} />
                    </g>
                  );
                })}
                <text className="fz-label" x={lx} y={ly - 16} textAnchor="middle">{z.name}</text>
              </g>
            </g>
          );
        })}
      </svg>
      <div className="floor-legend">
        <span><i className="lg free" />Free</span>
        <span><i className="lg taken" />Taken</span>
        <span><i className="lg vibe" />Your vibe</span>
      </div>
      <p className="floor-hint">Tap a zone to jump to it</p>
    </section>
  );
}
