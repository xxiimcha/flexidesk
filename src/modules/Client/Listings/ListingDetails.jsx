import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Star, MapPin, Share2, Heart, Users, Building2, Clock, Wifi,
  ParkingCircle, Coffee, DoorClosed, Monitor, ThermometerSun, Send, ExternalLink, X
} from "lucide-react";

/* ---------------- utils ---------------- */
function diffDaysISO(a, b) {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  const ms = d2 - d1;
  return Math.max(1, Math.ceil(ms / 86400000));
}
function getAuthToken() {
  const USER_TOKEN_KEY = "flexidesk_user_token";
  const ADMIN_TOKEN_KEY = "flexidesk_admin_token";
  return (
    localStorage.getItem(USER_TOKEN_KEY) ||
    sessionStorage.getItem(USER_TOKEN_KEY) ||
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY) || ""
  );
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtCurrency(symbol, n) {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  return `${symbol}${num.toLocaleString()}`;
}
function formatCompact(n){
  try { return Intl.NumberFormat(undefined, { notation: "compact" }).format(n); } catch { return String(n); }
}
function cap(s){ return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : ""; }
function prettyAmenity(a){ return cap(String(a).replace(/_/g, " ").replace(/\s+/g, " ").trim()); }
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
function diffHours(dateA, timeA, dateB, timeB) {
  try {
    const start = new Date(`${dateA}T${timeA || "00:00"}:00`);
    const end = new Date(`${dateB}T${timeB || "00:00"}:00`);
    const ms = end - start;
    if (ms <= 0) return 0;
    const hours = ms / 36e5;
    return Math.ceil(hours * 4) / 4; // quarter-hour
  } catch { return 0; }
}

/* ---------------- NEW: Pricing helpers ---------------- */
function pickPricingMode(vm, startDate, endDate, hours) {
  // Priority: hourly (if configured and duration < 24h), else daily, else monthly (>=27 nights)
  const hasHourly = vm._raw.priceSeatHour || vm._raw.priceRoomHour;
  const hasDaily = vm._raw.priceSeatDay || vm._raw.priceRoomDay || vm._raw.priceWholeDay;
  const hasMonthly = vm._raw.priceWholeMonth;

  const nights = diffDaysISO(startDate, endDate);
  if (hasHourly && hours > 0 && nights === 1) return "hour";
  if (hasDaily) return "day";
  if (hasMonthly && nights >= 27) return "month";
  // sensible fallback
  if (hasHourly && hours > 0) return "hour";
  if (hasMonthly) return "month";
  return "day";
}

function getUnitPrice(vm, mode) {
  if (mode === "hour") return firstNum([vm._raw.priceSeatHour, vm._raw.priceRoomHour]);
  if (mode === "day") return firstNum([vm._raw.priceSeatDay, vm._raw.priceRoomDay, vm._raw.priceWholeDay]);
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
  else if (mode === "month") {
    // simple pro-rating by nights (30-day month baseline); if >=27 nights, charge 1 month
    qty = nights >= 27 ? 1 : (nights / 30);
  }

  const base = unitPrice * qty;
  const serviceFee = vm.specs.serviceFee != null ? Number(vm.specs.serviceFee) : 0;
  const cleaningFee = vm.specs.cleaningFee != null ? Number(vm.specs.cleaningFee) : 0;
  const subtotal = Math.max(0, base);
  const total = Math.max(0, subtotal + serviceFee + cleaningFee);

  return {
    mode, // "hour" | "day" | "month"
    unitPrice,
    qty,
    base: round2(subtotal),
    fees: {
      service: serviceFee,
      cleaning: cleaningFee,
    },
    total: round2(total),
    hours,
    nights,
    guests: Number(guests) || 1,
    label:
      mode === "hour" ? `${qty} hour(s)` :
      mode === "day"  ? `${qty} night(s)` :
      `${qty.toFixed(qty >= 1 ? 0 : 2)} month(s)`,
  };
}
function round2(n){ return Math.round((Number(n)||0)*100)/100; }

