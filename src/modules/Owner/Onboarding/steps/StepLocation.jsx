import StepShell from "../components/StepShell";
import { MapPin, Crosshair, ShieldCheck, Info, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const COUNTRIES = ["Philippines", "United States", "Singapore", "Malaysia", "United Kingdom", "Australia"];

export default function StepLocation({ draft, setDraft }) {
  const set = (k, v) => setDraft(s => ({ ...s, [k]: v }));

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported in this browser.");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setDraft(s => ({ ...s, lat: latitude, lng: longitude }));
      },
      err => alert(err.message || "Unable to fetch your location.")
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4" />
            Address details
          </div>

          <input
            className="w-full border rounded-md p-2"
            placeholder="Venue or building name (optional)"
            value={draft.venue || ""}
            onChange={(e) => set("venue", e.target.value)}
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="border rounded-md p-2"
              placeholder="Street address"
              value={draft.address || ""}
              onChange={(e) => set("address", e.target.value)}
            />
            <input
              className="border rounded-md p-2"
              placeholder="Unit / floor / suite (optional)"
              value={draft.address2 || ""}
              onChange={(e) => set("address2", e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="border rounded-md p-2"
              placeholder="Barangay / district (optional)"
              value={draft.district || ""}
              onChange={(e) => set("district", e.target.value)}
            />
            <input
              className="border rounded-md p-2"
              placeholder="City / municipality"
              value={draft.city || ""}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <input
              className="border rounded-md p-2"
              placeholder="Province / state"
              value={draft.region || ""}
              onChange={(e) => set("region", e.target.value)}
            />
            <input
              className="border rounded-md p-2"
              placeholder="ZIP / postal code"
              value={draft.zip || ""}
              onChange={(e) => set("zip", e.target.value)}
            />
            <select
              className="border rounded-md p-2 bg-white"
              value={draft.country || ""}
              onChange={(e) => set("country", e.target.value)}
            >
              <option value="" disabled>Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={Boolean(draft.showApprox)}
                onChange={(e) => set("showApprox", e.target.checked)}
              />
              Show only approximate location on the map
            </label>

            <button
              type="button"
              onClick={useMyLocation}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-charcoal/5"
            >
              <Crosshair className="h-4 w-4" /> Use my location
            </button>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate">
            <ShieldCheck className="h-4 w-4 mt-0.5" />
            <span>{privacyText}</span>
          </div>
        </motion.div>

        {/* RIGHT: Map + Lat/Lng readout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden border relative min-h-[380px] md:min-h-[460px] lg:min-h-[520px] bg-gradient-to-br from-sky-100 to-sky-200"
        >
          {/* Map toolbar */}
          <div className="absolute left-3 top-3 right-3 flex items-center justify-between gap-3">
            <div className="bg-white/95 backdrop-blur rounded-full shadow px-3 py-1.5 text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map preview
            </div>
            <div className="bg-white/95 backdrop-blur rounded-full shadow px-3 py-1.5 text-xs text-slate flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              Drag the pin in the real map (coming soon)
            </div>
          </div>

          {/* Centered pin */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <MapPin className="h-10 w-10 text-ink" />
          </div>

          {/* Lat/Lng + status chip */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-3">
            <div className="bg-white/95 backdrop-blur rounded-md shadow px-3 py-2 text-xs">
              <div className="flex gap-3">
                <span>Lat: <strong>{draft.lat ?? "—"}</strong></span>
                <span>Lng: <strong>{draft.lng ?? "—"}</strong></span>
              </div>
            </div>
            <div className={`rounded-full shadow px-3 py-1.5 text-xs ${
              draft.showApprox ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {draft.showApprox ? "Approximate location shown" : "Exact shown after booking"}
            </div>
          </div>
        </motion.div>
      </div>
    </StepShell>
  );
}
