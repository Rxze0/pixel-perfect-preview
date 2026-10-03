/* Accounts, profiles and staff roles live in Lovable Cloud.
   "Guest" is a local choice so visitors can browse without an account. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type Context } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ALLERGENS } from "@/lib/sitabit";

export type User = { id: string; name: string; email: string; restrictions: string[]; favorites: string[] };
export type Session = { mode: "guest" } | { mode: "user"; user: User } | null;
export type Staff = { name: string };

const GUEST_KEY = "sitabit-guest";

type Ctx = {
  ready: boolean;
  session: Session;
  user: User | null;
  isGuest: boolean;
  continueAsGuest: () => void;
  signOut: () => void;
  updateUser: (patch: Partial<Pick<User, "name" | "restrictions" | "favorites">>) => void;
  /** Returns true if signed in; otherwise opens the soft "sign in to use this" prompt. */
  requireUser: (what?: string) => boolean;
  openAuth: () => void;
  openProfile: () => void;
  openWelcome: () => void;
  staff: Staff | null;
  /** Calls onIn right away if a staff account is signed in; otherwise shows the staff sign-in first. */
  enterStaff: (onIn: () => void) => void;
  staffSignOut: () => void;
};
const g = globalThis as unknown as { __sitabitAuthCtx?: Context<Ctx | null> };
const AuthCtx = (g.__sitabitAuthCtx ??= createContext<Ctx | null>(null));
export const useAuth = () => {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
};

