import { useState, useMemo } from "react";
import StepShell from "../components/StepShell";
import {
  MapPin,
  Crosshair,
  ShieldCheck,
  Info,
  Building2,
  Loader2,
  Navigation2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const COUNTRIES = [
  "Philippines",
  "United States",
  "Singapore",
  "Malaysia",
  "United Kingdom",
  "Australia",
];

const DEFAULT_CENTER = { lat: 14.554729, lng: 121.024445 }; // Makati-ish

// Fix Leaflet marker icon paths in bundlers like Vite/Webpack
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Small helper: shape Nominatim address into our fields
function parseNominatimAddress(data) {
  const a = data?.address || {};
  const street =
    [a.house_number, a.road].filter(Boolean).join(" ") ||
    data.display_name ||
    "";

  const city =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.county ||
    a.state_district ||
    "";
  const region = a.state || a.region || a.province || "";
  const country = a.country || "";
  const zip = a.postcode || "";

  return { street, city, region, country, zip };
}

export default function StepLocation({ draft, setDraft }) {
  const [locLoading, setLocLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");

  const set = (k, v) => setDraft((s) => ({ ...s, [k]: v }));

  const center = useMemo(() => {
    const lat =
      typeof draft.lat === "number"
        ? draft.lat
        : draft.lat
        ? parseFloat(draft.lat)
        : DEFAULT_CENTER.lat;
    const lng =
      typeof draft.lng === "number"
        ? draft.lng
        : draft.lng
        ? parseFloat(draft.lng)
        : DEFAULT_CENTER.lng;
    return { lat, lng };
  }, [draft.lat, draft.lng]);

  const updateLatLng = async (lat, lng, { reverse = true } = {}) => {
    setDraft((s) => ({
      ...s,
      lat: +lat.toFixed(6),
      lng: +lng.toFixed(6),
    }));

    if (!reverse) return;

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: {
          // Nominatim wants some identification; Referer from browser also helps
          "Accept-Language": "en",
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      const { street, city, region, country, zip } = parseNominatimAddress(
        data
      );

      setDraft((s) => ({
        ...s,
        lat: +lat.toFixed(6),
        lng: +lng.toFixed(6),
        address: s.address || street,
        city: s.city || city,
        region: s.region || region,
        country: s.country || country,
        zip: s.zip || zip,
      }));
    } catch {
      // fail silently; we still have updated lat/lng
    }
  };

  const searchAddress = async (e) => {
    e?.preventDefault?.();
    if (!search.trim()) return;
    setSearchLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        search.trim()
      )}&limit=1`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });
      if (!res.ok) throw new Error("Search failed");
      const results = await res.json();
      if (!results?.length) {
        alert("No results found for that address.");
        setSearchLoading(false);
        return;
      }

      const place = results[0];
      const lat = parseFloat(place.lat);
      const lng = parseFloat(place.lon);

      const { street, city, region, country, zip } = parseNominatimAddress(
        place
      );

      setDraft((s) => ({
        ...s,
        lat: +lat.toFixed(6),
        lng: +lng.toFixed(6),
        address: street || s.address,
        city: city || s.city,
        region: region || s.region,
        country: country || s.country,
        zip: zip || s.zip,
        venue: s.venue, // Nominatim doesn't really give venue name
      }));
    } catch (err) {
      console.error(err);
      alert("Unable to search address right now.");
    } finally {
      setSearchLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported in this browser.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateLatLng(latitude, longitude, { reverse: true });
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
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
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
              onChange={(v) =>
                set("lat", v === "" ? "" : parseFloat(v) || draft.lat)
              }
              inputMode="decimal"
            />
            <Field
              label="Longitude"
              placeholder="121.024445"
              value={draft.lng ?? ""}
              onChange={(v) =>
                set("lng", v === "" ? "" : parseFloat(v) || draft.lng)
              }
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
              {locLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
              Use my location
            </button>
          </div>

          <div
            className="flex items-start gap-2 text-xs text-slate"
            aria-live="polite"
          >
            <ShieldCheck className="h-4 w-4 mt-0.5" />
            <span>{privacyText}</span>
          </div>
        </motion.div>

        {/* RIGHT: Map (OpenStreetMap via Leaflet) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border relative min-h-[48vh] md:min-h-[52vh] bg-white"
        >
          {/* Map toolbar + search */}
          <div className="absolute left-3 top-3 right-3 flex items-center justify-between gap-3 z-10">
            <div className="bg-white/95 backdrop-blur rounded-full shadow px-3 py-1.5 text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map preview
            </div>
            <form
              onSubmit={searchAddress}
              className="flex-1 max-w-xs flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search address or place"
                  className="w-full rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <Info className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate" />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-60"
              >
                {searchLoading ? "Searching…" : "Search"}
              </button>
            </form>
          </div>

          <MapContainer
            center={center}
            zoom={draft.lat && draft.lng ? 17 : 13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationMarker center={center} onMove={updateLatLng} />
          </MapContainer>

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
                  draft.showApprox
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800",
                ].join(" ")}
              >
                {draft.showApprox
                  ? "Approximate location shown"
                  : "Exact shown after booking"}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </StepShell>
  );
}

/* ---------- Leaflet click + drag handling ---------- */

function LocationMarker({ center, onMove }) {
  useMapEvents({
    click(e) {
      if (!e.latlng) return;
      onMove(e.latlng.lat, e.latlng.lng, { reverse: true });
    },
  });

  return (
    <Marker
      position={center}
      icon={markerIcon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const p = e.target.getLatLng();
          onMove(p.lat, p.lng, { reverse: true });
        },
      }}
    />
  );
}

/* ---------- Small local UI helpers (unchanged) ---------- */

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
        {Icon ? (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" />
        ) : null}
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
