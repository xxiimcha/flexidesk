// src/modules/User/pages/UserDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/services/api"; // axios instance with baseURL

export default function UserDashboard({ meId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // New public endpoint: active listings
        const { data } = await api.get("/listings", {
          params: { status: "active", limit: 24 },
        });

        const raw = Array.isArray(data?.items) ? data.items : [];

        // Normalize docs and filter out my own listings
        const cleaned = raw
          .map((it) => ({
            id: it.id || it._id, // mongo id
            ownerId: it.ownerId || it.owner || it.owner_id,
            status: it.status,
            photos: it.photos || it.photosMeta || [],
            coverIndex: it.coverIndex ?? 0,
            currency: it.currency || "PHP",
            priceSeatDay: it.priceSeatDay,
            priceRoomDay: it.priceRoomDay,
            priceWholeDay: it.priceWholeDay,
            priceSeatHour: it.priceSeatHour,
            priceRoomHour: it.priceRoomHour,
            priceWholeMonth: it.priceWholeMonth,
            venue: it.venue,
            category: it.category,
            scope: it.scope,
            city: it.city,
            region: it.region,
            country: it.country,
          }))
          .filter((it) => String(it.ownerId) !== String(meId) && it.status === "active");

        if (alive) setItems(cleaned);
      } catch (e) {
        console.error("Failed to load listings:", e);
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [meId]);

  const cards = useMemo(() => items.map(toCard), [items]);
  const popular = cards.slice(0, 10);
  const weekend = cards.slice(10, 20);

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
    <a
      href={`/app/spaces/${c.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="w-[280px] shrink-0 rounded-2xl border border-charcoal/15 bg-white shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-ink/30"
      title={c.title}
    >
      <img src={c.img} alt={c.title} className="h-44 w-full object-cover rounded-t-2xl" />
      <div className="p-3">
        <div className="font-medium text-ink truncate">{c.title}</div>
        <div className="text-sm text-slate truncate">{c.city}</div>
        <div className="mt-1 text-sm text-ink">
          {c.currencySymbol}{c.price.toLocaleString()}
          <span className="text-slate"> {c.priceNote}</span>
        </div>
      </div>
    </a>
  );
}

function SkeletonCard() {
  return <div className="w-[280px] h-[230px] shrink-0 rounded-2xl bg-slate-100 animate-pulse" />;
}

/* ---------- Helpers ---------- */

function toCard(it) {
  // best-effort photo extraction (supports {url}, string paths, etc.)
  const coverIdx = Number.isInteger(it.coverIndex) ? it.coverIndex : 0;
  const photos = Array.isArray(it.photos) ? it.photos : [];
  const pick = photos[coverIdx] || photos[0];

  const photoUrl =
    typeof pick === "string"
      ? pick
      : pick?.url || pick?.path || pick?.src ||
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop";

  const currency = (it.currency || "PHP").toUpperCase();
  const currencySymbol = currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;

  const price =
    firstNum([
      it.priceSeatDay,
      it.priceRoomDay,
      it.priceWholeDay,
      it.priceSeatHour,
      it.priceRoomHour,
      it.priceWholeMonth,
    ]) ?? 0;

  const unit =
    it.priceSeatHour || it.priceRoomHour ? "/ hour" :
    it.priceWholeMonth ? "/ month" : "/ day";

  const title =
    it.venue || [cap(it.category), cap(it.scope)].filter(Boolean).join(" • ") || "Space";

  return {
    id: it.id,
    title,
    city: [it.city, it.region, it.country].filter(Boolean).join(", "),
    img: photoUrl,
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
