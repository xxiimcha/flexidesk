// components/SummaryCard.jsx
import {
  MapPin, Users, Building2, DoorOpen, Wifi, Plug,
  CheckCircle2, ShieldCheck, Quote, Image as ImageIcon, Tag
} from "lucide-react";
import { categories, bookingScopes, AMENITIES } from "../constants";

export default function SummaryCard({ draft, step }) {
  const categoryLabel = categories.find((x) => x.id === draft.category)?.label ?? "—";
  const scopeLabel = bookingScopes.find((x) => x.id === draft.scope)?.label ?? "—";
  const currency = draft.currency || "PHP";

  const addr = joinParts([
    draft.venue, draft.address, draft.address2, draft.district,
    draft.city, draft.region, draft.zip, draft.country
  ]);

  // Amenities
  const selectedAmenityIds = Object.entries(draft.amenities || {})
    .filter(([, v]) => v)
    .map(([k]) => k);
  const selectedAmenities = AMENITIES.filter((a) =>
    selectedAmenityIds.includes(a.id)
  ).map((a) => a.label);
  const amenPreview = selectedAmenities.slice(0, 3);
  const amenMore = Math.max(0, selectedAmenities.length - amenPreview.length);

  // Pricing chips (only show those that exist)
  const prices = [
    ["Price per seat (day)", draft.priceSeatDay],
    ["Price per seat (hour)", draft.priceSeatHour],
    ["Price per room (hour)", draft.priceRoomHour],
    ["Price per room (day)", draft.priceRoomDay],
    ["Entire space (day)", draft.priceWholeDay],
    ["Entire space (month)", draft.priceWholeMonth],
  ].filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");

  // Photos
  const photos = draft.photosMeta || []; // [{name,size,type}]
  const coverIdx = typeof draft.coverIndex === "number" ? draft.coverIndex : 0;
  const coverName = photos[coverIdx]?.name;

  // Noise label
  const NOISE = { quiet: "Quiet (library-like)", moderate: "Moderate", lively: "Lively" };
  const noiseLabel = NOISE[draft.noiseLevel] || undefined;

  return (
    <section className="space-y-5">
      {/* Progress pill */}
      <div className="text-xs text-slate rounded-full bg-slate-100 inline-block px-2 py-0.5">
        Step {Math.min(step, 4)} / 4
      </div>

      {/* Type */}
      <Block title="Type">
        <Item icon={<CheckCircle2 className="w-4 h-4" />} label="Category" value={categoryLabel} />
        <Item icon={<CheckCircle2 className="w-4 h-4" />} label="Booking type" value={scopeLabel} />
      </Block>

      {/* Description */}
      {(draft.shortDesc || draft.longDesc) && (
        <Block title="Description">
          {draft.shortDesc && (
            <Item
              icon={<Tag className="w-4 h-4" />}
              label="Headline"
              value={draft.shortDesc}
            />
          )}
          {draft.longDesc && (
            <Item
              icon={<Quote className="w-4 h-4" />}
              label="About the space"
              value={<ClampText text={draft.longDesc} max={240} />}
            />
          )}
        </Block>
      )}

      {/* Location */}
      <Block title="Location">
        <Item
          icon={<MapPin className="w-4 h-4" />}
          label="Address"
          value={addr || "—"}
          pill={
            <Pill
              tone={draft.showApprox ? "amber" : "emerald"}
              text={draft.showApprox ? "Approximate shown" : "Exact after booking"}
            />
          }
        />
        <MiniRow>
          <MiniChip label={`Lat: ${fmt(draft.lat)}`} />
          <MiniChip label={`Lng: ${fmt(draft.lng)}`} />
        </MiniRow>
      </Block>

      {/* Basics */}
      <Block title="Basics">
        <Item icon={<Users className="w-4 h-4" />} label="Seats" value={numOrDash(draft.seats)} />
        {(draft.rooms ?? 0) > 0 && (
          <Item icon={<Building2 className="w-4 h-4" />} label="Rooms/areas" value={numOrDash(draft.rooms)} />
        )}
        {(draft.privateRooms ?? 0) > 0 && (
          <Item icon={<DoorOpen className="w-4 h-4" />} label="Private rooms" value={numOrDash(draft.privateRooms)} />
        )}
        {draft.minHours ? (
          <Item icon={<DoorOpen className="w-4 h-4 rotate-180" />} label="Min booking" value={`${draft.minHours} hr`} />
        ) : null}
      </Block>

      {/* Connectivity */}
      {(draft.wifiMbps || draft.outletsPerSeat || noiseLabel) && (
        <Block title="Connectivity">
          <Item
            icon={<Wifi className="w-4 h-4" />}
            label="Wi-Fi speed"
            value={draft.wifiMbps ? `${draft.wifiMbps} Mbps` : "—"}
          />
          <Item
            icon={<Plug className="w-4 h-4" />}
            label="Outlets/seat"
            value={numOrDash(draft.outletsPerSeat)}
          />
          {noiseLabel && (
            <Item
              icon={<Plug className="w-4 h-4 opacity-0" />} // spacer to align
              label="Noise level"
              value={noiseLabel}
            />
          )}
        </Block>
      )}

      {/* Pricing */}
      {(prices.length > 0 || draft.serviceFee || draft.cleaningFee) && (
        <Block title="Pricing">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700 ring-1 ring-slate-200">
              Currency: {currency}
            </span>
            {prices.map(([label, val]) => (
              <span
                key={label}
                className="text-xs rounded-full bg-white px-2 py-1 text-slate-700 ring-1 ring-slate-200"
                title={label}
              >
                {label}: <strong>{currency} {fmtMoney(val)}</strong>
              </span>
            ))}
          </div>
          {(draft.serviceFee || draft.cleaningFee) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {draft.serviceFee && (
                <span className="text-xs rounded-full bg-slate-50 px-2 py-1 text-slate-700 ring-1 ring-slate-200">
                  Service fee: {currency} {fmtMoney(draft.serviceFee)}
                </span>
              )}
              {draft.cleaningFee && (
                <span className="text-xs rounded-full bg-slate-50 px-2 py-1 text-slate-700 ring-1 ring-slate-200">
                  Cleaning fee: {currency} {fmtMoney(draft.cleaningFee)}
                </span>
              )}
            </div>
          )}
        </Block>
      )}

      {/* Photos */}
      <Block title="Photos">
        {photos.length === 0 ? (
          <div className="text-sm text-slate">No photos selected yet.</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700 ring-1 ring-slate-200">
                {photos.length} {photos.length === 1 ? "photo" : "photos"}
              </span>
              {typeof coverIdx === "number" && photos[coverIdx] && (
                <span className="text-xs rounded-full bg-amber-100 px-2 py-1 text-amber-800 ring-1 ring-amber-200 inline-flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Cover: {truncate(photos[coverIdx].name, 28)}
                </span>
              )}
            </div>
            {photos.length > 0 && (
              <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {photos.slice(0, 4).map((p, i) => (
                  <li key={`${p.name}_${i}`} className="text-xs text-slate-700 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{truncate(p.name, 36)}</span>
                    <span className="text-slate-500">({bytes(p.size)})</span>
                  </li>
                ))}
              </ul>
            )}
            {photos.length > 4 && (
              <div className="text-xs text-slate mt-1">+{photos.length - 4} more</div>
            )}
          </>
        )}
      </Block>

      {/* Essentials */}
      <Block title="Essentials">
        {selectedAmenities.length === 0 ? (
          <div className="text-sm text-slate">No essentials selected yet.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {amenPreview.map((t) => (
              <span key={t} className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700 ring-1 ring-slate-200">
                {t}
              </span>
            ))}
            {amenMore > 0 && (
              <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700 ring-1 ring-slate-200">
                +{amenMore} more
              </span>
            )}
          </div>
        )}
      </Block>

      {/* Privacy note */}
      <div className="flex items-start gap-2 text-xs text-slate">
        <ShieldCheck className="h-4 w-4 mt-0.5" />
        Exact addresses remain private until a booking is confirmed.
      </div>
    </section>
  );
}

