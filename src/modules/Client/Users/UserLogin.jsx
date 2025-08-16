import { useState } from "react";
import { Briefcase, Mail, Lock } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../../services/userAuth";

export default function UserLogin() {
  const nav = useNavigate();
  const { state } = useLocation();
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
    setErr(""); setLoading(true);
    try {
      const { user } = await loginUser(form);
      // role-based redirect
      const fallback = user.role === "owner" ? "/owner" : "/app";
      nav(state?.from?.pathname || fallback, { replace: true });
    } catch (ex) {
      setErr(ex.message || "Login failed.");
    } finally {
      setLoading(false);
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

          {err && <div className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{err}</div>}

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
                <button type="button" className="px-3 text-xs text-slate hover:text-ink" onClick={() => setShow(s=>!s)}>
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-slate">
                <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} className="h-4 w-4 accent-brand" />
                Remember me
              </label>
              <a href="#" className="text-sm text-ink hover:text-brand">Forgot password?</a>
            </div>

            <button disabled={loading} className="w-full rounded-md bg-brand text-ink px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in"}
            </button>

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
