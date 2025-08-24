// src/controllers/listings.controller.js
const { db } = require("../config/firebase");

/**
 * GET /api/listings/published
 * Optional query params:
 *   - limit=24 (1..100)
 *   - cursor=<listingId>  (opaque id cursor in sorted list)
 *   - city=, country=, category=, scope=  (simple exact filters; case-insensitive)
 * Excludes the caller's own listings when req.user?.uid is present.
 */
exports.listPublished = async (req, res, next) => {
  try {
    const uid = req.user?.uid || null;

    const rawLimit = parseInt(req.query.limit || "24", 10);
    const limit = Math.max(1, Math.min(rawLimit, 100));
    const cursorId = req.query.cursor ? String(req.query.cursor) : null;

    const filters = {
      city:      String(req.query.city || "").trim(),
      country:   String(req.query.country || "").trim(),
      category:  String(req.query.category || "").trim(),
      scope:     String(req.query.scope || "").trim(),
    };

    // Single-field equality: no composite index required
    const snap = await db.collection("listings")
      .where("status", "==", "published")
      .get();

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

    // Exclude my own listings if authenticated
    if (uid) items = items.filter(it => it.ownerId !== uid);

    // Optional, in-memory filters (avoid composite indexes)
    const eq = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();
    if (filters.city)     items = items.filter(it => eq(it.city, filters.city));
    if (filters.country)  items = items.filter(it => eq(it.country, filters.country));
    if (filters.category) items = items.filter(it => eq(it.category, filters.category));
    if (filters.scope)    items = items.filter(it => eq(it.scope, filters.scope));

    // Sort newest first by updatedAt/createdAt
    items.sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });

    // Cursor-based paging in memory
    let start = 0;
    if (cursorId) {
      const idx = items.findIndex(it => it.id === cursorId);
      if (idx !== -1) start = idx + 1;
    }
    const page = items.slice(start, start + limit);
    const nextCursor = (start + limit < items.length) ? items[start + limit - 1].id : null;

    res.json({ items: page, nextCursor });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/listings/public/:id
 * Only returns a listing if it's published.
 */
exports.getPublic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const snap = await db.collection("listings").doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: "not_found" });

    const data = snap.data();
    if (data.status !== "published") {
      return res.status(403).json({ error: "not_published" });
    }

    const toIso = (ts) => (ts && typeof ts.toDate === "function" ? ts.toDate().toISOString() : null);
    res.json({
      id: snap.id,
      ...data,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    });
  } catch (err) {
    next(err);
  }
};
