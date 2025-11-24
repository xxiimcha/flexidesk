import { motion } from "framer-motion";
import { ArrowRight, MapPin, Users, Rocket } from "lucide-react";

export default function StepIntro({ onNext }) {
  const steps = [
    {
      title: "Tell us about your space",
      text: "Choose what you’re listing, how it’s booked, and where it’s located.",
      Icon: MapPin,
    },
    {
      title: "Make it team-ready",
      text: "Share capacity, layout, and essentials like Wi-Fi, power, and A/C.",
      Icon: Users,
    },
    {
      title: "Finish up & publish",
      text: "Add photos, set availability and pricing, then go live in minutes.",
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
      <div className="relative p-10 lg:p-16 bg-ink text-white flex items-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              "radial-gradient(600px_200px_at_-20%_-10%,rgba(255,255,255,.06),transparent), linear-gradient(110deg,rgba(255,255,255,.06)_0%,transparent_35%)",
          }}
        />

        <div className="relative z-10 max-w-xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 text-xs sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            New to hosting? Start in 3 steps
          </span>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
              It’s easy to get started on Flexidesk
            </h1>
            <p className="text-sm sm:text-base text-white/80">
              Turn underused space into flexible income. List a private office, meeting room, or a
              handful of extra desks, and Flexidesk connects you with teams looking nearby.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div className="rounded-xl bg-white/5 ring-1 ring-white/15 px-3 py-2.5">
              <p className="font-semibold text-white">No setup fees</p>
              <p className="mt-1 text-white/70">
                Create a listing for free and only pay when you earn.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 ring-1 ring-white/15 px-3 py-2.5">
              <p className="font-semibold text-white">Payouts on schedule</p>
              <p className="mt-1 text-white/70">
                Receive earnings regularly once bookings are completed.
              </p>
            </div>
            <div className="rounded-xl bg-white/5 ring-1 ring-white/15 px-3 py-2.5">
              <p className="font-semibold text-white">You stay in control</p>
              <p className="mt-1 text-white/70">
                Decide who can book, when, and at what rates.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 lg:p-14 flex flex-col justify-center bg-gradient-to-b from-white to-slate-50/80">
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                Listing setup
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Guide for your first workspace
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex h-7 items-center rounded-full border border-slate-200 px-3">
                3 steps
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand" style={{ width: "33%" }} aria-hidden />
            </div>
            <span className="whitespace-nowrap">Step 1 of 3</span>
          </div>
        </div>

        <ol className="space-y-4">
          {steps.map(({ title, text, Icon }, index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="group relative flex gap-4 rounded-xl p-4 ring-1 ring-slate-200/90 bg-white hover:ring-brand/40 hover:bg-brand/3 shadow-sm/0 hover:shadow-sm transition-all"
            >
              <div className="flex-none">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-brand/12 ring-1 ring-brand/30 flex items-center justify-center text-brand">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-2 -left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-900 text-white/90">
                    {index + 1}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onNext}
            onKeyDown={(e) => {
              if (e.key === "Enter") onNext?.();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand text-ink px-5 py-3 text-sm font-semibold shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs sm:text-sm text-slate-500">
            You can save as draft anytime and finish later.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