async function loadUser(id: string, email: string): Promise<{ user: User; staff: boolean }> {
  const [{ data: p }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("name, restrictions, favorites").eq("id", id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", id),
  ]);
  return {
    user: { id, email, name: p?.name || email.split("@")[0]!, restrictions: p?.restrictions ?? [], favorites: p?.favorites ?? [] },
    staff: (roles ?? []).some((r) => r.role === "staff" || r.role === "admin"),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [guest, setGuest] = useState(false);
  const [view, setView] = useState<null | "auth" | "gate" | "profile" | "welcome" | "staff">(null);
  const staffNext = useRef<(() => void) | null>(null);
  const [gateWhat, setGateWhat] = useState("This feature");
  const [staffPin, setStaffPin] = useState<Staff | null>(null);
  useEffect(() => {
    try { const v = localStorage.getItem("sitabit-staff"); if (v) setStaffPin(JSON.parse(v)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setGuest(localStorage.getItem(GUEST_KEY) === "1");
    const apply = async (s: { user: { id: string; email?: string } } | null) => {
      if (!s) { setUser(null); setIsStaff(false); setReady(true); return; }
      const r = await loadUser(s.user.id, s.user.email ?? "");
      setUser(r.user); setIsStaff(r.staff); setReady(true);
      if (staffNext.current && r.staff) { const n = staffNext.current; staffNext.current = null; setView(null); n(); }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
        setTimeout(() => { void apply(s); }, 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const session: Session = user ? { mode: "user", user } : guest ? { mode: "guest" } : null;
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setIsStaff(false); setView(null);
  };

  const ctx: Ctx = {
    ready, session, user, isGuest: !user && guest,
    continueAsGuest: () => { localStorage.setItem(GUEST_KEY, "1"); setGuest(true); setView(null); },
    signOut: () => { void signOut(); },
    updateUser: (patch) => {
      if (!user) return;
      setUser({ ...user, ...patch });
      void supabase.from("profiles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", user.id);
    },
    requireUser: useCallback((what?: string) => {
      if (user) return true;
      setGateWhat(what || "This feature"); setView("gate"); return false;
    }, [user]),
    openAuth: () => setView("auth"),
    openProfile: () => setView(user ? "profile" : "auth"),
    openWelcome: () => setView("welcome"),
    staff: staffPin,
    enterStaff: (onIn) => {
      if (staffPin) return onIn();
      staffNext.current = onIn; setView("staff");
    },
    staffSignOut: () => { localStorage.removeItem("sitabit-staff"); setStaffPin(null); },
  };

  useEffect(() => {
    if (!view) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setView(null); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [view]);

  return (
    <AuthCtx.Provider value={ctx}>
      {children}
      {view === "staff" && <StaffLogin onClose={() => { staffNext.current = null; setView(null); }} onIn={(st) => {
        localStorage.setItem("sitabit-staff", JSON.stringify(st)); setStaffPin(st); setView(null);
        const n = staffNext.current; staffNext.current = null; n?.();
      }} />}
      {view === "welcome" && <Welcome onAuth={() => setView("auth")} onGuest={ctx.continueAsGuest} />}
      {view === "auth" && <AuthForm onClose={() => setView(null)} onDone={() => setView(null)} onGuest={!session ? ctx.continueAsGuest : undefined} />}
      {view === "gate" && (
        <Overlay onClose={() => setView(null)} label="Sign in needed">
          <div className="auth-emoji" aria-hidden="true">🔒</div>
          <div className="sheet-title">Just for members</div>
          <p className="auth-p">{gateWhat} is available only to signed-in guests. Want to sign in or create an account? It takes a few seconds.</p>
          <button className="cta" onClick={() => setView("auth")}>Sign in or sign up</button>
          <button className="ghost auth-wide" onClick={() => setView(null)}>Maybe later</button>
        </Overlay>
      )}
      {view === "profile" && user && (
        <Overlay onClose={() => setView(null)} label="Your profile">
          <div className="auth-who">
            <div className="ins-av">{user.name[0]?.toUpperCase()}</div>
            <div><div className="sheet-title">{user.name}</div><div className="muted" style={{ fontSize: 14 }}>{user.email}</div></div>
          </div>
          <div className="label">I can't eat</div>
          <div className="chips">
            {ALLERGENS.map((a) => {
              const on = user.restrictions.includes(a.id);
              return <button key={a.id} className="chip" aria-pressed={on} onClick={() => ctx.updateUser({ restrictions: on ? user.restrictions.filter((x) => x !== a.id) : [...user.restrictions, a.id] })}>{a.label}</button>;
            })}
          </div>
          <div className="label">Favorite dishes</div>
          {user.favorites.length
            ? <div className="chips">{user.favorites.map((f) => <span key={f} className="chip on">♥ {f}</span>)}</div>
            : <p className="auth-p">No favorites yet — tap ♡ on any dish in the menu.</p>}
          <button className="ghost auth-wide" onClick={async () => { await supabase.auth.signOut(); setView("auth"); }}>Switch profile</button>
          <button className="ghost auth-wide auth-out" onClick={ctx.signOut}>Sign out</button>
        </Overlay>
      )}
    </AuthCtx.Provider>
  );
}

function Overlay({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="sheet auth-sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}

function Welcome({ onAuth, onGuest }: { onAuth: () => void; onGuest: () => void }) {
  return (
    <div className="auth-welcome" role="dialog" aria-modal="true" aria-label="Welcome to SitABit">
      <div className="auth-welcome-in">
        <div className="logo" style={{ fontSize: 26 }}>SitABit</div>
        <h1 className="auth-h">Find your table, your vibe and dishes that are safe for you.</h1>
        <p className="auth-p">Sign in to save your food restrictions, favorite dishes, bookings and feedback — or just look around first.</p>
        <button className="cta" onClick={onAuth}>Sign in / Sign up</button>
        <button className="ghost auth-wide" onClick={onGuest}>Continue as guest</button>
      </div>
    </div>
  );
}

async function google(setErr: (s: string) => void) {
  const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  if (r.error) setErr("Google sign-in didn't work. Please try again.");
}

function EmailForm({ mode, onDone }: { mode: "in" | "up"; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Please enter a valid email.");
    if (pw.length < 6) return setErr("Password needs at least 6 characters.");
    if (mode === "up" && !name.trim()) return setErr("What should we call you?");
    setBusy(true);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin, data: { name: name.trim() } } });
      setBusy(false);
      if (error) return setErr(error.message);
      if (!data.session) return setSent(true);
      onDone();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      setBusy(false);
      if (error) return setErr(error.message.includes("confirm") ? "Please confirm your email first — check your inbox." : "Wrong email or password.");
      onDone();
    }
  };
  if (sent) return <p className="auth-p">Almost there! We sent a confirmation link to <b>{email}</b>. Open it, then come back and sign in.</p>;
  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "up" && <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
      <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label><span>Password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} /></label>
      {err && <div className="auth-err" role="alert">{err}</div>}
      <button className="cta" type="submit" disabled={busy}>{busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}</button>
      <button className="ghost auth-wide" type="button" onClick={() => void google(setErr)}>Continue with Google</button>
    </form>
  );
}

function AuthForm({ onClose, onDone, onGuest }: { onClose: () => void; onDone: () => void; onGuest?: (() => void) | undefined }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  return (
    <Overlay onClose={onClose} label="Sign in">
      <div className="auth-tabs" role="tablist">
        <button role="tab" aria-selected={mode === "in"} onClick={() => setMode("in")}>Sign in</button>
        <button role="tab" aria-selected={mode === "up"} onClick={() => setMode("up")}>Create account</button>
      </div>
      <EmailForm key={mode} mode={mode} onDone={onDone} />
      {onGuest && <button className="ghost auth-wide" onClick={onGuest}>Continue as guest</button>}
    </Overlay>
  );
}

const STAFF_PIN = "1234";
function StaffLogin({ onClose, onIn }: { onClose: () => void; onIn: (s: Staff) => void }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== STAFF_PIN) return setErr("Wrong PIN. Try again.");
    onIn({ name: name.trim() || "Staff" });
  };
  return (
    <Overlay onClose={onClose} label="Staff sign in">
      <div className="auth-emoji" aria-hidden="true">🛎️</div>
      <div className="sheet-title">Staff sign in</div>
      <p className="auth-p">Enter your name and the staff PIN. You'll stay signed in on this device. Demo PIN: <b>1234</b></p>
      <form className="auth-form" onSubmit={submit}>
        <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
        <label><span>PIN</span><input className="staff-pin" inputMode="numeric" type="password" maxLength={4} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setErr(""); }} autoFocus /></label>
        {err && <div className="auth-err" role="alert">{err}</div>}
        <button className="cta" type="submit">Enter</button>
      </form>
    </Overlay>
  );
}

/** Small account button for headers. */
export function AccountButton() {
  const { ready, user, openProfile, openAuth } = useAuth();
  if (!ready) return null;
  return user
    ? <button className="acct-btn" onClick={openProfile} aria-label="Your profile"><span className="acct-av">{user.name[0]?.toUpperCase()}</span>{user.name}</button>
    : <button className="acct-btn" onClick={openAuth}>Sign in</button>;
}
