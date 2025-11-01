// src/modules/admin/auth.controller.js
const jwt = require("jsonwebtoken");

// Use the initialized Admin SDK from our config file
const firebase = require("../../config/firebase");
const admin = firebase.admin;
const db = firebase.db;

// Use global fetch on Node 18+; lazy-load node-fetch only if needed
const fetchFn =
  typeof fetch === "function"
    ? fetch
    : (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const JWT_SECRET = process.env.JWT_SECRET || "flexidesk_dev_secret";

/**
 * POST /api/admin/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    // Defensive checks up front
    if (!admin || typeof admin.auth !== "function") {
      return res.status(500).json({ error: "Firebase Admin not initialized" });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password." });
    }

    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Missing FIREBASE_WEB_API_KEY in backend .env" });
    }

    // Verify email/password with Firebase Identity Toolkit REST API
    const resp = await fetchFn(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || data?.error) {
      const msg =
        data?.error?.message ||
        (resp.status === 400 ? "INVALID_CREDENTIALS" : "AUTH_FAILED");
      return res.status(401).json({ error: msg });
    }

    // Look up user and enforce role
    const userRecord = await admin.auth().getUser(data.localId);
    const claims = userRecord.customClaims || {};
    if (claims.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Not an admin account." });
    }

    // Issue your backend JWT for subsequent /api/admin/* calls
    const token = jwt.sign(
      { uid: userRecord.uid, email: userRecord.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Optional: audit log
    try {
      await db.collection("audit_logs").add({
        uid: userRecord.uid,
        email: userRecord.email,
        action: "admin_login",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      // non-fatal
      console.warn("audit log failed:", e?.message || e);
    }

    return res.json({
      token,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || "Administrator",
        role: "admin",
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
};
