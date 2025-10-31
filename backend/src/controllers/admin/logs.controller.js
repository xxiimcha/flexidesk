const { db } = require("../../config/firebase");

const LOGS = () => db.collection("verificationLogs");

/**
 * GET /admin/logs?userId=...&ownerId=...
 */
exports.getLogs = async (req, res, next) => {
  try {
    const { userId, ownerId } = req.query;

    const qs = [];
    if (userId) qs.push(LOGS().where("userId", "==", userId));
    if (ownerId) qs.push(LOGS().where("ownerId", "==", ownerId));

    if (!qs.length) return res.json({ items: [] });

    const results = await Promise.all(
      qs.map((q) => q.orderBy("createdAt", "desc").limit(50).get())
    );

    const items = results
      .flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    res.json({ items });
  } catch (e) {
    next(e);
  }
};
