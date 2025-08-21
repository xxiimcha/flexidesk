import { useState } from "react";
import { Briefcase, Mail, Lock } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser, signInWithGoogle } from "../../../services/userAuth";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../services/firebaseClient";

// optional toggle
const GOOGLE_ENABLED = (import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN ?? "true") !== "false";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.293 31.91 29.036 35 24 35c-6.627 0-12-5.373-12-12S17.373 11 24 11c3.059 0 5.842 1.153 7.971 3.029l5.657-5.657C34.917 6.832 29.74 5 24 5 16.316 5 9.676 9.337 6.306 15.691z"/>
    <path fill="#FF3D00" d="M6.306 15.691l6.571 4.816C14.3 17.27 18.7 13 24 13c3.059 0 5.842 1.153 7.971 3.029l5.657-5.657C34.917 6.832 29.74 5 24 5 16.316 5 9.676 9.337 6.306 15.691z"/>
    <path fill="#4CAF50" d="M24 45c5.176 0 9.942-1.979 13.53-5.2l-6.238-5.112C29.59 36.938 26.97 38 24 38c-5.008 0-9.259-3.413-10.767-8.008l-6.627 5.11C9.949 41.736 16.419 45 24 45z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a10.999 10.999 0 01-3.77 5.688l6.238 5.112C40.942 35.979 44 31.019 44 25c0-1.606-.165-3.162-.389-4.917z"/>
  </svg>
);

// friendlier error text
function friendlyAuthError(ex) {
  const code = ex?.code || "";
  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/user-not-found" || code === "auth/wrong-password")
    return "Invalid email or password.";
  if (code === "auth/too-many-requests")
    return "Too many attempts. Try again later.";
  if (code === "auth/network-request-failed")
    return "Network error. Please check your connection.";
  if (code === "auth/popup-closed-by-user")
    return "Google sign-in was closed before completing.";
  return ex?.message || "Something went wrong.";
}

export default function UserLogin() {
  const nav = useNavigate();
  const { state } = useLocation();

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const redirectPostAuth = (user) => {
    const fallback = user?.role === "owner" ? "/owner" : "/app";
    nav(state?.from?.pathname || fallback, { replace: true });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);
    try {
      const { user } = await loginUser(form);
      redirectPostAuth(user);
    } catch (ex) {
      setErr(friendlyAuthError(ex));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    if (!GOOGLE_ENABLED) return;
    setErr(""); setMsg(""); setGLoading(true);
    try {
      const { user } = await signInWithGoogle({ remember: form.remember });
      redirectPostAuth(user);
    } catch (ex) {
      setErr(friendlyAuthError(ex));
    } finally {
      setGLoading(false);
    }
  };

  // NEW: password reset
  const onForgot = async () => {
    setErr(""); setMsg("");
    const email = form.email.trim();
    if (!email) return setErr("Enter your email above, then click Forgot password.");
    if (!auth) return setErr("Password reset isn’t available in demo mode.");

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset email sent. Check your inbox.");
    } catch (ex) {
      setErr(friendlyAuthError(ex));
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
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

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{/* fix: w/full → w-full */}
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

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Email</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand">
                <Mail className="mx-2 h-4 w-4 text-slate" />
                <input
                  className="w-full p-2 outline-none rounded-md"
                  type="email" name="email" value={form.email} onChange={onChange}
                  required placeholder="you@example.com" autoComplete="username"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Password</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand">
                <Lock className="mx-2 h-4 w-4 text-slate" />
                <input
                  className="w-full p-2 outline-none rounded-md"
                  type={show ? "text" : "password"} name="password" value={form.password} onChange={onChange}
                  required placeholder="••••••••" autoComplete="current-password"
                />
                <button
                  type="button"
                  className="px-3 text-xs text-slate hover:text-ink"
                  onClick={() => setShow(s => !s)}
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
              disabled={loading || gLoading}
              className="w-full rounded-md bg-brand text-ink px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <span className="h-px flex-1 bg-charcoal/20" />
              <span className="text-xs text-slate">or</span>
              <span className="h-px flex-1 bg-charcoal/20" />
            </div>

            {/* Google Sign-in */}
            {GOOGLE_ENABLED && (
              <button
                type="button"
                onClick={onGoogle}
                disabled={gLoading || loading}
                className="w-full rounded-md border border-charcoal/20 px-4 py-2 font-medium hover:bg-charcoal/5 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <GoogleIcon />
                <span>{gLoading ? "Signing in with Google..." : "Continue with Google"}</span>
              </button>
            )}

            {/* Demo helpers (remove in prod) */}
            <div className="text-xs text-slate mt-3">
              Client: <span className="font-mono">user@flexidesk.com / user123</span><br/>
              Owner: <span className="font-mono">owner@flexidesk.com / owner123</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
