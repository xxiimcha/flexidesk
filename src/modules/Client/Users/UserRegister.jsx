import { useState } from "react";
import { Briefcase, Mail, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../../services/userAuth";

export default function UserRegister() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirm: "", role: "client", agree: true
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
      const { user } = await registerUser({
        fullName: form.fullName, email: form.email, password: form.password, role: form.role
      });
      // redirect based on chosen role
      nav(user.role === "owner" ? "/owner" : "/app", { replace: true });
    } catch (ex) {
      setErr(ex.message || "Registration failed.");
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
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-3 text-white/80">Choose whether you’re booking (Client) or listing spaces (Owner).</p>
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

          {err && <div className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{err}</div>}

          {/* Role selector */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {["client","owner"].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setForm(s => ({ ...s, role: r }))}
                className={`rounded-md border px-3 py-2 text-sm ${form.role===r ? "border-brand bg-brand/20 text-ink font-medium" : "border-charcoal/20 text-ink/80 hover:bg-brand/10"}`}
              >
                {r === "client" ? "I’m a Client" : "I’m an Owner"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Full name</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand">
                <User className="mx-2 h-4 w-4 text-slate" />
                <input className="w-full p-2 outline-none rounded-md" name="fullName" value={form.fullName} onChange={onChange} required placeholder="Juan Dela Cruz" />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Email</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand">
                <Mail className="mx-2 h-4 w-4 text-slate" />
                <input className="w-full p-2 outline-none rounded-md" type="email" name="email" value={form.email} onChange={onChange} required placeholder="you@example.com" />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Password</span>
              <div className="mt-1 flex items-center rounded-md border border-charcoal/20 focus-within:border-brand">
                <Lock className="mx-2 h-4 w-4 text-slate" />
                <input className="w-full p-2 outline-none rounded-md" type={show ? "text" : "password"} name="password" value={form.password} onChange={onChange} required placeholder="••••••••" />
                <button type="button" className="px-3 text-xs text-slate hover:text-ink" onClick={() => setShow(s=>!s)}>{show ? "Hide" : "Show"}</button>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Confirm password</span>
              <input className="mt-1 w-full rounded-md border border-charcoal/20 p-2 focus:border-brand outline-none"
                     type="password" name="confirm" value={form.confirm} onChange={onChange} required />
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-slate">
              <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} className="h-4 w-4 accent-brand" />
              I agree to the <a href="#" className="underline text-ink hover:text-brand">Terms</a> and <a href="#" className="underline text-ink hover:text-brand">Privacy Policy</a>.
            </label>

            <button disabled={loading} className="w-full rounded-md bg-brand text-ink px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
