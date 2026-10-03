import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ALLERGENS, DISHES, HOURS, OCC, RESTAURANT_NAME, checkedDishes, lower, rankedZones, type Kind } from "@/lib/sitabit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SitABit" },
      { name: "description", content: "Find where and when this place feels right for your occasion, and which dishes are safe for you." },
      { property: "og:title", content: "SitABit" },
      { property: "og:description", content: "Best zone and time for your occasion, plus allergen-safe dishes." },
    ],
  }),
  component: App,
});

type Screen = "setup" | "tonight" | "safe";

function Icon({ kind }: { kind: Kind | "info" }) {
  if (kind === "ok") return <svg className="ic-ok" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
  if (kind === "ask") return <svg className="ic-ask" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 3.5" /><path d="M12 17v.01" /></svg>;
  if (kind === "no") return <svg className="ic-no" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>;
  return <svg className="ic-info" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16.5v.01" /></svg>;
}

function App() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [occId, setOccId] = useState("date");
  const [allergies, setAllergies] = useState<string[]>(["nuts"]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const o = OCC.find((x) => x.id === occId)!;
  const dishes = checkedDishes(allergies);
  const safeCount = dishes.filter((d) => d.kind === "ok").length;
  const go = (s: Screen) => { setScreen(s); scrollRef.current?.scrollTo({ top: 0 }); };

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
      <button className="tab" onClick={() => go("tonight")} aria-current={screen === "tonight" ? "page" : undefined}>Tonight</button>
      <button className="tab" onClick={() => go("safe")} aria-current={screen === "safe" ? "page" : undefined}>Safe for you · {safeCount}</button>
    </nav>
  );

  if (screen === "setup") {
    return (
      <main className="app" aria-live="polite">
        <div className="scroll" ref={scrollRef}><div className="setup">
          <div className="logo" style={{ fontSize: 22 }}>SitABit</div>
          <div>
            <h1>What's tonight?</h1>
            <p className="muted">Tell us once. We'll show you where and when this place feels right for you.</p>
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
            <div className="label" id="al-label">Anything you can't eat?</div>
            <div className="chips" role="group" aria-labelledby="al-label">
              {ALLERGENS.map((a) => (
                <button key={a.id} className="chip" aria-pressed={allergies.includes(a.id)}
                  onClick={() => setAllergies(allergies.includes(a.id) ? allergies.filter((x) => x !== a.id) : [...allergies, a.id])}>{a.label}</button>
              ))}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>Tap again to remove. Leave empty if nothing applies.</div>
          </div>
        </div></div>
        <div className="cta-wrap"><button className="cta" onClick={() => go("tonight")}>Show me tonight</button></div>
      </main>
    );
  }

  if (screen === "tonight") {
    const zones = rankedZones(o), top = zones[0]!;
    const diet = allergies.length ? "No " + allergies.map(lower).join(", ") : "No food restrictions";
    const good = HOURS.filter((h) => h.occ >= o.lo && h.occ <= o.hi).map((h) => h.h + ":00");
    const badge = ["Your vibe", "Could work", "Not your vibe"];
    return (
      <main className="app" aria-live="polite">
        {header(RESTAURANT_NAME, (
          <div className="meta"><span><span className="dot" />Live · updated 1 min ago</span><span>·</span><span>{o.label}</span><span>·</span><span>{diet}</span></div>
        ))}
        <div className="scroll" ref={scrollRef}><div className="body">
          <section className="hero">
            <div className="k">Best for {o.headline} right now</div>
            <div className="n">{top.name}</div>
            <div className="l">{top.vibe} · {top.free} tables free · {top.sound}</div>
          </section>
          <section className="group">
            <div className="label">Every zone, right now</div>
            {zones.map((z) => {
              const filled = Math.round(z.occ / 20);
              return (
                <div className="zone" key={z.name}>
                  <div className="zone-top"><b>{z.name}</b><span className={`badge f${z.fit}`}>{badge[z.fit]}</span></div>
                  <div className="meter" role="img" aria-label={`${z.occ}% full`}>{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < filled ? "on" : ""} />)}</div>
                  <div className="zone-bottom"><span>{z.vibe} · {z.sound}</span><span>{z.free} of {z.total} tables free</span></div>
                </div>
              );
            })}
          </section>
          <section className="group">
            <div className="label">Best times tonight</div>
            <div className="chart">
              <div className="bars">{HOURS.map((h) => <i key={h.h} className={h.occ >= o.lo && h.occ <= o.hi ? "good" : ""} style={{ height: Math.round(h.occ * 1.15) }} title={`${h.h}:00 · ${h.occ}% full`} />)}</div>
              <div className="hours">{HOURS.map((h) => <span key={h.h} className={h.now ? "now" : ""}>{h.now ? "Now" : h.h + ":00"}</span>)}</div>
              <div className="chart-foot"><span className="muted">Feels right for you at </span><b>{good.length ? good.join(" · ") : "no hour tonight, try another day"}</b></div>
            </div>
          </section>
        </div></div>
        {tabs}
      </main>
    );
  }

  const summary = allergies.length ? `${safeCount} of ${DISHES.length} dishes are safe for you right now` : "Add your restrictions to see what is safe for you";
  return (
    <main className="app" aria-live="polite">
      {header("Safe for you tonight", <div className="muted" style={{ fontSize: 14 }}>{summary}</div>)}
      <div className="scroll" ref={scrollRef}><div className="body" style={{ gap: 10 }}>
        <div className="note"><Icon kind="info" /><span>Checked against the kitchen's live recipes. Severe allergy? Tell your waiter too, since kitchens share equipment.</span></div>
        <div className="dishes">
          {dishes.map((d) => (
            <div className="dish" key={d.name}><Icon kind={d.kind} /><div><b>{d.name}</b><div className="d">{d.desc}</div><div className={`s ${d.kind}`}>{d.status}</div></div></div>
          ))}
        </div>
      </div></div>
      {tabs}
    </main>
  );
}