/* ---------- Tiny UI helpers ---------- */
function Block({ title, children }) {
  return (
    <div className="rounded-xl ring-1 ring-slate-200 p-3">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Item({ icon, label, value, pill }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <div className="mt-0.5 text-slate flex-none">{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-slate">{label}</div>
          <div className="text-sm font-medium text-ink break-words">{value}</div>
        </div>
      </div>
      {pill}
    </div>
  );
}
function Pill({ text, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-800",
    emerald: "bg-emerald-100 text-emerald-800",
  };
  return <span className={`text-xs rounded-full px-2 py-0.5 ${tones[tone]} whitespace-nowrap`}>{text}</span>;
}
function MiniRow({ children }) {
  return <div className="flex flex-wrap gap-2 mt-1">{children}</div>;
}
function MiniChip({ label }) {
  return <span className="text-xs rounded-md bg-white ring-1 ring-slate-200 px-2 py-1 text-slate-700">{label}</span>;
}
function joinParts(arr) { return arr.filter(Boolean).map((s) => String(s).trim()).filter(Boolean).join(", "); }
function fmt(v) { return v === undefined || v === null || v === "" ? "—" : v; }
function numOrDash(v) { const n = Number(v || 0); return n > 0 ? n : "—"; }
function truncate(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
function bytes(b) {
  const n = Number(b || 0);
  if (!n) return "0 B";
  const u = ["B","KB","MB","GB","TB"]; const i = Math.min(u.length - 1, Math.floor(Math.log2(n) / 10));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}
function fmtMoney(v) {
  const num = Number(String(v).replace(/[^0-9.]/g, "")) || 0;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function ClampText({ text, max = 200 }) {
  const t = String(text || "");
  return <span>{t.length > max ? t.slice(0, max - 1) + "…" : t}</span>;
}
