// src/modules/Owner/Onboarding/OwnerDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, ChevronDown, ExternalLink, MapPin, Users, DoorOpen, ImageOff } from "lucide-react";
import OwnerShell from "../components/OwnerShell";
import api from "@/services/api";

export default function OwnerDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [totals, setTotals] = useState({ all: 0, draft: 0, active: 0, archived: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const navigate = useNavigate();
  const goManage = (id) => navigate(`/owner/listings/${id}`);

  const baseHeaders = { "Cache-Control": "no-cache", Pragma: "no-cache" };
  const validate = (s) => s >= 200 && s < 300;

  const reqRows = () => ({
    params: {
      status: statusFilter !== "all" ? statusFilter : undefined,
      limit: 12,
      _ts: Date.now(),
    },
    headers: baseHeaders,
    validateStatus: validate,
  });

  const COUNT_PAGE_LIMIT = 5000;
  const fetchBucket = async (status) => {
    const res = await api.get("/owner/listings/mine", {
      params: {
        status,
        limit: COUNT_PAGE_LIMIT,
        _ts: Date.now(),
      },
      headers: baseHeaders,
      validateStatus: validate,
    });
    const arr = Array.isArray(res?.data?.items) ? res.data.items : [];
    return arr.map((x) => ({ id: x.id || x._id, ...x }));
  };

  const loadTotals = async () => {
    try {
      const [draft, active, archived] = await Promise.all([
        fetchBucket("draft"),
        fetchBucket("active"),
        fetchBucket("archived"),
      ]);
      const all = draft.length + active.length + archived.length;
      setTotals({ all, draft: draft.length, active: active.length, archived: archived.length });
    } catch {
      setTotals((t) => t);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [rowsRes] = await Promise.allSettled([api.get("/owner/listings/mine", reqRows()), loadTotals()]);
        if (rowsRes.status === "fulfilled") {
          const data = rowsRes.value?.data || {};
          const arr = Array.isArray(data.items) ? data.items : [];
          const normalized = arr.map((x) => ({ id: x.id || x._id, ...x }));
          if (!cancelled) {
            setItems(normalized);
            setNextCursor(data.nextCursor || null);
          }
        } else if (!cancelled) {
          const e = rowsRes.reason;
          const msg = e?.response?.data?.message || e.message || "Failed to load listings";
          setErr(msg);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.data?.message || e.message || "Failed to load listings";
          setErr(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, refreshKey]);

  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      const res = await api.get("/owner/listings/mine", {
        ...reqRows(),
        params: { ...(reqRows().params || {}), cursor: nextCursor },
      });
      const data = res?.data || {};
      const more = Array.isArray(data.items) ? data.items : [];
      const normalized = more.map((x) => ({ id: x.id || x._id, ...x }));
      setItems((prev) => [...prev, ...normalized]);
      setNextCursor(data.nextCursor || null);
    } catch (e) {
      setErr((s) => s || (e?.response?.data?.message || e.message));
    }
  };

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = [...items];
    if (q) {
      arr = arr.filter((it) => {
        const t1 = (it.shortDesc || "").toLowerCase();
        const t2 = [it.city, it.region, it.country].filter(Boolean).join(", ").toLowerCase();
        return t1.includes(q) || t2.includes(q);
      });
    }
    const ts = (x) => (x ? new Date(x).getTime() || 0 : 0);
    if (sortBy === "updated_desc") arr.sort((a, b) => ts(b.updatedAt ?? b.createdAt) - ts(a.updatedAt ?? a.createdAt));
    if (sortBy === "updated_asc") arr.sort((a, b) => ts(a.updatedAt ?? a.createdAt) - ts(b.updatedAt ?? b.createdAt));
    if (sortBy === "seats_desc") arr.sort((a, b) => (b.seats || 0) - (a.seats || 0));
    if (sortBy === "seats_asc") arr.sort((a, b) => (a.seats || 0) - (b.seats || 0));
    return arr;
  }, [items, sortBy, query]);

  const headerProps = { query, onQueryChange: setQuery, onRefresh: () => setRefreshKey((x) => x + 1) };
  const sidebarProps = { statusFilter, setStatusFilter };

  return (
    <OwnerShell
      navOpen={navOpen}
      onToggleNav={() => setNavOpen((v) => !v)}
      onCloseNav={() => setNavOpen(false)}
      headerProps={headerProps}
      sidebarProps={sidebarProps}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KPI label="All listings" value={totals.all} />
        <KPI label="Draft" value={totals.draft} tone="amber" />
        <KPI label="Active" value={totals.active} tone="emerald" />
      </div>

      <div className="mt-6 rounded-xl ring-1 ring-slate-200 bg-white p-3 md:p-4 sticky top-14 z-10">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["all", `All (${totals.all || 0})`],
            ["draft", `Draft (${totals.draft || 0})`],
            ["active", `Active (${totals.active || 0})`],
            ["archived", `Archived (${totals.archived || 0})`],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={[
                "rounded-full px-3 py-1 text-sm ring-1 transition-colors",
                statusFilter === val ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate" />
            <div className="relative">
              <select
                className="appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 py-1.5 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated_desc">Newest first</option>
                <option value="updated_asc">Oldest first</option>
                <option value="seats_desc">Seats: high → low</option>
                <option value="seats_asc">Seats: low → high</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
            </div>
          </div>
        </div>
      </div>

      {err && <div className="mt-4 rounded-md bg-rose-50 ring-1 ring-rose-200 text-rose-800 px-3 py-2 text-sm">{err}</div>}

      <div className="mt-6 rounded-xl ring-1 ring-slate-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="border-b border-slate-200">
                <Th className="w-20">Cover</Th>
                <Th>Listing</Th>
                <Th>Type</Th>
                <Th>Location</Th>
                <Th className="text-right">Seats / Rooms</Th>
                <Th>Status</Th>
                <Th className="text-right">Main price</Th>
                <Th>Updated</Th>
                <Th className="w-24 text-right">Actions</Th>
              </tr>
            </thead>
            {loading ? (
              <tbody>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</tbody>
            ) : filteredSorted.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate">No listings to display.</td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {filteredSorted.map((it) => (
                  <ListingRow key={it.id} item={it} onManage={goManage} />
                ))}
              </tbody>
            )}
          </table>
        </div>
        {nextCursor && (
          <div className="p-3 border-t border-slate-200 bg-white text-center">
            <button onClick={loadMore} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">Load more</button>
          </div>
        )}
      </div>
    </OwnerShell>
  );
}

