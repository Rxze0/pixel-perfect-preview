import { useEffect, useState } from "react";
import { clearFeedback, loadFeedback, type FeedbackEntry } from "@/lib/feedback";
import { useRestaurant } from "@/lib/restaurants";

const REASONS = ["Food", "Speed", "Service", "Atmosphere", "Price", "Nothing, it was great"];

export function FeedbackInsights() {
  const restaurantId = useRestaurant().restaurant.id;
  const [all, setAll] = useState<FeedbackEntry[]>([]);
  useEffect(() => {
    const sync = () => setAll(loadFeedback());
    sync();
    window.addEventListener("sitabit-feedback", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("sitabit-feedback", sync); window.removeEventListener("storage", sync); };
  }, []);
  const list = all.filter((f) => f.restaurantId === restaurantId);
  const votes = list.filter((f) => f.kind === "reason");
  const reviews = list.filter((f) => f.kind === "review").reverse();
  const max = Math.max(1, ...REASONS.map((r) => votes.filter((v) => v.text === r).length));

  return (
    <section className="group">
      <div className="label">Guest feedback & answers</div>
      <div className="fb-stats">
        <div className="fb-stat"><b>{votes.length}</b><span>Votes</span></div>
        <div className="fb-stat"><b>{reviews.length}</b><span>Reviews</span></div>
        <div className="fb-stat"><b>{votes.length ? Math.round((votes.filter((v) => v.text === REASONS[5]).length / votes.length) * 100) : 0}%</b><span>Loved it</span></div>
      </div>
      <div className="fb-bars">
        {REASONS.map((r) => {
          const n = votes.filter((v) => v.text === r).length;
          return (
            <div className="fb-bar" key={r}>
              <span>{r}</span>
              <i><em style={{ width: `${(n / max) * 100}%` }} /></i>
              <b>{n}</b>
            </div>
          );
        })}
      </div>
      <div className="label" style={{ marginTop: 6 }}>Written reviews</div>
      <div className="fb-list" tabIndex={0} aria-label="Written reviews">
        {reviews.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>No reviews yet. They appear here as soon as guests send them.</div>
        ) : reviews.map((r) => (
          <div className="fb-item" key={r.at}>
            <span className="fb-date">{new Date(r.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            <p>{r.text}</p>
          </div>
        ))}
      </div>
      {list.length > 0 && <button className="ghost" onClick={clearFeedback}>Reset test feedback</button>}
    </section>
  );
}
