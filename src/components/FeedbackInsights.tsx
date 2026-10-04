import { useEffect, useState } from "react";
import { clearFeedback, loadFeedback, type FeedbackEntry } from "@/lib/feedback";
import { useRestaurant } from "@/lib/restaurants";


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
  const reviews = list.filter((f) => f.kind === "review").reverse();

  return (
    <section className="group">
      <div className="label">Guest reviews</div>
      <div className="fb-stats">
        <div className="fb-stat"><b>{reviews.length}</b><span>Reviews</span></div>
        <div className="fb-stat"><b>{reviews.filter((r) => Date.now() - new Date(r.at).getTime() < 7 * 864e5).length}</b><span>This week</span></div>
        <div className="fb-stat"><b>{reviews.length ? Math.round(reviews.reduce((n, r) => n + r.text.length, 0) / reviews.length) : 0}</b><span>Avg. length</span></div>
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
