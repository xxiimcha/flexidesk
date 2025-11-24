// src/modules/Auth/pages/OtpVerify.jsx
import { useEffect, useState } from "react";
import { Briefcase, Mail, KeyRound } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { verifyOtp, resendOtp } from "../../../services/userAuth";

function friendlyAuthError(ex) {
  const msg = (ex?.response?.data?.message || ex?.message || "").toLowerCase();
  if (ex?.response?.status === 409 || msg.includes("already")) return "Email already registered.";
  if (msg.includes("invalid email")) return "Please enter a valid email address.";
  if (msg.includes("expired") || msg.includes("otp expired")) return "Your code has expired. Please request a new one.";
  if (msg.includes("invalid otp") || msg.includes("invalid code")) return "The code you entered is incorrect.";
  if (msg.includes("missing")) return "Please enter the code sent to your email.";
  if (msg.includes("network")) return "Network error. Please check your connection.";
  return ex?.response?.data?.message || ex?.message || "Something went wrong.";
}

export default function OtpVerify() {
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialEmail =
    location.state?.email ||
    searchParams.get("email") ||
    "";

  const [email] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [counter, setCounter] = useState(60);

  useEffect(() => {
    if (!email) return;
    setCounter(60);
  }, [email]);

  useEffect(() => {
    if (counter <= 0) return;
    const id = setInterval(() => {
      setCounter((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [counter]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    const trimmedCode = code.trim();
    if (!email) {
      setErr("Email is missing. Please go back and start again.");
      return;
    }
    if (!trimmedCode) {
      setErr("Please enter the verification code.");
      return;
    }
    if (trimmedCode.length < 4) {
      setErr("Enter the full verification code.");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ email, code: trimmedCode });
      setInfo("Email verified successfully. Redirecting...");
      nav("/app", { replace: true });
    } catch (ex) {
      setErr(friendlyAuthError(ex));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email || counter > 0) return;
    setErr("");
    setInfo("");
    setResending(true);
    try {
      await resendOtp({ email });
      setInfo("We sent a new code to your email.");
      setCounter(60);
    } catch (ex) {
      setErr(friendlyAuthError(ex));
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? (() => {
        const [user, domain] = email.split("@");
        if (!user || !domain) return email;
        const visible = user.slice(0, 2);
        const hidden = user.length > 2 ? "*".repeat(user.length - 2) : "";
        return `${visible}${hidden}@${domain}`;
      })()
    : "";

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
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Step 2 of 2 · Email verification
          </div>

          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Verify your email to continue.
          </h1>
          <p className="mt-4 text-sm text-white/80">
            Enter the one-time code we sent to your email to secure your FlexiDesk account
            and unlock bookings, QR access, and more.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm">
              <p className="font-medium">Extra security</p>
              <p className="mt-1 text-white/70">
                Verifying your email helps keep your bookings, payment details, and workspace
                access more secure.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm">
              <p className="font-medium">One account for everything</p>
              <p className="mt-1 text-white/70">
                After verification, you can book spaces, manage reservations, and unlock host
                tools from the same account.
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
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Secure sign-up
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-ink">Verify your email</h2>
                <p className="mt-1 text-sm text-slate">
                  We sent a one-time verification code to{" "}
                  <span className="font-medium text-ink">
                    {maskedEmail || "your email"}
                  </span>
                  . Enter the code below to confirm your account.
                </p>
              </div>
              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                <KeyRound className="h-5 w-5 text-brand" />
              </div>
            </div>

            {err && (
              <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {err}
              </div>
            )}

            {info && (
              <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                {info}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="space-y-5"
              autoComplete="off"
              noValidate
            >
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4">
                <label className="block">
                  <span className="text-sm font-medium text-ink">Verification code</span>
                  <div className="mt-2 flex items-center rounded-lg border border-charcoal/10 bg-white px-3 py-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/70">
                    <KeyRound className="mr-2 h-4 w-4 flex-shrink-0 text-slate" />
                    <input
                      className="w-full bg-transparent py-1.5 text-center text-lg font-semibold text-ink outline-none tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate/40"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      name="code"
                      value={code}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\s/g, "");
                        setCode(v);
                      }}
                      placeholder="••••••"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate">
                    Enter the 6-digit code we sent to your email. It may take a few seconds to arrive.
                  </p>
                </label>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate">
                  <Mail className="h-3.5 w-3.5 text-slate/70" />
                  <span>
                    Not seeing the email? Check your Promotions, Updates, or Spam folders.
                  </span>
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify and continue"}
              </button>

              <div className="flex flex-col gap-2 text-xs text-slate">
                <div className="flex items-center justify-between">
                  <span>Didn&apos;t get a code?</span>
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={resending || counter > 0 || !email}
                    className="text-ink font-medium hover:text-brand disabled:text-slate disabled:cursor-not-allowed"
                  >
                    {counter > 0
                      ? `Resend in ${counter}s`
                      : resending
                      ? "Resending..."
                      : "Resend code"}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => nav("/register", { replace: true })}
                    className="text-xs font-medium text-slate hover:text-ink underline-offset-4 hover:underline"
                  >
                    Use a different email
                  </button>
                  <Link
                    to="/login"
                    className="text-xs font-medium text-slate hover:text-ink underline-offset-4 hover:underline"
                  >
                    Back to sign in
                  </Link>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate text-center">
                If you are still having trouble, you can contact support for manual verification.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
