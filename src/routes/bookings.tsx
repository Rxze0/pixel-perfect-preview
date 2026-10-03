import { createFileRoute, Link } from "@tanstack/react-router";
import { getRestaurant } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "Мои брони — Стол и Меню" },
      { name: "description", content: "Список ваших бронирований столов с возможностью отмены." },
      { property: "og:title", content: "Мои брони — Стол и Меню" },
      { property: "og:description", content: "Управляйте бронированиями столов." },
    ],
  }),
  component: Bookings,
});

function Bookings() {
  const { bookings, cancelBooking } = useStore();
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <h1 className="text-3xl font-bold">Мои брони</h1>
      {bookings.length === 0 && <p className="mt-4 text-muted-foreground">Броней нет. <Link to="/" className="underline">Выбрать ресторан</Link></p>}
      <ul className="mt-4 space-y-3">
        {bookings.map((b) => (
          <li key={b.id} className="card-surface flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-bold">{getRestaurant(b.restaurantId)?.name} · стол №{b.tableNumber}</p>
              <p className="text-sm text-muted-foreground">{b.date} в {b.time} · {b.guests} гостей · код {b.id}</p>
            </div>
            <button onClick={() => cancelBooking(b.id)} className="shrink-0 rounded-full border border-busy px-3 py-1.5 text-sm font-semibold">Отменить</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
