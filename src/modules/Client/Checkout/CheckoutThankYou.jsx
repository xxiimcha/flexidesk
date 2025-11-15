import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function CheckoutThankYou() {
  const q = new URLSearchParams(useLocation().search);
  const status = q.get("status"); 

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl ring-1 ring-slate-200 bg-white p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
        <h1 className="mt-2 text-xl font-semibold text-ink">Thank you!</h1>
        <p className="mt-1 text-slate text-sm">
          Your payment {status ? `(${status}) ` : ""}was received. We’ve sent a confirmation to your email.
        </p>
        <p className="mt-1 text-slate text-sm">
          Your access QR code will be provided a day before your check-in date.
        </p>
        <div className="mt-4">
          <Link
            to="/app/bookings"
            className="inline-flex px-3 py-1.5 rounded-lg bg-ink text-white text-sm"
          >
            View my bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
