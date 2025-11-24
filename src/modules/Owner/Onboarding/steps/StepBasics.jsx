import { useEffect, useMemo, useState } from "react";
import StepShell from "../components/StepShell";
import {
  Users,
  Building2,
  DoorOpen,
  Wifi,
  Plug,
  Clock,
  Gauge,
  Car,
  Accessibility,
  Volume2,
  Info,
  Image as ImageIcon,
  Star,
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

const CATEGORY_KIND_BY_ID = {
  "coworking-floor": "cowork",
  "dedicated-desk": "cowork",
  "meeting-room": "meeting",
  "training-room": "event",
  "event-space": "event",
  "private-office": "privateOffice",
  "phone-booth": "phone",
};

const RULE_TYPES = [
  { id: "seasonal", label: "Seasonal" },
  { id: "peak", label: "Peak hours" },
  { id: "event", label: "Event-based" },
];

const APPLY_TARGETS = [
  { id: "seatHour", label: "Per seat (hour)" },
  { id: "seatDay", label: "Per seat (day)" },
  { id: "roomHour", label: "Per room (hour)" },
  { id: "roomDay", label: "Per room (day)" },
  { id: "wholeDay", label: "Entire space (day)" },
];

const DAYS_OF_WEEK = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

export default function StepBasics({ draft, setDraft, onFilesChange }) {
  const [previews, setPreviews] = useState([]);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);

  useEffect(() => {
    if (!draft.photosMeta?.length && previews.length) {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
    }
  }, [draft.photosMeta, previews]);

  useEffect(() => {
    if (onFilesChange) onFilesChange(previews);
  }, [previews, onFilesChange]);

  const updateNum = (key, delta) =>
    setDraft((s) => ({
      ...s,
      [key]: Math.max(0, (Number(s[key]) || 0) + delta),
    }));

  const set = (k, v) => setDraft((s) => ({ ...s, [k]: v }));

  const categoryId = draft.category || "";
  const kind = CATEGORY_KIND_BY_ID[categoryId] || "generic";

  const showSeats = true;
  const showRooms =
    kind === "meeting" || kind === "event" || kind === "privateOffice";
  const showPrivateRooms = kind === "privateOffice";

  const showLocks = kind === "privateOffice";
  const showNoise =
    kind === "cowork" || kind === "event" || kind === "phone" || kind === "generic";
  const showParking = true;
  const showAccessibility = true;

  const showPriceSeatDay = kind === "cowork" || kind === "phone" || kind === "generic";
  const showPriceSeatHour = kind === "cowork" || kind === "phone" || kind === "generic";
  const showPriceRoomHour = kind === "meeting" || kind === "event";
  const showPriceRoomDay = kind === "meeting" || kind === "event";
  const showPriceWholeDay = kind === "event" || kind === "privateOffice";
  const showPriceWholeMonth = kind === "privateOffice";

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
        ...newPreviews.map(({ name, size, type }) => ({
          name,
          size,
          type,
        })),
      ],
      coverIndex:
        typeof s.coverIndex === "number" && s.coverIndex >= 0 ? s.coverIndex : 0,
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 xl:col-span-2"
        >
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

              <Counter
                icon={Clock}
                label="Minimum booking (hours)"
                value={draft.minHours || 0}
                onDec={() => updateNum("minHours", -1)}
                onInc={() => updateNum("minHours", +1)}
              />
            </div>

            <p className="mt-3 text-xs text-slate">
              Fields adjust based on your selected category. You can change them anytime.
            </p>
          </div>

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
              Tip: Add 5–10 photos. The first (starred) is your cover. Selected photos are
              previewed locally and will be uploaded on the next step.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-2xl ring-1 ring-slate-200 bg-white p-4 md:p-5">
            <div className="text-sm font-medium mb-3">Pricing</div>

            <div className="grid sm:grid-cols-3 gap-3">
              <LabeledSelect
                label="Currency"
                value={draft.currency || "PHP"}
                onChange={(v) => set("currency", v)}
                options={CURRENCIES}
              />
              <Field
                label="Service fee (optional)"
                value={draft.serviceFee ?? ""}
                onChange={(v) => set("serviceFee", v.replace(/[^0-9.]/g, ""))}
                placeholder="e.g., 0 or 100"
                inputMode="decimal"
              />
              <Field
                label="Cleaning fee (optional)"
                value={draft.cleaningFee ?? ""}
                onChange={(v) => set("cleaningFee", v.replace(/[^0-9.]/g, ""))}
                placeholder="e.g., 0 or 250"
                inputMode="decimal"
              />
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

            <div className="mt-3 flex flex-col gap-1">
              <p className="text-xs text-slate">
                Set seasonal, peak-hour, and event-based pricing to override your base rates
                when needed.
              </p>
              <button
                type="button"
                onClick={() => setShowAdvancedPricing((v) => !v)}
                className="self-start text-xs font-semibold text-brand hover:underline"
              >
                {showAdvancedPricing
                  ? "Hide advanced pricing"
                  : "Set seasonal, peak-hour, and event-based pricing"}
              </button>
            </div>

            {showAdvancedPricing && (
              <div className="mt-4 border-t pt-4">
                <AdvancedPricingEditor
                  currency={draft.currency || "PHP"}
                  value={draft.advancedPricing || []}
                  onChange={(rules) => set("advancedPricing", rules)}
                />
              </div>
            )}
          </div>

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
                          accessibility: {
                            ...(s.accessibility || {}),
                            [a.id]: e.target.checked,
                          },
                        }))
                      }
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
          )}

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
                        amenities: {
                          ...(s.amenities || {}),
                          [a.id]: e.target.checked,
                        },
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  inputMode,
  className,
}) {
  return (
    <label className={["block", className].filter(Boolean).join(" ")}>
      <span className="block text-xs font-medium text-ink/90 mb-1">{label}</span>
      <div className="relative rounded-md ring-1 ring-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand">
        {Icon ? (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
        ) : null}
        <input
          className={["w-full rounded-md bg-transparent p-2", Icon ? "pl-9" : "pl-3"].join(
            " "
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
        />
      </div>
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  className,
}) {
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
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
          {currency}
        </span>
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

function AdvancedPricingEditor({ currency, value, onChange }) {
  const rules = value || [];

  const addRule = () => {
    const id = String(Date.now()) + "_" + Math.random().toString(16).slice(2);
    const next = [
      ...rules,
      {
        id,
        name: "",
        type: "seasonal",
        fromDate: "",
        toDate: "",
        days: [],
        startTime: "",
        endTime: "",
        target: "seatHour",
        price: "",
      },
    ];
    onChange(next);
  };

  const updateRule = (id, patch) => {
    const next = rules.map((r) => (r.id === id ? { ...r, ...patch } : r));
    onChange(next);
  };

  const toggleDay = (id, day) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const has = rule.days?.includes(day);
    const nextDays = has
      ? rule.days.filter((d) => d !== day)
      : [...(rule.days || []), day];
    updateRule(id, { days: nextDays });
  };

  const removeRule = (id) => {
    const next = rules.filter((r) => r.id !== id);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {rules.length === 0 && (
        <p className="text-xs text-slate">
          No advanced pricing rules yet. Add one to override your base prices on specific
          dates or times.
        </p>
      )}

      {rules.map((rule) => (
        <div key={rule.id} className="rounded-xl border border-slate-200 p-3 space-y-3">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <input
              className="w-full md:w-1/2 rounded-md border border-slate-200 px-2 py-1 text-sm"
              placeholder="Rule name (e.g., Weekend rate, Holiday promo)"
              value={rule.name}
              onChange={(e) => updateRule(rule.id, { name: e.target.value })}
            />
            <select
              className="rounded-md border border-slate-200 px-2 py-1 text-sm"
              value={rule.type}
              onChange={(e) => updateRule(rule.id, { type: e.target.value })}
            >
              {RULE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeRule(rule.id)}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-ink/90 space-y-1">
              <span>Date range</span>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm"
                  value={rule.fromDate}
                  onChange={(e) => updateRule(rule.id, { fromDate: e.target.value })}
                />
                <input
                  type="date"
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm"
                  value={rule.toDate}
                  onChange={(e) => updateRule(rule.id, { toDate: e.target.value })}
                />
              </div>
            </label>

            <label className="text-xs text-ink/90 space-y-1">
              <span>Time window</span>
              <div className="flex gap-2">
                <input
                  type="time"
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm"
                  value={rule.startTime}
                  onChange={(e) => updateRule(rule.id, { startTime: e.target.value })}
                />
                <input
                  type="time"
                  className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm"
                  value={rule.endTime}
                  onChange={(e) => updateRule(rule.id, { endTime: e.target.value })}
                />
              </div>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-ink/90">Days of week</span>
            {DAYS_OF_WEEK.map((d) => {
              const active = rule.days?.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(rule.id, d.id)}
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] border",
                    active
                      ? "bg-brand/10 border-brand text-ink"
                      : "bg-white border-slate-200 text-slate-600",
                  ].join(" ")}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-ink/90 space-y-1">
              <span>Apply to</span>
              <select
                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                value={rule.target}
                onChange={(e) => updateRule(rule.id, { target: e.target.value })}
              >
                {APPLY_TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-ink/90 space-y-1">
              <span>Override price</span>
              <div className="relative rounded-md border border-slate-200 bg-white">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-600">
                  {currency}
                </span>
                <input
                  className="w-full rounded-md bg-transparent pl-10 pr-2 py-1 text-sm"
                  value={rule.price}
                  onChange={(e) =>
                    updateRule(rule.id, {
                      price: e.target.value.replace(/[^0-9.]/g, ""),
                    })
                  }
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRule}
        className="mt-2 inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
      >
        Add pricing rule
      </button>
    </div>
  );
}
