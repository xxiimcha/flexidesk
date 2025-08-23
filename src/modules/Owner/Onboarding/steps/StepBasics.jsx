import { useEffect, useMemo, useState } from "react";
import StepShell from "../components/StepShell";
import {
  Users, Building2, DoorOpen, Wifi, Plug, Clock, Gauge,
  Car, Accessibility, Volume2, Info, Image as ImageIcon, Star
} from "lucide-react";
import Counter from "../components/Counter";
import Radio from "../components/Radio";
import { AMENITIES } from "../constants";
import { motion } from "framer-motion";

const NOISE = [
  { id: "quiet", label: "Quiet (library-like)" },
  { id: "moderate", label: "Moderate" },
  { id: "lively", label: "Lively" },
];

const PARKING = [
  { id: "none", label: "None" },
  { id: "street", label: "Street nearby" },
  { id: "onsite", label: "Onsite parking" },
];

const ACCESS = [
  { id: "wheelchair", label: "Wheelchair accessible" },
  { id: "elevator", label: "Elevator" },
  { id: "restroom", label: "Restroom on floor" },
];

const CURRENCIES = ["PHP", "USD", "SGD", "MYR", "GBP", "AUD"];

export default function StepBasics({ draft, setDraft, onFilesChange}) {
  const [previews, setPreviews] = useState([]); // [{id,url,name,size}]

  // keep previews in sync if user clears photosMeta elsewhere
  useEffect(() => {
    if (!draft.photosMeta?.length && previews.length) {
      // revoke objectURLs
      previews.forEach(p => URL.revokeObjectURL(p.url));
      setPreviews([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.photosMeta]);

  const updateNum = (key, delta) =>
    setDraft((s) => ({ ...s, [key]: Math.max(0, (Number(s[key]) || 0) + delta) }));

  const set = (k, v) => setDraft((s) => ({ ...s, [k]: v }));

  // ----- Dynamic rules (based on category & scope) -----
  const cat = String(draft.category || "").toLowerCase();
  const scope = String(draft.scope || "").toLowerCase();

  const isSeatScope  = scope === "seat";
  const isRoomScope  = scope === "room";
  const isWholeScope = ["entire", "entire-space", "space", "whole"].includes(scope);

  const isMeeting       = /meeting|conference/.test(cat);
  const isPrivateOffice = /private|office/.test(cat);
  const isCowork        = /hot|desk|cowork|shared/.test(cat);
  const isEvent         = /event|studio|hall|workshop|training/.test(cat);

  // Counters visibility
  const showSeats        = true;                                 // capacity makes sense for all
  const showRooms        = isRoomScope || isWholeScope || isEvent || isPrivateOffice;
  const showPrivateRooms = (isWholeScope || isPrivateOffice) && !isMeeting && !isCowork;

  // Other sections
  const showLocks        = showPrivateRooms;                     // locks only if private areas expected
  const showNoise        = isCowork || isEvent || isWholeScope;  // noise matters more for open/shared/event
  const showParking      = true;
  const showAccessibility= true;

  // Pricing visibility (you can tweak to your liking)
  const showPriceSeatDay    = isSeatScope || isCowork;
  const showPriceSeatHour   = isSeatScope || isCowork;
  const showPriceRoomHour   = isRoomScope || isMeeting;
  const showPriceRoomDay    = isRoomScope || isMeeting;
  const showPriceWholeDay   = isWholeScope || isPrivateOffice || isEvent;
  const showPriceWholeMonth = isWholeScope || isPrivateOffice;

  // ------ Image handlers ------
  const onPickImages = (files) => {
    if (!files?.length) return;
    const newPreviews = Array.from(files).map((f, idx) => ({
      id: `${Date.now()}_${idx}_${f.name}`,
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setPreviews((p) => [...p, ...newPreviews]);
    setDraft((s) => ({
      ...s,
      photosMeta: [
        ...(s.photosMeta || []),
        ...newPreviews.map(({ name, size, type }) => ({ name, size, type })),
      ],
      coverIndex:
        typeof s.coverIndex === "number" && s.coverIndex >= 0
          ? s.coverIndex
          : 0,
    }));
  };

  const removeImage = (idx) => {
    setPreviews((p) => {
      const clone = [...p];
      const [removed] = clone.splice(idx, 1);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return clone;
    });
    setDraft((s) => {
      const meta = [...(s.photosMeta || [])];
      meta.splice(idx, 1);
      let coverIndex = s.coverIndex ?? 0;
      if (coverIndex === idx) coverIndex = 0;
      if (coverIndex > meta.length - 1) coverIndex = Math.max(0, meta.length - 1);
      return { ...s, photosMeta: meta, coverIndex };
    });
  };

  const setCover = (idx) => setDraft((s) => ({ ...s, coverIndex: idx }));

  return (
    <StepShell title="Let’s start with the basics">
      <div className="grid xl:grid-cols-3 gap-8">
        {/* LEFT: counts */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 xl:col-span-2">
          {/* Capacity & layout */}
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
            <div className="text-sm font-medium flex items-center gap-2 mb-3">
              <Info className="h-4 w-4" /> Capacity & layout
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {showSeats && (
                <Counter
                  icon={Users}
                  label="Seats (capacity)"
                  value={draft.seats || 0}
                  onDec={() => updateNum("seats", -1)}
                  onInc={() => updateNum("seats", +1)}
                />
              )}

              {showRooms && (
                <Counter
                  icon={Building2}
                  label="Rooms / areas available"
                  value={draft.rooms || 0}
                  onDec={() => updateNum("rooms", -1)}
                  onInc={() => updateNum("rooms", +1)}
                />
              )}

              {showPrivateRooms && (
                <Counter
                  icon={DoorOpen}
                  label="Private rooms"
                  value={draft.privateRooms || 0}
                  onDec={() => updateNum("privateRooms", -1)}
                  onInc={() => updateNum("privateRooms", +1)}
                />
              )}

              {/* Minimum booking applies generally */}
              <Counter
                icon={Clock}
                label="Minimum booking (hours)"
                value={draft.minHours || 0}
                onDec={() => updateNum("minHours", -1)}
                onInc={() => updateNum("minHours", +1)}
              />
            </div>

            <p className="mt-3 text-xs text-slate">
              Fields auto-adjust based on your category (<code className="font-semibold">{draft.category || "—"}</code>)
              and scope (<code className="font-semibold">{draft.scope || "—"}</code>). You can change them anytime.
            </p>
          </div>

          {/* Description */}
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
            <div className="text-sm font-medium mb-3">Describe your space</div>
            <Field
              label="Short description (headline)"
              value={draft.shortDesc ?? ""}
              onChange={(v) => set("shortDesc", v.slice(0, 140))}
              placeholder="e.g., Bright 6-pax meeting room near Ayala"
            />
            <TextareaField
              className="mt-3"
              label="Full description"
              value={draft.longDesc ?? ""}
              onChange={(v) => set("longDesc", v)}
              placeholder="Tell guests what makes your space great, what's included, nearby transport, house rules, etc."
              hint={`${(draft.longDesc?.length ?? 0).toLocaleString()} characters`}
            />
          </div>

          {/* Connectivity & power */}
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
            <div className="text-sm font-medium flex items-center gap-2 mb-3">
              <Wifi className="h-4 w-4" /> Connectivity & power
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                label="Wi-Fi speed (Mbps)"
                icon={Gauge}
                value={draft.wifiMbps ?? ""}
                onChange={(v) => set("wifiMbps", v.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                placeholder="e.g., 200"
              />
              <Field
                label="Power outlets per seat"
                icon={Plug}
                value={draft.outletsPerSeat ?? ""}
                onChange={(v) => set("outletsPerSeat", v.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder="e.g., 1"
              />
            </div>

            {showNoise && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Volume2 className="h-4 w-4" /> Typical noise level
                </div>
                <div className="flex flex-wrap gap-3">
                  {NOISE.map((n) => (
                    <Radio
                      key={n.id}
                      name="noiseLevel"
                      label={n.label}
                      checked={draft.noiseLevel === n.id}
                      onChange={() => set("noiseLevel", n.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
            <div className="text-sm font-medium mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Photos
            </div>
            <ImagePicker
              previews={previews}
              onPick={onPickImages}
              onRemove={removeImage}
              onSetCover={setCover}
              coverIndex={draft.coverIndex ?? 0}
            />
            <p className="mt-2 text-xs text-slate">
              Tip: Add 5–10 photos. The first (starred) is your cover. Selected photos are previewed locally and will be uploaded on the next step.
            </p>
          </div>
        </motion.div>

        {/* RIGHT: pricing, policies, amenities */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Pricing */}
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
            <div className="text-sm font-medium mb-3">Pricing</div>

            <div className="grid sm:grid-cols-3 gap-3">
              <LabeledSelect
                label="Currency"
                value={draft.currency || "PHP"}
                onChange={(v) => set("currency", v)}
                options={CURRENCIES}
              />
              {/* Displayed as read-only prefix in price fields too */}
              <Field label="Service fee (optional)" value={draft.serviceFee ?? ""} onChange={(v)=>set("serviceFee", v.replace(/[^0-9.]/g, ""))} placeholder="e.g., 0 or 100" inputMode="decimal" />
              <Field label="Cleaning fee (optional)" value={draft.cleaningFee ?? ""} onChange={(v)=>set("cleaningFee", v.replace(/[^0-9.]/g, ""))} placeholder="e.g., 0 or 250" inputMode="decimal" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {showPriceSeatDay && (
                <PriceField
                  label="Price per seat (day)"
                  currency={draft.currency || "PHP"}
                  value={draft.priceSeatDay ?? ""}
                  onChange={(v) => set("priceSeatDay", v)}
                />
              )}
              {showPriceSeatHour && (
                <PriceField
                  label="Price per seat (hour)"
                  currency={draft.currency || "PHP"}
                  value={draft.priceSeatHour ?? ""}
                  onChange={(v) => set("priceSeatHour", v)}
                />
              )}
              {showPriceRoomHour && (
                <PriceField
                  label="Price per room (hour)"
                  currency={draft.currency || "PHP"}
                  value={draft.priceRoomHour ?? ""}
                  onChange={(v) => set("priceRoomHour", v)}
                />
              )}
              {showPriceRoomDay && (
                <PriceField
                  label="Price per room (day)"
                  currency={draft.currency || "PHP"}
                  value={draft.priceRoomDay ?? ""}
                  onChange={(v) => set("priceRoomDay", v)}
                />
              )}
              {showPriceWholeDay && (
                <PriceField
                  label="Price for entire space (day)"
                  currency={draft.currency || "PHP"}
                  value={draft.priceWholeDay ?? ""}
                  onChange={(v) => set("priceWholeDay", v)}
                />
              )}
              {showPriceWholeMonth && (
                <PriceField
                  label="Price for entire space (month)"
                  currency={draft.currency || "PHP"}
                  value={draft.priceWholeMonth ?? ""}
                  onChange={(v) => set("priceWholeMonth", v)}
                />
              )}
            </div>
            <p className="mt-2 text-xs text-slate">
              You can fine-tune pricing (discounts, peak hours, coupons) on the next step.
            </p>
          </div>

          {/* Security */}
          {showLocks && (
            <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
              <div className="text-sm font-medium mb-3">Security</div>
              <div className="flex flex-wrap gap-4">
                <Radio
                  name="hasLocks"
                  label="Every private area has a lock"
                  checked={draft.hasLocks === true}
                  onChange={() => setDraft((s) => ({ ...s, hasLocks: true }))}
                />
                <Radio
                  name="hasLocks"
                  label="Some or none have locks"
                  checked={draft.hasLocks === false}
                  onChange={() => setDraft((s) => ({ ...s, hasLocks: false }))}
                />
              </div>
            </div>
          )}

          {/* Parking */}
          {showParking && (
            <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
              <div className="text-sm font-medium mb-3 flex items-center gap-2">
                <Car className="h-4 w-4" /> Parking
              </div>
              <div className="flex flex-wrap gap-3">
                {PARKING.map((p) => (
                  <Radio
                    key={p.id}
                    name="parking"
                    label={p.label}
                    checked={draft.parking === p.id}
                    onChange={() => set("parking", p.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Accessibility */}
          {showAccessibility && (
            <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
              <div className="text-sm font-medium mb-3 flex items-center gap-2">
                <Accessibility className="h-4 w-4" /> Accessibility
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {ACCESS.map((a) => (
                  <label
                    key={a.id}
                    className="inline-flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      className="accent-brand"
                      checked={Boolean(draft.accessibility?.[a.id])}
                      onChange={(e) =>
                        setDraft((s) => ({
                          ...s,
                          accessibility: { ...(s.accessibility || {}), [a.id]: e.target.checked },
                        }))
                      }
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Essentials */}
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
            <div className="text-sm font-medium mb-2">Essentials provided</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {AMENITIES.map((a) => (
                <label
                  key={a.id}
                  className="inline-flex items-center gap-2 border rounded-md px-3 py-2 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="accent-brand"
                    checked={Boolean(draft.amenities?.[a.id])}
                    onChange={(e) =>
                      setDraft((s) => ({
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
        </motion.div>
      </div>
    </StepShell>
  );
}

/* ---------- Local UI helpers ---------- */

function Field({ label, value, onChange, placeholder, icon: Icon, inputMode, className }) {
  return (
    <label className={["block", className].filter(Boolean).join(" ")}>
      <span className="block text-xs font-medium text-ink/90 mb-1">{label}</span>
      <div className="relative rounded-md ring-1 ring-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand">
        {Icon ? <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" /> : null}
        <input
          className={["w-full rounded-md bg-transparent p-2", Icon ? "pl-9" : "pl-3"].join(" ")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
        />
      </div>
    </label>
  );
}

function TextareaField({ label, value, onChange, placeholder, hint, className }) {
  return (
    <label className={["block", className].filter(Boolean).join(" ")}>
      <span className="block text-xs font-medium text-ink/90 mb-1">{label}</span>
      <div className="relative rounded-md ring-1 ring-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand">
        <textarea
          rows={5}
          className="w-full rounded-md bg-transparent p-2 resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {hint ? <div className="mt-1 text-[11px] text-slate">{hint}</div> : null}
    </label>
  );
}

function LabeledSelect({ label, value, onChange, options, required, className }) {
  return (
    <label className={["block", className].filter(Boolean).join(" ")}>
      <span className="block text-xs font-medium text-ink/90 mb-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      <div className="relative rounded-md ring-1 ring-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand">
        <select
          className="w-full rounded-md bg-transparent p-2 appearance-none pr-8"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M7 10l5 5 5-5H7z" fill="currentColor" className="text-slate" />
        </svg>
      </div>
    </label>
  );
}

function PriceField({ label, currency, value, onChange }) {
  const sanitize = (s) => s.replace(/[^0-9.]/g, "");
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink/90 mb-1">{label}</span>
      <div className="relative rounded-md ring-1 ring-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">{currency}</span>
        <input
          className="w-full rounded-md bg-transparent pl-14 pr-3 p-2"
          value={value}
          onChange={(e) => onChange(sanitize(e.target.value))}
          placeholder="0.00"
          inputMode="decimal"
        />
      </div>
    </label>
  );
}

function ImagePicker({ previews, onPick, onRemove, onSetCover, coverIndex = 0 }) {
  return (
    <div>
      <label className="flex items-center justify-center h-28 rounded-md border-2 border-dashed border-slate-300 hover:border-ink/50 transition-colors cursor-pointer bg-slate-50">
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <ImageIcon className="w-4 h-4" />
          Click to upload photos (JPG/PNG)
        </div>
      </label>

      {/* Thumbs */}
      {previews?.length ? (
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((p, idx) => (
            <li key={p.id} className="relative">
              <img
                src={p.url}
                alt={p.name}
                className="w-full h-28 object-cover rounded-md ring-1 ring-slate-200"
              />
              <div className="absolute top-1 left-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => onSetCover(idx)}
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] ring-1",
                    idx === coverIndex
                      ? "bg-amber-100 text-amber-800 ring-amber-200"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                  title="Set as cover"
                >
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3 h-3" /> {idx === coverIndex ? "Cover" : "Make cover"}
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="absolute top-1 right-1 rounded-md bg-white/90 text-slate-700 ring-1 ring-slate-200 px-2 py-0.5 text-[11px] hover:bg-white"
                title="Remove"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
