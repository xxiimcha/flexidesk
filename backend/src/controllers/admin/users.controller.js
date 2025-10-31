const { db, FieldValue, Timestamp } = require("../../config/firebase");

const PROFILES = () => db.collection("profiles");
const LISTINGS = () => db.collection("listings");
const LOGS = () => db.collection("verificationLogs");

async function logVerification(payload = {}) {
  await LOGS().add({ ...payload, createdAt: FieldValue.serverTimestamp() });
}

/**
 * GET /admin/users
 * Query: role, vstatus, search, limit, cursorUpdatedAt, cursorId
 */
exports.listUsers = async (req, res, next) => {
  try {
    const {
      role = "all",
      vstatus = "all",
      search = "",
      limit = "10",
      cursorUpdatedAt,
      cursorId,
    } = req.query;

    const pageSize = Math.min(Number(limit) || 10, 50);

    let q = PROFILES()
      .orderBy("updatedAt", "desc")
      .orderBy("__name__", "desc")
      .limit(pageSize);

    if (cursorUpdatedAt && cursorId) {
      const ts = Timestamp.fromMillis(Number(cursorUpdatedAt));
      q = PROFILES()
        .orderBy("updatedAt", "desc")
        .orderBy("__name__", "desc")
        .startAfter(ts, cursorId)
        .limit(pageSize);
    }

    const snap = await q.get();

    const items = [];
    snap.forEach((doc) => {
      const d = doc.data() || {};
      const status = String(d.verification?.status || "pending").toLowerCase();
      const r = String(d.role || "client").toLowerCase();

      const passRole = role === "all" ? true : r === role;
      const passV = vstatus === "all" ? true : status === vstatus;
      if (!passRole || !passV) return;

      const hay = `${(d.fullName || "").toLowerCase()} ${(d.email || "").toLowerCase()}`;
      if (search && !hay.includes(String(search).toLowerCase())) return;

      items.push({
        id: doc.id,
        fullName: d.fullName || "—",
        email: d.email || "—",
        role: d.role || "client",
        verification: d.verification || { status: "pending" },
        accountStatus: d.accountStatus || "active",
        blockedUntil: d.blockedUntil || null,
        idUrl: d.verification?.idUrl || null,
        updatedAt: d.updatedAt || null,
      });
    });

    const last = snap.docs[snap.docs.length - 1] || null;
    const nextCursor = last
      ? {
          cursorUpdatedAt: last.data()?.updatedAt?.toMillis?.() || 0,
          cursorId: last.id,
        }
      : null;

    res.json({ items, nextCursor });
  } catch (e) {
    next(e);
  }
};

/**
 * POST /admin/users/:id/verify
 * body: { action: "approve"|"reject", note?, idUrl? }
 */
exports.verifyUserId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, note = "", idUrl } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const ref = PROFILES().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ message: "User not found" });

    const verification = {
      ...(snap.data().verification || {}),
      status: action === "approve" ? "verified" : "rejected",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: req.user?.uid || "admin",
      notes: note || snap.data().verification?.notes || "",
      idUrl: idUrl || snap.data().verification?.idUrl || null,
    };

    await ref.update({ verification, updatedAt: FieldValue.serverTimestamp() });
    await logVerification({ type: "user_id", action, userId: id, notes: note });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

/**
 * POST /admin/users/:id/account
 * body: { status: "terminated"|"deactivated"|"blocked"|"active", days? }
 */
exports.setAccountStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, days } = req.body;

    const valid = ["terminated", "deactivated", "blocked", "active"];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const ref = PROFILES().doc(id);
    const data = {
      accountStatus: status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (status === "blocked") {
      const numDays = Math.max(1, Number(days || 1));
      const until = new Date(Date.now() + numDays * 24 * 60 * 60 * 1000);
      data.blockedUntil = Timestamp.fromDate(until);
      await logVerification({
        type: "account",
        action: "blocked",
        userId: id,
        blockedUntil: data.blockedUntil,
      });
    } else {
      data.blockedUntil = null;
      await logVerification({ type: "account", action: status, userId: id });
    }

    await ref.update(data);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /admin/users/:id/listings?status=pending
 */
exports.getOwnerListings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = String(req.query.status || "pending");

    let q = LISTINGS()
      .where("ownerId", "==", id)
      .orderBy("createdAt", "desc")
      .limit(50);

    if (status) q = q.where("status", "==", status);

    const snap = await q.get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (e) {
    next(e);
  }
};
