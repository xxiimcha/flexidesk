// src/config/firebase.js
const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps.length) return admin; // already initialized

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      'Missing Firebase Admin env vars: FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  console.log('✅ Firebase Admin initialized');
  return admin;
}

initAdmin();                 // initialize immediately
const db = admin.firestore();

module.exports = { admin, db, initAdmin };
