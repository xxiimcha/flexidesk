import { useState } from "react";
import StepShell from "../components/StepShell";
import { MapPin, Crosshair, ShieldCheck, Info, Building2, Loader2, Navigation2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COUNTRIES = ["Philippines", "United States", "Singapore", "Malaysia", "United Kingdom", "Australia"];

export default function StepLocation({ draft, setDraft }) {
  const [locLoading, setLocLoading] = useState(false);
  const set = (k, v) => setDraft((s) => ({ ...s, [k]: v }));

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported in this browser.");
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDraft((s) => ({ ...s, lat: +latitude.toFixed(6), lng: +longitude.toFixed(6) }));
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        alert(err?.message || "Unable to fetch your location.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const privacyText = draft.showApprox
    ? "Guests see an approximate area on the map. Exact address is shared only after booking."
    : "Exact address is hidden until a booking is confirmed.";

  return (
    <StepShell
      title="Where’s your space located?"
      subtitle="Precise addresses are private. We only share them with guests after they book."
    >
      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT: Address details */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4" />
            Address details
          </div>

          <Field
            label="Venue or building name (optional)"
            placeholder="e.g., One Ayala Tower"
            value={draft.venue || ""}
            onChange={(v) => set("venue", v)}
            icon={Building2}
            autoComplete="organization"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              required
              label="Street address"
              placeholder="Street, house/building no."
              value={draft.address || ""}
              onChange={(v) => set("address", v)}
              icon={Navigation2}
              autoComplete="address-line1"
            />
            <Field
              label="Unit / floor / suite (optional)"
              placeholder="Unit, floor, suite"
              value={draft.address2 || ""}
              onChange={(v) => set("address2", v)}
              autoComplete="address-line2"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Barangay / district (optional)"
              placeholder="e.g., Bel-Air"
              value={draft.district || ""}
              onChange={(v) => set("district", v)}
              autoComplete="address-level3"
            />
            <Field
              required
              label="City / municipality"
              placeholder="e.g., Makati"
              value={draft.city || ""}
              onChange={(v) => set("city", v)}
              autoComplete="address-level2"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Field
              label="Province / state"
              placeholder="e.g., Metro Manila"
              value={draft.region || ""}
              onChange={(v) => set("region", v)}
              autoComplete="address-level1"
            />
            <Field
              label="ZIP / postal code"
              placeholder="e.g., 1226"
              value={draft.zip || ""}
              onChange={(v) => set("zip", v)}
              inputMode="numeric"
              autoComplete="postal-code"
            />
            <LabeledSelect
              required
              label="Country"
              value={draft.country || ""}
              onChange={(v) => set("country", v)}
              options={COUNTRIES}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field
              label="Latitude"
              placeholder="14.554729"
              value={draft.lat ?? ""}
              onChange={(v) => set("lat", v)}
              inputMode="decimal"
            />
            <Field
              label="Longitude"
              placeholder="121.024445"
              value={draft.lng ?? ""}
              onChange={(v) => set("lng", v)}
              inputMode="decimal"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Switch-style toggle */}
            <button
              type="button"
              onClick={() => set("showApprox", !draft.showApprox)}
              className={[
                "inline-flex items-center gap-2 text-sm select-none",
                "rounded-full px-1 py-1 bg-slate-100 hover:bg-slate-200 transition-colors",
              ].join(" ")}
              aria-pressed={Boolean(draft.showApprox)}
            >
              <span
                className={[
                  "w-9 h-5 rounded-full transition-colors relative",
                  draft.showApprox ? "bg-brand" : "bg-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                    draft.showApprox ? "left-4" : "left-0.5",
                  ].join(" ")}
                />
              </span>
              <span>Show only approximate location on the map</span>
            </button>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={locLoading}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-charcoal/5 disabled:opacity-60"
            >
              {locLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
              Use my location
            </button>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate" aria-live="polite">
            <ShieldCheck className="h-4 w-4 mt-0.5" />
            <span>{privacyText}</span>
          </div>
        </motion.div>

        {/* RIGHT: Map card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border relative min-h-[48vh] md:min-h-[52vh] bg-white"
        >
          {/* decorative grid background */}
          <div
            className="absolute inset-0 opacity-60"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(2,6,23,.08) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          {/* gradient wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-sky-100 opacity-90" aria-hidden />

          {/* Map toolbar */}
          <div className="absolute left-3 top-3 right-3 flex items-center justify-between gap-3 z-10">
            <div className="bg-white/95 backdrop-blur rounded-full shadow px-3 py-1.5 text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map preview
            </div>
            <div className="bg-white/95 backdrop-blur rounded-full shadow px-3 py-1.5 text-xs text-slate flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              Drag the pin in the real map (coming soon)
            </div>
          </div>

          {/* Faux controls (disabled) */}
          <div className="absolute right-3 top-14 z-10 grid gap-2">
            <button
              type="button"
              disabled
              className="h-9 w-9 rounded-md bg-white/90 text-ink ring-1 ring-slate-200 grid place-items-center opacity-70"
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              disabled
              className="h-9 w-9 rounded-md bg-white/90 text-ink ring-1 ring-slate-200 grid place-items-center opacity-70"
              title="Zoom out"
            >
              −
            </button>
          </div>

          {/* Centered pin with pulse */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none z-10">
            <span className="relative">
              <span className="absolute -inset-3 rounded-full bg-brand/30 blur-lg animate-ping" />
              <MapPin className="relative h-10 w-10 text-ink" />
            </span>
          </div>

          {/* Lat/Lng + status chip */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-3 z-10">
            <div className="bg-white/95 backdrop-blur rounded-md shadow px-3 py-2 text-xs">
              <div className="flex gap-3">
                <span>
                  Lat: <strong>{draft.lat ?? "—"}</strong>
                </span>
                <span>
                  Lng: <strong>{draft.lng ?? "—"}</strong>
                </span>
              </div>
            </div>

            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={draft.showApprox ? "approx" : "exact"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={[
                  "rounded-full shadow px-3 py-1.5 text-xs",
                  draft.showApprox ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
                ].join(" ")}
              >
                {draft.showApprox ? "Approximate location shown" : "Exact shown after booking"}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </StepShell>
  );
}

/* ---------- Small local UI helpers (no external deps) ---------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  icon: Icon,
  inputMode,
  autoComplete,
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink/90 mb-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      <div
        className={[
          "relative rounded-md ring-1 ring-slate-200 bg-white",
          "focus-within:ring-2 focus-within:ring-brand",
        ].join(" ")}
      >
        {Icon ? <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" /> : null}
        <input
          className={[
            "w-full rounded-md bg-transparent p-2",
            Icon ? "pl-9" : "pl-3",
          ].join(" ")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          inputMode={inputMode}
          autoComplete={autoComplete}
        />
      </div>
    </label>
  );
}

function LabeledSelect({ label, value, onChange, options, required }) {
  return (
    <label className="block">
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
          <option value="" disabled>
            Select country
          </option>
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
