const { admin } = require('../config/firebase');

async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(roles) {
  const allow = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    const claimRole = req.user?.role || req.user?.claims?.role;
    if (allow.includes(claimRole)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

module.exports = { requireAuth, requireRole };
