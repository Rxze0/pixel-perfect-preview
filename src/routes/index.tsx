import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { FloorPlan } from "@/components/FloorPlan";
import { StartTable } from "@/components/StartTable";
import { OwnerInsights } from "@/components/OwnerInsights";
import { BookingMap } from "@/components/BookingMap";
import { RestaurantPicker, useRestaurant } from "@/lib/restaurants";
import { AccountButton, AFTER_LOGIN_KEY, useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ALLERGENS, DISHES, HOURS, OCC, TABLES, ZONES, lower, rankedZones, type Kind, type Person, type Table } from "@/lib/sitabit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SitABit" },
      { name: "description", content: "Find where and when this place feels right for your occasion." },
      { property: "og:title", content: "SitABit" },
      { property: "og:description", content: "Best zone and time for your occasion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Screen = "start" | "setup" | "tonight" | "manager" | "tables" | "table" | "after";

function Icon({ kind }: { kind: Kind | "info" }) {
  if (kind === "ok") return <svg className="ic-ok" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
  if (kind === "ask") return <svg className="ic-ask" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 3.5" /><path d="M12 17v.01" /></svg>;
  if (kind === "no") return <svg className="ic-no" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>;
  return <svg className="ic-info" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16.5v.01" /></svg>;
}

let nextPersonId = 1;

function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [occId, setOccId] = useState("date");
  const [people, setPeople] = useState<Person[]>([{ id: "p0", name: "Me", restrictions: ["nuts"] }]);
  const [newName, setNewName] = useState("");
  const [promo, setPromo] = useState(false);
  const [howWeKnow, setHowWeKnow] = useState(false);
  const [tableId, setTableId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedDishes, setSavedDishes] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [planHour, setPlanHour] = useState<{ h: string; occ: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const RESTAURANT_NAME = useRestaurant().restaurant.name;
  const restaurantId = useRestaurant().restaurant.id;
  const concept = useRestaurant().restaurant.concept;
  // Signed-in: "Me" uses the profile's restrictions, saved dishes come from favorites.
  useEffect(() => {
    if (!auth.user) return;
    setPeople((ps) => ps.map((p) => p.id === "p0" ? { ...p, name: auth.user!.name, restrictions: auth.user!.restrictions } : p));
    setSavedDishes(auth.user.favorites);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.email]);

  // Returning from Google sign-in (full-page redirect): go straight into the guest flow.
  useEffect(() => {
    if (!auth.user) return;
    let after: string | null = null;
    try { after = sessionStorage.getItem(AFTER_LOGIN_KEY); sessionStorage.removeItem(AFTER_LOGIN_KEY); } catch { /* ignore */ }
    if (after === null) return;
    if (after.startsWith("/menu")) { window.location.replace("/menu"); return; }
    setScreen((s) => (s === "start" ? "setup" : s));
  }, [auth.user]);

  useEffect(() => {
    if (!howWeKnow) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setHowWeKnow(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [howWeKnow]);

  const o = OCC.find((x) => x.id === occId)!;
  const go = (s: Screen) => {
    if (s === screen) return;
    const changeScreen = () => {
      flushSync(() => setScreen(s));
      scrollRef.current?.scrollTo({ top: 0 });
    };
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("screen-transitioning");
      const transition = document.startViewTransition(changeScreen);
      void transition.finished.finally(() => document.documentElement.classList.remove("screen-transitioning"));
    } else {
      changeScreen();
    }
  };

  const addPerson = () => {
    if (!auth.requireUser("Adding people and their food needs")) return;
    const name = newName.trim();
    if (!name) return;
    setPeople([...people, { id: "p" + nextPersonId++, name, restrictions: [] }]);
    setNewName("");
  };
  const removePerson = (id: string) => setPeople(people.filter((p) => p.id !== id));
  const toggleRestriction = (id: string, allergen: string) => {
    if (!auth.requireUser("Saving food preferences")) return;
    const next = people.map((p) => p.id === id
      ? { ...p, restrictions: p.restrictions.includes(allergen) ? p.restrictions.filter((x) => x !== allergen) : [...p.restrictions, allergen] }
      : p);
    setPeople(next);
    if (id === "p0") auth.updateUser({ restrictions: next[0]!.restrictions });
  };

  const liveBadge = (
    <button className="live-btn" onClick={() => setHowWeKnow(true)}>
      <span className="dot" />Live · updated 1 min ago
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16.5v.01" /></svg>
    </button>
  );

  const sheet = howWeKnow && (
    <div className="sheet-overlay" onClick={() => setHowWeKnow(false)}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="How we know" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">How we know</div>
        <div className="sheet-points">
          <div className="sheet-point"><b>Tables</b><span>Status comes straight from the restaurant's order system — no staff has to tap anything.</span></div>
          <div className="sheet-point"><b>Vibe</b><span>A small sound sensor in each zone reads the room. Volume only, never recordings.</span></div>
          <div className="sheet-point"><b>Allergens</b><span>We read the kitchen's live recipes, so it matches what the chefs actually cook.</span></div>
        </div>
        <button className="cta" onClick={() => setHowWeKnow(false)}>Got it</button>
      </div>
    </div>
  );

  const header = (title: string, subline: React.ReactNode) => (
    <div className="head">
      <div className="head-row">
        <div className="logo" style={{ fontSize: 18 }}>SitABit</div>
        <button className="ghost" onClick={() => go("setup")}>Edit preferences</button>
      </div>
      <div className="title">{title}</div>
      {subline}
    </div>
  );
  const tabs = (
    <nav className="tabs" aria-label="Sections">
      <button className="tab" onClick={() => go("tonight")} aria-current={screen === "tonight" ? "page" : undefined}>
        <svg className="tab-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
        <span>Tonight</span>
      </button>
      <button className="tab" onClick={() => go("after")} aria-current={screen === "after" ? "page" : undefined}>
        <svg className="tab-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" /></svg>
        <span>After visit</span>
      </button>
    </nav>
  );

  if (screen === "start") {
    return (
      <main key="start" className="app" aria-live="polite">
        <div className="scroll" ref={scrollRef}><div className="setup">
          <div className="head-row"><div className="logo" style={{ fontSize: 22 }}>SitABit</div><AccountButton /></div>
          <div>
            <h1>Who's at the table?</h1>
          </div>
          <StartTable onGuest={() => { go("setup"); if (auth.ready && !auth.session) auth.openWelcome(); }} onRestaurant={() => auth.enterStaff(() => go("manager"))} />
        </div></div>
      </main>
    );
  }

  if (screen === "setup") {
    return (
      <main key="setup" className="app" aria-live="polite">
        <div className="scroll" ref={scrollRef}><div className="setup">
          <div className="head-row"><div className="logo" style={{ fontSize: 22 }}>SitABit</div><AccountButton /></div>
          <div>
            <h1>What's tonight?</h1>
            <p className="muted">Tell us once. We'll show you where and when this place feels right for you.</p>
          </div>
          <div className="group">
            <div className="label">The restaurant</div>
            <RestaurantPicker />
            <p className="rest-concept">{concept}</p>
          </div>
          <div className="group">
            <div className="label" id="occ-label">The occasion</div>
            <div className="occ-grid" role="group" aria-labelledby="occ-label">
              {OCC.map((x) => (
                <button key={x.id} className="occ" aria-pressed={x.id === occId} onClick={() => setOccId(x.id)}><b>{x.label}</b><span>{x.sub}</span></button>
              ))}
            </div>
          </div>
          <div className="group">
            <div className="label" id="who-label">Who's coming?</div>
            <div className="people" role="group" aria-labelledby="who-label">
              {people.map((p) => (
                <div className="person" key={p.id}>
                  <div className="person-top">
                    <b>{p.name}</b>
                    {people.length > 1 && <button className="person-remove" aria-label={`Remove ${p.name}`} onClick={() => removePerson(p.id)}>Remove</button>}
                  </div>
                  <div className="chips" role="group" aria-label={`Food restrictions for ${p.name}`}>
                    {ALLERGENS.map((a) => (
                      <button key={a.id} className="chip" aria-pressed={p.restrictions.includes(a.id)} onClick={() => toggleRestriction(p.id, a.id)}>{a.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="person-add">
              <input
                className="person-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addPerson(); }}
                placeholder="Name, e.g. Mom"
                aria-label="Name of person to add"
                maxLength={24}
              />
              <button className="ghost" onClick={addPerson} disabled={!newName.trim()}>Add</button>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>Pick what each person can't eat. Leave empty if nothing applies.</div>
          </div>
        </div></div>
        <div className="cta-wrap">
          <button className="cta" onClick={() => go("tonight")}>Show me tonight</button>
          <a className="for-rest" href="/menu">See the full menu</a>
          <button className="for-rest" onClick={() => go("start")}>Back to start</button>
        </div>
      </main>
    );
  }

  if (screen === "manager") {
    const QUIET = 45;
    const quietHours = HOURS.filter((h) => h.occ < QUIET).map((h) => h.h + ":00");
    const calmest = [...ZONES].sort((a, b) => a.occ - b.occ)[0]!;
    const firstBusy = HOURS.find((h) => h.occ >= QUIET);
    return (
      <main key="manager" className="app" aria-live="polite">
        <div className="head">
          <div className="head-row">
            <div className="logo" style={{ fontSize: 18 }}>SitABit</div>
            <button className="ghost" onClick={() => go("start")}>Switch role</button>
            <button className="ghost" onClick={() => { auth.staffSignOut(); go("start"); }}>Staff sign out</button>
          </div>
          <div className="title">{RESTAURANT_NAME} · Staff & owner</div>
          <div className="meta">{liveBadge}<span>·</span><span>Sample data</span></div>
        </div>
        <div className="scroll" ref={scrollRef}><div className="body">
          <section className="group">
            <div className="label">Live occupancy by zone</div>
            {ZONES.map((z) => (
              <div className="zone" key={z.name}>
                <div className="zone-top"><b>{z.name}</b><span className="occ-pct">{z.occ}%</span></div>
                <div className="meter" role="img" aria-label={`${z.occ}% full`}>{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < Math.round(z.occ / 20) ? "on" : ""} />)}</div>
                <div className="zone-bottom"><span>{z.vibe} · {z.sound}</span><span>{z.free} of {z.total} tables free</span></div>
              </div>
            ))}
          </section>
          <section className="group">
            <div className="label">Today's occupancy by hour</div>
            <div className="chart">
              <div className="bars">{HOURS.map((h) => <i key={h.h} className={h.occ < QUIET ? "good" : ""} style={{ height: Math.round(h.occ * 1.15) }} title={`${h.h}:00 · ${h.occ}% full`} />)}</div>
              <div className="hours">{HOURS.map((h) => <span key={h.h} className={h.now ? "now" : ""}>{h.now ? "Now" : h.h + ":00"}</span>)}</div>
              <div className="chart-foot"><span className="muted">Quiet hours (under {QUIET}% full): </span><b>{quietHours.length ? quietHours.join(" · ") : "none today"}</b></div>
            </div>
          </section>
          <section className="stat">
            <div className="stat-n">128</div>
            <div className="stat-l">Guests who checked SitABit today</div>
          </section>
          <OwnerInsights />
          <section className="group">
            <button className="cta" onClick={() => setPromo(!promo)}>{promo ? "Hide preview" : "Promote quiet hours"}</button>
            <button className="ghost" onClick={() => go("tables")}>Tables · for waiters</button>
            {promo && (
              <div className="promo">
                <div className="label">Guests would see</div>
                <div className="promo-msg">
                  <div className="k">Quiet hours at {RESTAURANT_NAME}</div>
                  <div className="m">{calmest.name} is calm until {firstBusy ? firstBusy.h + ":00" : "closing"} — book a table and enjoy the quiet.</div>
                </div>
              </div>
            )}
          </section>
        </div></div>
        {sheet}
      </main>
    );
  }

  if (screen === "tables") {
    return (
      <main key="tables" className="app" aria-live="polite">
        <div className="head">
          <div className="head-row">
            <div className="logo" style={{ fontSize: 18 }}>SitABit</div>
            <button className="ghost" onClick={() => go("manager")}>Back</button>
          </div>
          <div className="title">Tables</div>
          <div className="meta"><span>{TABLES.length} tables seated now</span><span>·</span><span>Sample data</span></div>
        </div>
        <div className="scroll" ref={scrollRef}><div className="body">
          <div className="note"><Icon kind="info" /><span>Tap a table to see the occasion, everyone's food restrictions, and past favorites. We never show how much a guest spends.</span></div>
          <section className="group">
            {TABLES.map((t) => (
              <button className="table-card" key={t.id} onClick={() => { setTableId(t.id); go("table"); }}>
                <div className="zone-top">
                  <b>{t.name} · {t.guests} {t.guests === 1 ? "guest" : "guests"}</b>
                  <span className="badge f0">{t.occasion}</span>
                </div>
                <div className="zone-bottom">
                  <span>{t.visits > 0 ? `Returning guest · ${t.visits} visits` : "First visit"}</span>
                  {t.restrictions.length > 0 && <span>No {t.restrictions.map(lower).join(", ")}</span>}
                </div>
              </button>
            ))}
          </section>
        </div></div>
      </main>
    );
  }

  if (screen === "table") {
    const t = TABLES.find((x) => x.id === tableId)!;
    return (
      <main key="table" className="app" aria-live="polite">
        <div className="head">
          <div className="head-row">
            <div className="logo" style={{ fontSize: 18 }}>SitABit</div>
            <button className="ghost" onClick={() => go("tables")}>All tables</button>
          </div>
          <div className="title">{t.name}</div>
          <div className="meta"><span>{t.guests} {t.guests === 1 ? "guest" : "guests"}</span><span>·</span><span>{t.occasion}</span><span>·</span><span>{t.visits > 0 ? `Returning · ${t.visits} visits` : "First visit"}</span></div>
        </div>
        <div className="scroll" ref={scrollRef}><div className="body">
          <section className="group">
            <div className="label">Food restrictions at this table</div>
            {t.restrictions.length ? (
              <div className="chips">{t.restrictions.map((r) => <span key={r} className="chip on">No {lower(r)}</span>)}</div>
            ) : (
              <div className="muted" style={{ fontSize: 14 }}>None — everything on the menu is fine.</div>
            )}
          </section>
          <section className="group">
            <div className="label">Favorites from past visits</div>
            {t.favorites.length ? (
              <div className="dishes">
                {t.favorites.map((f) => (
                  <div className="dish" key={f}><Icon kind="ok" /><div><b>{f}</b></div></div>
                ))}
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 14 }}>First visit — no history yet.</div>
            )}
          </section>
          <section className="group">
            <div className="label">A gentle suggestion</div>
            <div className="note"><Icon kind="info" /><span>{t.pairing}</span></div>
          </section>
        </div></div>
      </main>
    );
  }

  if (screen === "tonight") {
    const zones = rankedZones(o), top = zones[0]!;
    const allRestrictions = [...new Set(people.flatMap((p) => p.restrictions))];
    const diet = allRestrictions.length ? "No " + allRestrictions.map(lower).join(", ") : "No food restrictions";
    const good = HOURS.filter((h) => h.occ >= o.lo && h.occ <= o.hi).map((h) => h.h + ":00");
    const badge = ["Your vibe", "Could work", "Not your vibe"];
    return (
      <main key="tonight" className="app" aria-live="polite">
        {header(RESTAURANT_NAME, (
          <>
            <div className="meta">{liveBadge}</div>
            <div className="meta-chips"><span className="pill">{o.label}</span><span className="pill">{diet}</span></div>
          </>
        ))}
        <div className="scroll" ref={scrollRef}><div className="body">
          <section className="hero">
            <div className="k">Best for {o.headline} right now</div>
            <div className="n">{top.name}</div>
            <div className="l">{top.vibe} · {top.free} tables free · {top.sound}</div>
          </section>
          <FloorPlan best={top.name} hour={planHour} onPick={(n) => document.getElementById(`zone-${n.replace(/\s+/g, "-")}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} />
          <BookingMap />
          <section className="group">
            <div className="label">Every zone, right now</div>
             {zones.map((z, index) => {
              const filled = Math.round(z.occ / 20);
              return (
                 <div className="zone ranked-zone" id={`zone-${z.name.replace(/\s+/g, "-")}`} key={z.name} style={{ "--rank": index } as React.CSSProperties}>
                  <div className="zone-top"><b>{z.name}</b><span className={`badge f${z.fit}`}>{badge[z.fit]}</span></div>
                  <div className="meter" role="img" aria-label={`${z.occ}% full`}>{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < filled ? "on" : ""} />)}</div>
                  <div className="zone-bottom"><span>{z.vibe} · {z.sound}</span><span>{z.free} of {z.total} tables free</span></div>
                  {z.fit === 2 && (
                    <button className="zone-notify" onClick={() => toast(`We'll notify you when ${z.name} matches your vibe.`)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9.5a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
                      Tell me when it's my vibe
                    </button>
                  )}
                </div>
              );
            })}
          </section>
          <section className="group">
            <div className="label">Best times tonight</div>
            <div className="chart">
              <div className="bars">{HOURS.map((h) => <button key={h.h} type="button" className={`bar-btn${planHour?.h === h.h ? " sel" : ""}`} aria-label={`Show the floor plan at ${h.h}:00`} aria-pressed={planHour?.h === h.h} onClick={() => setPlanHour(planHour?.h === h.h ? null : { h: h.h, occ: h.occ })}><i className={h.occ >= o.lo && h.occ <= o.hi ? "good" : ""} style={{ height: Math.round(h.occ * 1.15) }} /></button>)}</div>
              <div className="hours">{HOURS.map((h) => <span key={h.h} className={h.now ? "now" : ""}>{h.now ? "Now" : h.h + ":00"}</span>)}</div>
              <div className="chart-foot"><span className="muted">{planHour ? `Floor plan shows ${planHour.h}:00 — tap again for now. Feels right at ` : "Feels right for you at "}</span><b>{good.length ? good.join(" · ") : "no hour tonight, try another day"}</b></div>
            </div>
          </section>
        </div></div>
        {tabs}
        {sheet}
      </main>
    );
  }

  if (screen === "after") {
    const options = ["Food", "Speed", "Service", "Atmosphere", "Price", "Nothing, it was great"];
    const great = feedback === "Nothing, it was great";
    return (
      <main key="after" className="app" aria-live="polite">
        {header("After your visit", <div className="muted" style={{ fontSize: 14 }}>Thanks for coming by tonight</div>)}
        <div className="scroll" ref={scrollRef}><div className="body">
          <section className="group">
            <div className="label">What could have been better tonight?</div>
            <div className="chips">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`chip${feedback === option ? " on" : ""}`}
                  aria-pressed={feedback === option}
                  onClick={() => {
                    if (!auth.requireUser("Leaving feedback")) return;
                    const next = feedback === option ? null : option;
                    setFeedback(next);
                    if (next) void supabase.from("feedback").insert({ restaurant_id: restaurantId, reason: next });
                  }}
                >{option}</button>
              ))}
            </div>
            {feedback && !great && (
              <div className="note"><Icon kind="info" /><span>Thanks — noted for the team. We'll work on the {feedback.toLowerCase()}.</span></div>
            )}
          </section>
          {great && (
            <section className="group">
              <div className="label">Save the dishes you liked?</div>
              <div className="muted" style={{ fontSize: 13 }}>We'll remember them for your next visit.</div>
              <div className="dish-save-list">
                {DISHES.map((d) => {
                  const saved = savedDishes.includes(d.name);
                  return (
                    <label key={d.name} className={`dish-save${saved ? " saved" : ""}`}>
                      <input
                        type="checkbox"
                        checked={saved}
                        onChange={() => {
                          if (!auth.requireUser("Saving favorite dishes")) return;
                          const next = savedDishes.includes(d.name) ? savedDishes.filter((n) => n !== d.name) : [...savedDishes, d.name];
                          setSavedDishes(next);
                          auth.updateUser({ favorites: next });
                        }}
                      />
                      <span className="dish-save-box" aria-hidden="true">{saved ? "✓" : ""}</span>
                      <span className="dish-save-info">
                        <b>{d.name}</b>
                        <span className="dish-save-tags">{d.desc}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {savedDishes.length > 0 && (
                <div className="note"><Icon kind="ok" /><span>Saved {savedDishes.length} {savedDishes.length === 1 ? "dish" : "dishes"} for next time.</span></div>
              )}
            </section>
          )}
          <section className="group">
            <div className="label">Or write your own review</div>
            <div className="muted" style={{ fontSize: 13 }}>Tell us in your own words — we read every note.</div>
            {reviewSent ? (
              <div className="note"><Icon kind="ok" /><span>Thanks for your review — it went straight to the team.</span></div>
            ) : (
              <>
                <textarea
                  className="review-input"
                  placeholder="How was your evening?"
                  value={reviewText}
                  maxLength={500}
                  rows={4}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <button
                  type="button"
                  className="cta"
                  disabled={reviewText.trim().length < 3}
                  onClick={() => {
                    if (!auth.requireUser("Leaving a review")) return;
                    const text = reviewText.trim();
                    if (text.length < 3) return;
                    void supabase.from("feedback").insert({ restaurant_id: restaurantId, reason: text.slice(0, 500) });
                    setReviewSent(true);
                  }}
                >Send review</button>
              </>
            )}
          </section>
        </div></div>
        {tabs}
      </main>
    );
  }

  return null;
}
