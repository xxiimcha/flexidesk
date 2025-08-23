// src/controllers/items.controller.js
const { admin, db } = require("../config/firebase");
const { badRequest } = require("../utils/httpErrors");

exports.create = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) throw badRequest("Unauthenticated");

    const b = req.body || {};

    // Basic validation
    const missing = [];
    if (!b.category) missing.push("category");
    if (!b.scope) missing.push("scope");
    if (!b.city) missing.push("city");
    if (!b.country) missing.push("country");
    if ((Number(b.seats) || 0) <= 0) missing.push("seats");
    if (missing.length) throw badRequest("Missing required fields", { missing });

    // Normalizers
    const S = (v) => (typeof v === "string" ? v.trim() : v);
    const I = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => {
      const n = Number(v); return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : 0;
    };
    const F = (v) => (v === "" || v == null ? null : Number(v));
    const money = (v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(String(v).replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : null;
    };
    const obj = (v) => {
      if (!v) return {};
      if (typeof v === "object") return v;
      try { return JSON.parse(v); } catch { return {}; }
    };

    const doc = {
      ownerId: uid,
      category: S(b.category) || null,
      scope: S(b.scope) || null,

      // location
      venue: S(b.venue) || null,
      address: S(b.address) || null,
      address2: S(b.address2) || null,
      district: S(b.district) || null,
      city: S(b.city) || null,
      region: S(b.region) || null,
      zip: S(b.zip) || null,
      country: S(b.country) || null,
      lat: F(b.lat),
      lng: F(b.lng),
      showApprox: b.showApprox === true || b.showApprox === "true" || b.showApprox === "1",

      // basics
      seats: I(b.seats, 1, 9999),
      rooms: I(b.rooms, 0, 999),
      privateRooms: I(b.privateRooms, 0, 999),
      minHours: I(b.minHours, 0, 24),
      hasLocks: b.hasLocks === true || b.hasLocks === "true" || b.hasLocks === "1",

      // description
      shortDesc: S(b.shortDesc) || "",
      longDesc: S(b.longDesc) || "",

      // connectivity
      wifiMbps: F(b.wifiMbps),
      outletsPerSeat: F(b.outletsPerSeat),
      noiseLevel: S(b.noiseLevel) || null,

      // pricing
      currency: S((b.currency || "PHP")).toUpperCase(),
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
      parking: S(b.parking) || "none",

      photos: [], // images deferred
      coverIndex: I(b.coverIndex, 0),

      // status / meta
      status: "pending_review",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection("listings").add(doc);

    // Optional: quick “my listings” index
    await db.collection("users").doc(uid).collection("listings").doc(ref.id).set({
      listingId: ref.id,
      status: doc.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Nice response for the client
    res
      .status(201)
      .set("Location", `/api/items/${ref.id}`)
      .json({ id: ref.id, status: doc.status });
  } catch (e) {
    return next(e);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) throw badRequest("Unauthenticated");

    // Inputs
    const rawLimit = parseInt(req.query.limit || "20", 10);
    const limit = Math.max(1, Math.min(rawLimit, 100)); // cap to keep memory sane
    const cursorId = req.query.cursor ? String(req.query.cursor) : null;
    const statusParam = String(req.query.status || "").trim().toLowerCase(); // optional

    // 🚫 No composite index needed: single-field equality only
    const snap = await db.collection("listings")
      .where("ownerId", "==", uid)
      .get();

    // Normalize docs
    const toIso = (ts) => (ts && typeof ts.toDate === "function" ? ts.toDate().toISOString() : null);
    let items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
      };
    });

    // Optional filter (done in memory to avoid composite index)
    if (statusParam) {
      items = items.filter(it => String(it.status || "").toLowerCase() === statusParam);
    }

    // Sort newest first (in memory)
    items.sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });

    // Cursor slicing (also in memory)
    let start = 0;
    if (cursorId) {
      const idx = items.findIndex(it => it.id === cursorId);
      if (idx !== -1) start = idx + 1;
    }
    const page = items.slice(start, start + limit);
    const nextCursor = (start + limit < items.length) ? items[start + limit - 1].id : null;

    res.json({ items: page, nextCursor });
  } catch (e) {
    next(e);
  }
};