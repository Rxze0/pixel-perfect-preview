/** Demo mode: guest feedback lives in this browser's storage. v2 key = fresh start (old test data dropped). */
export type FeedbackEntry = { restaurantId: string; kind: "reason" | "review"; text: string; at: string };

const KEY = "sitabit-feedback-v2";

export function loadFeedback(): FeedbackEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as FeedbackEntry[];
  } catch {
    return [];
  }
}

export function saveFeedback(restaurantId: string, kind: FeedbackEntry["kind"], text: string) {
  try {
    const list = loadFeedback();
    list.push({ restaurantId, kind, text, at: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("sitabit-feedback"));
  } catch { /* ignore */ }
}

export function clearFeedback() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem("sitabit-feedback");
    window.dispatchEvent(new Event("sitabit-feedback"));
  } catch { /* ignore */ }
}
