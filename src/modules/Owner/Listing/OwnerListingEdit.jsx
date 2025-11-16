// src/modules/Owner/Listing/OwnerListingEdit.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X, MapPin } from "lucide-react";
import OwnerShell from "../components/OwnerShell";
import Card from "./components/Card";
import Toast from "../components/Toast";
import api from "@/services/api";

/* ---------- helpers ---------- */
const toStr = (v) => (v === null || v === undefined ? "" : String(v));
const toNumOrNull = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toBool = (v) => Boolean(v);

function renderLocation(src = {}) {
  const parts = [toStr(src.city).trim(), toStr(src.region).trim(), toStr(src.country).trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}
/* -------------------------------- */

export default function OwnerListingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState({ open: false, tone: "success", message: "" });

  const headerProps = {
    title: "Edit Listing",
    query: "",
    onQueryChange: () => {},
    onRefresh: () => window.location.reload(),
  };
  const sidebarProps = { statusFilter: "all", setStatusFilter: () => {} };

  // load listing
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get(`/owner/listings/${id}`);
        if (cancelled) return;
        const listing = { id: data?.listing?._id || data?.listing?.id || id, ...data.listing };
        setItem(listing);
        setForm(extractForm(listing));
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.data?.message || e.message || "Failed to load listing";
          setErr(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function defaultForm() {
    return {
      // core
      category: "meeting", // meeting | hotdesk | office | venue (your taxonomy)
      scope: "entire",     // entire | shared
      venue: "",
      address: "",
      address2: "",
      district: "",
      city: "",
      region: "",
      zip: "",
      country: "Philippines",
      lat: "",
      lng: "",
      showApprox: false,

      // capacity & rules
      seats: 0,
      rooms: 0,
      privateRooms: 0,
      minHours: 1,
      hasLocks: false,

      // descriptions
      shortDesc: "",
      longDesc: "",

      // connectivity & noise
      wifiMbps: "",
      outletsPerSeat: "",
      noiseLevel: "", // quiet | normal | lively, etc.

      // pricing
      currency: "PHP",
      priceSeatDay: null,
      priceSeatHour: null,
      priceRoomHour: null,
      priceRoomDay: null,
      priceWholeDay: null,
      priceWholeMonth: null,
      serviceFee: null,
      cleaningFee: null,

      // amenities & access
      amenities: {
        wifi: false,
        ac: false,
        power: false,
        coffee: false,
        whiteboard: false,
        projector: false,
      },
      accessibility: {
        elevator: false,
        restroom: false,
      },

      parking: "", // onsite | street | none | paid, etc.

      // additional, non-required settings
      customMessage: "",
      guestNotes: "",
      openingHoursWeekdays: "",
      openingHoursWeekends: "",
      checkinInstructions: "",
      otherRules: "",
    };
  }

  function extractForm(x = {}) {
    return {
      // core
      category: toStr(x.category) || "meeting",
      scope: toStr(x.scope) || "entire",
      venue: toStr(x.venue),
      address: toStr(x.address),
      address2: toStr(x.address2),
      district: toStr(x.district),
      city: toStr(x.city),
      region: toStr(x.region),
      zip: toStr(x.zip),
      country: toStr(x.country) || "Philippines",
      lat: toStr(x.lat),
      lng: toStr(x.lng),
      showApprox: toBool(x.showApprox),

      // capacity & rules
      seats: Number.isFinite(Number(x.seats)) ? Number(x.seats) : 0,
      rooms: Number.isFinite(Number(x.rooms)) ? Number(x.rooms) : 0,
      privateRooms: Number.isFinite(Number(x.privateRooms)) ? Number(x.privateRooms) : 0,
      minHours: Number.isFinite(Number(x.minHours)) ? Number(x.minHours) : 1,
      hasLocks: toBool(x.hasLocks),

      // descriptions
      shortDesc: toStr(x.shortDesc),
      longDesc: toStr(x.longDesc),

      // connectivity & noise
      wifiMbps: toStr(x.wifiMbps),
      outletsPerSeat: toStr(x.outletsPerSeat),
      noiseLevel: toStr(x.noiseLevel),

      // pricing
      currency: toStr(x.currency) || "PHP",
      priceSeatDay: x.priceSeatDay ?? null,
      priceSeatHour: x.priceSeatHour ?? null,
      priceRoomHour: x.priceRoomHour ?? null,
      priceRoomDay: x.priceRoomDay ?? null,
      priceWholeDay: x.priceWholeDay ?? null,
      priceWholeMonth: x.priceWholeMonth ?? null,
      serviceFee: x.serviceFee ?? null,
      cleaningFee: x.cleaningFee ?? null,

      // amenities & access
      amenities: {
        wifi: toBool(x?.amenities?.wifi),
        ac: toBool(x?.amenities?.ac),
        power: toBool(x?.amenities?.power),
        coffee: toBool(x?.amenities?.coffee),
        whiteboard: toBool(x?.amenities?.whiteboard),
        projector: toBool(x?.amenities?.projector),
      },
      accessibility: {
        elevator: toBool(x?.accessibility?.elevator),
        restroom: toBool(x?.accessibility?.restroom),
      },

      parking: toStr(x.parking),

      // additional, non-required settings
      customMessage: toStr(x.customMessage),
      guestNotes: toStr(x.guestNotes),
      openingHoursWeekdays: toStr(x.openingHoursWeekdays),
      openingHoursWeekends: toStr(x.openingHoursWeekends),
      checkinInstructions: toStr(x.checkinInstructions),
      otherRules: toStr(x.otherRules),
    };
  }

  function setField(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
    setDirty(true);
  }
  function setAmenity(k, v) {
    setForm((s) => ({ ...s, amenities: { ...s.amenities, [k]: v } }));
    setDirty(true);
  }
  function setAccess(k, v) {
    setForm((s) => ({ ...s, accessibility: { ...s.accessibility, [k]: v } }));
    setDirty(true);
  }

  const title = toStr(item?.shortDesc) || (loading ? "…" : "Untitled listing");

  // save — send ALL fields; convert blanks appropriately
  const save = async () => {
    const problems = [];
    if (!toStr(form.shortDesc).trim()) problems.push("Short description is required.");
    if (!toStr(form.city).trim()) problems.push("City is required.");
    if (!toStr(form.country).trim()) problems.push("Country is required.");
    if (problems.length) {
      setToast({ open: true, tone: "error", message: problems[0] });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        // core
        category: toStr(form.category),
        scope: toStr(form.scope),
        venue: toStr(form.venue),
        address: toStr(form.address),
        address2: toStr(form.address2),
        district: toStr(form.district),
        city: toStr(form.city),
        region: toStr(form.region),
        zip: toStr(form.zip),
        country: toStr(form.country),
        lat: toStr(form.lat),
        lng: toStr(form.lng),
        showApprox: toBool(form.showApprox),

        // capacity & rules
        seats: Number.isFinite(Number(form.seats)) ? Number(form.seats) : 0,
        rooms: Number.isFinite(Number(form.rooms)) ? Number(form.rooms) : 0,
        privateRooms: Number.isFinite(Number(form.privateRooms)) ? Number(form.privateRooms) : 0,
        minHours: Number.isFinite(Number(form.minHours)) ? Number(form.minHours) : 1,
        hasLocks: toBool(form.hasLocks),

        // descriptions
        shortDesc: toStr(form.shortDesc),
        longDesc: toStr(form.longDesc),

        // connectivity & noise
        wifiMbps: toStr(form.wifiMbps),
        outletsPerSeat: toStr(form.outletsPerSeat),
        noiseLevel: toStr(form.noiseLevel),

        // pricing (numbers or null)
        currency: toStr(form.currency) || "PHP",
        priceSeatDay: toNumOrNull(form.priceSeatDay),
        priceSeatHour: toNumOrNull(form.priceSeatHour),
        priceRoomHour: toNumOrNull(form.priceRoomHour),
        priceRoomDay: toNumOrNull(form.priceRoomDay),
        priceWholeDay: toNumOrNull(form.priceWholeDay),
        priceWholeMonth: toNumOrNull(form.priceWholeMonth),
        serviceFee: toNumOrNull(form.serviceFee),
        cleaningFee: toNumOrNull(form.cleaningFee),

        // nested objects
        amenities: {
          wifi: toBool(form.amenities?.wifi),
          ac: toBool(form.amenities?.ac),
          power: toBool(form.amenities?.power),
          coffee: toBool(form.amenities?.coffee),
          whiteboard: toBool(form.amenities?.whiteboard),
          projector: toBool(form.amenities?.projector),
        },
        accessibility: {
          elevator: toBool(form.accessibility?.elevator),
          restroom: toBool(form.accessibility?.restroom),
        },

        parking: toStr(form.parking),

        // additional, non-required settings
        customMessage: toStr(form.customMessage),
        guestNotes: toStr(form.guestNotes),
        openingHoursWeekdays: toStr(form.openingHoursWeekdays),
        openingHoursWeekends: toStr(form.openingHoursWeekends),
        checkinInstructions: toStr(form.checkinInstructions),
        otherRules: toStr(form.otherRules),
      };

      await api.put(`/owner/listings/${id}`, payload);
      setToast({ open: true, tone: "success", message: "Listing updated." });
      setDirty(false);
      navigate(`/owner/listings/${id}`); // back to manage page
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Save failed.";
      setToast({ open: true, tone: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    navigate(`/owner/listings/${id}`);
  };

  return (
    <OwnerShell headerProps={headerProps} sidebarProps={sidebarProps}>
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (dirty && !confirm("Discard unsaved changes?")) return;
            navigate(-1);
          }}
          className="rounded-md border px-2.5 py-1.5 text-sm hover:bg-slate-50 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="ml-auto" />
      </div>

      {/* Title */}
      <div className="mt-4">
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {item && (
          <div className="text-sm text-slate mt-1 inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {renderLocation(item)}
          </div>
        )}
      </div>

      {err && (
        <div className="mt-4 rounded-md bg-rose-50 ring-1 ring-rose-200 text-rose-800 px-3 py-2 text-sm">
          {err}
        </div>
      )}
      {loading && !item && <div className="mt-6 text-slate">Loading…</div>}

      {item && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {/* Overview / Descriptions */}
          <Card
            title="Overview"
            className="md:col-span-2"
            headerRight={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={onCancel}
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Category">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                >
                  <option value="meeting">meeting</option>
                  <option value="hotdesk">hotdesk</option>
                  <option value="office">office</option>
                  <option value="venue">venue</option>
                </select>
              </Field>
              <Field label="Scope">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                  value={form.scope}
                  onChange={(e) => setField("scope", e.target.value)}
                >
                  <option value="entire">entire</option>
                  <option value="shared">shared</option>
                </select>
              </Field>

              <Field label="Short description">
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.shortDesc}
                  onChange={(e) => setField("shortDesc", e.target.value)}
                />
              </Field>
              <Field label="Parking">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                  value={form.parking}
                  onChange={(e) => setField("parking", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="onsite">onsite</option>
                  <option value="street">street</option>
                  <option value="paid">paid</option>
                  <option value="none">none</option>
                </select>
              </Field>

              <Field label="Long description" full>
                <textarea
                  rows={5}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.longDesc}
                  onChange={(e) => setField("longDesc", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* Quick preview */}
          <Card title="Preview">
            <div className="text-sm text-slate">
              <div className="font-medium text-ink">{form.shortDesc || "—"}</div>
              <div className="mt-1">{renderLocation(form)}</div>
              <div className="mt-2">
                {form.currency} {Number(form.priceSeatDay ?? 0).toLocaleString()} / Seat day
              </div>
              {form.customMessage && (
                <div className="mt-3 text-xs text-slate-500 border-t pt-2">
                  Custom message: {form.customMessage}
                </div>
              )}
            </div>
          </Card>

          {/* Location */}
          <Card title="Location" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Venue / Building">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.venue}
                  onChange={(e) => setField("venue", e.target.value)}
                  placeholder="One Ayala Tower, Makati"
                />
              </Field>
              <Field label="Address line 1">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                />
              </Field>
              <Field label="Address line 2">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.address2}
                  onChange={(e) => setField("address2", e.target.value)}
                  placeholder="Floor / Unit"
                />
              </Field>
              <Field label="District / Barangay">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.district}
                  onChange={(e) => setField("district", e.target.value)}
                />
              </Field>
              <Field label="City">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </Field>
              <Field label="Region / State">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.region}
                  onChange={(e) => setField("region", e.target.value)}
                />
              </Field>
              <Field label="ZIP">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.zip}
                  onChange={(e) => setField("zip", e.target.value)}
                />
              </Field>
              <Field label="Country">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                />
              </Field>
              <Field label="Latitude">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.lat}
                  onChange={(e) => setField("lat", e.target.value)}
                />
              </Field>
              <Field label="Longitude">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.lng}
                  onChange={(e) => setField("lng", e.target.value)}
                />
              </Field>
              <Field label="Show exact only after booking">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.showApprox}
                    onChange={(e) => setField("showApprox", e.target.checked)}
                  />
                  Hide exact location until booking
                </label>
              </Field>
            </div>
          </Card>

          {/* Capacity & Rules */}
          <Card title="Capacity & Rules" className="md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Field label="Seats">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.seats}
                  onChange={(e) => setField("seats", e.target.value)}
                  min={0}
                />
              </Field>
              <Field label="Rooms">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.rooms}
                  onChange={(e) => setField("rooms", e.target.value)}
                  min={0}
                />
              </Field>
              <Field label="Private rooms">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.privateRooms}
                  onChange={(e) => setField("privateRooms", e.target.value)}
                  min={0}
                />
              </Field>
              <Field label="Min hours">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.minHours}
                  onChange={(e) => setField("minHours", e.target.value)}
                  min={0}
                />
              </Field>
              <Field label="Locks available">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.hasLocks}
                    onChange={(e) => setField("hasLocks", e.target.checked)}
                  />
                  Has locks
                </label>
              </Field>
            </div>
          </Card>

          {/* Connectivity & Noise */}
          <Card title="Connectivity & Noise" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Wi-Fi Mbps">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.wifiMbps}
                  onChange={(e) => setField("wifiMbps", e.target.value)}
                />
              </Field>
              <Field label="Outlets per seat">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.outletsPerSeat}
                  onChange={(e) => setField("outletsPerSeat", e.target.value)}
                />
              </Field>
              <Field label="Typical noise">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                  value={form.noiseLevel}
                  onChange={(e) => setField("noiseLevel", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="quiet">Quiet</option>
                  <option value="normal">Normal</option>
                  <option value="lively">Lively</option>
                </select>
              </Field>
            </div>
          </Card>

          {/* Pricing */}
          <Card title="Pricing" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Currency">
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>
              <Field label="Seat / hour">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={toStr(form.priceSeatHour ?? "")}
                  onChange={(e) => setField("priceSeatHour", e.target.value)}
                  min={0}
                  step="0.01"
                />
              </Field>
              <Field label="Seat / day">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={toStr(form.priceSeatDay ?? "")}
                  onChange={(e) => setField("priceSeatDay", e.target.value)}
                  min={0}
                  step="0.01"
                />
              </Field>
              <Field label="Room / hour">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={toStr(form.priceRoomHour ?? "")}
                  onChange={(e) => setField("priceRoomHour", e.target.value)}
                  min={0}
                  step="0.01"
                />
              </Field>
              <Field label="Room / day">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={toStr(form.priceRoomDay ?? "")}
                  onChange={(e) => setField("priceRoomDay", e.target.value)}
                  min={0}
                  step="0.01"
                />
              </Field>
              <Field label="Whole-day (entire)">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={toStr(form.priceWholeDay ?? "")}
                  onChange={(e) => setField("priceWholeDay", e.target.value)}
                  min={0}
                  step="0.01"
                />
              </Field>
              <Field label="Whole-month (entire)">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={toStr(form.priceWholeMonth ?? "")}
                  onChange={(e) => setField("priceWholeMonth", e.target.value)}
                  min={0}
                  step="0.01"
                />
              </Field>
              <Field label="Service fee">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={toStr(form.serviceFee ?? "")}
                  onChange={(e) => setField("serviceFee", e.target.value)}
                  min={0}
                  step="0.01"
                />
              </Field>
              <Field label="Cleaning fee">
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={toStr(form.cleaningFee ?? "")}
                  onChange={(e) => setField("cleaningFee", e.target.value)}
                  min={0}
                  step="0.01"
                />
              </Field>
            </div>
          </Card>

          {/* Amenities */}
          <Card title="Amenities" className="md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                ["wifi", "Wi-Fi"],
                ["ac", "Air conditioning"],
                ["power", "Power"],
                ["coffee", "Coffee"],
                ["whiteboard", "Whiteboard"],
                ["projector", "Projector"],
              ].map(([key, label]) => (
                <CheckboxRow
                  key={key}
                  label={label}
                  checked={!!form.amenities[key]}
                  onChange={(v) => setAmenity(key, v)}
                />
              ))}
            </div>
          </Card>

          {/* Accessibility */}
          <Card title="Accessibility" className="md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ["elevator", "Elevator"],
                ["restroom", "Restroom"],
              ].map(([key, label]) => (
                <CheckboxRow
                  key={key}
                  label={label}
                  checked={!!form.accessibility[key]}
                  onChange={(v) => setAccess(key, v)}
                />
              ))}
            </div>
          </Card>

          {/* Additional settings (optional) */}
          <Card title="Additional settings" className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Custom message for guests">
                <textarea
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Shown to guests on the booking page or confirmation…"
                  value={form.customMessage}
                  onChange={(e) => setField("customMessage", e.target.value)}
                />
              </Field>
              <Field label="Extra notes (what to prepare, expectations)">
                <textarea
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.guestNotes}
                  onChange={(e) => setField("guestNotes", e.target.value)}
                />
              </Field>
              <Field label="Opening hours (weekdays)">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="e.g. Mon–Fri, 9:00 AM – 7:00 PM"
                  value={form.openingHoursWeekdays}
                  onChange={(e) => setField("openingHoursWeekdays", e.target.value)}
                />
              </Field>
              <Field label="Opening hours (weekends)">
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="e.g. Sat–Sun, 10:00 AM – 5:00 PM or Closed"
                  value={form.openingHoursWeekends}
                  onChange={(e) => setField("openingHoursWeekends", e.target.value)}
                />
              </Field>
              <Field label="Check-in instructions">
                <textarea
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Where to go, who to look for, how to access the space…"
                  value={form.checkinInstructions}
                  onChange={(e) => setField("checkinInstructions", e.target.value)}
                />
              </Field>
              <Field label="Other rules (optional)">
                <textarea
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="House rules, noise limits, food policy, etc."
                  value={form.otherRules}
                  onChange={(e) => setField("otherRules", e.target.value)}
                />
              </Field>
            </div>
          </Card>
        </div>
      )}

      <Toast
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </OwnerShell>
  );
}

/* ------------ small UI helpers ------------ */
function Field({ label, children, full }) {
  return (
    <div className={`space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <label className="text-xs text-slate">{label}</label>
      {children}
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
