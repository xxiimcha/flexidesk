import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "@/services/api";
import { Loader2, ShieldCheck, CreditCard, Calendar, Users, Home } from "lucide-react";

export default function CheckoutStart() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  // restore intent from sessionStorage if needed
  const saved = typeof window !== "undefined" ? sessionStorage.getItem("checkout_intent") : null;
  const savedIntent = saved ? JSON.parse(saved) : null;

  const payload = useMemo(() => {
    const s = location.state || {};
    return {
      listingId: s.listingId || savedIntent?.listingId,
      startDate: s.startDate || savedIntent?.startDate,
      endDate: s.endDate || savedIntent?.endDate,
      nights: s.nights || savedIntent?.nights || 1,
      guests: s.guests || savedIntent?.guests || 1,
    };
  }, [location, savedIntent]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!payload.listingId || !payload.startDate || !payload.endDate) {
          setError("Missing reservation details. Please go back and pick your dates.");
          setBusy(false);
          return;
        }

        setBusy(true);
        const { data } = await api.post("/bookings/intent", {
          ...payload,
          returnUrl: window.location.origin + "/app/bookings/thank-you",
        });

        const checkoutUrl = data?.checkout?.url || data?.checkoutUrl;
        const bookingId = data?.bookingId;
        if (checkoutUrl) {
          // keep id around if you want
          if (bookingId) sessionStorage.setItem("current_booking_id", bookingId);
          window.location.assign(checkoutUrl);
          return;
        }
        if (bookingId) {
          navigate(`/app/bookings/${bookingId}`, { replace: true });
          return;
        }
        setError("We couldn't start the checkout. Please try again.");
      } catch (e) {
        console.error("CheckoutStart error:", e);
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message ||
          (status === 401 ? "Please sign in to continue." :
           status === 409 ? "Those dates were just taken. Pick new dates." :
           status === 422 ? "Invalid reservation details." :
           "Checkout failed.");
        setError(msg);
        if (status === 401) {
          // keep intent and force login
          if (payload) sessionStorage.setItem("checkout_intent", JSON.stringify(payload));
          navigate("/login?next=" + encodeURIComponent("/checkout"));
        }
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => (alive = false);
  }, [payload, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl ring-1 ring-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-ink" />
          <h1 className="text-xl font-semibold text-ink">Preparing your checkout</h1>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <InfoRow icon={<Home className="w-4 h-4" />} label="Listing" value={payload.listingId || "—"} />
          <InfoRow icon={<Users className="w-4 h-4" />} label="Guests" value={payload.guests} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Check-in" value={payload.startDate || "—"} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Check-out" value={payload.endDate || "—"} />
        </div>

        {busy && !error && (
          <div className="mt-6 flex items-center gap-3 text-sm text-slate">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting you to our secure payment page…
          </div>
        )}

        {!!error && (
          <div className="mt-6 rounded-lg bg-rose-50 ring-1 ring-rose-200 text-rose-800 p-3 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-slate">
          <div className="inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Payments are processed securely.
          </div>
          <Link to="/search" className="underline">Back to search</Link>
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
      <div className="text-ink">{String(value ?? "—")}</div>
    </div>
  );
}
