import { motion } from "framer-motion";
import { ArrowRight, MapPin, Users, Rocket } from "lucide-react";

export default function StepIntro({ onNext }) {
  const steps = [
    {
      title: "Tell us about your space",
      text: "Pick a category, booking type, and where it is.",
      Icon: MapPin,
    },
    {
      title: "Make it suitable for teams",
      text: "Share capacity and essentials like Wi‑Fi and power.",
      Icon: Users,
    },
    {
      title: "Finish up & publish",
      text: "Add photos, set availability & pricing, then publish.",
      Icon: Rocket,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="min-h-[72vh] grid lg:grid-cols-2 rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white"
    >
      {/* Left hero */}
      <div className="relative p-10 lg:p-16 bg-slate-950 bg-ink text-white flex items-center">
        {/* subtle glow / texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              "radial-gradient(600px_200px_at_-20%_-10%,rgba(255,255,255,.06),transparent), linear-gradient(110deg,rgba(255,255,255,.06)_0%,transparent_35%)",
          }}
        />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Host on Flexidesk
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight">
            It’s easy to get started on Flexidesk
          </h1>
          <p className="mt-4 text-white/80 max-w-xl">
            List your workspace to earn more from unused capacity. Whether it’s a private office,
            meeting room, or a few extra desks—Flexidesk connects you with teams nearby.
          </p>

          <ul className="mt-6 flex flex-wrap gap-3 text-sm text-white/85">
            <li className="rounded-full bg-white/10 ring-1 ring-white/15 px-3 py-1">No setup fees</li>
            <li className="rounded-full bg-white/10 ring-1 ring-white/15 px-3 py-1">Payouts weekly</li>
            <li className="rounded-full bg-white/10 ring-1 ring-white/15 px-3 py-1">Cancel anytime</li>
          </ul>
        </div>
      </div>

      {/* Right: steps */}
      <div className="p-6 md:p-10 lg:p-14 flex flex-col justify-center bg-white/60">
        {/* progress rail (purely decorative here) */}
        <div className="mb-6">
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand" style={{ width: "33%" }} aria-hidden />
          </div>
          <p className="sr-only">3 steps total</p>
        </div>

        <ol className="space-y-6">
          {steps.map(({ title, text, Icon }, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group relative flex gap-4 rounded-xl p-4 ring-1 ring-slate-200 hover:ring-slate-300 bg-white shadow-sm/0 hover:shadow-sm transition-all"
            >
              <div className="flex-none">
                <div className="w-10 h-10 rounded-xl bg-brand/15 ring-1 ring-brand/30 flex items-center justify-center text-brand">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-ink">{title}</h3>
                <p className="text-slate-600 text-slate mt-1">{text}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="mt-8">
          <button
            onClick={onNext}
            onKeyDown={(e) => {
              if (e.key === "Enter") onNext?.();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand text-ink px-5 py-3 font-semibold shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.section>
  );
}
