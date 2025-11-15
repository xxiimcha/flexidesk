// src/modules/Owner/Bookings/OwnerBookings.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Filter,
  ChevronDown,
  ExternalLink,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  CreditCard,
} from "lucide-react";
import OwnerShell from "../components/OwnerShell";
import api from "@/services/api";

export default function OwnerBookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_desc");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const navigate = useNavigate();
  const goManage = (id) => navigate(`/owner/bookings/${id}`);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/owner/bookings/mine", reqRows());
        const data = res?.data || {};
        const arr = Array.isArray(data.items) ? data.items : [];
        const normalized = arr.map((x) => ({ id: x.id || x._id, ...x }));
        if (!cancelled) {
          setItems(normalized);
          setNextCursor(data.nextCursor || null);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.data?.message || e.message || "Failed to load bookings";
          setErr(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, refreshKey]);

  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      const res = await api.get("/owner/bookings/mine", {
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
      arr = arr.filter((b) => {
        const listing = b.listing || b.listingRef || {};
        const t1 = (listing.shortDesc || listing.title || "").toLowerCase();
        const city = [listing.city, listing.region, listing.country].filter(Boolean).join(", ").toLowerCase();
        const guest = getGuestName(b).toLowerCase();
        return t1.includes(q) || city.includes(q) || guest.includes(q);
      });
    }

    const ts = (x) => (x ? new Date(x).getTime() || 0 : 0);
    const amount = (x) => Number(x.totalAmount || x.amount || 0);

    if (sortBy === "created_desc") arr.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
    if (sortBy === "created_asc") arr.sort((a, b) => ts(a.createdAt) - ts(b.createdAt));
    if (sortBy === "checkin_asc") arr.sort((a, b) => ts(a.checkIn || a.checkInDate) - ts(b.checkIn || b.checkInDate));
    if (sortBy === "checkin_desc") arr.sort((a, b) => ts(b.checkIn || b.checkInDate) - ts(a.checkIn || a.checkInDate));
    if (sortBy === "amount_desc") arr.sort((a, b) => amount(b) - amount(a));
    if (sortBy === "amount_asc") arr.sort((a, b) => amount(a) - amount(b));

    return arr;
  }, [items, sortBy, query]);

  const totals = useMemo(() => {
    const count = items.length;
    let revenue = 0;
    let guests = 0;
    items.forEach((b) => {
      revenue += Number(b.totalAmount || b.amount || 0);
      guests += Number(b.guests || b.seats || 0);
    });
    return { count, revenue, guests };
  }, [items]);

  const headerProps = {
    query,
    onQueryChange: setQuery,
    onRefresh: () => setRefreshKey((x) => x + 1),
  };

  const sidebarProps = { active: "bookings" };

  return (
    <OwnerShell
      navOpen={navOpen}
      onToggleNav={() => setNavOpen((v) => !v)}
      onCloseNav={() => setNavOpen(false)}
      headerProps={headerProps}
      sidebarProps={sidebarProps}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <KPI label="Bookings" value={totals.count} icon={CalendarIcon} />
        <KPI label="Revenue" value={fmtMoney(totals.revenue)} icon={CreditCard} prefix="PHP " />
        <KPI label="Guests" value={totals.guests} icon={Users} />
      </div>

      <div className="mt-6 rounded-xl ring-1 ring-slate-200 bg-white p-3 md:p-4 sticky top-14 z-10">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["confirmed", "Confirmed"],
            ["checked_in", "Checked in"],
            ["completed", "Completed"],
            ["cancelled", "Cancelled"],
            ["refunded", "Refunded"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={[
                "rounded-full px-3 py-1 text-sm ring-1 transition-colors",
                statusFilter === val
                  ? "bg-ink text-white ring-ink"
                  : "bg-white text-ink ring-slate-200 hover:bg-slate-50",
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
                <option value="created_desc">Newest created</option>
                <option value="created_asc">Oldest created</option>
                <option value="checkin_asc">Check-in: soonest</option>
                <option value="checkin_desc">Check-in: latest</option>
                <option value="amount_desc">Amount: high → low</option>
                <option value="amount_asc">Amount: low → high</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
            </div>
          </div>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-md bg-rose-50 ring-1 ring-rose-200 text-rose-800 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      <div className="mt-6 rounded-xl ring-1 ring-slate-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="border-b border-slate-200">
                <Th>Booking</Th>
                <Th>Listing</Th>
                <Th>Location</Th>
                <Th>Dates</Th>
                <Th className="text-right">Guests</Th>
                <Th>Status</Th>
                <Th className="text-right">Amount</Th>
                <Th>Created</Th>
                <Th className="w-24 text-right">Actions</Th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            ) : filteredSorted.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate">
                    No bookings to display.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {filteredSorted.map((b) => (
                  <BookingRow key={b.id} booking={b} onManage={goManage} />
                ))}
              </tbody>
            )}
          </table>
        </div>
        {nextCursor && (
          <div className="p-3 border-t border-slate-200 bg-white text-center">
            <button
              onClick={loadMore}
              className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </OwnerShell>
  );
}

function KPI({ label, value, icon: Icon, prefix = "" }) {
  return (
    <div className="rounded-xl ring-1 ring-slate-200 bg-white p-4 flex items-center gap-3">
      {Icon && (
        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
          <Icon className="h-4 w-4 text-slate-700" />
        </div>
      )}
      <div>
        <div className="text-xs text-slate">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-ink">
          {prefix}
          {value ?? 0}
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-3 py-2 text-left font-medium ${className}`}>{children}</th>;
}

function StatusPill({ status }) {
  const norm = (status || "").toLowerCase();
  const map = {
    pending: ["Pending", "bg-amber-100 text-amber-800 ring-amber-200"],
    confirmed: ["Confirmed", "bg-blue-100 text-blue-800 ring-blue-200"],
    checked_in: ["Checked in", "bg-indigo-100 text-indigo-800 ring-indigo-200"],
    completed: ["Completed", "bg-emerald-100 text-emerald-800 ring-emerald-200"],
    cancelled: ["Cancelled", "bg-rose-100 text-rose-800 ring-rose-200"],
    refunded: ["Refunded", "bg-slate-100 text-slate-700 ring-slate-200"],
  };
  const [text, tone] = map[norm] || [status || "Unknown", "bg-slate-100 text-slate-700 ring-slate-200"];
  return <span className={`inline-flex text-xs px-2 py-0.5 rounded-full ring-1 ${tone}`}>{text}</span>;
}

function BookingRow({ booking, onManage }) {
  const listing = booking.listing || booking.listingRef || {};
  const city = [listing.city, listing.region, listing.country].filter(Boolean).join(", ");
  const guestName = getGuestName(booking) || "Guest";
  const currency = booking.currency || listing.currency || "PHP";
  const amount = booking.totalAmount || booking.amount || 0;

  const checkIn = booking.checkIn || booking.checkInDate;
  const checkOut = booking.checkOut || booking.checkOutDate;
  const hours = booking.hours || booking.durationHours;
  const nights = booking.nights || booking.durationNights;

  const dateLabel = fmtBookingRange(checkIn, checkOut, { hours, nights });

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50/50">
      <td className="px-3 py-2">
        <div className="font-medium truncate max-w-[200px]">{guestName}</div>
        <div className="text-[11px] text-slate mt-0.5 truncate max-w-[200px]">
          #{booking.code || booking.shortId || booking.id?.slice(-6) || "—"}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="font-medium truncate max-w-[260px]">
          {listing.shortDesc || listing.title || "Untitled listing"}
        </div>
        <div className="text-[11px] text-slate mt-0.5 truncate max-w-[260px]">
          {listing.category || "—"} • {listing.scope || "—"}
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-slate">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {city || "—"}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-slate">
        <span className="inline-flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" /> {dateLabel || "—"}
        </span>
      </td>
      <td className="px-3 py-2 text-right text-xs text-slate">
        <span className="inline-flex items-center gap-1 justify-end">
          <Users className="h-3.5 w-3.5" /> {booking.guests ?? booking.seats ?? 1}
        </span>
      </td>
      <td className="px-3 py-2">
        <StatusPill status={booking.status} />
      </td>
      <td className="px-3 py-2 text-right font-medium">
        {amount != null ? `${currency} ${fmtMoney(amount)}` : "—"}
      </td>
      <td className="px-3 py-2 text-xs text-slate">{fmtDate(booking.createdAt) || "—"}</td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onManage?.(booking.id)}
          className="text-xs inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-white"
          title="View booking"
        >
          View <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-200">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="px-3 py-2">
          <div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" />
        </td>
      ))}
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

function fmtBookingRange(checkIn, checkOut, { hours, nights } = {}) {
  if (!checkIn && !checkOut) return null;
  const dIn = checkIn ? new Date(checkIn) : null;
  const dOut = checkOut ? new Date(checkOut) : null;

  const sameDay =
    dIn &&
    dOut &&
    dIn.getFullYear() === dOut.getFullYear() &&
    dIn.getMonth() === dOut.getMonth() &&
    dIn.getDate() === dOut.getDate();

  const fmt = (d, opts = {}) =>
    d && !Number.isNaN(d.getTime())
      ? d.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          ...opts,
        })
      : null;

  if (hours && sameDay) {
    const tIn = fmt(dIn, { hour: "2-digit", minute: "2-digit" });
    const tOut = fmt(dOut, { hour: "2-digit", minute: "2-digit" });
    return `${fmt(dIn)} • ${tIn}–${tOut} (${hours}h)`;
  }

  if (dIn && dOut && !sameDay) {
    const lbl = `${fmt(dIn)} → ${fmt(dOut)}`;
    if (nights) return `${lbl} (${nights} nights)`;
    return lbl;
  }

  if (dIn && !dOut) return `From ${fmt(dIn)}`;
  if (!dIn && dOut) return `Until ${fmt(dOut)}`;
  return null;
}

function getGuestName(b) {
  return (
    b.guestName ||
    b.customerName ||
    b.clientName ||
    b.user?.fullName ||
    b.user?.name ||
    b.customer?.name ||
    ""
  );
}
