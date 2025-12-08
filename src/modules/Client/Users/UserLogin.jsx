// src/modules/Auth/pages/UserLogin.jsx
import { useState, useMemo } from "react";
import { Briefcase, Mail, Lock } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../../services/userAuth";

const GOOGLE_ENABLED =
  (import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN ?? "false") !== "false";

function friendlyAuthError(ex) {
  const raw = ex?.response?.data?.message || ex?.message || "";
  const msg = raw.toLowerCase();

  if (msg.includes("invalid email")) return "Please enter a valid email address.";
  if (msg.includes("invalid credentials")) return "Invalid email or password.";
  if (msg.includes("too many")) return "Too many attempts. Try again later.";
  if (msg.includes("network")) return "Network error. Please check your connection.";
  return raw || "Something went wrong.";
}

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

export default function UserLogin() {
  const nav = useNavigate();
  const location = useLocation();

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    const n = params.get("next");
    if (n && n.startsWith("/")) return n;
    return null;
  }, [location.search]);

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [emailErr, setEmailErr] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "email") {
      const trimmed = value.trim();
      if (trimmed && !isValidEmailFormat(trimmed)) {
        setEmailErr("Enter a valid email address.");
      } else {
        setEmailErr("");
      }
    }

    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const redirectPostAuth = (user) => {
    if (nextPath) {
      nav(nextPath, { replace: true });
      return;
    }

    const fromState = location.state?.from?.pathname;
    if (fromState) {
      nav(fromState, { replace: true });
      return;
    }

    const fallback = user?.role === "owner" ? "/owner" : "/app";
    nav(fallback, { replace: true });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail || !isValidEmailFormat(trimmedEmail)) {
      setEmailErr("Enter a valid email address.");
      setErr("Enter a valid email address.");
      return;
    }

    setEmailErr("");
    setLoading(true);
    try {
      const user = await loginUser({
        email: trimmedEmail,
        password: form.password,
        remember: form.remember,
      });
      redirectPostAuth(user);
    } catch (ex) {
      const needsVerification = ex?.response?.data?.needsVerification;
      const emailFromServer = ex?.response?.data?.email || trimmedEmail;

      if (needsVerification && emailFromServer) {
        nav(
          `/otp?email=${encodeURIComponent(emailFromServer)}`,
          {
            replace: true,
            state: { email: emailFromServer, from: "/login" },
          }
        );
        return;
      }

      setErr(friendlyAuthError(ex));
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    setErr("");
    setMsg("");
    const email = form.email.trim();
    if (!email || !isValidEmailFormat(email)) {
      setEmailErr("Enter a valid email address.");
      setErr("Enter a valid email address.");
      return;
    }
    setEmailErr("");
    setMsg("Password reset isn’t enabled yet.");
  };

  const showLockHint = err.toLowerCase().includes("too many attempts");

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex w-[45%] flex-col justify-between bg-ink px-10 py-10 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Briefcase className="h-5 w-5 text-brand" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm uppercase tracking-[0.16em] text-white/60">
              FlexiDesk
            </span>
            <span className="text-xl font-semibold">Workspace Platform</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            Book smarter. Work better.
          </h1>
          <p className="mt-4 text-sm text-white/80">
            Sign in to discover flexible desks, meeting rooms, and private offices
            across the city. Manage bookings, earnings, and access in one place.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm">
              <p className="font-medium">For clients</p>
              <p className="mt-1 text-white/70">
                Search workspaces, track your bookings, and access spaces using QR codes.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm">
              <p className="font-medium">For owners</p>
              <p className="mt-1 text-white/70">
                Publish listings, view occupancy and earnings, and manage on-site check-ins.
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} FlexiDesk. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5">
                <Briefcase className="h-5 w-5 text-brand" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.16em] text-slate">
                  FlexiDesk
                </span>
                <span className="text-base font-semibold text-ink">
                  Workspace Platform
                </span>
              </div>
            </div>
            <Link
              to="/register"
              className="text-sm font-medium text-ink hover:text-brand underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </div>

          <div className="rounded-2xl bg-white px-6 py-7 shadow-lg shadow-slate-200/70 border border-slate-100">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-ink">Sign in</h2>
              <p className="mt-1 text-sm text-slate">
                Access your bookings, listings, and workspace tools in one place.
              </p>
            </div>

            {err && (
              <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <p>{err}</p>
                {showLockHint && (
                  <p className="mt-1 text-xs text-red-600/80">
                    For your security, this account is temporarily locked. Please try again
                    later, or contact support if you think this is a mistake.
                  </p>
                )}
              </div>
            )}
            {msg && (
              <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                {msg}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="space-y-4"
              autoComplete="off"
              noValidate
            >
              <label className="block">
                <span className="text-sm font-medium text-ink">Email</span>
                <div className="mt-1 flex items-center rounded-lg border border-charcoal/15 bg-slate-50/60 px-2.5 py-1.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/70">
                  <Mail className="mr-2 h-4 w-4 flex-shrink-0 text-slate" />
                  <input
                    className="w-full bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-slate/50"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    required
                    placeholder="you@example.com"
                    autoComplete="username"
                  />
                </div>
                {emailErr && (
                  <p className="mt-1 text-xs text-red-600">{emailErr}</p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-ink">Password</span>
                <div className="mt-1 flex items-center rounded-lg border border-charcoal/15 bg-slate-50/60 px-2.5 py-1.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/70">
                  <Lock className="mr-2 h-4 w-4 flex-shrink-0 text-slate" />
                  <input
                    className="w-full bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-slate/50"
                    type={show ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="ml-2 text-xs font-medium text-slate hover:text-ink"
                    onClick={() => setShow((s) => !s)}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-slate">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={form.remember}
                    onChange={onChange}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <span>Remember me on this device</span>
                </label>
                <button
                  type="button"
                  onClick={onForgot}
                  className="text-sm font-medium text-ink hover:text-brand"
                >
                  Forgot password?
                </button>
              </div>

              <button
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              {GOOGLE_ENABLED && (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs text-slate">or sign in with</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 opacity-60 cursor-not-allowed"
                    title="Google sign-in is disabled"
                  >
                    Continue with Google
                  </button>
                </>
              )}

              <p className="pt-3 text-center text-xs text-slate">
                New to FlexiDesk?{" "}
                <Link
                  to="/register"
                  className="font-medium text-ink hover:text-brand underline-offset-4 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