/* ---------------- Component ---------------- */
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
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("18:00");
  const [guests, setGuests] = useState(1);
  const [reserving, setReserving] = useState(false);

  const [photosOpen, setPhotosOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // NEW: live quote state
  const [quote, setQuote] = useState(null);

  // NEW: availability state
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);

  const today = todayISO();

  function onStartChange(v) {
    setStartDate(v);
    if (endDate && v && endDate < v) setEndDate(v);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError("");
        setLoading(true);
        const { data } = await api.get(`/listings/${id}`);
        if (alive) {
          const listing = data?.listing ?? null;
          setItem(listing);

          // NEW: auto-select today as default start/end on first load
          const todayStr = todayISO();
          setStartDate(prev => prev || todayStr);
          setEndDate(prev => prev || todayStr);
        }
      } catch {
        if (alive) {
          setError("We couldn't load this listing right now.");
          setItem(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/saves/${id}`);
        if (alive && data && typeof data.saved === "boolean") setSaved(data.saved);
      } catch {}
    })();
    return () => { alive = false; };
  }, [id]);

  const vm = useMemo(() => (item ? toVM(item) : null), [item]);

  // NEW: recompute quote whenever inputs change
  useEffect(() => {
    if (!vm) { setQuote(null); return; }
    const q = estimateQuote(vm, { startDate, endDate, checkInTime, checkOutTime, guests });
    setQuote(q);
  }, [vm, startDate, endDate, checkInTime, checkOutTime, guests]);

  // NEW: server-side availability check whenever date/time changes, with logs
  useEffect(() => {
    console.log("[AvailabilityCheck] Triggered with:", {
      listingId: id,
      startDate,
      endDate,
      checkInTime,
      checkOutTime,
    });

    if (!id || !startDate || !endDate || !checkInTime || !checkOutTime) {
      console.log("[AvailabilityCheck] Missing fields → skipping check.");
      setHasConflict(false);
      return;
    }

    const hours = diffHours(startDate, checkInTime, endDate, checkOutTime);
    if (hours <= 0) {
      console.log("[AvailabilityCheck] Invalid duration (hours <= 0) → skipping check.");
      setHasConflict(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setAvailabilityChecking(true);

        console.log("[AvailabilityCheck] Sending request to backend:", {
          url: "/bookings/check-availability",
          payload: {
            listingId: id,
            startDate,
            endDate,
            checkInTime,
            checkOutTime,
          },
        });

        const { data } = await api.post("/bookings/check-availability", {
          listingId: id,
          startDate,
          endDate,
          checkInTime,
          checkOutTime,
        });

        if (cancelled) return;

        console.log("[AvailabilityCheck] Backend responded:", data);

        const available = data?.available !== false;
        console.log("[AvailabilityCheck] Parsed availability:", available);

        setHasConflict(!available);
      } catch (err) {
        if (cancelled) return;

        console.warn("[AvailabilityCheck] ERROR:", err);

        // On error, don't block bookings; treat as no conflict.
        setHasConflict(false);
      } finally {
        if (!cancelled) {
          console.log("[AvailabilityCheck] Finished.");
          setAvailabilityChecking(false);
        }
      }
    })();

    return () => {
      console.log("[AvailabilityCheck] Cancelled previous request.");
      cancelled = true;
    };
  }, [id, startDate, endDate, checkInTime, checkOutTime]);

  function showToast(msg, tone = "success") {
    setToast({ open: true, tone, msg });
    window.setTimeout(() => setToast(s => ({ ...s, open: false })), 2200);
  }

  async function toggleSave() {
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
    } catch {
      showToast("Sign in to save listings", "error");
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
    if (!startDate || !endDate) { showToast("Pick dates first", "error"); return false; }
    if (!checkInTime || !checkOutTime) { showToast("Select time in & time out", "error"); return false; }
    if (endDate < startDate) {
      setEndDate(startDate);
      showToast("Adjusted check-out date to match check-in", "error");
      return false;
    }
    if (startDate === endDate) {
      const a = toMinutes(checkInTime);
      const b = toMinutes(checkOutTime);
      if (a == null || b == null) { showToast("Invalid time selected", "error"); return false; }
      if (b <= a) { showToast("Time out must be after time in", "error"); return false; }
    }
    const minH = Number(vm?.specs?.minHours || 0);
    if (minH > 0) {
      const hours = diffHours(startDate, checkInTime, endDate, checkOutTime);
      if (hours > 0 && hours < minH) {
        showToast(`Minimum ${minH} hour(s) required`, "error");
        return false;
      }
    }
    if (hasConflict) {
      showToast("This time slot is already booked. Please choose another.", "error");
      return false;
    }
    return true;
  }

  // NEW: Reserve now also respects availability conflicts
  async function reserve() {
    console.log("[ListingDetails] Reserve clicked", {
      startDate,
      endDate,
      checkInTime,
      checkOutTime,
      guests,
    });

    if (Number(guests) < 1) {
      setGuests(1);
      showToast("Guests must be at least 1", "error");
      console.log("[ListingDetails] Reserve aborted - guests < 1");
      return;
    }
    if (!validateDateTime()) {
      console.log("[ListingDetails] Reserve aborted - invalid date/time or conflict");
      return;
    }

    // Optional: ensure we have a quote
    if (!quote) {
      showToast("Select valid dates/times to continue", "error");
      console.log("[ListingDetails] Reserve aborted - no quote", {
        quote,
        startDate,
        endDate,
        checkInTime,
        checkOutTime,
      });
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

      // NEW: price breakdown payload
      pricing: {
        mode: quote.mode,            // "hour" | "day" | "month"
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
    const hasToken = !!token;

    console.log("[ListingDetails] Auth check before reserve", {
      hasToken,
      tokenPreview: token ? token.slice(0, 12) + "..." : null,
    });

    if (!hasToken) {
      console.log("[ListingDetails] No token – redirecting to /login with intent", intent);
      sessionStorage.setItem("checkout_intent", JSON.stringify(intent));
      navigate("/login?next=" + encodeURIComponent("/checkout"));
      return;
    }

    setReserving(true);

    sessionStorage.setItem("checkout_intent", JSON.stringify(intent));
    console.log("[ListingDetails] Stored checkout_intent and navigating to /app/checkout", intent);

    navigate("/app/checkout", { state: intent });
  }


  function goToMessageHost() {
    const to = vm?.specs?.ownerId || "";
    const nextUrl = `/app/messages/new?listing=${encodeURIComponent(id)}${to ? `&to=${encodeURIComponent(to)}` : ""}`;
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
    console.log("[ListingDetails] Message host clicked", { listingId: id, to, intent });
    sessionStorage.setItem("message_intent", JSON.stringify(intent));
    const token =
      localStorage.getItem("flexidesk_user_token") ||
      sessionStorage.getItem("flexidesk_user_token");
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    navigate(nextUrl, { state: intent });
  }

  const mapsHref = useMemo(() => {
    if (!item) return "#";
    const q = encodeURIComponent(
      [item.address, item.address2, item.district, item.city, item.region, item.zip, item.country]
        .filter(x => x != null && String(x).trim() !== "").join(", ")
    );
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [item]);

  if (loading) return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4" aria-live="polite">
        <div className="mt-4"/>
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-80 mt-2" />
        <div className="grid grid-cols-4 gap-2 mt-4">
          <Skeleton className="col-span-4 md:col-span-2 h-64 md:h-80 rounded-xl" />
          <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2">
            <Skeleton className="h-39 rounded-xl" />
            <Skeleton className="h-39 rounded-xl" />
            <Skeleton className="h-39 rounded-xl" />
            <Skeleton className="h-39 rounded-xl" />
          </div>
        </div>
        <div className="grid md:grid-cols-12 gap-6 mt-6">
          <Skeleton className="md:col-span-7 lg:col-span-8 h-64 rounded-xl" />
          <Skeleton className="md:col-span-5 lg:col-span-4 h-60 rounded-xl" />
        </div>
      </div>
    </PageShell>
  );

  if (error || !vm) return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-ink">Listing not available</h1>
          <p className="mt-1 text-slate text-sm">{error || "This space may have been removed or is temporarily unavailable."}</p>
          <div className="mt-4">
            <Link to="/search" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink text-white text-sm">Back to search</Link>
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
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-ink">{vm.title}</h1>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={shareLink} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white text-sm">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button
              onClick={toggleSave}
              aria-pressed={saved}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 text-sm ${saved ? "bg-ink text-white" : "bg-white"}`}
              title={saved ? "Remove from saved" : "Save listing"}
            >
              <Heart className="w-4 h-4" /> {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <div className="mt-1 text-slate text-sm flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 fill-current" /> <b className="text-ink">{vm.rating.toFixed(1)}</b> ({formatCompact(vm.reviewsCount)} reviews)</span>
          <span>•</span>
          <a href={mapsHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
            <MapPin className="w-4 h-4" /> {vm.location}
          </a>
        </div>

        <AirbnbGallery
          photos={vm.photos}
          title={vm.title}
          onOpen={(i)=>{setPhotoIndex(i); setPhotosOpen(true);}}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between">
              <div className="text-ink">
                <div className="text-lg font-medium">{vm.venueType || vm.category}</div>
                <div className="text-sm text-slate">
                  Fits {vm.capacity || 1} {vm.capacity === 1 ? "person" : "people"} • {cap(vm.scope)}
                </div>
              </div>
              <div className="md:hidden flex items-center gap-2">
                <button onClick={shareLink} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white text-xs">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button onClick={toggleSave} aria-pressed={saved} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 text-xs ${saved ? "bg-ink text-white" : "bg-white"}`}>
                  <Heart className="w-4 h-4" /> {saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <Divider />

            <BadgesRow vm={vm} />

            <Divider />

            <Section title="About this space">
              <p className="text-sm text-ink whitespace-pre-wrap">{vm.longDesc || DEFAULT_ABOUT}</p>
            </Section>

            <Section title="What this place offers">
              <Amenities items={vm.amenitiesList} />
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {vm.accessibilityList?.map(a => (
                  <span key={a} className="inline-flex items-center gap-2 rounded-lg ring-1 ring-slate-200 bg-white px-2 py-1.5">
                    <span className="w-4 h-4 inline-block" />
                    {prettyAmenity(a)}
                  </span>
                ))}
              </div>
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
                <a className="inline-flex items-center gap-1 text-ink underline" href={mapsHref} target="_blank" rel="noreferrer">
                  Open in Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </Section>

            <Section title="Key details">
              <KeyDetailsGrid specs={vm.specs} />
            </Section>

            <Section title="Meet your host">
              <HostCard firstName={vm.hostFirstName} onMessage={goToMessageHost} />
            </Section>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 sticky top-6">
              <div className="text-xl font-semibold text-ink flex items-end gap-1">
                <span>{vm.currencySymbol}{vm.price.toLocaleString()}</span>
                <span className="text-sm text-slate font-normal">{vm.priceNote}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <label className="rounded-lg ring-1 ring-slate-200 p-2">
                  <div className="text-[11px] text-slate">Check-in date</div>
                  <input type="date" value={startDate} min={today} onChange={(e) => onStartChange(e.target.value)} className="w-full outline-none" />
                </label>
                <label className="rounded-lg ring-1 ring-slate-200 p-2">
                  <div className="text-[11px] text-slate">Check-out date</div>
                  <input type="date" value={endDate} min={startDate || today} onChange={(e) => setEndDate(e.target.value)} className="w-full outline-none" />
                </label>

                <label className="rounded-lg ring-1 ring-slate-200 p-2">
                  <div className="text-[11px] text-slate">Time in</div>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full outline-none"
                    step="900"
                  />
                </label>
                <label className="rounded-lg ring-1 ring-slate-200 p-2">
                  <div className="text-[11px] text-slate">Time out</div>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full outline-none"
                    step="900"
                  />
                </label>

                <label className="col-span-2 rounded-lg ring-1 ring-slate-200 p-2">
                  <div className="text-[11px] text-slate">Guests</div>
                  <select value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full outline-none">
                    {Array.from({ length: Math.max(1, vm.capacity || 6) }, (_, i) => i + 1).slice(0, 12).map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                onClick={reserve}
                disabled={reserveDisabled}
                className="mt-4 w-full rounded-lg bg-ink text-white py-2 text-sm disabled:opacity-60"
              >
                {reserving
                  ? "Processing…"
                  : availabilityChecking
                    ? "Checking availability…"
                    : hasConflict
                      ? "Slot unavailable"
                      : "Reserve"}
              </button>

              <div className="mt-4 border-t pt-3">
                <PricingList
                  currencySymbol={vm.currencySymbol}
                  base={{ value: vm.price, note: vm.priceNote }}
                  fees={{ service: vm.specs.serviceFee, cleaning: vm.specs.cleaningFee }}
                />

                {/* NEW: Live estimate */}
                {quote && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Pricing mode</span>
                      <span className="font-medium">{cap(quote.mode)} • {quote.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Base</span>
                      <span className="font-medium">{fmtCurrency(vm.currencySymbol, quote.base)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Service fee</span>
                      <span className="font-medium">{fmtCurrency(vm.currencySymbol, quote.fees.service)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Cleaning fee</span>
                      <span className="font-medium">{fmtCurrency(vm.currencySymbol, quote.fees.cleaning)}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t flex items-center justify-between">
                      <span className="text-ink font-semibold">Estimated total</span>
                      <span className="text-ink font-semibold">{fmtCurrency(vm.currencySymbol, quote.total)}</span>
                    </div>
                  </div>
                )}

                {hasConflict && (
                  <div className="mt-2 text-xs text-rose-600 font-medium">
                    The selected date and time overlaps an existing booking. Please choose another slot.
                  </div>
                )}

                <div className="mt-2 text-xs text-slate flex items-center gap-1">
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

            <div className="mt-4 text-xs text-slate">
              <Link to="/start" className="underline">List your space</Link>
            </div>
          </aside>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3 flex items-center justify-between">
        <div className="text-sm">
          <div className="text-ink font-semibold">
            {quote
              ? `${vm.currencySymbol}${quote.total.toLocaleString()}`
              : `${vm.currencySymbol}${vm.price.toLocaleString()}`
            }{" "}
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
          className="rounded-lg bg-ink text-white px-4 py-2 text-sm disabled:opacity-60"
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
          onClose={()=>setPhotosOpen(false)}
          onPrev={()=>setPhotoIndex(i=>Math.max(0, i-1))}
          onNext={()=>setPhotoIndex(i=>Math.min(vm.photos.length-1, i+1))}
        />
      )}

      {toast.open && (
        <div className={`fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 rounded-lg px-3 py-2 text-sm shadow ${toast.tone === "error" ? "bg-rose-600 text-white" : "bg-ink text-white"}`}>
          {toast.msg}
        </div>
      )}
    </PageShell>
  );
}

/* ---------------- presentational subcomponents (unchanged) ---------------- */
function PageShell({ children }) { return <div className="pb-20 md:pb-12">{children}</div>; }
function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
function Divider() { return <hr className="border-slate-200 my-6" />; }
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 ring-slate-200 bg-white">
      {Icon && <Icon className="w-3.5 h-3.5" />} {children}
    </span>
  );
}

function AirbnbGallery({ photos = [], title, onOpen }) {
  const list = photos.length ? photos : [PLACEHOLDER_IMG];
  const first = list[0];
  const next = list.slice(1, 5);
  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-2 mt-4">
        <button onClick={()=>onOpen(0)} className="col-span-4 md:col-span-2 rounded-xl overflow-hidden">
          <img src={first} alt={`${title} photo 1`} className="h-64 md:h-[420px] w-full object-cover hover:opacity-95 transition" />
        </button>
        <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2">
          {next.map((p, i) => (
            <button key={i} onClick={()=>onOpen(i+1)} className="rounded-xl overflow-hidden">
              <img src={p} alt={`${title} photo ${i + 2}`} className="h-32 md:h-[205px] w-full object-cover hover:opacity-95 transition" />
            </button>
          ))}
        </div>
      </div>
      {list.length > 5 && (
        <button onClick={()=>onOpen(0)} className="hidden md:inline-flex absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-white/90 ring-1 ring-slate-200 text-sm">
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
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white/90 p-2">
        <X className="w-5 h-5" />
      </button>
      <div className="h-full w-full flex items-center justify-center p-4">
        <img src={current} alt="" className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
        {index + 1} / {photos.length}
      </div>
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
        <button onClick={onPrev} disabled={index===0} className="px-3 py-2 rounded bg-white/80 text-ink disabled:opacity-40">Prev</button>
        <button onClick={onNext} disabled={index===photos.length-1} className="px-3 py-2 rounded bg-white/80 text-ink disabled:opacity-40">Next</button>
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
          <div key={i} className="rounded-lg ring-1 ring-slate-200 bg-white px-2 py-1.5 flex items-center gap-2">
            <AmenityIcon name={a} />
            <span>{prettyAmenity(a)}</span>
          </div>
        ))}
      </div>
      {list.length > 10 && (
        <button className="mt-3 text-sm underline" onClick={() => setExpanded(e => !e)}>
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
        className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/90 ring-1 ring-slate-200 text-sm"
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
    ["Lat/Lng", (specs.lat != null || specs.lng != null) ? `${specs.lat ?? "?"}, ${specs.lng ?? "?"}${specs.showApprox ? " (approx)" : ""}` : null],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!rows.length) return <div className="text-sm text-slate">No details provided.</div>;
  return (
    <dl className="grid sm:grid-cols-2 gap-px bg-slate-100 rounded-xl overflow-hidden">
      {rows.map(([k, v]) => (
        <div key={k} className="bg-white p-3">
          <dt className="text-xs text-slate">{k}</dt>
          <dd className="text-sm text-ink mt-0.5">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}
function PricingList({ currencySymbol, base = {}, fees = {} }) {
  const items = [
    ["Base price", base.value != null ? `${fmtCurrency(currencySymbol, base.value)} ${base.note || ""}`.trim() : "—"],
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
    <div className="rounded-xl ring-1 ring-slate-200 bg-white p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 grid place-items-center text-ink font-medium">
          {initial}
        </div>
        <div>
          <div className="text-ink font-medium">{firstName}</div>
          <div className="text-slate text-sm">Responsive • Usually replies within an hour</div>
        </div>
      </div>
      <button
        onClick={onMessage}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white text-sm"
      >
        <Send className="w-4 h-4" /> Message host
      </button>
    </div>
  );
}

/* ---------------- VM ---------------- */
function toVM(it) {
  const photos = Array.isArray(it.photos) && it.photos.length
    ? it.photos
    : [PLACEHOLDER_IMG, PLACEHOLDER_IMG, PLACEHOLDER_IMG, PLACEHOLDER_IMG, PLACEHOLDER_IMG];

  const currency = String(it.currency || "PHP").toUpperCase();
  const currencySymbol = currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;

  const price = firstNum([
    it.priceSeatDay, it.priceRoomDay, it.priceWholeDay,
    it.priceSeatHour, it.priceRoomHour, it.priceWholeMonth
  ]) ?? 0;

  const priceNote =
    it.priceSeatHour || it.priceRoomHour ? "/ hour" :
    it.priceWholeMonth ? "/ month" : "/ day";

  const title = it.venue || [cap(it.category), cap(it.scope)].filter(Boolean).join(" • ") || "Space";
  const location = [it.address, it.address2, it.district, it.city, it.region, it.zip, it.country].filter(Boolean).join(", ") || "—";

  const amenitiesList = Array.isArray(it.amenities)
    ? it.amenities
    : Object.keys(it.amenities || {}).filter(k => it.amenities[k]);

  const reviewsCount = Number(it.reviewsCount) || 0;
  const rating = Number(it.rating) || 5;

  let rawHost =
    (it.owner && typeof it.owner === "object" && (it.owner.name || it.owner.fullName || it.owner.firstName || it.owner.displayName)) ||
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
      ownerId: typeof it.owner === "string" ? it.owner : (it.owner?._id || null),
      coverIndex: it.coverIndex ?? 0,
    },
    accessibilityList: Object.keys(it.accessibility || {}).filter(k => it.accessibility[k]),
    _raw: it,
  };
}

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop";
const DEFAULT_ABOUT =
  "We’re putting the finishing touches on this page. In the meantime, here are a few highlights of the space based on the listing details.";
const DEFAULT_AMENITIES = [
  "Wi-Fi", "Air conditioning", "Free street parking", "Projector/TV",
  "Coffee/tea", "Private meeting room", "24/7 access", "On-site staff",
];
