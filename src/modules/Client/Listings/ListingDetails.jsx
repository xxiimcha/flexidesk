// src/modules/Client/ListingDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Star,
  MapPin,
  Share2,
  Heart,
  Users,
  Building2,
  Clock,
  Wifi,
  ParkingCircle,
  Coffee,
  DoorClosed,
  Monitor,
  ThermometerSun,
  Send,
  ExternalLink,
  X,
} from "lucide-react";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

function diffDaysISO(a, b) {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  const ms = d2 - d1;
  return Math.max(1, Math.ceil(ms / 86400000));
}

function getAuthToken() {
  const USER_TOKEN_KEY = "flexidesk_user_token";
  const OWNER_TOKEN_KEY = "flexidesk_owner_token";
  const ADMIN_TOKEN_KEY = "flexidesk_admin_token";
  return (
    localStorage.getItem(USER_TOKEN_KEY) ||
    sessionStorage.getItem(USER_TOKEN_KEY) ||
    localStorage.getItem(OWNER_TOKEN_KEY) ||
    sessionStorage.getItem(OWNER_TOKEN_KEY) ||
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY) ||
    ""
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function fmtYMD(date) {
  if (!(date instanceof Date) || isNaN(date)) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtCurrency(symbol, n) {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  return `${symbol}${num.toLocaleString()}`;
}

function formatCompact(n) {
  try {
    return Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
  } catch {
    return String(n);
  }
}

function cap(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "";
}

function prettyAmenity(a) {
  return cap(String(a).replace(/_/g, " ").replace(/\s+/g, " ").trim());
}

function firstNum(list) {
  for (const v of list) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function firstNameOnly(s) {
  if (!s) return "";
  const clean = String(s).trim().replace(/\s+/g, " ");
  const token = clean.split(/[ \-]/)[0];
  return cap(token);
}

function toMinutes(t) {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function countDaySlots(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  if (startDate === endDate) return 1;
  const nights = diffDaysISO(startDate, endDate);
  return nights + 1;
}

function diffHours(dateA, timeA, dateB, timeB) {
  try {
    if (!dateA || !dateB) return 0;

    const daySlots = countDaySlots(dateA, dateB);

    const start = new Date(`${dateA}T${timeA || "00:00"}:00`);
    let endSameDay = new Date(`${dateA}T${timeB || "00:00"}:00`);
    let perDayMs = endSameDay - start;

    if (perDayMs <= 0) {
      const end = new Date(`${dateB}T${timeB || "00:00"}:00`);
      perDayMs = end - start;
    }

    if (perDayMs <= 0) return 0;

    const perDayHours = perDayMs / 36e5;
    const totalHours = perDayHours * daySlots;

    return Math.ceil(totalHours * 4) / 4;
  } catch {
    return 0;
  }
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function isDateBlocked(dateStr, blockedDates) {
  if (!dateStr || !Array.isArray(blockedDates)) return false;
  return blockedDates.includes(dateStr);
}

function listNightsISO(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const out = [];
  let d = new Date(startDate + "T00:00:00");
  const stop = new Date(endDate + "T00:00:00");
  while (d < stop) {
    out.push(fmtYMD(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function pickPricingMode(vm, startDate, endDate, hours) {
  const hasHourly = vm._raw.priceSeatHour || vm._raw.priceRoomHour;
  const hasDaily = vm._raw.priceSeatDay || vm._raw.priceRoomDay || vm._raw.priceWholeDay;
  const hasMonthly = vm._raw.priceWholeMonth;

  const nights = diffDaysISO(startDate, endDate);

  if (hasHourly && hours > 0) return "hour";
  if (hasDaily) return "day";
  if (hasMonthly && nights >= 27) return "month";
  if (hasMonthly) return "month";
  return "day";
}

function getUnitPrice(vm, mode) {
  if (mode === "hour") return firstNum([vm._raw.priceSeatHour, vm._raw.priceRoomHour]);
  if (mode === "day")
    return firstNum([vm._raw.priceSeatDay, vm._raw.priceRoomDay, vm._raw.priceWholeDay]);
  if (mode === "month") return Number(vm._raw.priceWholeMonth || 0);
  return 0;
}

function estimateQuote(vm, { startDate, endDate, checkInTime, checkOutTime, guests }) {
  if (!vm) return null;
  if (!startDate || !endDate || !checkInTime || !checkOutTime) return null;

  const hours = diffHours(startDate, checkInTime, endDate, checkOutTime);
  const nights = diffDaysISO(startDate, endDate);

  const mode = pickPricingMode(vm, startDate, endDate, hours);
  const unitPrice = getUnitPrice(vm, mode);

  let qty = 0;
  if (mode === "hour") qty = Math.max(0, hours);
  else if (mode === "day") qty = Math.max(1, nights);
  else if (mode === "month") qty = nights >= 27 ? 1 : nights / 30;

  const base = unitPrice * qty;
  const serviceFee = vm.specs.serviceFee != null ? Number(vm.specs.serviceFee) : 0;
  const cleaningFee = vm.specs.cleaningFee != null ? Number(vm.specs.cleaningFee) : 0;
  const subtotal = Math.max(0, base);
  const total = Math.max(0, subtotal + serviceFee + cleaningFee);

  return {
    mode,
    unitPrice,
    qty,
    base: round2(subtotal),
    fees: { service: serviceFee, cleaning: cleaningFee },
    total: round2(total),
    hours,
    nights,
    guests: Number(guests) || 1,
    label:
      mode === "hour"
        ? `${qty} hour(s)`
        : mode === "day"
        ? `${hours} hour(s)`
        : `${qty.toFixed(qty >= 1 ? 0 : 2)} month(s)`,
  };
}

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState({ open: false, tone: "success", msg: "" });

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [guests, setGuests] = useState(1);
  const [reserving, setReserving] = useState(false);

  const [photosOpen, setPhotosOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const [quote, setQuote] = useState(null);

  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);

  const [blockedDates, setBlockedDates] = useState([]);

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const todayStr = todayISO();

  function showToast(msg, tone = "success") {
    setToast({ open: true, tone, msg });
    window.setTimeout(() => setToast((s) => ({ ...s, open: false })), 2200);
  }

  const todayDateObj = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedRange = useMemo(() => {
    const from = startDate ? new Date(startDate + "T00:00:00") : undefined;
    const to = endDate ? new Date(endDate + "T00:00:00") : undefined;
    if (!from && !to) return undefined;
    return { from, to };
  }, [startDate, endDate]);

  const blockedDateObjs = useMemo(
    () =>
      blockedDates.filter(Boolean).map((d) => {
        const dt = new Date(d + "T00:00:00");
        dt.setHours(0, 0, 0, 0);
        return dt;
      }),
    [blockedDates]
  );

  const disabledDaysAll = useMemo(
    () => [{ before: todayDateObj }, ...blockedDateObjs],
    [todayDateObj, blockedDateObjs]
  );

  function handleRangeSelect(range) {
    if (!range || !range.from) {
      setStartDate("");
      setEndDate("");
      return;
    }

    const fromISO = fmtYMD(range.from);
    const toDate = range.to || range.from;
    const toISO = fmtYMD(toDate);

    if (fromISO < todayStr || toISO < todayStr) {
      showToast("You can’t select past dates.", "error");
      setStartDate("");
      setEndDate("");
      return;
    }

    const span = listNightsISO(fromISO, toISO);

    const overlapsBlocked =
      isDateBlocked(fromISO, blockedDates) ||
      isDateBlocked(toISO, blockedDates) ||
      span.some((d) => blockedDates.includes(d));

    if (overlapsBlocked) {
      showToast("These dates are already booked. Please choose another range.", "error");
      setStartDate("");
      setEndDate("");
      return;
    }

    setStartDate(fromISO);
    setEndDate(toISO);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError("");
        setLoading(true);
        const { data } = await api.get(`/listings/${id}`);
        if (alive) setItem(data?.listing ?? null);
      } catch {
        if (alive) {
          setError("We couldn't load this listing right now.");
          setItem(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const token = getAuthToken();
      if (!token) {
        if (alive) setSaved(false);
        return;
      }
      try {
        const { data } = await api.get(`/saves/${id}`);
        if (alive && data && typeof data.saved === "boolean") setSaved(data.saved);
      } catch {
        if (alive) setSaved(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/bookings/blocked-dates?listingId=${id}`);
        if (!alive) return;
        const list = Array.isArray(data?.blockedDates) ? data.blockedDates : [];
        setBlockedDates(list.filter(Boolean));
      } catch (err) {
        console.warn("[ListingDetails] Failed to load blocked dates", err);
        if (alive) setBlockedDates([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const vm = useMemo(() => (item ? toVM(item) : null), [item]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        setReviewsLoading(true);
        const { data } = await api.get("/reviews", {
          params: { listing: id, status: "visible" },
        });
        if (!alive) return;
        const raw = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
        const normalized = raw.map((r) => ({
          id: r._id || r.id,
          authorName:
            r.user?.firstName ||
            r.user?.fullName ||
            r.user?.name ||
            r.userName ||
            "",
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        }));
        setReviews(normalized);
      } catch (err) {
        console.warn("[ListingDetails] Failed to load reviews", err);
        if (alive) setReviews([]);
      } finally {
        if (alive) setReviewsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!vm) {
      setQuote(null);
      return;
    }
    const q = estimateQuote(vm, { startDate, endDate, checkInTime, checkOutTime, guests });
    setQuote(q);
  }, [vm, startDate, endDate, checkInTime, checkOutTime, guests]);

  useEffect(() => {
    if (!id || !startDate || !endDate || !checkInTime || !checkOutTime) {
      setHasConflict(false);
      return;
    }

    const hours = diffHours(startDate, checkInTime, endDate, checkOutTime);
    if (hours <= 0) {
      setHasConflict(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setAvailabilityChecking(true);
        const { data } = await api.post("/bookings/check-availability", {
          listingId: id,
          startDate,
          endDate,
          checkInTime,
          checkOutTime,
        });
        if (cancelled) return;
        const available = data?.available !== false;
        setHasConflict(!available);
      } catch {
        if (cancelled) return;
        setHasConflict(false);
      } finally {
        if (!cancelled) setAvailabilityChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, startDate, endDate, checkInTime, checkOutTime]);

  async function toggleSave() {
    const token = getAuthToken();
    if (!token) {
      showToast("Sign in to save listings", "error");
      const next = window.location.pathname + window.location.search;
      navigate(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    try {
      if (!saved) {
        await api.put(`/saves/${id}`);
        setSaved(true);
        showToast("Saved to your list");
      } else {
        await api.delete(`/saves/${id}`);
        setSaved(false);
        showToast("Removed from saved");
      }
    } catch (err) {
      console.error("[ListingDetails] toggleSave failed", err);
      showToast("Could not update saved state. Please try again.", "error");
    }
  }

  async function shareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Link copied");
    } catch {
      showToast("Copy failed", "error");
    }
  }

  function validateDateTime() {
    if (!startDate || !endDate) {
      showToast("Pick dates first", "error");
      return false;
    }
    if (!checkInTime || !checkOutTime) {
      showToast("Select time in & time out", "error");
      return false;
    }

    if (startDate < todayStr || endDate < todayStr) {
      showToast("You can’t select past dates.", "error");
      return false;
    }

    if (endDate < startDate) {
      setEndDate(startDate);
      showToast("Adjusted check-out date to match check-in", "error");
      return false;
    }
    if (startDate === endDate) {
      const a = toMinutes(checkInTime);
      const b = toMinutes(checkOutTime);
      if (a == null || b == null) {
        showToast("Invalid time selected", "error");
        return false;
      }
      if (b <= a) {
        showToast("Time out must be after time in", "error");
        return false;
      }
    }
    const minH = Number(vm?.specs?.minHours || 0);
    if (minH > 0) {
      const hours = diffHours(startDate, checkInTime, endDate, checkOutTime);
      if (hours > 0 && hours < minH) {
        showToast(`Minimum ${minH} hour(s) required`, "error");
        return false;
      }
    }

    if (blockedDates.length) {
      const span = listNightsISO(startDate, endDate);
      const overlap = span.some((d) => blockedDates.includes(d));
      if (overlap) {
        showToast(
          "Your stay overlaps dates that are already booked. Please adjust your dates.",
          "error"
        );
        return false;
      }
    }

    if (hasConflict) {
      showToast("This time slot is already booked. Please choose another.", "error");
      return false;
    }
    return true;
  }

  async function reserve() {
    if (Number(guests) < 1) {
      setGuests(1);
      showToast("Guests must be at least 1", "error");
      return;
    }
    if (!validateDateTime()) return;
    if (!quote) {
      showToast("Select valid dates/times to continue", "error");
      return;
    }

    const nights = diffDaysISO(startDate, endDate);
    const totalHours = diffHours(startDate, checkInTime, endDate, checkOutTime);

    const intent = {
      listingId: id,
      startDate,
      endDate,
      checkInTime,
      checkOutTime,
      nights,
      totalHours,
      guests: Number(guests) || 1,
      pricing: {
        mode: quote.mode,
        unitPrice: quote.unitPrice,
        qty: quote.qty,
        base: quote.base,
        fees: quote.fees,
        total: quote.total,
        currencySymbol: vm.currencySymbol,
        label: quote.label,
      },
    };

    const token = getAuthToken();
    if (!token) {
      sessionStorage.setItem("checkout_intent", JSON.stringify(intent));
      navigate("/login?next=" + encodeURIComponent("/checkout"));
      return;
    }

    setReserving(true);
    sessionStorage.setItem("checkout_intent", JSON.stringify(intent));
    navigate("/app/checkout", { state: intent });
  }

  function goToMessageHost() {
    const to = vm?.specs?.ownerId || "";
    const nextUrl = `/app/messages/new?listing=${encodeURIComponent(id)}${
      to ? `&to=${encodeURIComponent(to)}` : ""
    }`;
    const intent = {
      listingId: id,
      to,
      listingTitle: vm?.title || "Listing",
      checkIn: startDate || null,
      checkOut: endDate || null,
      checkInTime: checkInTime || null,
      checkOutTime: checkOutTime || null,
      guests: Number(guests) || 1,
    };
    sessionStorage.setItem("message_intent", JSON.stringify(intent));
    const token =
      localStorage.getItem("flexidesk_user_token") || sessionStorage.getItem("flexidesk_user_token");
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    navigate(nextUrl, { state: intent });
  }

  const mapsHref = useMemo(() => {
    if (!item) return "#";
    const q = encodeURIComponent(
      [
        item.address,
        item.address2,
        item.district,
        item.city,
        item.region,
        item.zip,
        item.country,
      ]
        .filter((x) => x != null && String(x).trim() !== "")
        .join(", ")
    );
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [item]);

  const baseRating = vm?.rating ?? 0;
  const ratingFromReviews =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
      : null;
  const effectiveRating = ratingFromReviews ?? baseRating;
  const effectiveReviewsCount = reviews.length || vm?.reviewsCount || 0;

  if (loading)
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto px-4" aria-live="polite">
          <div className="mt-4 md:mt-2" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
          <div className="grid grid-cols-4 gap-2 mt-4">
            <Skeleton className="col-span-4 md:col-span-2 h-64 md:h-80 rounded-2xl" />
            <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2">
              <Skeleton className="h-39 rounded-2xl" />
              <Skeleton className="h-39 rounded-2xl" />
              <Skeleton className="h-39 rounded-2xl" />
              <Skeleton className="h-39 rounded-2xl" />
            </div>
          </div>
          <div className="grid md:grid-cols-12 gap-6 mt-6">
            <Skeleton className="md:col-span-7 lg:col-span-8 h-64 rounded-2xl" />
            <Skeleton className="md:col-span-5 lg:col-span-4 h-60 rounded-2xl" />
          </div>
        </div>
      </PageShell>
    );

  if (error || !vm)
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto px-4">
          <div className="mt-4" />
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-ink">Listing not available</h1>
            <p className="mt-1 text-slate text-sm">
              {error || "This space may have been removed or is temporarily unavailable."}
            </p>
            <div className="mt-4">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink text-white text-sm"
              >
                Back to search
              </Link>
            </div>
          </div>
        </div>
      </PageShell>
    );

  const reserveDisabled =
    reserving ||
    !startDate ||
    !endDate ||
    !checkInTime ||
    !checkOutTime ||
    availabilityChecking ||
    hasConflict;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4">
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate mb-1">
              <Link
                to="/search"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 ring-1 ring-slate-200 hover:bg-white"
              >
                <span>←</span>
                <span>Back to search</span>
              </Link>
              <span className="hidden sm:inline h-3 w-px bg-slate-200" />
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 ring-1 ring-slate-200">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-medium text-ink">{effectiveRating.toFixed(1)}</span>
                <span className="text-slate">
                  ({formatCompact(effectiveReviewsCount)} review
                  {effectiveReviewsCount === 1 ? "" : "s"})
                </span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-ink truncate">
              {vm.title}
            </h1>
            <div className="mt-1 text-slate text-sm flex flex-wrap items-center gap-2">
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                <MapPin className="w-4 h-4" /> {vm.location}
              </a>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={shareLink}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white text-sm hover:bg-slate-50"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button
              onClick={toggleSave}
              aria-pressed={saved}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 text-sm transition ${
                saved
                  ? "bg-ink text-white ring-ink hover:bg-ink/90"
                  : "bg-white ring-slate-200 hover:bg-slate-50"
              }`}
              title={saved ? "Remove from saved" : "Save listing"}
            >
              <Heart className="w-4 h-4" /> {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <AirbnbGallery
          photos={vm.photos}
          title={vm.title}
          onOpen={(i) => {
            setPhotoIndex(i);
            setPhotosOpen(true);
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between gap-3">
              <div className="text-ink">
                <div className="text-lg font-medium">{vm.venueType || vm.category}</div>
                <div className="text-sm text-slate">
                  Fits {vm.capacity || 1} {vm.capacity === 1 ? "person" : "people"} • {cap(vm.scope)}
                </div>
              </div>
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={shareLink}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white text-xs hover:bg-slate-50"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={toggleSave}
                  aria-pressed={saved}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 text-xs transition ${
                    saved ? "bg-ink text-white" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <Heart className="w-4 h-4" /> {saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <Divider />
            <BadgesRow vm={vm} />
            <Divider />

            <Section title="About this space">
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                {vm.longDesc || DEFAULT_ABOUT}
              </p>
            </Section>

            <Section title="What this place offers">
              <Amenities items={vm.amenitiesList} />
              <div className="mt-4 rounded-2xl bg-slate-50/80 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate mb-2">
                  Accessibility and extras
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {vm.accessibilityList?.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-2 rounded-lg ring-1 ring-slate-200 bg-white px-2 py-1.5"
                    >
                      <span className="w-4 h-4 inline-block" />
                      {prettyAmenity(a)}
                    </span>
                  ))}
                  {!vm.accessibilityList?.length && (
                    <span className="text-xs text-slate col-span-2">
                      No additional accessibility details provided.
                    </span>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Key details">
              <KeyDetailsGrid specs={vm.specs} />
            </Section>

            <Section title="What guests are saying">
              {reviewsLoading ? (
                <p className="text-sm text-slate">Loading reviews…</p>
              ) : reviews.length > 0 ? (
                <ReviewsList
                  reviews={reviews}
                  rating={effectiveRating}
                  count={effectiveReviewsCount}
                />
              ) : (
                <p className="text-sm text-slate">
                  No reviews yet. Be the first to book and share your experience.
                </p>
              )}
            </Section>

            <Section title="Where you’ll be">
              <MapEmbed
                lat={vm.specs.lat}
                lng={vm.specs.lng}
                address={vm.location}
                approx={vm.specs.showApprox}
                mapsHref={mapsHref}
              />
              <div className="mt-2 text-sm text-slate flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {vm.location}
                </span>
                <a
                  className="inline-flex items-center gap-1 text-ink underline"
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </Section>

            <Section title="Meet your host">
              <HostCard firstName={vm.hostFirstName} onMessage={goToMessageHost} />
            </Section>
          </div>

          <aside className="lg:col-span-5 lg:pl-2 xl:pl-4 space-y-4">
            <div className="rounded-2xl ring-1 ring-slate-200 bg-white/90 backdrop-blur p-4 md:p-5 sticky top-4 shadow-lg space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div className="text-xl font-semibold text-ink flex items-baseline gap-1">
                  <span>
                    {vm.currencySymbol}
                    {vm.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate font-normal">{vm.priceNote}</span>
                </div>
                <div className="hidden md:flex items-center gap-1 text-xs text-slate">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-medium text-ink">{effectiveRating.toFixed(1)}</span>
                  <span>
                    · {formatCompact(effectiveReviewsCount)} review
                    {effectiveReviewsCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50/80 p-3 text-xs text-slate">
                Add your dates, times, and number of guests to see an exact price before booking.
              </div>

              <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2">
                  <button
                    type="button"
                    className="w-full rounded-lg ring-1 ring-slate-200 bg-white/80 p-2 text-left hover:ring-ink/40 focus:outline-none"
                    onClick={() => setDatePickerOpen(true)}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate mb-1">
                      <span>Check-in</span>
                      <span>Check-out</span>
                    </div>
                    <div className="flex items-center justify-between text-xs md:text-sm text-ink">
                      <div className="flex-1 border-r border-slate-200 pr-2">
                        <div className="font-medium truncate">
                          {startDate
                            ? new Date(startDate + "T00:00:00").toLocaleDateString()
                            : "Add date"}
                        </div>
                      </div>
                      <div className="flex-1 pl-2">
                        <div className="font-medium truncate">
                          {endDate
                            ? new Date(endDate + "T00:00:00").toLocaleDateString()
                            : "Add date"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-slate">
                      {startDate && endDate
                        ? `${diffDaysISO(startDate, endDate)} night(s)`
                        : "Add your travel dates for exact pricing"}
                    </div>
                  </button>
                </div>

                <label className="rounded-lg ring-1 ring-slate-200 bg-white/80 p-2 flex flex-col gap-1">
                  <div className="text-[11px] text-slate">Time in</div>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full outline-none bg-transparent text-sm"
                    step="900"
                  />
                </label>
                <label className="rounded-lg ring-1 ring-slate-200 bg-white/80 p-2 flex flex-col gap-1">
                  <div className="text-[11px] text-slate">Time out</div>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full outline-none bg-transparent text-sm"
                    step="900"
                  />
                </label>

                <label className="col-span-2 rounded-lg ring-1 ring-slate-200 bg-white/80 p-2 flex flex-col gap-1">
                  <div className="text-[11px] text-slate">Guests</div>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full outline-none bg-transparent text-sm"
                  >
                    {Array.from({ length: Math.max(1, vm.capacity || 6) }, (_, i) => i + 1)
                      .slice(0, 12)
                      .map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "guest" : "guests"}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <button
                onClick={reserve}
                disabled={reserveDisabled}
                className="mt-2 w-full rounded-lg bg-ink text-white py-2.5 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:bg-ink/90 transition"
              >
                {reserving
                  ? "Processing…"
                  : availabilityChecking
                  ? "Checking availability…"
                  : hasConflict
                  ? "Slot unavailable"
                  : "Reserve"}
              </button>

              <div className="mt-4 border-t border-slate-200 pt-3 space-y-3">
                <PricingList
                  currencySymbol={vm.currencySymbol}
                  base={{ value: vm.price, note: vm.priceNote }}
                  fees={{ service: vm.specs.serviceFee, cleaning: vm.specs.cleaningFee }}
                />

                {quote && (
                  <div className="mt-1 rounded-lg bg-slate-50 p-3 text-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Pricing mode</span>
                      <span className="font-medium">
                        {cap(quote.mode)} • {quote.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Base</span>
                      <span className="font-medium">
                        {fmtCurrency(vm.currencySymbol, quote.base)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Service fee</span>
                      <span className="font-medium">
                        {fmtCurrency(vm.currencySymbol, quote.fees.service)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Cleaning fee</span>
                      <span className="font-medium">
                        {fmtCurrency(vm.currencySymbol, quote.fees.cleaning)}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t flex items-center justify-between">
                      <span className="text-ink font-semibold">Estimated total</span>
                      <span className="text-ink font-semibold">
                        {fmtCurrency(vm.currencySymbol, quote.total)}
                      </span>
                    </div>
                  </div>
                )}

                {hasConflict && (
                  <div className="mt-1 text-xs text-rose-600 font-medium">
                    The selected date and time overlaps an existing booking. Please choose another
                    slot.
                  </div>
                )}

                <div className="mt-1 text-xs text-slate flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {hasConflict
                      ? "Slot unavailable."
                      : vm.specs.minHours
                      ? `Minimum ${vm.specs.minHours} hour(s). You won’t be charged yet.`
                      : "You won’t be charged yet."}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate text-right">
              <Link to="/start" className="underline hover:text-ink">
                List your space on FlexiDesk
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3 flex items-center justify-between gap-3 shadow-[0_-10px_30px_rgba(15,23,42,0.25)]">
        <div className="text-sm min-w-0">
          <div className="text-ink font-semibold truncate">
            {quote
              ? `${vm.currencySymbol}${quote.total.toLocaleString()}`
              : `${vm.currencySymbol}${vm.price.toLocaleString()}`}{" "}
            <span className="text-slate font-normal">
              {quote ? "est. total" : vm.priceNote}
            </span>
          </div>
          <div className="text-[11px] text-slate">
            {hasConflict ? "Selected slot is unavailable" : "You won’t be charged yet"}
          </div>
        </div>
        <button
          onClick={reserve}
          disabled={reserveDisabled}
          className="rounded-lg bg-ink text-white px-4 py-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {reserving
            ? "…"
            : availabilityChecking
            ? "Checking…"
            : hasConflict
            ? "Unavailable"
            : "Reserve"}
        </button>
      </div>

      {photosOpen && (
        <PhotoLightbox
          photos={vm.photos}
          index={photoIndex}
          onClose={() => setPhotosOpen(false)}
          onPrev={() => setPhotoIndex((i) => Math.max(0, i - 1))}
          onNext={() => setPhotoIndex((i) => Math.min(vm.photos.length - 1, i + 1))}
        />
      )}

      {toast.open && (
        <div
          className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 rounded-lg px-3 py-2 text-sm shadow-md ${
            toast.tone === "error" ? "bg-rose-600 text-white" : "bg-ink text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {datePickerOpen && (
        <DateRangeDropdown
          startDate={startDate}
          endDate={endDate}
          selectedRange={selectedRange}
          fromDate={todayDateObj}
          disabledDays={disabledDaysAll}
          onSelect={handleRangeSelect}
          onClear={() => handleRangeSelect(null)}
          onClose={() => setDatePickerOpen(false)}
        />
      )}
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      <div className="pt-3 md:pt-5">{children}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl bg-white/80 ring-1 ring-slate-200 px-4 py-4 md:px-5 md:py-5">
      <h2 className="text-lg md:text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Divider() {
  return <hr className="border-slate-200 my-6" />;
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200/60 rounded ${className}`} />;
}

function BadgesRow({ vm }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {vm.venueType && <Badge icon={Building2}>{vm.venueType}</Badge>}
      {vm.scope && <Badge icon={Clock}>{cap(vm.scope)}</Badge>}
      {vm.category && <Badge icon={Users}>{cap(vm.category)}</Badge>}
    </div>
  );
}

function Badge({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ring-1 ring-slate-200 bg-white shadow-sm">
      {Icon && <Icon className="w-3.5 h-3.5" />} {children}
    </span>
  );
}

function AirbnbGallery({ photos = [], title, onOpen }) {
  const list = photos.length ? photos : [PLACEHOLDER_IMG];
  const first = list[0];
  const next = list.slice(1, 5);
  return (
    <div className="relative mt-4">
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onOpen(0)}
          className="col-span-4 md:col-span-2 rounded-2xl overflow-hidden group relative"
        >
          <img
            src={first}
            alt={`${title} photo 1`}
            className="h-64 md:h-[420px] w-full object-cover group-hover:scale-[1.02] transition-transform"
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </button>
        <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2">
          {next.map((p, i) => (
            <button
              key={i}
              onClick={() => onOpen(i + 1)}
              className="rounded-2xl overflow-hidden group relative"
            >
              <img
                src={p}
                alt={`${title} photo ${i + 2}`}
                className="h-32 md:h-[205px] w-full object-cover group-hover:scale-[1.03] transition-transform"
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </button>
          ))}
        </div>
      </div>
      {list.length > 1 && (
        <button
          onClick={() => onOpen(0)}
          className="hidden md:inline-flex absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-white/95 ring-1 ring-slate-200 text-sm shadow-sm hover:bg-white"
        >
          Show all photos
        </button>
      )}
    </div>
  );
}

function PhotoLightbox({ photos, index, onClose, onPrev, onNext }) {
  const current = photos[index];
  return (
    <div className="fixed inset-0 z-[999] bg-black/90">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/90 p-2 shadow"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="h-full w-full flex items-center justify-center p-4">
        <img
          src={current}
          alt=""
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full">
        {index + 1} / {photos.length}
      </div>
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="px-3 py-2 rounded-full bg-white/80 text-ink disabled:opacity-40 shadow"
        >
          Prev
        </button>
        <button
          onClick={onNext}
          disabled={index === photos.length - 1}
          className="px-3 py-2 rounded-full bg-white/80 text-ink disabled:opacity-40 shadow"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Amenities({ items }) {
  const list = items?.length ? items : DEFAULT_AMENITIES;
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? list : list.slice(0, 10);
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        {shown.map((a, i) => (
          <div
            key={i}
            className="rounded-lg ring-1 ring-slate-200 bg-slate-50/80 px-2 py-1.5 flex items-center gap-2"
          >
            <AmenityIcon name={a} />
            <span>{prettyAmenity(a)}</span>
          </div>
        ))}
      </div>
      {list.length > 10 && (
        <button
          className="mt-3 text-sm underline text-ink"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show less" : `Show all ${list.length} amenities`}
        </button>
      )}
    </>
  );
}

function AmenityIcon({ name }) {
  const key = String(name || "").toLowerCase();
  if (key.includes("wifi")) return <Wifi className="w-4 h-4" />;
  if (key.includes("park")) return <ParkingCircle className="w-4 h-4" />;
  if (key.includes("coffee") || key.includes("tea")) return <Coffee className="w-4 h-4" />;
  if (key.includes("room") || key.includes("private")) return <DoorClosed className="w-4 h-4" />;
  if (key.includes("projector") || key.includes("tv")) return <Monitor className="w-4 h-4" />;
  if (key.includes("air") || key.includes("ac")) return <ThermometerSun className="w-4 h-4" />;
  return <span className="w-4 h-4 inline-block" />;
}

function buildMapsEmbedSrc({ lat, lng, address }) {
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps?q=${encodeURIComponent(lat + "," + lng)}&z=16&output=embed`;
  }
  const q = encodeURIComponent(address || "");
  return `https://www.google.com/maps?q=${q}&z=15&output=embed`;
}

function MapEmbed({ lat, lng, address, approx, mapsHref }) {
  const src = buildMapsEmbedSrc({ lat, lng, address });
  return (
    <div className="relative rounded-xl ring-1 ring-slate-200 overflow-hidden bg-slate-100">
      <iframe
        title="Location map"
        src={src}
        className="w-full h-56 md:h-72"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="absolute top-3 left-3 flex gap-2">
        {approx && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-white/90 ring-1 ring-slate-200 text-ink">
            Approximate location
          </span>
        )}
      </div>
      <a
        href={mapsHref}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/90 ring-1 ring-slate-200 text-sm shadow-sm"
      >
        View larger map <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function KeyDetailsGrid({ specs = {} }) {
  const rows = [
    ["Seats", specs.seats],
    ["Rooms", specs.rooms],
    ["Private rooms", specs.privateRooms],
    ["Minimum hours", specs.minHours],
    ["Wi-Fi speed", specs.wifiMbps != null ? `${specs.wifiMbps} Mbps` : null],
    ["Outlets per seat", specs.outletsPerSeat],
    ["Noise level", specs.noiseLevel ? cap(specs.noiseLevel) : null],
    ["Parking", specs.parking ? cap(specs.parking) : null],
    ["Locks", specs.hasLocks ? "Has locks" : "No locks"],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!rows.length)
    return <div className="text-sm text-slate">No details provided.</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {rows.map(([k, v]) => (
        <div
          key={k}
          className="rounded-xl bg-slate-50/80 ring-1 ring-slate-200 p-3 flex flex-col"
        >
          <div className="text-[11px] uppercase tracking-wide text-slate font-semibold">
            {k}
          </div>
          <div className="mt-1 text-sm text-ink font-medium break-words">
            {String(v)}
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingList({ currencySymbol, base = {}, fees = {} }) {
  const items = [
    [
      "Base price",
      base.value != null
        ? `${fmtCurrency(currencySymbol, base.value)} ${base.note || ""}`.trim()
        : "—",
    ],
    ["Service fee", fees.service != null ? fmtCurrency(currencySymbol, fees.service) : "—"],
    ["Cleaning fee", fees.cleaning != null ? fmtCurrency(currencySymbol, fees.cleaning) : "—"],
  ];
  return (
    <div className="text-sm text-ink">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between py-1">
          <span className="text-slate">{k}</span>
          <span className="font-medium">{v}</span>
        </div>
      ))}
    </div>
  );
}

function HostCard({ firstName = "Host", onMessage }) {
  const initial = firstName?.charAt(0) || "H";
  return (
    <div className="rounded-xl ring-1 ring-slate-200 bg-slate-50/80 p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 grid place-items-center text-ink font-medium text-lg">
          {initial}
        </div>
        <div>
          <div className="text-ink font-medium">{firstName}</div>
          <div className="text-slate text-sm">Responsive • Usually replies within an hour</div>
        </div>
      </div>
      <button
        onClick={onMessage}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white text-sm hover:bg-slate-50"
      >
        <Send className="w-4 h-4" /> Message host
      </button>
    </div>
  );
}

function DateRangeDropdown({
  startDate,
  endDate,
  selectedRange,
  fromDate,
  disabledDays,
  onSelect,
  onClear,
  onClose,
}) {
  return (
    <div className="fixed z-40 top-24 left-1/2 -translate-x-1/2 w-[min(95vw,700px)] px-2">
      <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 p-4 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-ink">Select dates</h3>
            <p className="text-xs md:text-sm text-slate">
              Add your travel dates for exact pricing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 max-w-sm">
          <div className="border rounded-lg px-3 py-2 bg-slate-50/70">
            <div className="text-[10px] uppercase tracking-wide text-slate font-semibold">
              Check-in
            </div>
            <div className="text-sm mt-1">
              {startDate ? new Date(startDate + "T00:00:00").toLocaleDateString() : "Add date"}
            </div>
          </div>
          <div className="border rounded-lg px-3 py-2 bg-slate-50/70">
            <div className="text-[10px] uppercase tracking-wide text-slate font-semibold">
              Check-out
            </div>
            <div className="text-sm mt-1">
              {endDate ? new Date(endDate + "T00:00:00").toLocaleDateString() : "Add date"}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate mb-3">
          {startDate && endDate
            ? `${diffDaysISO(startDate, endDate)} night(s)`
            : "Select a check-in and check-out date"}
        </div>

        <div className="overflow-x-auto">
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={onSelect}
            numberOfMonths={2}
            fromDate={fromDate}
            disabled={disabledDays}
            weekStartsOn={0}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs md:text-sm">
          <button
            type="button"
            onClick={onClear}
            className="underline text-slate hover:text-ink"
          >
            Clear dates
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-ink text-white text-xs md:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Stars({ value }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.round(v) ? "fill-current text-amber-500" : "text-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewsList({ reviews, rating, count }) {
  const shown = reviews.slice(0, 3);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50/80 p-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
          <span className="text-lg font-semibold text-ink">{rating.toFixed(1)}</span>
          <Stars value={rating} />
        </div>
        <div className="text-xs md:text-sm text-slate">
          Based on {count} review{count === 1 ? "" : "s"} from other clients
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((r, idx) => {
          const name = r.authorName || r.author || "Guest";
          const initial = name.charAt(0).toUpperCase();
          const rv = Number(r.rating) || rating;
          const dateLabel = r.createdAt
            ? new Date(r.createdAt).toLocaleDateString()
            : "";
          return (
            <article
              key={r.id || idx}
              className="rounded-xl bg-white ring-1 ring-slate-200 p-3 flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 grid place-items-center text-xs font-medium text-ink">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{name}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate">
                    <Stars value={rv} />
                    {dateLabel && <span>· {dateLabel}</span>}
                  </div>
                </div>
              </div>
              {r.comment && (
                <p className="text-xs md:text-sm text-ink leading-relaxed line-clamp-4">
                  {r.comment}
                </p>
              )}
            </article>
          );
        })}
      </div>
      {reviews.length > shown.length && (
        <div className="text-xs text-slate">
          Showing the latest {shown.length} review{shown.length === 1 ? "" : "s"}.
        </div>
      )}
    </div>
  );
}

function toVM(it) {
  const photos =
    Array.isArray(it.photos) && it.photos.length
      ? it.photos
      : [PLACEHOLDER_IMG, PLACEHOLDER_IMG, PLACEHOLDER_IMG, PLACEHOLDER_IMG, PLACEHOLDER_IMG];

  const currency = String(it.currency || "PHP").toUpperCase();
  const currencySymbol =
    currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;

  const hasHourly = it.priceSeatHour || it.priceRoomHour;
  const hasDaily = it.priceSeatDay || it.priceRoomDay || it.priceWholeDay;
  const hasMonth = it.priceWholeMonth;

  let price = 0;
  let priceNote = "/ day";

  if (hasHourly) {
    price = firstNum([it.priceSeatHour, it.priceRoomHour]);
    priceNote = "/ hour";
  } else if (hasDaily) {
    price = firstNum([it.priceSeatDay, it.priceRoomDay, it.priceWholeDay]);
    priceNote = "/ day";
  } else if (hasMonth) {
    price = Number(it.priceWholeMonth || 0);
    priceNote = "/ month";
  } else {
    price = 0;
    priceNote = "/ day";
  }

  const title =
    it.venue || [cap(it.category), cap(it.scope)].filter(Boolean).join(" • ") || "Space";

  const location =
    [
      it.address,
      it.address2,
      it.district,
      it.city,
      it.region,
      it.zip,
      it.country,
    ]
      .filter(Boolean)
      .join(", ") || "—";

  const amenitiesList = Array.isArray(it.amenities)
    ? it.amenities
    : Object.keys(it.amenities || {}).filter((k) => it.amenities[k]);

  const reviewsCount = Number(it.reviewsCount) || 0;
  const rating = Number(it.rating) || 5;

  let rawHost =
    (it.owner &&
      typeof it.owner === "object" &&
      (it.owner.name ||
        it.owner.fullName ||
        it.owner.firstName ||
        it.owner.displayName)) ||
    it.hostName ||
    "";
  const hostFirstName = firstNameOnly(rawHost) || "Host";

  return {
    photos,
    currencySymbol,
    price,
    priceNote,
    title,
    location,
    longDesc: it.longDesc,
    amenitiesList,
    capacity: firstNum([it.capacity, it.seatCapacity, it.maxGuests, it.seats]),
    venueType: it.venueType || cap(it.category),
    category: it.category,
    scope: it.scope,
    hostFirstName,
    reviewsCount,
    rating,
    specs: {
      seats: it.seats ?? null,
      rooms: it.rooms ?? null,
      privateRooms: it.privateRooms ?? null,
      minHours: it.minHours ?? null,
      hasLocks: !!it.hasLocks,
      wifiMbps: it.wifiMbps ? Number(it.wifiMbps) : null,
      outletsPerSeat: it.outletsPerSeat ? Number(it.outletsPerSeat) : null,
      noiseLevel: it.noiseLevel || null,
      parking: it.parking || null,
      serviceFee: it.serviceFee ?? null,
      cleaningFee: it.cleaningFee ?? null,
      lat: it.lat ? Number(it.lat) : null,
      lng: it.lng ? Number(it.lng) : null,
      showApprox: !!it.showApprox,
      status: it.status || null,
      createdAt: it.createdAt?.$date || it.createdAt || null,
      updatedAt: it.updatedAt?.$date || it.updatedAt || null,
      id: it.id || it._id || null,
      ownerId: typeof it.owner === "string" ? it.owner : it.owner?._id || null,
      coverIndex: it.coverIndex ?? 0,
    },
    accessibilityList: Object.keys(it.accessibility || {}).filter(
      (k) => it.accessibility[k]
    ),
    _raw: it,
  };
}

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop";
const DEFAULT_ABOUT =
  "We’re putting the finishing touches on this page. In the meantime, here are a few highlights of the space based on the listing details.";
const DEFAULT_AMENITIES = [
  "Wi-Fi",
  "Air conditioning",
  "Free street parking",
  "Projector/TV",
  "Coffee/tea",
  "Private meeting room",
  "24/7 access",
  "On-site staff",
];
