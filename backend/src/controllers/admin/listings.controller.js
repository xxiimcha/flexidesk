// src/controllers/admin/listings.controller.js
const { db, FieldValue } = require("../../config/firebase");

const LISTINGS = () => db.collection("listings");
const LOGS      = () => db.collection("verificationLogs");

async function logVerification(payload = {}) {
  try {
    await LOGS().add({ ...payload, createdAt: FieldValue.serverTimestamp() });
  } catch (err) {
    console.error("logVerification error:", err);
  }
}

/**
 * POST /admin/listings/:id/review
 * body: { action: "approve"|"reject", note? }
 */
const reviewListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const action = String(req.body?.action || "").toLowerCase();
    const note   = String(req.body?.note || "").trim();

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const ref = LISTINGS().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ message: "Listing not found" });

    const reviewer = req.user?.uid || "admin";
    const baseUpdate = {
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: reviewer,
    };

    let update;
    if (action === "approve") {
      update = {
        ...baseUpdate,
        status: "published",        
        publishedAt: FieldValue.serverTimestamp(),
        notes: FieldValue.delete?.() || null, // clear notes if previously set
      };
    } else {
      update = {
        ...baseUpdate,
        status: "rejected",
        notes: note || snap.data()?.notes || "",
      };
    }

    await ref.update(update);

    const data = snap.data() || {};
    await logVerification({
      type: "listing",
      action,
      listingId: id,
      ownerId: data.ownerId || "",
      notes: note,
      reviewer,
    });

    res.json({ ok: true, status: update.status });
  } catch (e) {
    next(e);
  }
};

module.exports = { reviewListing };
