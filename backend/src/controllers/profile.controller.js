const { db, admin } = require('../config/firebase');

exports.upsert = async (req, res, next) => {
  try {
    const doc = db.collection('profiles').doc(req.user.uid);
    await doc.set(
      { 
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.get = async (req, res, next) => {
  try {
    const snap = await db.collection('profiles').doc(req.user.uid).get();
    res.json({ profile: snap.exists ? snap.data() : null });
  } catch (e) {
    next(e);
  }
};
