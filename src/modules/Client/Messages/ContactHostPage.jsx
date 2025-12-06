// src/modules/Messages/pages/ContactHostPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/services/api";
import {
  ArrowLeft, MapPin, Send, Users, CalendarDays, ChevronDown, ChevronUp,
} from "lucide-react";
import { auth } from "@/services/firebaseClient";

function cap(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "";
}
function firstNameOnly(s) {
  if (!s) return "Host";
  const clean = String(s).trim().replace(/\s+/g, " ");
  return cap(clean.split(/[ \-]/)[0]);
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
function getStoredToken() {
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
async function getFreshAuthHeader() {
  try {
    const fresh = await auth?.currentUser?.getIdToken(true);
    if (fresh) return { Authorization: `Bearer ${fresh}` };
  } catch {}
  const stored = getStoredToken();
  return stored ? { Authorization: `Bearer ${stored}` } : {};
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
    return Math.ceil(hours * 4) / 4;
  } catch {
    return 0;
  }
}

export default function ContactHostPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const listingId = params.get("listing") || location.state?.listingId || "";
  const to = params.get("to") || location.state?.to || "";

  const qsStart = params.get("start") || "";
  const qsEnd = params.get("end") || "";
  const qsGuests = Number(params.get("guests") || 1);
  const qsIn = params.get("in") || "";
  const qsOut = params.get("out") || "";

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(!!listingId);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [startDate, setStartDate] = useState(qsStart || todayISO());
  const [endDate, setEndDate] = useState(qsEnd || todayISO());
  const [checkInTime, setCheckInTime] = useState(qsIn || "09:00");
  const [checkOutTime, setCheckOutTime] = useState(qsOut || "18:00");
  const [guests, setGuests] = useState(Math.max(1, qsGuests));
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("message_intent");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (!listingId || saved?.listingId === listingId) {
        if (saved?.body) setMessage(saved.body);
        if (saved?.checkIn) setStartDate(saved.checkIn);
        if (saved?.checkOut) setEndDate(saved.checkOut);
        if (saved?.checkInTime) setCheckInTime(saved.checkInTime);
        if (saved?.checkOutTime) setCheckOutTime(saved.checkOutTime);
        if (saved?.guests) setGuests(Number(saved.guests) || 1);
      }
    } catch {}
  }, [listingId]);

  useEffect(() => {
    let alive = true;
    if (!listingId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/listings/${listingId}`);
        if (!alive) return;
        const item = data?.listing;
        setListing(item || null);

        const hostFirst =
          firstNameOnly(
            (item?.owner &&
              typeof item.owner === "object" &&
              (item.owner.name ||
                item.owner.fullName ||
                item.owner.firstName ||
                item.owner.displayName)) ||
              item?.hostName
          );
        if (!message) {
          setMessage(`Hi ${hostFirst}, I’m interested in your space. Is it available for my preferred dates?`);
        }
        if (!qsEnd && qsStart) {
          const d = new Date(qsStart + "T00:00:00");
          d.setDate(d.getDate() + 1);
          setEndDate(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
          );
        }
      } catch {
        if (alive) setError("We couldn’t load the listing details.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [listingId, message, qsEnd, qsStart]);

  const vm = useMemo(() => {
    if (!listing) return null;
    const title =
      listing.venue || [cap(listing.category), cap(listing.scope)].filter(Boolean).join(" • ") || "Space";
    const locationLine = [listing.address, listing.address2, listing.city, listing.region, listing.country]
      .filter(Boolean)
      .join(", ");
    const currency = String(listing.currency || "PHP").toUpperCase();
    const currencySymbol = currency === "PHP" ? "₱" : currency === "USD" ? "$" : `${currency} `;
    const nightly =
      Number(
        listing.priceSeatDay ??
          listing.priceRoomDay ??
          listing.priceWholeDay ??
          listing.priceSeatHour ??
          listing.priceRoomHour ??
          listing.priceWholeMonth ??
          0
      ) || 0;

    const hostFirst =
      firstNameOnly(
        (listing?.owner &&
          typeof listing.owner === "object" &&
          (listing.owner.name ||
            listing.owner.fullName ||
            listing.owner.firstName ||
            listing.owner.displayName)) ||
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
      },
      minHours: listing.minHours ? Number(listing.minHours) : 0,
    };
  }, [listing]);

  const nights = diffDaysISO(startDate, endDate);
  const baseSubtotal = (vm?.nightly || 0) * nights;
  const total = baseSubtotal + (vm?.fees.service || 0) + (vm?.fees.cleaning || 0);

  function onStartChange(v) {
    setStartDate(v);
    if (endDate && v && endDate < v) setEndDate(v);
  }

  function validateDateTime(options = {}) {
    const { checkMinHours = false } = options;

    if (!startDate || !endDate || !checkInTime || !checkOutTime) {
      return { ok: false, reason: "missing" };
    }
    if (endDate < startDate) {
      setEndDate(startDate);
      return { ok: false, reason: "order" };
    }
    if (startDate === endDate) {
      const a = toMinutes(checkInTime);
      const b = toMinutes(checkOutTime);
      if (a == null || b == null) return { ok: false, reason: "invalid-time" };
      if (b <= a) return { ok: false, reason: "order" };

      if (checkMinHours && vm?.minHours) {
        const hours = diffHours(startDate, checkInTime, endDate, checkOutTime);
        if (hours > 0 && hours < vm.minHours) {
          return { ok: false, reason: "min-hours" };
        }
      }
    }
    return { ok: true };
  }

  function buildDefaultBody() {
    const host = vm?.hostFirst || "Host";
    const tIn = checkInTime ? ` at ${checkInTime}` : "";
    const tOut = checkOutTime ? ` at ${checkOutTime}` : "";
    const dates =
      startDate && endDate
        ? startDate === endDate
          ? `${startDate}${tIn}–${tOut}`
          : `${startDate}${tIn} to ${endDate}${tOut}`
        : "my preferred dates";
    const pax = `${guests} ${guests > 1 ? "guests" : "guest"}`;
    return `Hi ${host}, is your space available for ${dates} for ${pax}? Thank you!`;
  }

  function buildInquiryPayload(body) {
    const payload = {
      listingId,
      message: body,
      meta: {
        startDate,
        endDate,
        checkInTime,
        checkOutTime,
        guests: Number(guests) || 1,
        nights,
        totalHours: diffHours(startDate, checkInTime, endDate, checkOutTime),
      },
    };
    if (to) payload.to = to;
    return payload;
  }

  async function sendMessage(e) {
    e?.preventDefault?.();
    if (!listingId) return;

    const nextUrl =
      `/messages/new?listing=${encodeURIComponent(listingId)}` +
      `&start=${startDate}&end=${endDate}&guests=${guests}` +
      `&in=${encodeURIComponent(checkInTime || "")}&out=${encodeURIComponent(checkOutTime || "")}` +
      `${to ? `&to=${encodeURIComponent(to)}` : ""}`;

    const bodyText = (message || "").trim() || buildDefaultBody();

    const hasAnyToken = getStoredToken() || auth?.currentUser || null;

    if (!hasAnyToken) {
      sessionStorage.setItem(
        "message_intent",
        JSON.stringify({
          listingId,
          to,
          body: bodyText,
          checkIn: startDate,
          checkOut: endDate,
          checkInTime,
          checkOutTime,
          guests,
        })
      );
      navigate(`/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }

    const validation = validateDateTime({ checkMinHours: false });
    if (!validation.ok) {
      let msg = "Please select valid dates and times (Time out must be after Time in).";
      if (validation.reason === "missing") {
        msg = "Please select both check-in and check-out date and time.";
      } else if (validation.reason === "invalid-time" || validation.reason === "order") {
        msg = "Please make sure Time out is after Time in on the same day.";
      }
      alert(msg);
      return;
    }

    try {
      setSending(true);
      const payload = buildInquiryPayload(bodyText);
      const headers = await getFreshAuthHeader();

      console.log("[ContactHostPage] sendMessage clicked", {
        listingId,
        to,
        message: bodyText,
        meta: payload.meta,
        hasAuthHeader: Boolean(headers.Authorization),
      });

      await api.post("/inquiries", payload, { headers });

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

    const validation = validateDateTime({ checkMinHours: true });
    if (!validation.ok) {
      let msg = "Please select valid dates and times (Time out must be after Time in).";
      if (validation.reason === "missing") {
        msg = "Please select both check-in and check-out date and time.";
      } else if (validation.reason === "invalid-time" || validation.reason === "order") {
        msg = "Please make sure Time out is after Time in on the same day.";
      } else if (validation.reason === "min-hours" && vm?.minHours) {
        msg = `Minimum stay is ${vm.minHours} hour(s) for this space.`;
      }
      alert(msg);
      return;
    }

    const intent = {
      listingId,
      startDate,
      endDate,
      checkInTime,
      checkOutTime,
      nights,
      totalHours: diffHours(startDate, checkInTime, endDate, checkOutTime),
      guests: Number(guests) || 1,
    };
    const hasAnyToken = getStoredToken() || auth?.currentUser || null;
    if (!hasAnyToken) {
      sessionStorage.setItem("checkout_intent", JSON.stringify(intent));
      navigate("/login?next=" + encodeURIComponent("/checkout"));
      return;
    }
    sessionStorage.setItem("checkout_intent", JSON.stringify(intent));
    navigate("/checkout", { state: intent });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-ink hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

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
            <form onSubmit={sendMessage} className="mt-3">
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi ${vm?.hostFirst || "Host"}, I’ll be visiting...`}
                className="w-full rounded-2xl ring-1 ring-slate-200 bg-white p-4 text-sm outline-none focus:ring-ink/30"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink text-white text-sm disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Sending…" : "Send message"}
                </button>
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg ring-1 ring-slate-200 bg-white text-sm disabled:opacity-60"
                  title="Sends a quick availability message with your selected dates, times, and guests"
                >
                  Ask availability with details
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 sticky top-6">
            {vm ? (
              <>
                <div className="text-xl font-semibold text-ink">
                  {fmtCurrency(vm.currencySymbol, vm.nightly)}{" "}
                  <span className="text-sm text-slate font-normal">/ night</span>
                </div>

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

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <label className="rounded-lg ring-1 ring-slate-200 p-2">
                    <div className="text-[11px] text-slate inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> Check-in
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      min={todayISO()}
                      onChange={(e) => onStartChange(e.target.value)}
                      className="w-full outline-none"
                    />
                  </label>
                  <label className="rounded-lg ring-1 ring-slate-200 p-2">
                    <div className="text-[11px] text-slate inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> Check-out
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || todayISO()}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full outline-none"
                    />
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
                    <div className="text-[11px] text-slate inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Guests
                    </div>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full outline-none"
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
                  onClick={goReserve}
                  disabled={!startDate || !endDate || !checkInTime || !checkOutTime}
                  className="mt-4 w-full rounded-lg bg-ink text-white py-2 text-sm disabled:opacity-60"
                >
                  Reserve
                </button>
                <div className="mt-1 text-[11px] text-slate text-center">
                  {vm.minHours ? `Minimum ${vm.minHours} hour(s).` : "You won’t be charged yet"}
                </div>

                <button
                  onClick={() => setShowPriceDetails((s) => !s)}
                  className="mt-4 w-full inline-flex items-center justify-between text-sm"
                >
                  <span className="underline">Show price details</span>
                  {showPriceDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showPriceDetails && (
                  <div className="mt-2 text-sm">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate">
                        {fmtCurrency(vm.currencySymbol, vm.nightly)} × {nights} night
                        {nights > 1 ? "s" : ""}
                      </span>
                      <span className="font-medium">
                        {fmtCurrency(vm.currencySymbol, baseSubtotal)}
                      </span>
                    </div>
                    {!!vm.fees.service && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate">Service fee</span>
                        <span className="font-medium">
                          {fmtCurrency(vm.currencySymbol, vm.fees.service)}
                        </span>
                      </div>
                    )}
                    {!!vm.fees.cleaning && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate">Cleaning fee</span>
                        <span className="font-medium">
                          {fmtCurrency(vm.currencySymbol, vm.fees.cleaning)}
                        </span>
                      </div>
                    )}
                    <div className="border-t mt-2 pt-2 flex items-center justify-between">
                      <span className="text-ink font-semibold">Total</span>
                      <span className="text-ink font-semibold">
                        {fmtCurrency(vm.currencySymbol, total)}
                      </span>
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
            {listingId && (
              <Link to={`/spaces/${listingId}`} className="underline">
                Back to listing
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
