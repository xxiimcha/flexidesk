// src/modules/Auth/pages/UserLogin.jsx
import { useState, useMemo } from "react";
import { Briefcase, Mail, Lock } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../../services/userAuth";

const GOOGLE_ENABLED = (import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN ?? "false") !== "false";

// Friendlier messages for Axios/Mongo backend
function friendlyAuthError(ex) {
  const msg = (ex?.response?.data?.message || ex?.message || "").toLowerCase();
  if (msg.includes("invalid email")) return "Please enter a valid email address.";
  if (msg.includes("invalid credentials")) return "Invalid email or password.";
  if (msg.includes("too many")) return "Too many attempts. Try again later.";
  if (msg.includes("network")) return "Network error. Please check your connection.";
  return ex?.response?.data?.message || ex?.message || "Something went wrong.";
}

export default function UserLogin() {
  const nav = useNavigate();
  const location = useLocation();

  // read ?next=/checkout (or anything) from the URL
  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    const n = params.get("next");
    // protect against navigating to a full external URL
    if (n && n.startsWith("/")) return n;
    return null;
  }, [location.search]);

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const redirectPostAuth = (user) => {
    // 1) highest priority: ?next= from URL (e.g., /checkout)
    if (nextPath) {
      nav(nextPath, { replace: true });
      return;
    }

    // 2) else, if a route protector passed state.from
    const fromState = location.state?.from?.pathname;
    if (fromState) {
      nav(fromState, { replace: true });
      return;
    }

    // 3) fallback based on role
    const fallback = user?.role === "owner" ? "/owner" : "/app";
    nav(fallback, { replace: true });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);
    try {
      const user = await loginUser({
        email: form.email.trim(),
        password: form.password,
        remember: form.remember,
      });
      redirectPostAuth(user);
    } catch (ex) {
      setErr(friendlyAuthError(ex));
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setErr(""); setMsg("");
    const email = form.email.trim();
    if (!email) return setErr("Enter your email above, then click Forgot password.");
    setMsg("Password reset isn’t enabled yet.");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-ink text-white">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-brand" />
          <span className="text-xl font-semibold">FLEXIDESK</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-3 text-white/80">
            Sign in to book spaces (Clients) or manage your listings and earnings (Owners).
          </p>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} FlexiDesk</p>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <Briefcase className="h-6 w-6 text-brand" />
            <span className="text-xl font-semibold text-ink">FLEXIDESK</span>
          </div>

          <h2 className="text-2xl font-bold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-slate">
            New here?{" "}
            <Link to="/register" className="text-ink hover:text-brand underline">
              Create an account
            </Link>
          </p>

          {err && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}
          {msg && (
            <div className="mt-4 rounded-md bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
              {msg}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" autoComplete="off" noValidate>
            <label className="block">
              <span className="text-sm font-medium text-ink">Email</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand">
                <Mail className="mx-2 h-4 w-4 text-slate" />
                <input
                  className="w-full p-2 outline-none rounded-md"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  placeholder="you@example.com"
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Password</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand">
                <Lock className="mx-2 h-4 w-4 text-slate" />
                <input
                  className="w-full p-2 outline-none rounded-md"
                  type={show ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="px-3 text-xs text-slate hover:text-ink"
                  onClick={() => setShow((s) => !s)}
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
              <button type="button" onClick={onForgot} className="text-sm text-ink hover:text-brand">
                Forgot password?
              </button>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-md bg-brand text-ink px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {GOOGLE_ENABLED && (
              <>
                <div className="flex items-center gap-3 my-2">
                  <span className="h-px flex-1 bg-charcoal/20" />
                  <span className="text-xs text-slate">or</span>
                  <span className="h-px flex-1 bg-charcoal/20" />
                </div>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-md border border-charcoal/20 px-4 py-2 font-medium opacity-50 cursor-not-allowed"
                  title="Google sign-in is disabled"
                >
                  Continue with Google
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
