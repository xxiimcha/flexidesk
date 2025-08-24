// src/modules/User/pages/UserDashboard.jsx
import { useEffect, useMemo, useState } from "react";

/**
 * UserDashboard
 * - Shows published spaces (excluding the current user's listings)
 * - Server should expose GET /api/items/published (see note below)
 */
export default function UserDashboard({ meId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch published listings
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listings/published?limit=24`, {
          credentials: "include",
        });
        const json = await res.json();
        const raw = Array.isArray(json.items) ? json.items : [];
        // extra client-side guard: drop my own listings
        const cleaned = raw.filter((it) => it.ownerId !== meId && it.status === "published");
        setItems(cleaned);
      } catch (e) {
        console.error("Failed to load published listings:", e);
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [meId]);

  // Transform to card view-models
  const cards = useMemo(() => items.map(toCard), [items]);

  // You can split into different rows any way you prefer:
  const popular = cards.slice(0, 10);
  const weekend = cards.slice(10, 20); // placeholder split

  return (
    <div className="pb-6">
      <Row title="Popular spaces near you" cards={popular} loading={loading} />
      <Row title="Available this weekend" cards={weekend} loading={loading} />
    </div>
  );
}

/* ---------- Presentational bits ---------- */

function Row({ title, cards = [], loading }) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>

      <div className="mt-3 flex gap-4 overflow-x-auto no-scrollbar pr-2">
        {loading && cards.length === 0
          ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
          : cards.map((c) => <Card key={c.id} c={c} />)}
        {!loading && cards.length === 0 && (
          <div className="text-slate text-sm py-10">No spaces found.</div>
        )}
      </div>
    </section>
  );
}

function Card({ c }) {
  return (
    <article className="w-[280px] shrink-0 rounded-2xl border border-charcoal/15 bg-white shadow-sm hover:shadow-md transition">
      <img src={c.img} alt={c.title} className="h-44 w-full object-cover rounded-t-2xl" />
      <div className="p-3">
        <div className="font-medium text-ink truncate">{c.title}</div>
        <div className="text-sm text-slate truncate">{c.city}</div>
        <div className="mt-1 text-sm text-ink">
          {c.currencySymbol}{c.price.toLocaleString()}
          <span className="text-slate"> {c.priceNote}</span>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="w-[280px] h-[230px] shrink-0 rounded-2xl bg-slate-100 animate-pulse" />
  );
}

/* ---------- Helpers ---------- */

function toCard(it) {
  const img =
    (Array.isArray(it.photos) && it.photos[it.coverIndex ?? 0]) ||
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop";

  const currency = (it.currency || "PHP").toUpperCase();
  const currencySymbol = currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;

  // pick a display price (adjust to your business rules)
  const price =
    firstNum([it.priceSeatDay, it.priceRoomDay, it.priceWholeDay, it.priceSeatHour, it.priceRoomHour, it.priceWholeMonth]) ?? 0;

  const unit =
    it.priceSeatHour || it.priceRoomHour ? "/ hour" :
    it.priceWholeMonth ? "/ month" : "/ day";

  const title =
    it.venue || [cap(it.category), cap(it.scope)].filter(Boolean).join(" • ") || "Space";

  return {
    id: it.id,
    title,
    city: [it.city, it.region, it.country].filter(Boolean).join(", "),
    img,
    price,
    priceNote: unit,
    currencySymbol,
  };
}

function firstNum(list) {
  for (const v of list) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}
function cap(s) { return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : ""; }
