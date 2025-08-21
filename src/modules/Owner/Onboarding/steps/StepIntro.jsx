import { motion } from "framer-motion";

export default function StepIntro({ onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="grid lg:grid-cols-2 min-h-[70vh]"
    >
      <div className="p-10 lg:p-16 bg-ink text-white flex items-center">
        <div>
          <h1 className="text-4xl font-bold leading-tight">It’s easy to get started on Flexidesk</h1>
          <p className="mt-4 text-white/80 max-w-xl">
            List your workspace to earn more from unused capacity. Whether it’s a private office,
            meeting room, or a few extra desks—Flexidesk connects you with teams nearby.
          </p>
        </div>
      </div>

      <div className="p-8 md:p-14 flex flex-col justify-center">
        <ol className="space-y-8">
          {[
            ["Tell us about your space", "Pick a category, booking type, and where it is."],
            ["Make it suitable for teams", "Share capacity and essentials like Wi-Fi and power."],
            ["Finish up & publish", "Add photos, set availability & pricing, then publish."],
          ].map(([h, t], i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4"
            >
              <div className="text-ink font-semibold">{i + 1}</div>
              <div>
                <h3 className="font-semibold text-ink">{h}</h3>
                <p className="text-slate">{t}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="mt-10">
          <button onClick={onNext} className="rounded-md bg-brand text-ink px-5 py-3 font-semibold">
            Get started
          </button>
        </div>
      </div>
    </motion.div>
  );
}
