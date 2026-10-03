import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Clock, Users, XCircle, Wrench } from "lucide-react";
import type { Restaurant, Table } from "@/lib/data";
import { displayStatus, minutesLeft, useStore, type Booking, type DisplayStatus } from "@/lib/store";

const META: Record<DisplayStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  free: { label: "Свободен", cls: "bg-free", Icon: CheckCircle2 },
  busy: { label: "Занят", cls: "bg-busy", Icon: XCircle },
  soon: { label: "Скоро", cls: "bg-soon", Icon: Clock },
};

const schema = z.object({
  name: z.string().trim().min(2, "Введите имя").max(60),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{10,18}$/, "Неверный телефон"),
});

const today = () => new Date().toISOString().slice(0, 10);

export function TablesTab({ r }: { r: Restaurant }) {
  const st = useStore();
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState(2);
  const [sel, setSel] = useState<Table | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Booking | null>(null);
  const [staff, setStaff] = useState(false);

  const statusOf = (t: Table) => displayStatus(st.tables[t.id], st.now);
  const counts = r.tables.reduce((a, t) => ({ ...a, [statusOf(t)]: a[statusOf(t)] + 1 }), { free: 0, busy: 0, soon: 0 } as Record<DisplayStatus, number>);
  const load = Math.round(((counts.busy + counts.soon) / r.tables.length) * 100);
  const booked = (t: Table) => st.bookings.some((b) => b.tableId === t.id && b.date === date && Math.abs(toMin(b.time) - toMin(time)) < 120);
  const isNow = date === today() && Math.abs(toMin(time) - nowMin()) < 120;
  const available = (t: Table) => !booked(t) && (!isNow || statusOf(t) !== "busy");

  const submit = () => {
    const p = schema.safeParse(form);
    if (!p.success) return setErr(p.error.issues[0].message);
    if (!sel) return;
    setErr("");
    setDone(st.addBooking({ restaurantId: r.id, tableId: sel.id, tableNumber: sel.number, date, time, guests, ...p.data }));
    setSel(null);
  };

  if (done) {
    const still = st.bookings.find((b) => b.id === done.id);
    return (
      <div className="card-surface mx-auto max-w-md p-6 text-center animate-in zoom-in-95">
        {still ? <CheckCircle2 className="mx-auto h-14 w-14 text-free" /> : <XCircle className="mx-auto h-14 w-14 text-busy" />}
        <h3 className="mt-3 text-2xl font-semibold">{still ? "Бронь подтверждена" : "Бронь отменена"}</h3>
        <p className="mt-2 text-muted-foreground">{r.name} · стол №{done.tableNumber} · {done.guests} гостей<br />{done.date} в {done.time}<br />Код: <b>{done.id}</b></p>
        <div className="mt-5 flex justify-center gap-2">
          {still && <button onClick={() => st.cancelBooking(done.id)} className="rounded-full border border-busy px-4 py-2 font-semibold">Отменить бронь</button>}
          <button onClick={() => setDone(null)} className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">Готово</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="card-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Зал сейчас <span className="pulse-dot ml-1 inline-block h-2 w-2 rounded-full bg-free align-middle" aria-hidden /> <span className="text-xs font-normal text-muted-foreground">live</span></h3>
          <p className="text-sm font-semibold">Занято {counts.busy + counts.soon} / свободно {counts.free}</p>
        </div>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={load} aria-valuemin={0} aria-valuemax={100} aria-label="Загруженность">
          <div className="bg-busy transition-all duration-700" style={{ width: `${(counts.busy / r.tables.length) * 100}%` }} />
          <div className="bg-soon transition-all duration-700" style={{ width: `${(counts.soon / r.tables.length) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Загруженность {load}%</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {(Object.keys(META) as DisplayStatus[]).map((k) => { const M = META[k]; return <span key={k} className="flex items-center gap-1"><span className={`grid h-5 w-5 place-items-center rounded ${M.cls} text-status-foreground`}><M.Icon className="h-3 w-3" /></span>{k === "soon" ? "Скоро освободится / бронь в течение часа" : M.label}</span>; })}
        </div>
      </section>

      <section className="card-surface grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <label className="text-sm font-medium">Дата<input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3" /></label>
        <label className="text-sm font-medium">Время<input type="time" step={1800} value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 h-11 w-full rounded-xl border bg-background px-3" /></label>
        <label className="text-sm font-medium">Гостей<select value={guests} onChange={(e) => { setGuests(+e.target.value); setSel(null); }} className="mt-1 h-11 w-full rounded-xl border bg-background px-3">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></label>
      </section>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Схема зала</h3>
        <button onClick={() => setStaff(!staff)} className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${staff ? "bg-accent text-accent-foreground" : "bg-secondary"}`}><Wrench className="h-4 w-4" />Панель персонала</button>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-dashed bg-muted/50 p-3 sm:grid-cols-4">
        {r.tables.filter((t) => staff || t.seats >= guests).map((t) => {
          const s = statusOf(t); const M = META[s]; const ok = available(t);
          const ts = st.tables[t.id];
          return (
            <div key={t.id} className={`relative rounded-xl ${M.cls} p-3 text-status-foreground transition-all duration-500 ${sel?.id === t.id ? "ring-4 ring-ring" : ""}`}>
              <button disabled={staff || !ok} onClick={() => setSel(t)} className="w-full text-left disabled:cursor-default" aria-label={`Стол ${t.number}, ${t.seats} мест, ${M.label}`}>
                <div className="flex items-center justify-between"><span className="text-lg font-extrabold">№{t.number}</span><M.Icon className="h-5 w-5" /></div>
                <p className="flex items-center gap-1 text-sm font-semibold"><Users className="h-3.5 w-3.5" />{t.seats} мест</p>
                <p className="mt-1 text-xs font-bold">{M.label}</p>
                {ts && ts.status !== "free" && s !== "free" && <p className="text-[11px]">{ts.status === "busy" ? `освободится ~через ${minutesLeft(ts, st.now)} мин` : `бронь через ${minutesLeft(ts, st.now)} мин`}</p>}
                {!staff && !ok && <p className="text-[11px] font-bold">Недоступен на это время</p>}
              </button>
              {staff && (
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {(["free", "busy", "reserved"] as const).map((k) => (
                    <button key={k} onClick={() => st.setTableStatus(t.id, k)} className={`rounded-md bg-card/80 px-1 py-1 text-[10px] font-bold text-card-foreground ${ts?.status === k ? "outline-2 outline-foreground" : ""}`}>
                      {k === "free" ? "Своб." : k === "busy" ? "Занят" : "Бронь"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!staff && r.tables.every((t) => t.seats < guests) && <p className="text-muted-foreground">Нет столов на {guests} гостей.</p>}

      {sel && !staff && (
        <section className="card-surface p-4 animate-in slide-in-from-bottom-2">
          <h3 className="text-lg font-semibold">Бронь стола №{sel.number} · {date} · {time} · {guests} гостей</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input placeholder="Имя" maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl border bg-background px-3" />
            <input placeholder="+7 700 000 00 00" type="tel" maxLength={18} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 rounded-xl border bg-background px-3" />
          </div>
          {err && <p className="mt-2 text-sm font-semibold text-destructive">{err}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={submit} className="rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground">Забронировать</button>
            <button onClick={() => setSel(null)} className="rounded-full bg-secondary px-5 py-2.5 font-semibold">Отмена</button>
          </div>
        </section>
      )}
    </div>
  );
}

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
