// src/modules/Owner/Dashboard/OwnerDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";

export default function OwnerDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'draft' | 'pending_review' | 'published' | 'rejected'
  const [refreshKey, setRefreshKey] = useState(0);

  const auth = getAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Not signed in");
        const idToken = await user.getIdToken();

        const url = new URL("/api/items/mine", window.location.origin);
        if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
        url.searchParams.set("limit", "12");

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`);

        const data = JSON.parse(text);
        if (cancelled) return;
        setItems(data.items || []);
        setNextCursor(data.nextCursor || null);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load listings");
        console.error("Load listings error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [statusFilter, refreshKey]); // reload when filter or refreshKey changes

  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();

      const url = new URL("/api/items/mine", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      url.searchParams.set("limit", "12");
      url.searchParams.set("cursor", nextCursor);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`);
      const data = JSON.parse(text);

      setItems((prev) => [...prev, ...(data.items || [])]);
      setNextCursor(data.nextCursor || null);
    } catch (e) {
      console.error("Pagination error:", e);
      setErr((s) => s || e.message);
    }
  };

  const counts = useMemo(() => {
    const m = { all: items.length, draft: 0, pending_review: 0, published: 0, rejected: 0 };
    for (const it of items) {
      m[it.status] = (m[it.status] || 0) + 1;
    }
    return m;
  }, [items]);

  return (
    <div className="min-h-screen bg-white">
      <header className="h-14 border-b border-charcoal/20 bg-white flex items-center px-4">
        <div className="font-semibold text-ink">Owner Console</div>
        <div className="ml-auto text-sm text-slate">Welcome!</div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">Overview</h1>
          <button
            className="ml-auto rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={() => setRefreshKey((x) => x + 1)}
          >
            Refresh
          </button>
          <Link
            to="/owner/start"
            className="rounded-md bg-brand text-ink px-3 py-1.5 text-sm font-semibold hover:opacity-95"
          >
            Create listing
          </Link>
        </div>
        <p className="mt-2 text-slate">
          Manage your listings, availability, and payouts here.
        </p>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            ["all", `All (${counts.all || 0})`],
            ["pending_review", `Pending (${counts.pending_review || 0})`],
            ["published", `Published (${counts.published || 0})`],
            ["draft", `Drafts (${counts.draft || 0})`],
            ["rejected", `Rejected (${counts.rejected || 0})`],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={[
                "rounded-full px-3 py-1 text-sm ring-1",
                statusFilter === val
                  ? "bg-ink text-white ring-ink"
                  : "bg-white text-ink ring-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Errors */}
        {err && (
          <div className="mt-4 rounded-md bg-rose-50 ring-1 ring-rose-200 text-rose-800 px-3 py-2 text-sm">
            {err}
          </div>
        )}

        {/* Listings */}
        <section className="mt-6">
          {loading ? (
            <SkeletonGrid />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it) => (
                  <ListingCard key={it.id} item={it} />
                ))}
              </div>

              {nextCursor && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={loadMore}
                    className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="h-12 border-t border-charcoal/20 bg-white flex items-center justify-center text-xs text-slate">
        © {new Date().getFullYear()} FlexiDesk — Owner
      </footer>
    </div>
  );
}

/* ——— Small presentational helpers ——— */

function ListingCard({ item }) {
  const labels = {
    pending_review: ["Pending review", "bg-amber-100 text-amber-800 ring-amber-200"],
    published: ["Published", "bg-emerald-100 text-emerald-800 ring-emerald-200"],
    draft: ["Draft", "bg-slate-100 text-slate-700 ring-slate-200"],
    rejected: ["Rejected", "bg-rose-100 text-rose-800 ring-rose-200"],
  };
  const [text, tone] = labels[item.status] || ["Unknown", "bg-slate-100 text-slate-700 ring-slate-200"];

  const cover = item.cover || (Array.isArray(item.photos) && item.photos[0]?.path) || "";
  const imgSrc = cover ? cover : null;

  const city = [item.city, item.region, item.country].filter(Boolean).shift();
  const price =
    item.priceSeatDay ?? item.priceRoomDay ?? item.priceWholeDay ?? item.priceSeatHour ?? item.priceRoomHour ?? null;
  const currency = item.currency || "PHP";

  return (
    <div className="rounded-xl border border-charcoal/15 bg-white overflow-hidden shadow-sm">
      <div className="h-40 bg-slate-100 relative">
        {imgSrc ? (
          <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-slate-400 text-sm">No photo</div>
        )}
        <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full ring-1 ${tone}`}>{text}</span>
      </div>

      <div className="p-4">
        <div className="font-medium text-ink truncate">{item.shortDesc || "Untitled listing"}</div>
        <div className="text-xs text-slate mt-0.5 truncate">
          {item.category || "—"} • {item.scope || "—"}
        </div>
        <div className="text-xs text-slate mt-1 truncate">
          {city || "—"} {item.seats ? `• ${item.seats} seats` : ""}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm font-semibold">
            {price != null ? `${currency} ${fmtMoney(price)}` : "—"}
          </div>
          <Link
            to="/owner/details"
            state={{ id: item.id }}
            className="text-sm rounded-md border px-2.5 py-1 hover:bg-slate-50"
          >
            Manage
          </Link>
        </div>

        <div className="mt-2 text-[11px] text-slate">
          Updated {fmtDate(item.updatedAt) || "—"}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate">
      No listings yet. Click <span className="font-medium">Create listing</span> to get started.
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl border border-charcoal/15 bg-white overflow-hidden shadow-sm">
          <div className="h-40 bg-slate-100 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 bg-slate-100 rounded animate-pulse" />
            <div className="h-2.5 bg-slate-100 rounded animate-pulse w-2/3" />
            <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/2" />
            <div className="h-7 bg-slate-100 rounded animate-pulse mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function fmtMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
