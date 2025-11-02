// src/modules/Auth/pages/UserRegister.jsx
import { useState } from "react";
import { Briefcase, Mail, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../../services/userAuth";

// Map Axios/Mongo backend errors to friendly messages
function friendlyAuthError(ex) {
  const msg = (ex?.response?.data?.message || ex?.message || "").toLowerCase();
  if (ex?.response?.status === 409 || msg.includes("already")) return "Email already registered.";
  if (msg.includes("invalid email")) return "Please enter a valid email address.";
  if (msg.includes("password too short")) return "Password should be at least 6 characters.";
  if (msg.includes("invalid credentials")) return "Email or password is incorrect.";
  if (msg.includes("missing")) return "Please fill in all required fields.";
  if (msg.includes("network")) return "Network error. Please check your connection.";
  return ex?.response?.data?.message || ex?.message || "Something went wrong.";
}

export default function UserRegister() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirm: "", agree: true,
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (form.password !== form.confirm) return setErr("Passwords do not match.");
    if (!form.agree) return setErr("Please accept the Terms & Privacy Policy.");

    setLoading(true);
    try {
      await registerUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "client",
        remember: true,
      });
      nav("/app", { replace: true });
    } catch (ex) {
      setErr(friendlyAuthError(ex));
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-3 text-white/80">
            Book workspaces now. You can list your own space anytime by turning on Host mode in settings.
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

          <h2 className="text-2xl font-bold text-ink">Sign up</h2>
          <p className="mt-1 text-sm text-slate">
            Already have an account?{" "}
            <Link to="/login" className="text-ink hover:text-brand underline">Sign in</Link>
          </p>

          {err && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}

          {/* Email/password sign-up only (Mongo backend) */}
          <form onSubmit={onSubmit} className="mt-4 space-y-4" autoComplete="off" noValidate>
            <label className="block">
              <span className="text-sm font-medium text-ink">Full name</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand">
                <User className="mx-2 h-4 w-4 text-slate" />
                <input
                  className="w-full p-2 outline-none rounded-md"
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  required
                  placeholder="Juan Dela Cruz"
                  autoComplete="name"
                />
              </div>
            </label>

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
                  autoComplete="email"
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
                  autoComplete="new-password"
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

            <label className="block">
              <span className="text-sm font-medium text-ink">Confirm password</span>
              <input
                className="mt-1 w-full rounded-md border border-charcoal/20 p-2 focus:border-brand outline-none"
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                required
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={onChange}
                className="h-4 w-4 accent-brand"
              />
              I agree to the{" "}
              <a href="#" className="underline text-ink hover:text-brand">Terms</a> and{" "}
              <a href="#" className="underline text-ink hover:text-brand">Privacy Policy</a>.
            </label>

            <button
              disabled={loading}
              className="w-full rounded-md bg-brand text-ink px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p className="text-[11px] text-slate mt-2">
              By continuing, you agree to our Terms and acknowledge our Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
