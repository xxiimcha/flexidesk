// src/services/firebaseClient.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ← add this

const cfg = {
  apiKey:              import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:          import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:           import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:               import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket:       import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:   import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const required = ["apiKey", "authDomain", "projectId", "appId"];
const missing = required.filter(k => !cfg[k]);
if (missing.length) {
  console.warn("[firebase] Missing env keys:", missing.join(", "),
               "— check your .env and restart the dev server.");
}

const app = getApps().length ? getApps()[0] : initializeApp(cfg);

export const auth = getAuth(app);
export const hasFirebase = required.every(k => Boolean(cfg[k]));

// Export Firestore instance
export const db = hasFirebase ? getFirestore(app) : null;
