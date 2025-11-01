require("dotenv").config();
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Works on Vercel/Render/Netlify (newline-escaped)
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing Firebase env vars. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();
// (optional but nice) avoid errors when updating with undefined
db.settings?.({ ignoreUndefinedProperties: true });

const FieldValue = admin.firestore.FieldValue;
const Timestamp  = admin.firestore.Timestamp;

module.exports = { admin, db, FieldValue, Timestamp };
