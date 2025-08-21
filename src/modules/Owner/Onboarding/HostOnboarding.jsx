import { useEffect, useMemo, useState } from "react";
import {
  Briefcase, HelpCircle, Save, MapPin, Building2, Users,
  DoorOpen, LayoutGrid, Lock, Monitor, Presentation, Beaker,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Local draft key
const DRAFT_KEY = "flexidesk_host_draft_v1";

const categories = [
  { id: "cowork",   label: "Coworking floor", icon: LayoutGrid, help: "Open seating, shared floor" },
  { id: "desk",     label: "Dedicated desk",  icon: Briefcase,  help: "Individual desk, fixed spot" },
  { id: "private",  label: "Private office",  icon: Building2,  help: "Lockable office for a team" },
  { id: "meeting",  label: "Meeting room",    icon: Presentation, help: "Enclosed room for meetings" },
  { id: "training", label: "Training room",   icon: Monitor,    help: "Class/training setup" },
  { id: "event",    label: "Event space",     icon: Beaker,     help: "Open area for events/workshops" },
  { id: "booth",    label: "Phone booth/Pod", icon: DoorOpen,   help: "1–2 person focus pod" },
];

const bookingScopes = [
  { id: "entire",  label: "Entire space", help: "Guests book the whole space" },
  { id: "room",    label: "Per room",     help: "Guests book a room within your venue" },
  { id: "seat",    label: "Per desk/seat",help: "Guests book individual seats" },
];

function Header({ onSaveExit }) {
  return (
    <div className="flex items-center justify-between p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Briefcase className="h-6 w-6 text-brand" />
        <span className="font-semibold text-lg">FLEXIDESK</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="inline-flex items-center gap-2 text-sm text-ink/80 hover:text-ink">
          <HelpCircle className="h-4 w-4" /> Questions?
        </button>
        <button onClick={onSaveExit} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-charcoal/5">
          <Save className="h-4 w-4" /> Save &amp; exit
        </button>
      </div>
    </div>
  );
}

function Footer({ canNext, onBack, onNext, nextLabel = "Next" }) {
  return (
    <div className="flex items-center justify-between p-4 md:p-6 border-t">
      <button onClick={onBack} className="text-ink underline">Back</button>
      <button
        disabled={!canNext}
        onClick={onNext}
        className="rounded-md bg-ink text-white px-5 py-2.5 font-medium disabled:opacity-40"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function StepIntro({ onNext }) {
  return (
    <div className="grid lg:grid-cols-2 min-h-[70vh]">
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
          <li className="flex gap-4">
            <div className="text-ink font-semibold">1</div>
            <div>
              <h3 className="font-semibold text-ink">Tell us about your space</h3>
              <p className="text-slate">Pick a category, booking type, and where it is.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="text-ink font-semibold">2</div>
            <div>
              <h3 className="font-semibold text-ink">Make it suitable for teams</h3>
              <p className="text-slate">Share capacity and essentials like Wi-Fi and power.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="text-ink font-semibold">3</div>
            <div>
              <h3 className="font-semibold text-ink">Finish up &amp; publish</h3>
              <p className="text-slate">Add photos, set availability &amp; pricing, then publish.</p>
            </div>
          </li>
        </ol>

        <div className="mt-10">
          <button onClick={onNext} className="rounded-md bg-brand text-ink px-5 py-3 font-semibold">
            Get started
          </button>
        </div>
      </div>
    </div>
  );
}

function StepCategory({ draft, setDraft }) {
  return (
    <div className="px-6 md:px-12 lg:px-24 py-10">
      <h2 className="text-3xl font-bold">Which of these best describes your space?</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {categories.map(c => {
          const Icon = c.icon;
          const active = draft.category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setDraft(s => ({ ...s, category: c.id }))}
              className={`text-left border rounded-xl p-4 hover:border-ink/60 ${active ? "border-ink" : "border-charcoal/30"}`}
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
    </div>
  );
}

function StepBookingScope({ draft, setDraft }) {
  return (
    <div className="px-6 md:px-12 lg:px-24 py-10">
      <h2 className="text-3xl font-bold">What kind of booking will guests have?</h2>
      <div className="space-y-3 mt-8 max-w-2xl">
        {bookingScopes.map(b => {
          const active = draft.scope === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setDraft(s => ({ ...s, scope: b.id }))}
              className={`w-full text-left border rounded-xl p-4 hover:border-ink/60 ${active ? "border-ink" : "border-charcoal/30"}`}
            >
              <div className="font-medium">{b.label}</div>
              <div className="text-xs text-slate">{b.help}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepLocation({ draft, setDraft }) {
  return (
    <div className="px-6 md:px-12 lg:px-24 py-10">
      <h2 className="text-3xl font-bold">Where’s your space located?</h2>
      <p className="text-slate mt-2">We show the exact address only after a booking is confirmed.</p>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="space-y-3">
          <div className="text-sm font-medium">Address</div>
          <input
            className="w-full border rounded-md p-2"
            placeholder="Street address"
            value={draft.address || ""}
            onChange={(e) => setDraft(s => ({ ...s, address: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="border rounded-md p-2"
              placeholder="City / municipality"
              value={draft.city || ""}
              onChange={(e) => setDraft(s => ({ ...s, city: e.target.value }))}
            />
            <input
              className="border rounded-md p-2"
              placeholder="Province / state"
              value={draft.region || ""}
              onChange={(e) => setDraft(s => ({ ...s, region: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="border rounded-md p-2"
              placeholder="ZIP / postal code"
              value={draft.zip || ""}
              onChange={(e) => setDraft(s => ({ ...s, zip: e.target.value }))}
            />
            <input
              className="border rounded-md p-2"
              placeholder="Country"
              value={draft.country || ""}
              onChange={(e) => setDraft(s => ({ ...s, country: e.target.value }))}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm mt-2">
            <input
              type="checkbox"
              checked={Boolean(draft.showApprox)}
              onChange={(e) => setDraft(s => ({ ...s, showApprox: e.target.checked }))}
              className="h-4 w-4 accent-brand"
            />
            Show only approximate location on the map
          </label>
        </div>

        <div className="rounded-xl overflow-hidden border relative min-h-[320px]">
          <div className="absolute left-3 top-3 bg-white rounded-full shadow px-3 py-1 flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" /> Preview map
          </div>
          {/* Map placeholder; replace with Maps/Leaflet later */}
          <div className="w-full h-full bg-sky-200" />
        </div>
      </div>
    </div>
  );
}

function StepBasics({ draft, setDraft }) {
  const updateNum = (key, delta) =>
    setDraft(s => ({ ...s, [key]: Math.max(0, (Number(s[key]) || 0) + delta) }));

  return (
    <div className="px-6 md:px-12 lg:px-24 py-10">
      <h2 className="text-3xl font-bold">Let’s start with the basics</h2>

      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        <div className="space-y-6">
          <Counter
            icon={Users} label="Seats (capacity)"
            value={draft.seats || 0}
            onDec={() => updateNum("seats", -1)}
            onInc={() => updateNum("seats", +1)}
          />
          <Counter
            icon={Building2} label="Rooms / areas available"
            value={draft.rooms || 0}
            onDec={() => updateNum("rooms", -1)}
            onInc={() => updateNum("rooms", +1)}
          />
          {draft.scope !== "seat" && (
            <Counter
              icon={DoorOpen} label="Private rooms"
              value={draft.privateRooms || 0}
              onDec={() => updateNum("privateRooms", -1)}
              onInc={() => updateNum("privateRooms", +1)}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="text-sm font-medium">Does every private area have a lock?</div>
          <div className="flex gap-4">
            <Radio
              name="hasLocks"
              label="Yes"
              checked={draft.hasLocks === true}
              onChange={() => setDraft(s => ({ ...s, hasLocks: true }))}
            />
            <Radio
              name="hasLocks"
              label="No"
              checked={draft.hasLocks === false}
              onChange={() => setDraft(s => ({ ...s, hasLocks: false }))}
            />
          </div>

          <div className="mt-6 text-sm font-medium">Essentials provided</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { id: "wifi", label: "Fast Wi-Fi" },
              { id: "power", label: "Plenty of outlets" },
              { id: "ac", label: "Air conditioning" },
              { id: "coffee", label: "Free coffee/tea" },
              { id: "whiteboard", label: "Whiteboard" },
              { id: "projector", label: "TV/Projector" },
            ].map(a => (
              <label key={a.id} className="inline-flex items-center gap-2 border rounded-md px-3 py-2">
                <input
                  type="checkbox"
                  className="accent-brand"
                  checked={Boolean(draft.amenities?.[a.id])}
                  onChange={(e) =>
                    setDraft(s => ({
                      ...s,
                      amenities: { ...(s.amenities || {}), [a.id]: e.target.checked },
                    }))
                  }
                />
                {a.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Counter({ icon: Icon, label, value, onDec, onInc }) {
  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <div className="font-medium">{label}</div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={onDec} className="h-8 w-8 rounded-full border text-lg leading-none">−</button>
        <div className="w-10 text-center">{value}</div>
        <button onClick={onInc} className="h-8 w-8 rounded-full border text-lg leading-none">+</button>
      </div>
    </div>
  );
}

function Radio({ name, label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default function HostOnboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0); // 0=intro, 1,2,3,4
  const [draft, setDraft] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); }
    catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft || {}));
  }, [draft]);

  const canNext = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return Boolean(draft.category);
    if (step === 2) return Boolean(draft.scope);
    if (step === 3) return Boolean(draft.address && draft.city && draft.country);
    if (step === 4) return (Number(draft.seats) || 0) > 0;
    return true;
  }, [step, draft]);

  const onSaveExit = () => nav("/owner", { replace: true });
  const onBack = () => setStep(s => Math.max(0, s - 1));
  const onNext = () => {
    if (step < 4) setStep(s => s + 1);
    else nav("/owner/details"); // go to your real details form next
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onSaveExit={onSaveExit} />

      {step === 0 && <StepIntro onNext={onNext} />}
      {step === 1 && <StepCategory draft={draft} setDraft={setDraft} />}
      {step === 2 && <StepBookingScope draft={draft} setDraft={setDraft} />}
      {step === 3 && <StepLocation draft={draft} setDraft={setDraft} />}
      {step === 4 && <StepBasics draft={draft} setDraft={setDraft} />}

      <Footer
        canNext={canNext}
        onBack={onBack}
        onNext={onNext}
        nextLabel={step < 4 ? "Next" : "Continue to details"}
      />
    </div>
  );
}
