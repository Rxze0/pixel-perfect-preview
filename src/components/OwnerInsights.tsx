import { useState } from "react";

/* Sample owner analytics (replace with real order-system data later). */
const PERIODS = { "30": "Last 30 days", "90": "Last 90 days", "365": "Last year" } as const;
type Period = keyof typeof PERIODS;
const DATA: Record<Period, { guests: number; returning: number; avg: number; weeks: { w: string; n: number }[] }> = {
  "30": { guests: 46, returning: 14, avg: 13200, weeks: [{ w: "Sep 4", n: 9 }, { w: "Sep 11", n: 12 }, { w: "Sep 18", n: 11 }, { w: "Sep 25", n: 14 }] },
  "90": { guests: 128, returning: 37, avg: 13100, weeks: [{ w: "Jul 5", n: 6 }, { w: "Jul 20", n: 10 }, { w: "Aug 4", n: 11 }, { w: "Aug 19", n: 12 }, { w: "Sep 3", n: 13 }, { w: "Sep 18", n: 15 }] },
  "365": { guests: 512, returning: 141, avg: 12700, weeks: [{ w: "Q4", n: 98 }, { w: "Q1", n: 104 }, { w: "Q2", n: 142 }, { w: "Q3", n: 168 }] },
};
const FEEDBACK = [
  { k: "Speed", n: 9 }, { k: "Food", n: 4 }, { k: "Service", n: 3 },
  { k: "Atmosphere", n: 2 }, { k: "Price", n: 5 }, { k: "Other", n: 1 },
];
const REGULARS = [
  { name: "Aliya", visits: 7, avg: 17600, last: "26.09.2026", likes: "Meat · Mushrooms", phone: "77011234567" },
  { name: "Timur", visits: 4, avg: 10000, last: "23.09.2026", likes: "Fish · Spicy", phone: "77021234567" },
  { name: "Dana", visits: 5, avg: 10300, last: "28.08.2026", likes: "Desserts · Vegetables", phone: "77031234567" },
  { name: "Arman", visits: 3, avg: 14800, last: "25.08.2026", likes: "Fish · Seafood", phone: "77041234567" },
];
type Regular = (typeof REGULARS)[number];
const AWAY_DAYS = 30;
const daysSince = (d: string) => {
  const [dd = 1, mm = 1, yy = 2026] = d.split(".").map(Number);
  return Math.max(0, Math.floor((Date.now() - new Date(yy, mm - 1, dd).getTime()) / 86400000));
};
/* Simple rule-based offer from the guest's first matching preference (no AI). */
function offerFor(r: Regular) {
  const l = r.likes.toLowerCase();
  const dish = /fish|seafood/.test(l) ? "a new fish dish"
    : /meat/.test(l) ? "a new meat dish"
    : /dessert/.test(l) ? "a new dessert"
    : /vegetable/.test(l) ? "a new vegetable dish"
    : "something new on the menu";
  return `${r.name}, we haven't seen you in a while! We've added ${dish} we think you'll love. We'd be happy to see you again 💛`;
}
const tg = (n: number) => n.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₸";

export function OwnerInsights() {
  const [period, setPeriod] = useState<Period>("90");
  const [winBack, setWinBack] = useState<Regular | null>(null);
  const d = DATA[period];
  const max = Math.max(...d.weeks.map((w) => w.n));
  const fbMax = Math.max(...FEEDBACK.map((f) => f.n));
  const fbTotal = FEEDBACK.reduce((s, f) => s + f.n, 0);
  return (
    <>
      <section className="group ins">
        <div className="label">Your restaurant in numbers</div>
        <h2 className="ins-h">Guests who come back</h2>
        <p className="muted ins-p">Repeat visits, average bill, and why guests leave.</p>
        <select className="ins-select" value={period} onChange={(e) => setPeriod(e.target.value as Period)} aria-label="Period">
          {Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="ins-stats">
          <div className="stat"><div className="stat-n">{d.guests}</div><div className="stat-l">Guests in period</div></div>
          <div className="stat"><div className="stat-n">{d.returning}</div><div className="stat-l">Returning guests</div></div>
          <div className="stat"><div className="stat-n ins-sm">{tg(d.avg)}</div><div className="stat-l">Average bill</div></div>
          <div className="stat"><div className="stat-n">{Math.round((d.returning / d.guests) * 100)}%</div><div className="stat-l">Return rate</div></div>
        </div>
      </section>

      <section className="group ins">
        <div className="label">Visit rhythm</div>
        <p className="muted ins-p">Orders across the selected period.</p>
        <div className="ins-chart">
          {d.weeks.map((w, i) => (
            <div className="ins-col" key={w.w}>
              <b>{w.n}</b>
              <i className={i === d.weeks.length - 1 ? "last" : ""} style={{ height: `${Math.max(4, (w.n / max) * 100)}%` }} />
              <span>{w.w}</span>
            </div>
          ))}
        </div>
        <div className="ins-note"><b>{d.returning} returning guests</b> in this period. Personal recommendations help you see what brings them back.</div>
      </section>

      <section className="group ins">
        <div className="label">What could be better</div>
        <p className="muted ins-p">Guest feedback · {fbTotal} answers</p>
        <div className="ins-fb">
          {FEEDBACK.map((f) => (
            <div key={f.k}>
              <div className="ins-fb-row"><span>{f.k}</span><b>{f.n}</b></div>
              <div className="ins-track"><i style={{ width: `${(f.n / fbMax) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <p className="muted ins-p">Categories show what guests told us, not proven reasons for leaving.</p>
      </section>

      <section className="group ins">
        <div className="label">Regular guests</div>
        <div className="ins-reg">
          {REGULARS.map((r) => (
            <div className="ins-guest" key={r.name}>
              <div className="ins-av">{r.name[0]}</div>
              <div className="ins-gmain">
                <div className="ins-grow"><b>{r.name}</b><span className="muted">{r.visits} visits</span></div>
                <div className="ins-gmeta"><span>Avg bill {tg(r.avg)}</span><span>Last visit {r.last}</span></div>
                <span className="ins-tag">{r.likes}</span>
                {daysSince(r.last) >= AWAY_DAYS && (
                  <div className="ins-away">
                    <span className="ins-away-tag">Haven't visited in a while</span>
                    <button className="ins-away-btn" onClick={() => setWinBack(r)}>Win back guest</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {winBack && (
        <div className="sheet-overlay" style={{ position: "fixed" }} onClick={() => setWinBack(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Win back guest" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, margin: "0 auto" }}>
            <div className="sheet-handle" />
            <div className="sheet-title">{winBack.name} hasn't been here in a while</div>
            <div className="sheet-points">
              <div className="sheet-point"><b>Last visit</b><span>{daysSince(winBack.last)} days ago · {winBack.last}</span></div>
              <div className="sheet-point"><b>Preferences</b><span>{winBack.likes}</span></div>
              <div className="sheet-point"><b>Personal offer</b><span>«{offerFor(winBack)}»</span></div>
            </div>
            <a className="cta" style={{ textAlign: "center", textDecoration: "none" }} target="_blank" rel="noopener noreferrer"
              href={`https://wa.me/${winBack.phone}?text=${encodeURIComponent(offerFor(winBack))}`}>Open in WhatsApp</a>
            <button className="ins-away-btn" style={{ alignSelf: "center" }} onClick={() => setWinBack(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
