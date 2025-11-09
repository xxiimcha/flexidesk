// src/modules/Messages/pages/ContactHostPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/services/api";
import {
  ArrowLeft, MapPin, Send, Users, CalendarDays, ChevronDown, ChevronUp,
} from "lucide-react";

/* ---------------- utils ---------------- */
function cap(s){ return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : ""; }
function firstNameOnly(s) {
  if (!s) return "Host";
  const clean = String(s).trim().replace(/\s+/g, " ");
  return cap(clean.split(/[ \-]/)[0]);
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function diffDaysISO(a, b) {
  if (!a || !b) return 1;
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.max(1, Math.ceil((d2 - d1) / 86400000));
}
function fmtCurrency(symbol, n) {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  return `${symbol}${num.toLocaleString()}`;
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

/* =============== page =============== */
export default function ContactHostPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const listingId = params.get("listing") || location.state?.listingId || "";
  const to = params.get("to") || location.state?.to || ""; // optional ownerId
  const qsStart = params.get("start") || "";
  const qsEnd = params.get("end") || "";
  const qsGuests = Number(params.get("guests") || 1);

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(!!listingId);
  const [error, setError] = useState("");

  // compose form
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // booking card state
  const [startDate, setStartDate] = useState(qsStart || todayISO());
  const [endDate, setEndDate] = useState(qsEnd || todayISO());
  const [guests, setGuests] = useState(Math.max(1, qsGuests));
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  /* ---- restore pending message (if user came back from login) ---- */
  useEffect(() => {
    const raw = sessionStorage.getItem("message_intent");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      // Only restore if it refers to the same listing
      if (!listingId || saved?.listingId === listingId) {
        if (saved?.body) setMessage(saved.body);
        if (saved?.checkIn) setStartDate(saved.checkIn);
        if (saved?.checkOut) setEndDate(saved.checkOut);
        if (saved?.guests) setGuests(Number(saved.guests) || 1);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  /* ---- load listing ---- */
  useEffect(() => {
    let alive = true;
    if (!listingId) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/listings/${listingId}`);
        if (!alive) return;
        const item = data?.listing;
        setListing(item || null);

        // prefill message (if user hasn't typed yet)
        const hostFirst =
          firstNameOnly(
            (item?.owner && typeof item.owner === "object" &&
              (item.owner.name || item.owner.fullName || item.owner.firstName || item.owner.displayName)) ||
            item?.hostName
          );
        if (!message) {
          setMessage(`Hi ${hostFirst}, I’m interested in your space. Is it available for my preferred dates?`);
        }
        // If qs didn't include end date, nudge it to +1 day
        if (!qsEnd && qsStart) {
          const d = new Date(qsStart + "T00:00:00");
          d.setDate(d.getDate() + 1);
          setEndDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
        }
      } catch {
        if (alive) setError("We couldn’t load the listing details.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const vm = useMemo(() => {
    if (!listing) return null;
    const title = listing.venue || [cap(listing.category), cap(listing.scope)].filter(Boolean).join(" • ") || "Space";
    const locationLine = [listing.address, listing.address2, listing.city, listing.region, listing.country]
      .filter(Boolean).join(", ");
    const currency = String(listing.currency || "PHP").toUpperCase();
    const currencySymbol = currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;
    const nightly = Number(
      listing.priceSeatDay ??
      listing.priceRoomDay ??
      listing.priceWholeDay ??
      listing.priceSeatHour ??
      listing.priceRoomHour ??
      listing.priceWholeMonth ?? 0
    ) || 0;

    const hostFirst =
      firstNameOnly(
        (listing?.owner && typeof listing.owner === "object" &&
          (listing.owner.name || listing.owner.fullName || listing.owner.firstName || listing.owner.displayName)) ||
        listing?.hostName
      );

    return {
      title,
      locationLine,
      currencySymbol,
      nightly,
      hostFirst,
      photos: Array.isArray(listing.photos) ? listing.photos : [],
      capacity: listing.capacity || listing.seats || 1,
      fees: {
        service: listing.serviceFee ? Number(listing.serviceFee) : 0,
        cleaning: listing.cleaningFee ? Number(listing.cleaningFee) : 0,
      }
    };
  }, [listing]);

  const nights = diffDaysISO(startDate, endDate);
  const baseSubtotal = (vm?.nightly || 0) * nights;
  const total = baseSubtotal + (vm?.fees.service || 0) + (vm?.fees.cleaning || 0);

  /* ---- actions ---- */
  function onStartChange(v) {
    setStartDate(v);
    if (endDate && v && endDate < v) setEndDate(v);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!listingId) return;

    const token = getAuthToken();
    const nextUrl =
      `/messages/new?listing=${encodeURIComponent(listingId)}` +
      `&start=${startDate}&end=${endDate}&guests=${guests}` +
      `${to ? `&to=${encodeURIComponent(to)}` : ""}`;

    if (!token) {
      // Save intent so we can restore after login
      sessionStorage.setItem("message_intent", JSON.stringify({
        listingId,
        to,
        body: String(message || "").trim(),
        checkIn: startDate,
        checkOut: endDate,
        guests,
      }));
      navigate(`/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }

    const body = String(message || "").trim();
    if (body.length < 10) return;

    try {
      setSending(true);
      const payload = { listingId, message: body };
      if (to) payload.to = to;
      await api.post("/inquiries", payload);
      sessionStorage.removeItem("message_intent");
      navigate("/messages", { state: { flash: "Message sent to host." } });
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to send your message.");
    } finally {
      setSending(false);
    }
  }

  function goReserve() {
    if (!listingId) return;
    const token = getAuthToken();
    const intent = {
      listingId,
      startDate,
      endDate,
      nights,
      guests: Number(guests) || 1,
    };
    if (!token) {
      sessionStorage.setItem("checkout_intent", JSON.stringify(intent));
      navigate("/login?next=" + encodeURIComponent("/checkout"));
      return;
    }
    sessionStorage.setItem("checkout_intent", JSON.stringify(intent));
    navigate("/checkout", { state: intent });
  }

  /* =============== UI =============== */
  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-ink hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Title */}
      <div className="mt-3">
        {loading ? (
          <div className="h-7 w-72 bg-slate-200/60 rounded animate-pulse" />
        ) : vm ? (
          <>
            <h1 className="text-2xl font-semibold text-ink">
              Contact {vm.hostFirst} | {vm.title}
            </h1>
            <div className="text-slate text-sm mt-1">Typically responds within an hour</div>
          </>
        ) : (
          <h1 className="text-2xl font-semibold text-ink">Contact host</h1>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column */}
        <div className="lg:col-span-7">
          <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-ink">Most travelers ask about</h2>
            <div className="mt-4 space-y-4 text-sm text-ink">
              <div>
                <h3 className="font-medium">Getting there</h3>
                <ul className="list-disc pl-5 mt-1 text-slate">
                  <li>Paid parking on the premises.</li>
                  <li>Check-in and check-out times may vary by host.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium">House details and rules</h3>
                <ul className="list-disc pl-5 mt-1 text-slate">
                  <li>No smoking. No parties or events. No pets.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium">Price and availability</h3>
                <ul className="list-disc pl-5 mt-1 text-slate">
                  <li>Discounts may apply for long stays.</li>
                  <li>Flexible cancellation depends on host policy.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold text-ink">Still have questions? Message the host</h2>
            <form onSubmit={handleSend} className="mt-3">
              <textarea
                rows={6}
                value={message}
                onChange={(e)=>setMessage(e.target.value)}
                placeholder={`Hi ${vm?.hostFirst || "Host"}, I’ll be visiting...`}
                className="w-full rounded-2xl ring-1 ring-slate-200 bg-white p-4 text-sm outline-none focus:ring-ink/30"
              />
              <div className="mt-3">
                <button
                  type="submit"
                  disabled={sending || !message.trim() || message.trim().length < 10}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink text-white text-sm disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Sending…" : "Send message"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right column: Booking card */}
        <aside className="lg:col-span-5">
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 sticky top-6">
            {vm ? (
              <>
                {/* price headline */}
                <div className="text-xl font-semibold text-ink">
                  {fmtCurrency(vm.currencySymbol, vm.nightly)} <span className="text-sm text-slate font-normal">/ night</span>
                </div>

                {/* listing snippet */}
                <div className="mt-2 flex gap-3 items-start">
                  {vm.photos?.[0] && (
                    <img
                      src={vm.photos[0]}
                      alt=""
                      className="w-20 h-16 object-cover rounded-lg ring-1 ring-slate-200"
                    />
                  )}
                  <div className="text-sm">
                    <div className="font-medium text-ink">{vm.title}</div>
                    {vm.locationLine && (
                      <div className="text-slate inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {vm.locationLine}
                      </div>
                    )}
                  </div>
                </div>

                {/* inputs */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <label className="rounded-lg ring-1 ring-slate-200 p-2">
                    <div className="text-[11px] text-slate inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> Check-in
                    </div>
                    <input type="date" value={startDate} min={todayISO()} onChange={(e)=>onStartChange(e.target.value)} className="w-full outline-none" />
                  </label>
                  <label className="rounded-lg ring-1 ring-slate-200 p-2">
                    <div className="text-[11px] text-slate inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> Check-out
                    </div>
                    <input type="date" value={endDate} min={startDate || todayISO()} onChange={(e)=>setEndDate(e.target.value)} className="w-full outline-none" />
                  </label>
                  <label className="col-span-2 rounded-lg ring-1 ring-slate-200 p-2">
                    <div className="text-[11px] text-slate inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Guests
                    </div>
                    <select value={guests} onChange={(e)=>setGuests(e.target.value)} className="w-full outline-none">
                      {Array.from({ length: Math.max(1, vm.capacity || 6) }, (_, i) => i + 1)
                        .slice(0, 12)
                        .map(n => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
                    </select>
                  </label>
                </div>

                <button
                  onClick={goReserve}
                  disabled={!startDate || !endDate}
                  className="mt-4 w-full rounded-lg bg-ink text-white py-2 text-sm disabled:opacity-60"
                >
                  Reserve
                </button>
                <div className="mt-1 text-[11px] text-slate text-center">You won’t be charged yet</div>

                {/* price details */}
                <button
                  onClick={() => setShowPriceDetails(s => !s)}
                  className="mt-4 w-full inline-flex items-center justify-between text-sm"
                >
                  <span className="underline">Show price details</span>
                  {showPriceDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showPriceDetails && (
                  <div className="mt-2 text-sm">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate">{fmtCurrency(vm.currencySymbol, vm.nightly)} × {nights} night{nights>1?"s":""}</span>
                      <span className="font-medium">{fmtCurrency(vm.currencySymbol, baseSubtotal)}</span>
                    </div>
                    {!!vm.fees.service && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate">Service fee</span>
                        <span className="font-medium">{fmtCurrency(vm.currencySymbol, vm.fees.service)}</span>
                      </div>
                    )}
                    {!!vm.fees.cleaning && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate">Cleaning fee</span>
                        <span className="font-medium">{fmtCurrency(vm.currencySymbol, vm.fees.cleaning)}</span>
                      </div>
                    )}
                    <div className="border-t mt-2 pt-2 flex items-center justify-between">
                      <span className="text-ink font-semibold">Total</span>
                      <span className="text-ink font-semibold">{fmtCurrency(vm.currencySymbol, total)}</span>
                    </div>
                  </div>
                )}
              </>
            ) : loading ? (
              <div className="h-40 bg-slate-200/60 rounded animate-pulse" />
            ) : (
              <div className="text-sm text-slate">{error || "Listing unavailable."}</div>
            )}
          </div>

          <div className="mt-4 text-xs text-slate">
            {listingId && <Link to={`/spaces/${listingId}`} className="underline">Back to listing</Link>}
          </div>
        </aside>
      </div>
    </div>
  );
}
