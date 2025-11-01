import { useState } from "react";
import { Briefcase, Mail, Lock } from "lucide-react";
import { loginAdmin } from "../../../services/adminAuth"; // calls /api/admin/login
import { Link, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      // hits backend -> verifies Firebase email/password -> checks role=admin -> returns JWT
      await loginAdmin(form);
      nav("/admin/dashboard", { replace: true });
    } catch (ex) {
      setErr(ex.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white grid lg:grid-cols-2">
      {/* Left: brand / pitch */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-ink text-white">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-brand" />
          <span className="text-xl font-semibold">FLEXIDESK — Admin</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold">Welcome back, Admin</h1>
          <p className="mt-3 text-white/80">
            Sign in to manage listings, monitor bookings and payouts, review disputes,
            and keep the marketplace secure.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-white/80 list-disc list-inside">
            <li>RBAC-secured controls</li>
            <li>Real-time occupancy & income</li>
            <li>Dispute & refund workflows</li>
          </ul>
        </div>

        <p className="text-xs text-white/60">© {new Date().getFullYear()} FlexiDesk</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 lg:hidden mb-8">
            <Briefcase className="h-6 w-6 text-brand" />
            <span className="text-xl font-semibold text-ink">FLEXIDESK — Admin</span>
          </div>

          <h2 className="text-2xl font-bold text-ink">Admin Sign in</h2>
          <p className="mt-1 text-sm text-slate">Use your administrator credentials.</p>

          {err && (
            <div
              role="alert"
              className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm"
            >
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Email</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand bg-white">
                <Mail className="mx-2 h-4 w-4 text-slate" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  autoComplete="username"
                  className="w-full p-2 outline-none rounded-md"
                  placeholder="you@company.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Password</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand bg-white">
                <Lock className="mx-2 h-4 w-4 text-slate" />
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  autoComplete="current-password"
                  className="w-full p-2 outline-none rounded-md"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="px-3 text-xs text-slate hover:text-ink"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={onChange}
                  className="h-4 w-4 accent-brand"
                />
                Remember me
              </label>
              <a href="#" className="text-sm text-ink hover:text-brand">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-brand text-ink px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/" className="text-slate hover:text-ink">← Back to website</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
