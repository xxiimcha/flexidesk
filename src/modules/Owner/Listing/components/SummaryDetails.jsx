// src/modules/Owner/components/SummaryDetails.jsx
import {
  MapPin, Users, DoorOpen, Clock, Wifi, Plug, Volume2, Car, ShieldCheck,
} from "lucide-react";

export default function SummaryDetails({ item }) {
  if (!item) return null;

  const amenityChips = truthyKeys(item.amenities);
  const accessChips  = truthyKeys(item.accessibility);

  const currency = (item.currency || "PHP").toUpperCase();
  const prices = [
    ["Seat / day", item.priceSeatDay],
    ["Seat / hour", item.priceSeatHour],
    ["Room / hour", item.priceRoomHour],
    ["Room / day", item.priceRoomDay],
    ["Whole / day", item.priceWholeDay],
    ["Whole / month", item.priceWholeMonth],
    ["Service fee", item.serviceFee],
    ["Cleaning fee", item.cleaningFee],
  ].filter(([, v]) => v != null && v !== "");

  const cityLine = [item.address, item.address2].filter(Boolean).join(", ");
  const regionLine = [item.district, item.city, item.region, item.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      {/* quick stats */}
      <div className="flex flex-wrap gap-2">
        <StatPill icon={Users} label="Seats" value={item.seats ?? 0} />
        <StatPill icon={DoorOpen} label="Private rooms" value={item.privateRooms ?? 0} />
        <StatPill icon={Clock} label="Min booking" value={item.minHours ? `${item.minHours} hr` : "—"} />
        {typeof item.hasLocks === "boolean" && (
          <StatPill
            icon={ShieldCheck}
            label="Locks"
            value={item.hasLocks ? "All private" : "Some/none"}
          />
        )}
      </div>

      {/* overview & descriptions */}
      <Section title="Overview">
        <Row label="Category" value={`${item.category || "—"} • ${item.scope || "—"}`} />
        <Row label="Parking" value={(
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 ring-1 ring-slate-200 px-2 py-0.5 text-xs">
            <Car className="h-3.5 w-3.5 text-slate-600" />
            {item.parking || "—"}
          </span>
        )} />
        <div className="pt-2" />
        <Row label="Short description" value={item.shortDesc || "—"} />
        <div className="text-sm whitespace-pre-line text-ink">{item.longDesc || "—"}</div>
      </Section>

      {/* location + connectivity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Location">
          <div className="text-sm text-ink">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <MapPin className="h-4 w-4 text-slate-600" />
              <span className="font-medium">{regionLine || "—"}</span>
            </div>
            {cityLine && <div className="text-slate">{cityLine}</div>}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {isFiniteNum(item.lat) && isFiniteNum(item.lng) && (
                <span className="rounded-md bg-slate-50 ring-1 ring-slate-200 px-2 py-0.5">
                  Lat: <strong>{Number(item.lat).toFixed(5)}</strong> • Lng: <strong>{Number(item.lng).toFixed(5)}</strong>
                </span>
              )}
              {typeof item.showApprox === "boolean" && (
                <span className={`rounded-full px-2 py-0.5 ring-1 text-xs ${
                  item.showApprox ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-800 ring-emerald-200"
                }`}>
                  {item.showApprox ? "Approximate map location" : "Exact shown after booking"}
                </span>
              )}
            </div>
          </div>
        </Section>

        <Section title="Connectivity & noise">
          <div className="grid sm:grid-cols-2 gap-2">
            <MiniMetric icon={Wifi} label="Wi-Fi" value={numOrDash(item.wifiMbps, v => `${v} Mbps`)} />
            <MiniMetric icon={Plug} label="Outlets / seat" value={numOrDash(item.outletsPerSeat)} />
          </div>
          <div className="mt-2">
            <span className="text-xs text-slate">Typical noise</span>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-50 ring-1 ring-slate-200 px-2 py-0.5 text-xs">
              <Volume2 className="h-3.5 w-3.5 text-slate-600" />
              {prettyNoise(item.noiseLevel) || "—"}
            </div>
          </div>
        </Section>
      </div>

      {/* amenities & accessibility */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Amenities">
          <ChipList items={amenityChips} empty="No amenities set" />
        </Section>
        <Section title="Accessibility">
          <ChipList items={accessChips} empty="No accessibility details" />
        </Section>
      </div>

      {/* pricing */}
      <Section title="Pricing">
        {prices.length === 0 ? (
          <div className="text-sm text-slate">No pricing provided.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {prices.map(([label, val]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-slate">{label}</span>
                <span className="font-medium">{currency} {fmtMoney(val)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ——— Small presentational helpers ——— */

function Section({ title, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate font-medium">{title}</div>
      <div className="mt-2 rounded-lg ring-1 ring-slate-200 bg-white/60 p-3">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm py-1">
      <div className="w-40 shrink-0 text-slate">{label}</div>
      <div className="flex-1 text-ink">{value ?? "—"}</div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 ring-1 ring-slate-200 px-2.5 py-1 text-xs">
      <Icon className="h-3.5 w-3.5 text-slate-600" />
      <span className="font-medium">{value}</span>
      <span className="text-slate">• {label}</span>
    </span>
  );
}

function MiniMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md bg-slate-50 ring-1 ring-slate-200 p-2">
      <div className="text-xs text-slate flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-600" />
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function ChipList({ items, empty = "—" }) {
  if (!items.length) return <div className="text-sm text-slate">{empty}</div>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((x) => (
        <span
          key={x}
          className="inline-flex items-center rounded-full bg-white ring-1 ring-slate-200 px-2 py-0.5 text-xs"
        >
          {startCase(x)}
        </span>
      ))}
    </div>
  );
}

/* ——— tiny utils ——— */

function truthyKeys(obj) {
  if (!obj || typeof obj !== "object") return [];
  return Object.keys(obj).filter((k) => !!obj[k]);
}
function startCase(s = "") {
  return String(s)
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}
function fmtMoney(v) {
  const n = Number(String(v).replace(/[^0-9.]/g, "")) || 0;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function numOrDash(v, fmt = (x) => x) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return fmt(n);
}
function isFiniteNum(v) {
  const n = Number(v);
  return Number.isFinite(n);
}
function prettyNoise(val) {
  if (!val) return null;
  const map = { quiet: "Quiet (library-like)", moderate: "Moderate", lively: "Lively" };
  return map[val] || startCase(val);
}
