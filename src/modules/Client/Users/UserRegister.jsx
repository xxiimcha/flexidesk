import { useState } from "react";
import { Briefcase, Mail, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, signInWithGoogle } from "../../../services/userAuth";

// Small Google logo SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.293 31.91 29.036 35 24 35c-6.627 0-12-5.373-12-12S17.373 11 24 11c3.059 0 5.842 1.153 7.971 3.029l5.657-5.657C34.917 6.832 29.74 5 24 5 12.954 5 4 13.954 4 25s8.954 20 20 20 18-8.059 18-18c0-1.206-.12-2.384-.389-3.517z"/>
    <path fill="#FF3D00" d="M6.306 15.691l6.571 4.816C14.3 17.27 18.7 13 24 13c3.059 0 5.842 1.153 7.971 3.029l5.657-5.657C34.917 6.832 29.74 5 24 5 16.316 5 9.676 9.337 6.306 15.691z"/>
    <path fill="#4CAF50" d="M24 45c5.176 0 9.942-1.979 13.53-5.2l-6.238-5.112C29.59 36.938 26.97 38 24 38c-5.008 0-9.259-3.413-10.767-8.008l-6.627 5.11C9.949 41.736 16.419 45 24 45z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a10.999 10.999 0 01-3.77 5.688l6.238 5.112C40.942 35.979 44 31.019 44 25c0-1.606-.165-3.162-.389-4.917z"/>
  </svg>
);

export default function UserRegister() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirm: "", agree: true
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
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
      // Default everyone to "client" at signup; they can enable Host/Owner mode later.
      await registerUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: "client",
      });
      nav("/app", { replace: true });
    } catch (ex) {
      setErr(ex.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setErr("");
    setGLoading(true);
    try {
      // signInWithGoogle defaults role to "client" in your service
      await signInWithGoogle({ remember: true, defaultRole: "client" });
      nav("/app", { replace: true });
    } catch (ex) {
      setErr(ex.message || "Google sign-up failed.");
    } finally {
      setGLoading(false);
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
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-3 text-white/80">
            Book workspaces now. You can list your own space anytime by turning on Host mode in settings.
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

          {/* Google sign-up */}
          <button
            type="button"
            onClick={onGoogle}
            disabled={gLoading || loading}
            className="mt-5 w-full rounded-md border border-charcoal/20 px-4 py-2 font-medium hover:bg-charcoal/5 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            <span>{gLoading ? "Continuing with Google..." : "Continue with Google"}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <span className="h-px flex-1 bg-charcoal/20" />
            <span className="text-xs text-slate">or</span>
            <span className="h-px flex-1 bg-charcoal/20" />
          </div>

          {/* Email/password sign-up */}
          <form onSubmit={onSubmit} className="mt-1 space-y-4">
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

            <label className="block">
              <span className="text-sm font-medium text-ink">Confirm password</span>
              <input
                className="mt-1 w-full rounded-md border border-charcoal/20 p-2 focus:border-brand outline-none"
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                required
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
              disabled={loading || gLoading}
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
