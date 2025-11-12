// src/modules/Checkout/pages/CheckoutStart.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "@/services/api";
import { auth } from "@/services/firebaseClient";
import {
  Loader2,
  ShieldCheck,
  CreditCard,
  Calendar,
  Users,
  Home,
} from "lucide-react";

/* ---------- utils ---------- */
function readSavedIntent() {
  try {
    return JSON.parse(sessionStorage.getItem("checkout_intent") || "null");
  } catch {
    return null;
  }
}
function ensureIdemKey() {
  let k = sessionStorage.getItem("idem_booking_key");
  if (!k) {
    k =
      (crypto?.randomUUID?.() ||
        String(Date.now()) + "-" + Math.random().toString(36).slice(2));
    sessionStorage.setItem("idem_booking_key", k);
  }
  return k;
}
function hasBasicFields(i) {
  return !!(
    i?.listingId &&
    i?.startDate &&
    i?.endDate &&
    i?.checkInTime &&
    i?.checkOutTime
  );
}

/** Token helpers — mirror Message/Listing pages */
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
    if (fresh) {
      console.log("[CheckoutStart] Using Firebase ID token");
      return { Authorization: `Bearer ${fresh}` };
    }
  } catch (err) {
    console.log("[CheckoutStart] getIdToken error", err);
  }
  const stored = getStoredToken();
  if (stored) {
    console.log(
      "[CheckoutStart] Using stored token",
      stored.slice(0, 12) + "..."
    );
    return { Authorization: `Bearer ${stored}` };
  }
  console.log("[CheckoutStart] No auth header available");
  return {};
}

/** Unified login probe: storage → Firebase → cookie (/users/me) */
async function isLoggedIn() {
  const stored = getStoredToken();
  if (stored) {
    console.log("[CheckoutStart] isLoggedIn: true (token in storage)");
    return true;
  }
  if (auth?.currentUser) {
    console.log(
      "[CheckoutStart] isLoggedIn: true (Firebase currentUser)",
      auth.currentUser?.uid
    );
    return true;
  }
  try {
    console.log("[CheckoutStart] isLoggedIn: probing /users/me");
    const { data } = await api.get("/users/me");
    console.log("[CheckoutStart] /users/me response", data);
    return !!data?.user;
  } catch (err) {
    console.log(
      "[CheckoutStart] /users/me failed",
      err?.response?.status,
      err?.response?.data
    );
    return false;
  }
}

