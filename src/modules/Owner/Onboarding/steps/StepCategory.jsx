import StepShell from "../components/StepShell";
import { categories } from "../constants";

export default function StepCategory({ draft, setDraft }) {
  return (
    <StepShell title="Which of these best describes your space?">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map(c => {
          const Icon = c.icon;
          const active = draft.category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setDraft(s => ({ ...s, category: c.id }))}
              className={`h-full text-left border rounded-xl p-4 hover:border-ink/60 ${
                active ? "border-ink" : "border-charcoal/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <div className="font-medium">{c.label}</div>
              </div>
              <div className="text-xs text-slate mt-1">{c.help}</div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
