import StepShell from "../components/StepShell";
import { Users, Building2, DoorOpen } from "lucide-react";
import Counter from "../components/Counter";
import Radio from "../components/Radio";
import { AMENITIES } from "../constants";

export default function StepBasics({ draft, setDraft }) {
  const updateNum = (key, delta) =>
    setDraft(s => ({ ...s, [key]: Math.max(0, (Number(s[key]) || 0) + delta) }));

  return (
    <StepShell title="Let’s start with the basics">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Counter icon={Users} label="Seats (capacity)"
                   value={draft.seats || 0} onDec={() => updateNum("seats", -1)} onInc={() => updateNum("seats", +1)} />
          <Counter icon={Building2} label="Rooms / areas available"
                   value={draft.rooms || 0} onDec={() => updateNum("rooms", -1)} onInc={() => updateNum("rooms", +1)} />
          {draft.scope !== "seat" && (
            <Counter icon={DoorOpen} label="Private rooms"
                     value={draft.privateRooms || 0} onDec={() => updateNum("privateRooms", -1)} onInc={() => updateNum("privateRooms", +1)} />
          )}
        </div>

        <div className="space-y-4">
          <div className="text-sm font-medium">Does every private area have a lock?</div>
          <div className="flex gap-4">
            <Radio name="hasLocks" label="Yes" checked={draft.hasLocks === true}
                   onChange={() => setDraft(s => ({ ...s, hasLocks: true }))} />
            <Radio name="hasLocks" label="No" checked={draft.hasLocks === false}
                   onChange={() => setDraft(s => ({ ...s, hasLocks: false }))} />
          </div>

          <div className="mt-6 text-sm font-medium">Essentials provided</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {AMENITIES.map(a => (
              <label key={a.id} className="inline-flex items-center gap-2 border rounded-md px-3 py-2">
                <input type="checkbox" className="accent-brand"
                       checked={Boolean(draft.amenities?.[a.id])}
                       onChange={e => setDraft(s => ({
                         ...s,
                         amenities: { ...(s.amenities || {}), [a.id]: e.target.checked },
                       }))} />
                {a.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}