export default function CheckoutStart() {
  const location = useLocation();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [listing, setListing] = useState(null);
  const [listingError, setListingError] = useState("");

  // restore payload (router state takes priority; fallback to session)
  const payload = useMemo(() => {
    const s = location.state || {};
    const saved = readSavedIntent() || {};
    const merged = {
      listingId: s.listingId ?? saved.listingId,
      startDate: s.startDate ?? saved.startDate,
      endDate: s.endDate ?? saved.endDate,
      checkInTime: s.checkInTime ?? saved.checkInTime,
      checkOutTime: s.checkOutTime ?? saved.checkOutTime,
      totalHours: s.totalHours ?? saved.totalHours, // optional
      nights: s.nights ?? saved.nights ?? 1,
      guests: s.guests ?? saved.guests ?? 1,
      pricing: s.pricing ?? saved.pricing ?? null, // {mode, unitPrice, qty, base, fees:{}, total, currencySymbol, label}
    };
    console.log("[CheckoutStart] payload from state/session", merged);
    return merged;
  }, [location]);

  // Fetch listing + do a lightweight auth sanity check
  useEffect(() => {
    let alive = true;

    (async () => {
      console.log("[CheckoutStart] init effect start");

      if (!hasBasicFields(payload)) {
        console.log("[CheckoutStart] Missing basic fields", payload);
        setError(
          "Missing reservation details. Please go back and pick your date and time."
        );
        setCheckingAuth(false);
        return;
      }

      // keep intent handy in case we need to bounce the user
      sessionStorage.setItem("checkout_intent", JSON.stringify(payload));

      // Auth sanity check (but don't redirect on mount; we also re-check on confirm)
      const ok = await isLoggedIn();
      console.log("[CheckoutStart] initial isLoggedIn() result:", ok);
      if (!ok) {
        // We'll still show the page, but confirm will bounce them to login.
        setError("Please sign in to continue with checkout.");
      }

      // fetch listing for display
      try {
        const { data } = await api.get(`/listings/${payload.listingId}`);
        if (!alive) return;
        setListing(data?.listing || null);
      } catch (err) {
        console.log("[CheckoutStart] Failed to load listing", err);
        if (!alive) return;
        setListingError("Could not load listing details.");
      } finally {
        if (alive) setCheckingAuth(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [payload]);

  // View model for pretty listing info
  const vm = useMemo(() => {
    if (!listing) return null;
    const title =
      listing.venue ||
      listing.title ||
      [listing.category, listing.scope].filter(Boolean).join(" • ") ||
      "Your selected space";

    const locationLine = [
      listing.address,
      listing.address2,
      listing.district,
      listing.city,
      listing.region,
      listing.country,
    ]
      .filter(Boolean)
      .join(", ");

    const currency = (listing.currency || "PHP").toUpperCase();
    const currencySymbol =
      currency === "PHP" ? "₱" : currency === "USD" ? "$" : currency + " ";

    return {
      title,
      locationLine,
      photo: Array.isArray(listing.photos) ? listing.photos[0] : null,
      currencySymbol,
      capacity: listing.capacity || listing.seats || 1,
      category: listing.category,
      scope: listing.scope,
    };
  }, [listing]);

  async function handleConfirm() {
    if (!hasBasicFields(payload)) {
      setError(
        "Missing reservation details. Please go back and pick your date and time."
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      // Make sure user is logged in before calling /bookings/intent
      const ok = await isLoggedIn();
      console.log("[CheckoutStart] confirm isLoggedIn() result:", ok);
      if (!ok) {
        sessionStorage.setItem("checkout_intent", JSON.stringify(payload));
        navigate("/login?next=" + encodeURIComponent("/checkout"), {
          replace: true,
        });
        return;
      }

      const baseUrl = window.location.origin;
      const body = {
        listingId: payload.listingId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        checkInTime: payload.checkInTime,
        checkOutTime: payload.checkOutTime,
        guests: Number(payload.guests) || 1,
        totalHours: payload.totalHours,
        nights: payload.nights,
        pricing: payload.pricing || undefined, // server is source of truth; send if present
        returnUrl: `${baseUrl}/app/bookings/thank-you`,
        cancelUrl: `${baseUrl}/checkout`, // where to go if user cancels payment
      };

      const authHeader = await getFreshAuthHeader();
      const headers = {
        "X-Idempotency-Key": ensureIdemKey(),
        ...authHeader,
      };

      console.log("[CheckoutStart] POST /bookings/intent", { body, headers });

      const { data } = await api.post("/bookings/intent", body, { headers });

      console.log("[CheckoutStart] /bookings/intent response", data);

      const bookingId = data?.bookingId || data?.booking?.id;
      const checkoutUrl = data?.checkout?.url || data?.checkoutUrl;
      const status = (data?.booking?.status || data?.status || "").toLowerCase();

      // 1) Hosted checkout → redirect
      if (checkoutUrl) {
        if (bookingId) sessionStorage.setItem("current_booking_id", bookingId);
        console.log(
          "[CheckoutStart] Redirecting to hosted checkout",
          checkoutUrl
        );
        window.location.assign(checkoutUrl);
        return;
      }

      // 2) No external checkout; booking created or pending (e.g., Pay at venue / zero amount / wallet)
      if (bookingId) {
        console.log("[CheckoutStart] Booking created with status", status);
        if (
          status === "confirmed" ||
          status === "paid" ||
          status === "succeeded"
        ) {
          navigate("/app/bookings/thank-you", {
            replace: true,
            state: { bookingId },
          });
        } else {
          navigate(`/app/bookings/${bookingId}`, { replace: true });
        }
        return;
      }

      console.log("[CheckoutStart] No bookingId or checkoutUrl in response");
      setError("We couldn't start the checkout. Please try again.");
    } catch (e) {
      console.error("CheckoutStart error:", e);
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 401
          ? "Please sign in to continue."
          : status === 409
          ? "Those dates were just taken. Pick new dates."
          : status === 422
          ? "Invalid reservation details."
          : "Checkout failed.");
      setError(msg);

      if (status === 401) {
        console.log(
          "[CheckoutStart] /bookings/intent returned 401 → redirecting to /login"
        );
        sessionStorage.setItem("checkout_intent", JSON.stringify(payload));
        navigate("/login?next=" + encodeURIComponent("/checkout"), {
          replace: true,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const showSkeleton = checkingAuth && !listing && !error;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-2xl ring-1 ring-slate-200 bg-white p-6 sm:p-7">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-ink" />
          <h1 className="text-xl font-semibold text-ink">
            Review your booking
          </h1>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-slate">
          Check the details below, then continue to the secure payment page.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {/* Listing summary block */}
          <div className="sm:col-span-2 rounded-lg ring-1 ring-slate-200 bg-slate-50 p-4 flex gap-3">
            {showSkeleton ? (
              <div className="w-full h-16 bg-slate-200/60 rounded animate-pulse" />
            ) : vm ? (
              <>
                {vm.photo && (
                  <img
                    src={vm.photo}
                    alt=""
                    className="w-20 h-16 object-cover rounded-lg ring-1 ring-slate-200 flex-shrink-0"
                  />
                )}
                <div className="text-sm">
                  <div className="font-semibold text-ink">{vm.title}</div>
                  {vm.locationLine && (
                    <div className="text-slate/80">{vm.locationLine}</div>
                  )}
                  <div className="text-xs text-slate mt-1">
                    {[vm.category, vm.scope]
                      .filter(Boolean)
                      .map((x) => String(x).toUpperCase())
                      .join(" • ")}
                    {vm.capacity
                      ? ` • Capacity: ${vm.capacity} ${
                          vm.capacity === 1 ? "person" : "people"
                        }`
                      : ""}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate">
                {listingError || "Listing details unavailable."}
              </div>
            )}
          </div>

          <InfoRow
            icon={<Users className="w-4 h-4" />}
            label="Guests"
            value={payload.guests}
          />
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Check-in"
            value={`${payload.startDate || "—"} ${
              payload.checkInTime || ""
            }`.trim()}
          />
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Check-out"
            value={`${payload.endDate || "—"} ${
              payload.checkOutTime || ""
            }`.trim()}
          />
          <InfoRow
            icon={<Home className="w-4 h-4" />}
            label="Pricing mode"
            value={
              payload.pricing?.mode
                ? String(payload.pricing.mode).toUpperCase()
                : "—"
            }
          />
          <InfoRow
            icon={<CreditCard className="w-4 h-4" />}
            label="Estimated total"
            value={
              payload.pricing
                ? `${payload.pricing.currencySymbol || ""}${Number(
                    payload.pricing.total || 0
                  ).toLocaleString()}`
                : "—"
            }
          />
        </div>

        {!!error && (
          <div className="mt-4 rounded-lg bg-rose-50 ring-1 ring-rose-200 text-rose-800 p-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={busy || !hasBasicFields(payload)}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-white py-2.5 text-sm disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Confirm &amp; continue to payment
            </>
          )}
        </button>

        <p className="mt-2 text-[11px] text-slate text-center">
          You&apos;ll be redirected to a secure payment page. You won&apos;t be
          charged until you confirm there.
        </p>

        <div className="mt-5 flex items-center justify-between text-xs text-slate">
          <div className="inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Payments are processed securely.
          </div>
          <Link to="/search" className="underline">
            Back to search
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="rounded-lg ring-1 ring-slate-200 bg-slate-50 p-3">
      <div className="text-[11px] text-slate inline-flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-ink break-words">{String(value ?? "—")}</div>
    </div>
  );
}
