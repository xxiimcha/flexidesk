// src/controllers/items.controller.js
const { admin, db } = require("../config/firebase");
const { badRequest } = require("../utils/httpErrors");

exports.create = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) throw badRequest("Unauthenticated");

    const b = req.body || {};

    // Minimal validation (add more as needed)
    const missing = [];
    if (!b.category) missing.push("category");
    if (!b.scope) missing.push("scope");
    if (!b.city) missing.push("city");
    if (!b.country) missing.push("country");
    if ((Number(b.seats) || 0) <= 0) missing.push("seats");
    if (missing.length) throw badRequest("Missing required fields", { missing });

    // ... build doc (same as before) ...
    const doc = {
      ownerId: uid,
      category: b.category || null,
      scope: b.scope || null,
      // location
      venue: b.venue || null,
      address: b.address || null,
      address2: b.address2 || null,
      district: b.district || null,
      city: b.city || null,
      region: b.region || null,
      zip: b.zip || null,
      country: b.country || null,
      lat: b.lat ? Number(b.lat) : null,
      lng: b.lng ? Number(b.lng) : null,
      showApprox: b.showApprox === true || b.showApprox === "true" || b.showApprox === "1",
      // basics
      seats: Number(b.seats) || 0,
      rooms: Number(b.rooms) || 0,
      privateRooms: Number(b.privateRooms) || 0,
      minHours: Number(b.minHours) || 0,
      hasLocks: b.hasLocks === true || b.hasLocks === "true" || b.hasLocks === "1",
      // description
      shortDesc: b.shortDesc || "",
      longDesc: b.longDesc || "",
      // connectivity
      wifiMbps: b.wifiMbps ? Number(b.wifiMbps) : null,
      outletsPerSeat: b.outletsPerSeat ? Number(b.outletsPerSeat) : null,
      noiseLevel: b.noiseLevel || null,
      // pricing
      currency: b.currency || "PHP",
      priceSeatDay: money(b.priceSeatDay),
      priceSeatHour: money(b.priceSeatHour),
      priceRoomHour: money(b.priceRoomHour),
      priceRoomDay: money(b.priceRoomDay),
      priceWholeDay: money(b.priceWholeDay),
      priceWholeMonth: money(b.priceWholeMonth),
      serviceFee: money(b.serviceFee),
      cleaningFee: money(b.cleaningFee),
      // objects
      amenities: obj(b.amenities),
      accessibility: obj(b.accessibility),
      parking: b.parking || "none",
      photos: [], // images deferred
      coverIndex: Number(b.coverIndex || 0),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending_review",
    };

    const ref = await db.collection("listings").add(doc);
    res.status(201).json({ id: ref.id });
  } catch (e) {
    // let the global error handler format it
    return next(e);
  }
};

function money(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function obj(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return {}; }
}
