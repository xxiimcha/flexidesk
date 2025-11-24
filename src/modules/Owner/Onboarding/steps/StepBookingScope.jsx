import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import StepShell from "../components/StepShell";
import { bookingScopes, categories } from "../constants";

const DEFAULT_SCOPE_FOR_SKIPPED = "entire";

export default function StepBookingScope({ draft, setDraft, onSkip }) {
  const skipCategoryIds = useMemo(
    () =>
      categories
        .filter((c) =>
          ["Training room", "Meeting room", "Event space", "Private office"].includes(
            c.label
          )
        )
        .map((c) => c.id),
    []
  );

  const shouldSkipScope =
    draft?.category && skipCategoryIds.includes(draft.category);

  const select = (id) => setDraft((s) => ({ ...s, scope: id }));

  useEffect(() => {
    if (!shouldSkipScope) return;

    if (!draft.scope) {
      setDraft((s) => ({
        ...s,
        scope: s.scope || DEFAULT_SCOPE_FOR_SKIPPED,
      }));
    }

    if (onSkip) onSkip();
  }, [shouldSkipScope, draft.scope, onSkip, setDraft]);

  if (shouldSkipScope) {
    return null;
  }

  const availableScopes = useMemo(() => {
    if (!draft?.category) return bookingScopes;

    const hasCategorySpecific = bookingScopes.some(
      (s) => Array.isArray(s.categories) && s.categories.length > 0
    );

    if (!hasCategorySpecific) return bookingScopes;

    const filtered = bookingScopes.filter(
      (s) => !s.categories || s.categories.includes(draft.category)
    );

    return filtered;
  }, [draft?.category]);

  useEffect(() => {
    if (!availableScopes) return;

    if (!draft.scope && availableScopes.length === 1) {
      const only = availableScopes[0];
      setDraft((s) => ({ ...s, scope: only.id }));
      if (onSkip) onSkip();
    } else if (!draft.scope && availableScopes.length === 0) {
      if (onSkip) onSkip();
    }
  }, [availableScopes, draft.scope, onSkip, setDraft]);

  if (
    availableScopes.length === 0 ||
    (availableScopes.length === 1 &&
      draft.scope === availableScopes[0].id &&
      onSkip)
  ) {
    return null;
  }

  return (
    <StepShell title="What kind of booking will guests have?">
      <div
        role="radiogroup"
        aria-label="Booking scope"
        className="
          grid gap-4
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
          [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]
        "
      >
        {availableScopes.map((b, i) => {
          const active = draft.scope === b.id;
          const Icon = b.icon;

          return (
            <motion.button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => select(b.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(b.id);
                }
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={[
                "group relative h-full text-left rounded-2xl p-4 md:p-5",
                "border ring-1 bg-white transition-all",
                active
                  ? "border-ink shadow-sm ring-ink/20"
                  : "border-charcoal/20 ring-black/5 hover:bg-slate-50",
                "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                {Icon ? (
                  <div
                    className={[
                      "flex-none w-11 h-11 rounded-xl flex items-center justify-center ring-1 transition-transform",
                      active
                        ? "bg-brand/20 text-ink ring-brand/40"
                        : "bg-slate-100 text-slate-700 ring-slate-200",
                      "group-hover:scale-[1.03]",
                    ].join(" ")}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                ) : null}

                <div className="min-w-0">
                  <div className="font-semibold text-ink">{b.label}</div>
                  <div className="text-xs text-slate mt-1">{b.help}</div>
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
                  {active ? <Check className="w-3 h-3" /> : null}
                  {active ? "Selected" : "Choose"}
                </span>
              </div>

              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 group-hover:ring-brand/50 transition-[ring]" />
            </motion.button>
          );
        })}
      </div>
    </StepShell>
  );
}
