// src/modules/Owner/BookingsCalendar.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Dot,
  Mail,
  ExternalLink,
} from "lucide-react";
import api from "@/services/api";

function getAuthToken() {
  const USER_TOKEN_KEY = "flexidesk_user_token";
  const ADMIN_TOKEN_KEY = "flexidesk_admin_token";
  return (
    localStorage.getItem(USER_TOKEN_KEY) ||
    sessionStorage.getItem(USER_TOKEN_KEY) ||
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY) ||
    ""
  );
}

export default function BookingsCalendar({
  year: initialYear,
  month: initialMonth, // 0-based (0 = Jan)
  status = "all", // "all" | "pending" | "confirmed" | "checked_in" | "completed" | "cancelled" | "refunded"
}) {
  const today = new Date();

  const [cursor, setCursor] = useState(() => {
    const y = Number.isFinite(initialYear) ? initialYear : today.getFullYear();
    const m = Number.isFinite(initialMonth) ? initialMonth : today.getMonth();
    return new Date(y, m, 1);
  });

  const [rawBookings, setRawBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------- Fetch from /owner/bookings/mine ---------- */
  useEffect(() => {
    const fetchBookings = async () => {
      const token = getAuthToken();

      if (!token) {
        setRawBookings([]);
        setError("Not logged in.");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const queryStatus = status === "all" ? undefined : status;

        const res = await api.get("/owner/bookings/mine", {
          params: {
            status: queryStatus,
            limit: 200,
            cursor: 0,
            _ts: Date.now(),
          },
          // ✅ explicit Authorization header (in addition to interceptor)
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        setRawBookings(items);
      } catch (err) {
        console.error("Failed to load owner bookings calendar", err);
        console.error("Response:", err?.response?.status, err?.response?.data);
        setError("Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [status]);

  // Normalized events (adds per-day keys, start/end keys)
  const events = useMemo(() => {
    const mapped = rawBookings
      .map(mapApiBookingToCalendarShape)
      .filter((b) => b.start && b.end);
    return normalizeEvents(mapped);
  }, [rawBookings]);

  // Month grid
  const { days, monthLabel } = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const monthLabel = cursor.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
    const first = new Date(y, m, 1);
    const startDay = first.getDay(); // 0..6 (Sun..Sat)
    const startGrid = new Date(y, m, 1 - startDay);

    const days = [...Array(42)].map((_, i) => {
      const d = new Date(startGrid);
      d.setDate(startGrid.getDate() + i);
      const inMonth = d.getMonth() === m;
      return { date: d, inMonth, key: fmtDateKey(d) };
    });

    return { days, monthLabel };
  }, [cursor]);

  // Selection state for the right panel
  const [selectedDayKey, setSelectedDayKey] = useState(fmtDateKey(today));
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const prevMonth = () =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Derived: bookings on the selected day & currently selected booking
  const bookingsOnSelectedDay = useMemo(
    () =>
      events
        .filter((ev) => ev.days.has(selectedDayKey))
        .sort((a, b) => a.startKey.localeCompare(b.startKey)),
    [events, selectedDayKey]
  );

  const selectedBooking =
    events.find((e) => e.id === selectedBookingId) ||
    (bookingsOnSelectedDay.length ? bookingsOnSelectedDay[0] : null);

  // Click handlers
  const handleDayClick = (dayKey, dayEvents) => {
    setSelectedDayKey(dayKey);
    setSelectedBookingId(dayEvents[0]?.id ?? null);
  };

  const handleEventClick = (ev, dayKey) => {
    setSelectedDayKey(dayKey);
    setSelectedBookingId(ev.id);
  };

  return (
    <div className="grid gap-4 md:grid-cols-12">
      {/* LEFT: Calendar */}
      <div className="md:col-span-8 lg:col-span-9">
        <div className="rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
            <div className="inline-flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-brand" />
              <div className="font-semibold text-ink">{monthLabel}</div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="rounded-md p-1.5 hover:bg-slate-100"
                title="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextMonth}
                className="rounded-md p-1.5 hover:bg-slate-100"
                title="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Status bar */}
          {(loading || error) && (
            <div className="px-4 py-2 text-xs border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600">
                {loading
                  ? "Loading bookings…"
                  : error
                  ? "Some bookings may be missing. " + error
                  : null}
              </span>
            </div>
          )}

          {/* Weekday head */}
          <div className="grid grid-cols-7 text-xs text-slate bg-slate-50 border-b border-slate-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-2 py-2 text-center">
                {d}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200">
            {days.map(({ date, inMonth, key: dayKey }, idx) => {
              const dayEvents = events.filter((ev) => ev.days.has(dayKey));
              const isToday = sameDay(date, new Date());

              return (
                <div
                  key={idx}
                  className="bg-white p-1.5 min-h-[94px] cursor-pointer"
                  onClick={() => handleDayClick(dayKey, dayEvents)}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between">
                    <div
                      className={[
                        "text-xs px-1.5 py-0.5 rounded",
                        isToday ? "bg-ink text-white" : "text-slate-600",
                        !inMonth && !isToday ? "opacity-40" : "",
                      ].join(" ")}
                    >
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Events */}
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <EventPill
                        key={ev.id + dayKey}
                        ev={ev}
                        dayKey={dayKey}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(ev, dayKey);
                        }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[11px] text-slate/90">
                        +{dayEvents.length - 3} more…
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white">
            <Legend color="emerald" label="Confirmed / Completed" />
            <Legend color="amber" label="Pending / Checked-in" />
            <Legend color="rose" label="Cancelled / Refunded" />
          </div>
        </div>
      </div>

      {/* RIGHT: Details panel */}
      <div className="md:col-span-4 lg:col-span-3">
        <div className="rounded-xl ring-1 ring-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="text-xs text-slate">Selected day</div>
            <div className="font-semibold">{prettyDate(selectedDayKey)}</div>
          </div>

          {/* Day list */}
          <div className="p-3 space-y-2 border-b border-slate-100 max-h-56 overflow-auto">
            {bookingsOnSelectedDay.length === 0 ? (
              <div className="text-sm text-slate">
                {loading ? "Loading…" : "No bookings on this day."}
              </div>
            ) : (
              bookingsOnSelectedDay.map((bk) => (
                <button
                  key={bk.id}
                  onClick={() => setSelectedBookingId(bk.id)}
                  className={[
                    "w-full text-left rounded-md px-2 py-2 ring-1 transition",
                    "hover:bg-slate-50",
                    selectedBookingId === bk.id
                      ? "ring-ink/40 bg-slate-50"
                      : "ring-slate-200",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Dot className={`h-6 w-6 ${statusDotColor(bk.status)}`} />
                      <div className="text-sm font-medium truncate">
                        {bk.guest}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate shrink-0">
                      {bk.start} → {bk.end}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Selected details */}
          <div className="p-4">
            {!selectedBooking ? (
              <div className="text-sm text-slate">
                {loading ? "Loading bookings…" : "Select a booking to view details."}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    {selectedBooking.guest}
                  </div>
                  <StatusPill status={selectedBooking.status} />
                </div>

                <DetailRow
                  label="Dates"
                  value={`${selectedBooking.start} → ${selectedBooking.end}`}
                />
                <DetailRow
                  label="Nights"
                  value={countNights(
                    selectedBooking.start,
                    selectedBooking.end
                  )}
                />
                <DetailRow
                  label="Guests"
                  value={selectedBooking.guests ?? 1}
                />
                <DetailRow label="Reference" value={selectedBooking.id} />

                <div className="pt-1 flex items-center gap-2">
                  <button className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-slate-50">
                    <ExternalLink className="h-4 w-4" /> View booking
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-slate-50">
                    <Mail className="h-4 w-4" /> Message guest
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ——— Visual bits ——— */

const statusClassMap = {
  confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  pending: "bg-amber-100 text-amber-800 ring-amber-200",
  cancelled: "bg-rose-100 text-rose-800 ring-rose-200",
};

function EventPill({ ev, dayKey, onClick }) {
  const cls =
    statusClassMap[ev.status] || "bg-slate-100 text-slate-800 ring-slate-200";
  const startsToday = ev.startKey === dayKey;
  const endsToday = ev.endKey === dayKey;

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-[11px] px-1.5 py-1 rounded ring-1 truncate",
        "hover:ring-ink/40 transition",
        cls,
        startsToday ? "rounded-l-md" : "rounded-l-none",
        endsToday ? "rounded-r-md" : "rounded-r-none",
      ].join(" ")}
      title={`${ev.guest} • ${ev.start} → ${ev.end}`}
    >
      <span className="inline-flex items-center gap-1">
        {!startsToday && <span className="opacity-70">…</span>}
        <Dot className="h-3 w-3" />
        <span className="truncate">{ev.guest}</span>
        {!endsToday && <span className="opacity-70">…</span>}
      </span>
    </button>
  );
}

function Legend({ color = "slate", label }) {
  const dot =
    {
      emerald: "text-emerald-600",
      amber: "text-amber-600",
      rose: "text-rose-600",
      slate: "text-slate-600",
    }[color] || "text-slate-600";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate">
      <Dot className={`h-5 w-5 ${dot}`} />
      {label}
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    confirmed: ["Confirmed", "bg-emerald-100 text-emerald-800 ring-emerald-200"],
    pending: ["Pending", "bg-amber-100 text-amber-800 ring-amber-200"],
    cancelled: ["Cancelled", "bg-rose-100 text-rose-800 ring-rose-200"],
  };
  const [label, tone] =
    map[status] || ["Unknown", "bg-slate-100 text-slate-700 ring-slate-200"];
  return (
    <span
      className={`inline-flex text-[11px] px-2 py-0.5 rounded-full ring-1 ${tone}`}
    >
      {label}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="w-24 text-slate">{label}</div>
      <div className="flex-1 text-ink">{String(value ?? "—")}</div>
    </div>
  );
}

/* ——— Helpers & mapping ——— */

function mapApiBookingToCalendarShape(b) {
  const id = b.id || b._id;

  const rawStatus = (b.status || "").toLowerCase();
  let status;
  if (rawStatus === "pending") status = "pending";
  else if (["cancelled", "refunded"].includes(rawStatus)) status = "cancelled";
  else status = "confirmed";

  const guest =
    b.guest ||
    b.guestName ||
    b.clientName ||
    (b.user && (b.user.fullName || b.user.name || b.user.email)) ||
    "Guest";

  const start =
    b.checkInDate ||
    b.startDate ||
    b.start ||
    b.fromDate ||
    null;
  const end =
    b.checkOutDate ||
    b.endDate ||
    b.end ||
    b.toDate ||
    b.checkInDate ||
    null;

  const guests = b.guests || b.partySize || b.guestCount || 1;

  return { id, guest, start, end, status, guests };
}

function normalizeEvents(list = []) {
  return list.map((e) => {
    const start = asDate(e.start);
    const end = asDate(e.end);
    const days = new Set();
    const d = new Date(start);
    while (d <= end) {
      days.add(fmtDateKey(d));
      d.setDate(d.getDate() + 1);
    }
    return {
      ...e,
      start: fmtISO(start),
      end: fmtISO(end),
      startKey: fmtDateKey(start),
      endKey: fmtDateKey(end),
      days,
    };
  });
}

function asDate(any) {
  if (!any) return new Date();
  if (any instanceof Date)
    return new Date(any.getFullYear(), any.getMonth(), any.getDate());
  const d = new Date(`${any}T00:00:00`);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtISO(d) {
  return fmtDateKey(d);
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function prettyDate(key) {
  if (!key) return "—";
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function countNights(startISO, endISO) {
  const s = asDate(startISO).getTime();
  const e = asDate(endISO).getTime();
  const nights = Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  return nights;
}

function statusDotColor(status) {
  return (
    {
      confirmed: "text-emerald-600",
      pending: "text-amber-600",
      cancelled: "text-rose-600",
    }[status] || "text-slate-600"
  );
}
