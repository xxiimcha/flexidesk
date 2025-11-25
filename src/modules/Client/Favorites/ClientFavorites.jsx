// src/modules/Saves/pages/ClientFavorites.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { Heart, MapPin, Users, Star, Loader2 } from "lucide-react";

/* ---------- helpers ---------- */
const peso = (n) =>
  Number(n || 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  });

const unitLabel = (x) => {
  if (!x) return "day";
  if (x.category === "meeting" || x.scope === "room" || x.rooms > 0) return "hour";
  if (x.category === "office" || x.scope === "entire") return "month";
  return "day";
};

const coverImage = (x) => {
  const imgs = x?.images || x?.photos || [];
  return imgs[0]?.url || imgs[0]?.src || imgs[0] || x?.cover || "";
};

const place = (x) => [x?.venue, x?.city, x?.country].filter(Boolean).join(", ");

/* ---------- small card ---------- */
function FavCard({ item, onUnsave }) {
  const id = item?._id || item?.id || item?.listingId || "";
  const price = item?.price || item?.pricePerUnit || item?.dayRate || 0;
  const seats = item?.seats || item?.capacity;
  const rating = item?.rating || item?.avgRating;

  return (
    <div className="group overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-[16/10] bg-slate-100">
        {coverImage(item) ? (
          <img
            src={coverImage(item)}
            alt={item?.title || "Workspace"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate">
            No image
          </div>
        )}

        <button
          onClick={() => onUnsave?.(id)}
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm text-rose-600 shadow hover:bg-white"
          title="Remove from favorites"
        >
          <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
          Remove
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-semibold text-ink">
            {item?.title || item?.name || "Workspace"}
          </h3>
          {rating ? (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              <Star className="h-3 w-3 fill-current" />
              {Number(rating).toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm text-slate">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{place(item) || "—"}</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-ink">
            <span className="font-semibold">{peso(price)}</span>
            <span className="text-slate"> / {unitLabel(item)}</span>
          </div>
          {seats ? (
            <div className="inline-flex items-center gap-1 text-sm text-slate">
              <Users className="h-4 w-4" />
              {seats}
            </div>
          ) : (
            <div />
          )}
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Link
            to={id ? `/listing/${id}` : "#"}
            className="inline-flex items-center rounded-lg border border-charcoal/15 px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-50"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */
export default function ClientFavorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalize = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data.map((x) => x.listing || x);
    if (Array.isArray(data?.items)) return data.items.map((x) => x.listing || x);
    if (Array.isArray(data?.data)) return data.data.map((x) => x.listing || x);
    return [];
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/saves");
      setItems(normalize(res.data));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load favorites.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const unsave = async (listingId) => {
    try {
      await api.delete(`/saves/${listingId}`);
      setItems((prev) =>
        prev.filter((x) => (x._id || x.id || x.listingId) !== listingId)
      );
    } catch (e) {
      console.error("Unsave failed:", e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const body = useMemo(() => {
    if (loading) {
      return (
        <div className="inline-flex items-center gap-2 rounded-xl border border-charcoal/15 bg-white p-5 text-slate">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading favorites…
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          {error}
        </div>
      );
    }

    if (!items.length) {
      return (
        <div className="rounded-xl border border-charcoal/15 bg-white p-5 shadow-sm">
          Saved spaces will appear here.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <FavCard
            key={it._id || it.id || it.listingId}
            item={it}
            onUnsave={unsave}
          />
        ))}
      </div>
    );
  }, [loading, error, items]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Favorites</h1>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-charcoal/15 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      {body}
    </section>
  );
}
