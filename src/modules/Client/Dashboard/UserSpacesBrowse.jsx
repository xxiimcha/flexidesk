// src/modules/User/pages/UserSpacesBrowse.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/services/api";

export default function UserSpacesBrowse({ meId }) {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || "all";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const titleMap = {
    popular: "Popular spaces near you",
    weekend: "Available this weekend",
    all: "All spaces",
  };
  const title = titleMap[section] || titleMap.all;

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        // You can tweak limit / add sort params later
        const { data } = await api.get("/listings", {
          params: {
            status: "active",
            limit: 100,
          },
        });

        const raw = Array.isArray(data?.items) ? data.items : [];

        const cleaned = raw
          .map((it) => ({
            id: it.id || it._id,
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
          .filter(
            (it) =>
              (!meId || String(it.ownerId) !== String(meId)) &&
              it.status === "active"
          );

        if (!alive) return;
        setItems(cleaned);
      } catch (err) {
        console.error("Failed to load spaces:", err);
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [meId, section]); // section here in case you later customize API per section

  const cards = useMemo(() => items.map(toCard), [items]);

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          {!loading && (
            <p className="mt-1 text-sm text-slate">
              Showing {cards.length} space{cards.length !== 1 ? "s" : ""}.
            </p>
          )}
        </div>

        <Link
          to="/app"
          className="text-sm font-medium text-slate hover:text-ink"
        >
          ← Back to dashboard
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.id} c={c} />
          ))}
        </div>
      )}

      {!loading && cards.length === 0 && (
        <div className="py-16 text-center text-slate">
          No spaces found at the moment.
        </div>
      )}
    </div>
  );
}

/* ---------- Presentational bits ---------- */

function Card({ c }) {
  return (
    <a
      href={`/app/spaces/${c.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full rounded-2xl border border-charcoal/15 bg-white shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-ink/30"
      title={c.title}
    >
      <img
        src={c.img}
        alt={c.title}
        className="h-44 w-full object-cover rounded-t-2xl"
      />
      <div className="p-3">
        <div className="font-medium text-ink truncate">{c.title}</div>
        <div className="text-sm text-slate truncate">{c.city}</div>
        <div className="mt-1 text-sm text-ink">
          {c.currencySymbol}
          {c.price.toLocaleString()}
          <span className="text-slate"> {c.priceNote}</span>
        </div>
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="h-[230px] w-full rounded-2xl bg-slate-100 animate-pulse" />
  );
}

/* ---------- Helpers ---------- */

function toCard(it) {
  const coverIdx = Number.isInteger(it.coverIndex) ? it.coverIndex : 0;
  const photos = Array.isArray(it.photos) ? it.photos : [];
  const pick = photos[coverIdx] || photos[0];

  const photoUrl =
    typeof pick === "string"
      ? pick
      : pick?.url ||
        pick?.path ||
        pick?.src ||
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop";

  const currency = (it.currency || "PHP").toUpperCase();
  const currencySymbol =
    currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;

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
    it.priceSeatHour || it.priceRoomHour
      ? "/ hour"
      : it.priceWholeMonth
      ? "/ month"
      : "/ day";

  const title =
    it.venue ||
    [cap(it.category), cap(it.scope)].filter(Boolean).join(" • ") ||
    "Space";

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
function cap(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "";
}
