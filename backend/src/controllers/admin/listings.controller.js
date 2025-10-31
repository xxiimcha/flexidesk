const { db, FieldValue } = require("../../config/firebase");

const LISTINGS = () => db.collection("listings");
const LOGS = () => db.collection("verificationLogs");

async function logVerification(payload = {}) {
  await LOGS().add({ ...payload, createdAt: FieldValue.serverTimestamp() });
}

/**
 * POST /admin/listings/:id/review
 * body: { action: "approve"|"reject", note? }
 */
exports.reviewListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, note = "" } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const ref = LISTINGS().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ message: "Listing not found" });

    const status = action === "approve" ? "active" : "rejected";
    const update = {
      status,
      reviewedAt: FieldValue.serverTimestamp(),
    };
    if (action === "reject") update.notes = note;

    await ref.update(update);

    const ownerId = snap.data().ownerId || "";
    await logVerification({ type: "listing", action, listingId: id, ownerId, notes: note });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
