// backend/src/middleware/auth.js
const { admin } = require('../config/firebase');

module.exports = async function requireAuth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing_token' });

    const decoded = await admin.auth().verifyIdToken(token);

    // keep a consistent shape – most code references req.user.uid
    req.user = { uid: decoded.uid, ...decoded };

    return next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token', details: e.message });
  }
};
