/* Demo accounts live only in this browser (localStorage). No server, no email
   confirmation — any email + password of 6+ characters works. "Guest" is a
   local choice so visitors can browse without an account. */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type Context } from "react";
import { ALLERGENS } from "@/lib/sitabit";

export type User = { id: string; name: string; email: string; restrictions: string[]; favorites: string[] };
export type Session = { mode: "guest" } | { mode: "user"; user: User } | null;
export type Staff = { name: string };

const GUEST_KEY = "sitabit-guest";
const USERS_KEY = "sitabit-users";
const CURRENT_KEY = "sitabit-user";

type StoredUser = User & { password: string };

function readUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as StoredUser[]; } catch { return []; }
}
function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState(false);
  const [view, setView] = useState<null | "auth" | "gate" | "profile" | "welcome" | "staff">(null);
  const staffNext = useRef<(() => void) | null>(null);
  const [gateWhat, setGateWhat] = useState("This feature");
  const [staffPin, setStaffPin] = useState<Staff | null>(null);

  useEffect(() => {
    try { const v = localStorage.getItem("sitabit-staff"); if (v) setStaffPin(JSON.parse(v)); } catch { /* ignore */ }
    setGuest(localStorage.getItem(GUEST_KEY) === "1");
    const cur = localStorage.getItem(CURRENT_KEY);
    if (cur) {
      const found = readUsers().find((u) => u.email === cur);
      if (found) setUser({ id: found.id, name: found.name, email: found.email, restrictions: found.restrictions, favorites: found.favorites });
    }
    setReady(true);
  }, []);

  const session: Session = user ? { mode: "user", user } : guest ? { mode: "guest" } : null;

  const signIn = (u: StoredUser) => {
    localStorage.setItem(CURRENT_KEY, u.email);
    setUser({ id: u.id, name: u.name, email: u.email, restrictions: u.restrictions, favorites: u.favorites });
    setView(null);
  };

  const ctx: Ctx = {
    ready, session, user, isGuest: !user && guest,
    continueAsGuest: () => { localStorage.setItem(GUEST_KEY, "1"); setGuest(true); setView(null); },
    signOut: () => { localStorage.removeItem(CURRENT_KEY); setUser(null); setView(null); },
    updateUser: (patch) => {
      if (!user) return;
      const next = { ...user, ...patch };
      setUser(next);
      writeUsers(readUsers().map((u) => (u.email === user.email ? { ...u, ...patch } : u)));
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

  // Once signed in, sign-in windows never stay open.
  useEffect(() => {
    if (user && (view === "auth" || view === "welcome" || view === "gate")) setView(null);
  }, [user, view]);

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
      {view === "auth" && <AuthForm onClose={() => setView(null)} onSignIn={signIn} onGuest={!session ? ctx.continueAsGuest : undefined} />}
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
          <button className="ghost auth-wide" onClick={() => { localStorage.removeItem(CURRENT_KEY); setUser(null); setView("auth"); }}>Switch profile</button>
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

function EmailForm({ mode, onSignIn }: { mode: "in" | "up"; onSignIn: (u: StoredUser) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    const mail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setErr("Please enter a valid email.");
    if (pw.length < 6) return setErr("Password needs at least 6 characters.");
    const users = readUsers();
    const found = users.find((u) => u.email === mail);
    if (mode === "up") {
      if (!name.trim()) return setErr("What should we call you?");
      if (found) return setErr("This email already has an account — sign in instead.");
      const u: StoredUser = { id: crypto.randomUUID(), name: name.trim(), email: mail, password: pw, restrictions: [], favorites: [] };
      writeUsers([...users, u]);
      onSignIn(u);
    } else {
      if (!found || found.password !== pw) return setErr("Wrong email or password.");
      onSignIn(found);
    }
  };
  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "up" && <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
      <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label><span>Password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} /></label>
      {err && <div className="auth-err" role="alert">{err}</div>}
      <button className="cta" type="submit">{mode === "in" ? "Sign in" : "Create account"}</button>
    </form>
  );
}

function AuthForm({ onClose, onSignIn, onGuest }: { onClose: () => void; onSignIn: (u: StoredUser) => void; onGuest?: (() => void) | undefined }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  return (
    <Overlay onClose={onClose} label="Sign in">
      <div className="auth-tabs" role="tablist">
        <button role="tab" aria-selected={mode === "in"} onClick={() => setMode("in")}>Sign in</button>
        <button role="tab" aria-selected={mode === "up"} onClick={() => setMode("up")}>Create account</button>
      </div>
      <EmailForm key={mode} mode={mode} onSignIn={onSignIn} />
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
