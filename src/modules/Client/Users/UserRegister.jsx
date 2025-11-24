// src/modules/Auth/pages/UserRegister.jsx
import { useState } from "react";
import { Briefcase, Mail, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../../services/userAuth";

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

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

function isStrongPassword(pwd) {
  return /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(String(pwd));
}

export default function UserRegister() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirm: "",
    agree: true,
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

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

    if (name === "password") {
      if (value && !isStrongPassword(value)) {
        setPasswordErr("Password must be at least 6 characters and include both letters and numbers.");
      } else {
        setPasswordErr("");
      }
    }

    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const trimmedFullName = form.fullName.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedFullName || !trimmedEmail || !form.password || !form.confirm) {
      setErr("Please fill in all required fields.");
      return;
    }

    if (!isValidEmailFormat(trimmedEmail)) {
      setEmailErr("Enter a valid email address.");
      setErr("Enter a valid email address.");
      return;
    }

    if (!isStrongPassword(form.password)) {
      const msg = "Password must be at least 6 characters and include both letters and numbers.";
      setPasswordErr(msg);
      setErr(msg);
      return;
    }

    if (form.password !== form.confirm) {
      setErr("Passwords do not match.");
      return;
    }

    if (!form.agree) {
      setErr("Please accept the Terms & Privacy Policy.");
      return;
    }

    setEmailErr("");
    setPasswordErr("");
    setLoading(true);
    try {
      await registerUser({
        fullName: trimmedFullName,
        email: trimmedEmail,
        password: form.password,
        role: "client",
        remember: true,
      });

      nav(`/otp?email=${encodeURIComponent(trimmedEmail)}`, {
        replace: true,
        state: { email: trimmedEmail },
      });
    } catch (ex) {
      setErr(friendlyAuthError(ex));
    } finally {
      setLoading(false);
    }
  };

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
            Create your FlexiDesk account.
          </h1>
          <p className="mt-4 text-sm text-white/80">
            Sign up to start booking hot desks, meeting rooms, and offices. You can
            upgrade to a host account anytime to list your own spaces and manage
            bookings.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm">
              <p className="font-medium">Instant access</p>
              <p className="mt-1 text-white/70">
                Use a single account to book spaces, manage your reservations, and
                access workspaces via QR codes.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm">
              <p className="font-medium">Ready to host</p>
              <p className="mt-1 text-white/70">
                Turn on hosting later to publish listings, track occupancy, and view
                your earnings in real time.
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
              to="/login"
              className="text-sm font-medium text-ink hover:text-brand underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>

          <div className="rounded-2xl bg-white px-6 py-7 shadow-lg shadow-slate-200/70 border border-slate-100">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-ink">Create account</h2>
              <p className="mt-1 text-sm text-slate">
                Book workspaces now. You can list your own space anytime by turning
                on Host mode in settings.
              </p>
            </div>

            {err && (
              <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {err}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="space-y-4"
              autoComplete="off"
              noValidate
            >
              <label className="block">
                <span className="text-sm font-medium text-ink">Full name</span>
                <div className="mt-1 flex items-center rounded-lg border border-charcoal/15 bg-slate-50/60 px-2.5 py-1.5 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/70">
                  <User className="mr-2 h-4 w-4 flex-shrink-0 text-slate" />
                  <input
                    className="w-full bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-slate/50"
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
                    autoComplete="email"
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
                    placeholder="At least 6 characters with letters and numbers"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="ml-2 text-xs font-medium text-slate hover:text-ink"
                    onClick={() => setShow((s) => !s)}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordErr ? (
                  <p className="mt-1 text-xs text-red-600">{passwordErr}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate">
                    Use at least 6 characters and include both letters and numbers.
                  </p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-ink">Confirm password</span>
                <input
                  className="mt-1 w-full rounded-lg border border-charcoal/15 bg-slate-50/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-slate/50 focus:border-brand focus:ring-1 focus:ring-brand/70"
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={onChange}
                  required
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-slate pt-1">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={onChange}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <span>
                  I agree to the{" "}
                  <a
                    href="#"
                    className="underline text-ink hover:text-brand"
                  >
                    Terms
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="underline text-ink hover:text-brand"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              <button
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              <p className="mt-3 text-[11px] text-slate">
                By continuing, you agree to our Terms and acknowledge our Privacy
                Policy.
              </p>

              <p className="mt-3 text-center text-xs text-slate">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-ink hover:text-brand underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