function KPI({ label, value, tone = "slate" }) {
  const map = {
    slate: "ring-slate-200 bg-white",
    amber: "ring-amber-200 bg-amber-50",
    emerald: "ring-emerald-200 bg-emerald-50",
  };
  return (
    <div className={`rounded-xl ring-1 ${map[tone] || map.slate} p-4`}>
      <div className="text-xs text-slate">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value ?? 0}</div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>;
}

function StatusPill({ status }) {
  const map = {
    draft: ["Draft", "bg-amber-100 text-amber-800 ring-amber-200"],
    active: ["Active", "bg-emerald-100 text-emerald-800 ring-emerald-200"],
    archived: ["Archived", "bg-slate-100 text-slate-700 ring-slate-200"],
  };
  const [text, tone] = map[status] || ["Unknown", "bg-slate-100 text-slate-700 ring-slate-200"];
  return <span className={`inline-flex text-xs px-2 py-0.5 rounded-full ring-1 ${tone}`}>{text}</span>;
}

function ListingRow({ item, onManage }) {
  const cover = item.cover || (Array.isArray(item.photos) && item.photos[0]?.path) || "";
  const imgSrc = cover || null;
  const city = [item.city, item.region, item.country].filter(Boolean).join(", ");
  const price = item.priceSeatDay ?? item.priceRoomDay ?? item.priceWholeDay ?? item.priceSeatHour ?? item.priceRoomHour ?? null;
  const currency = item.currency || "PHP";

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50/50">
      <td className="px-3 py-2">
        <div className="w-16 h-12 bg-slate-100 rounded overflow-hidden relative">
          {imgSrc ? (
            <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-slate-400">
              <ImageOff className="h-4 w-4" />
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="font-medium truncate max-w-[260px]">{item.shortDesc || "Untitled listing"}</div>
        <div className="text-[11px] text-slate mt-0.5 truncate max-w-[260px]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {city || "—"}
          </span>
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-slate">
        {(item.category || "—")} • {(item.scope || "—")}
      </td>
      <td className="px-3 py-2 text-xs text-slate">{city || "—"}</td>
      <td className="px-3 py-2 text-right text-xs text-slate">
        <span className="inline-flex items-center gap-1 mr-2">
          <Users className="h-3.5 w-3.5" /> {item.seats ?? 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <DoorOpen className="h-3.5 w-3.5" /> {item.privateRooms ?? 0}
        </span>
      </td>
      <td className="px-3 py-2"><StatusPill status={item.status} /></td>
      <td className="px-3 py-2 text-right font-medium">
        {price != null ? `${currency} ${fmtMoney(price)}` : "—"}
      </td>
      <td className="px-3 py-2 text-xs text-slate">{fmtDate(item.updatedAt) || "—"}</td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onManage?.(item.id)}
          className="text-xs inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-white"
          title="Manage"
        >
          Manage <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-200">
      <td className="px-3 py-2"><div className="w-16 h-12 bg-slate-100 animate-pulse rounded" /></td>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-3 py-2"><div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" /></td>
      ))}
      <td className="px-3 py-2"><div className="h-7 bg-slate-100 animate-pulse rounded" /></td>
    </tr>
  );
}

function fmtMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
