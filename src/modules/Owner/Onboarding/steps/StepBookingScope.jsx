import StepShell from "../components/StepShell";
import { bookingScopes } from "../constants";

export default function StepBookingScope({ draft, setDraft }) {
  return (
    <StepShell title="What kind of booking will guests have?">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bookingScopes.map((b, idx) => {
          const active = draft.scope === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setDraft(s => ({ ...s, scope: b.id }))}
              className={`h-full text-left border rounded-xl p-4 hover:border-ink/60 ${
                active ? "border-ink" : "border-charcoal/30"
              }`}
            >
              <div className="font-medium">{b.label}</div>
              <div className="text-xs text-slate">{b.help}</div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
