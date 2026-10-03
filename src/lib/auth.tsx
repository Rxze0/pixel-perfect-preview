/* Demo-only auth: sessions and accounts live in this browser's localStorage.
   Not secure — any email/password works. Swap for real accounts later. */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ALLERGENS } from "@/lib/sitabit";

export type User = { name: string; email: string; restrictions: string[]; favorites: string[] };
export type Session = { mode: "guest" } | { mode: "user"; user: User } | null;

const SESSION_KEY = "sitabit-session";
const ACCOUNTS_KEY = "sitabit-accounts";

type Ctx = {
  ready: boolean;
  session: Session;
  user: User | null;
  isGuest: boolean;
  continueAsGuest: () => void;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
  /** Returns true if signed in; otherwise opens the soft "sign in to use this" prompt. */
  requireUser: (what?: string) => boolean;
  openAuth: () => void;
  openProfile: () => void;
};
// Reuse one context across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __sitabitAuthCtx?: React.Context<Ctx | null> };
const AuthCtx = (g.__sitabitAuthCtx ??= createContext<Ctx | null>(null));
export const useAuth = () => {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
};

function readAccounts(): Record<string, User> {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}"); } catch { return {}; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session>(null);
  const [view, setView] = useState<null | "auth" | "gate" | "profile">(null);
  const [gateWhat, setGateWhat] = useState("This feature");

  useEffect(() => {
    try { setSession(JSON.parse(localStorage.getItem(SESSION_KEY) || "null")); } catch { /* ignore */ }
    setReady(true);
  }, []);

  const persist = (s: Session) => {
    setSession(s);
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(SESSION_KEY);
    if (s?.mode === "user") localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ ...readAccounts(), [s.user.email]: s.user }));
  };

  const user = session?.mode === "user" ? session.user : null;
  const ctx: Ctx = {
    ready, session, user, isGuest: session?.mode === "guest",
    continueAsGuest: () => { persist({ mode: "guest" }); setView(null); },
    signIn: (email, name) => {
      const key = email.trim().toLowerCase();
      const existing = readAccounts()[key];
      const u: User = existing
        ? { ...existing, name: name?.trim() || existing.name }
        : { name: name?.trim() || key.split("@")[0]!, email: key, restrictions: [], favorites: [] };
      persist({ mode: "user", user: u });
      setView(null);
    },
    signOut: () => { persist(null); setView(null); },
    updateUser: (patch) => { if (user) persist({ mode: "user", user: { ...user, ...patch } }); },
    requireUser: useCallback((what?: string) => {
      if (session?.mode === "user") return true;
      setGateWhat(what || "This feature"); setView("gate"); return false;
    }, [session]),
    openAuth: () => setView("auth"),
    openProfile: () => setView(user ? "profile" : "auth"),
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
      {ready && !session && !view && <Welcome onAuth={() => setView("auth")} onGuest={ctx.continueAsGuest} />}
      {view === "auth" && <AuthForm onClose={() => setView(null)} onSubmit={ctx.signIn} onGuest={!session ? ctx.continueAsGuest : undefined} />}
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
          <button className="ghost auth-wide" onClick={() => setView("auth")}>Switch profile</button>
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
        <p className="auth-p">Sign in to save your food restrictions, favorite dishes and feedback — or just look around first.</p>
        <button className="cta" onClick={onAuth}>Sign in / Sign up</button>
        <button className="ghost auth-wide" onClick={onGuest}>Continue as guest</button>
        <p className="muted" style={{ fontSize: 12, textAlign: "center" }}>Demo version — your data stays in this browser.</p>
      </div>
    </div>
  );
}

function AuthForm({ onClose, onSubmit, onGuest }: { onClose: () => void; onSubmit: (email: string, name?: string) => void; onGuest?: (() => void) | undefined }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Please enter a valid email.");
    if (pw.length < 6) return setErr("Password needs at least 6 characters.");
    if (mode === "up" && !name.trim()) return setErr("What should we call you?");
    onSubmit(email, mode === "up" ? name : undefined);
  };
  return (
    <Overlay onClose={onClose} label="Sign in">
      <div className="auth-tabs" role="tablist">
        <button role="tab" aria-selected={mode === "in"} onClick={() => { setMode("in"); setErr(""); }}>Sign in</button>
        <button role="tab" aria-selected={mode === "up"} onClick={() => { setMode("up"); setErr(""); }}>Create account</button>
      </div>
      <form className="auth-form" onSubmit={submit}>
        {mode === "up" && <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
        <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label><span>Password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} /></label>
        {err && <div className="auth-err" role="alert">{err}</div>}
        <button className="cta" type="submit">{mode === "in" ? "Sign in" : "Create account"}</button>
      </form>
      {onGuest && <button className="ghost auth-wide" onClick={onGuest}>Continue as guest</button>}
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
