// src/controllers/admin/logs.controller.js
const { db } = require("../../config/firebase");

const LOGS = () => db.collection("verificationLogs");

/**
 * GET /admin/logs?userId=...&ownerId=...&type=...
 * Optional filters: userId, ownerId, type
 */
const getLogs = async (req, res, next) => {
  try {
    const { userId, ownerId, type } = req.query || {};

    // Build Firestore queries based on available filters
    const queries = [];

    if (userId)  queries.push(LOGS().where("userId", "==", userId));
    if (ownerId) queries.push(LOGS().where("ownerId", "==", ownerId));
    if (type)    queries.push(LOGS().where("type", "==", type));

    // No filters → return latest logs (global view)
    if (!queries.length) {
      const snap = await LOGS().orderBy("createdAt", "desc").limit(50).get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return res.json({ items });
    }

    // Combine filtered queries
    const results = await Promise.all(
      queries.map((q) => q.orderBy("createdAt", "desc").limit(50).get())
    );

    // Flatten and sort all fetched logs
    const items = results
      .flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    res.json({ items });
  } catch (e) {
    console.error("getLogs error:", e);
    next(e);
  }
};

module.exports = { getLogs };
