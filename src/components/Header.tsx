import { Link } from "@tanstack/react-router";
import { Moon, Sun, UtensilsCrossed } from "lucide-react";
import { useStore } from "@/lib/store";

export function Header() {
  const { theme, set, bookings } = useStore();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><UtensilsCrossed className="h-5 w-5" /></span>
          <span className="truncate font-display text-xl font-semibold">Стол&nbsp;и&nbsp;Меню</span>
        </Link>
        <div className="flex items-center gap-2">
          {bookings.length > 0 && (
            <Link to="/bookings" className="rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold">Брони · {bookings.length}</Link>
          )}
          <button aria-label="Сменить тему" onClick={() => set({ theme: theme === "dark" ? "light" : "dark" })} className="grid h-9 w-9 place-items-center rounded-full border transition hover:bg-secondary">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
