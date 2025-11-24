import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import StepShell from "../components/StepShell";
import { categories } from "../constants";

export default function StepCategory({ draft, setDraft, onSkip }) {
  const select = (id) => setDraft((s) => ({ ...s, category: id }));

  const availableCategories = useMemo(() => {
    if (!draft?.categoryFilter) return categories;
    return categories.filter((c) => c.group === draft.categoryFilter);
  }, [draft?.categoryFilter]);

  useEffect(() => {
    if (!draft.category && availableCategories.length === 1) {
      const only = availableCategories[0];
      setDraft((s) => ({ ...s, category: only.id }));
      if (onSkip) onSkip();
    }
  }, [availableCategories, draft.category, onSkip, setDraft]);

  if (!draft.category && availableCategories.length === 1 && onSkip) {
    return null;
  }

  return (
    <StepShell title="Which of these best describes your space?">
      <div
        role="radiogroup"
        aria-label="Space category"
        className="
          grid gap-4
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
          [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]
        "
      >
        {availableCategories.map((c, i) => {
          const Icon = c.icon;
          const active = draft.category === c.id;

          return (
            <motion.button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => select(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(c.id);
                }
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.045 }}
              className={[
                "group relative h-full text-left rounded-2xl p-4 md:p-5",
                "border ring-1 bg-white transition-all",
                active
                  ? "border-ink ring-ink/20 shadow-sm"
                  : "border-slate-200 ring-black/5 hover:bg-slate-50",
                "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "flex-none w-11 h-11 rounded-xl flex items-center justify-center ring-1 transition-transform",
                    active
                      ? "bg-brand/20 text-ink ring-brand/40"
                      : "bg-slate-100 text-slate-700 ring-slate-200",
                    "group-hover:scale-[1.04]",
                  ].join(" ")}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-ink">{c.label}</div>
                  <div className="text-xs text-slate mt-1 leading-relaxed">
                    {c.help}
                  </div>
                </div>
              </div>

              <div className="absolute top-3 right-3">
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                    active
                      ? "bg-brand/20 text-ink ring-brand/40"
                      : "bg-slate-100 text-slate-700 ring-slate-200 opacity-0 group-hover:opacity-100",
                    "transition-opacity",
                  ].join(" ")}
                >
                  {active && <Check className="w-3 h-3" />}
                  {active ? "Selected" : "Choose"}
                </span>
              </div>

              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 group-hover:ring-brand/40 transition-[ring]" />
            </motion.button>
          );
        })}
      </div>
    </StepShell>
  );
}
