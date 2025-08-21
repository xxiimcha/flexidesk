// src/services/userAuth.js
import { auth, hasFirebase } from "./firebaseClient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const TOKEN_KEY   = "flexidesk_user_token";
const USER_KEY    = "flexidesk_user_profile";
const CURRENT_KEY = "flexidesk_current_email";

// ---------------- Local demo helpers (fallback when Firebase not configured) -------------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const seed = [
  { fullName: "Demo Client", email: "user@flexidesk.com",  password: "user123",  role: "client" },
  { fullName: "Demo Owner",  email: "owner@flexidesk.com", password: "owner123", role: "owner"  },
];
if (!localStorage.getItem(USER_KEY)) localStorage.setItem(USER_KEY, JSON.stringify(seed));
const getAllUsers = () => JSON.parse(localStorage.getItem(USER_KEY) || "[]");
const saveAllUsers = (list) => localStorage.setItem(USER_KEY, JSON.stringify(list));
const pickStorage = (remember) => (remember ? localStorage : sessionStorage);
const getFromBoth = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);
const storeOrUpdateUser = (u) => {
  const all = getAllUsers();
  const i = all.findIndex(x => x.email.toLowerCase() === u.email.toLowerCase());
  if (i >= 0) all[i] = { ...all[i], ...u, password: u.password ?? all[i].password };
  else all.push(u);
  saveAllUsers(all);
  return { ...u };
};
const serialiseUser = (u) => { if (!u) return null; const { password, ...safe } = u; return safe; };
const persistLocalSession = ({ email, token, remember }) => {
  const st = pickStorage(remember);
  st.setItem(TOKEN_KEY, token);
  st.setItem(CURRENT_KEY, email.toLowerCase());
};

// ---------------- Shared helpers ----------------
async function callApi(path, { method = "GET", body, token }) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function persistFirebaseSession({ email, token, remember }) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const st = remember ? localStorage : sessionStorage;
  st.setItem(TOKEN_KEY, token);
  st.setItem(CURRENT_KEY, (email || "").toLowerCase());
}

function cacheUser(u) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {}
}
function readCachedUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}

// --------------------------------- Public API ---------------------------------

export async function registerUser({ fullName, email, password, role = "client", remember = true }) {
  if (!hasFirebase) {
    // Fallback: local demo mode
    await sleep(300);
    const all = getAllUsers();
    if (all.some(u => u.email.toLowerCase() === email.toLowerCase()))
      throw new Error("Email already registered.");
    const user = storeOrUpdateUser({ fullName, email: email.toLowerCase(), password, role });
    localStorage.setItem(TOKEN_KEY, "demo-user-token");
    localStorage.setItem(CURRENT_KEY, user.email);
    cacheUser(serialiseUser(user));
    return { token: "demo-user-token", user: serialiseUser(user) };
  }

  // Real Firebase flow
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (fullName) await updateProfile(cred.user, { displayName: fullName }).catch(() => {});
  const idToken = await cred.user.getIdToken(true);
  await persistFirebaseSession({ email: cred.user.email, token: idToken, remember });
  await callApi("/profile", { method: "POST", body: { fullName, role }, token: idToken });
  const safeUser = { uid: cred.user.uid, email: cred.user.email, fullName, role };
  cacheUser(safeUser);
  return { token: idToken, user: safeUser };
}

export async function loginUser({ email, password, remember = true }) {
  if (!hasFirebase) {
    await sleep(250);
    const all = getAllUsers();
    const found = all.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) throw new Error("Invalid email or password.");
    persistLocalSession({ email: found.email, token: "demo-user-token", remember });
    cacheUser(serialiseUser(found));
    return { token: "demo-user-token", user: serialiseUser(found) };
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken(true);
  await persistFirebaseSession({ email: cred.user.email, token: idToken, remember });

  let profile = null;
  try { profile = (await callApi("/profile", { method: "GET", token: idToken }))?.profile || null; } catch {}
  const safeUser = {
    uid: cred.user.uid,
    email: cred.user.email,
    fullName: profile?.fullName || cred.user.displayName || "",
    role: profile?.role || "client",
  };
  cacheUser(safeUser);
  return { token: idToken, user: safeUser };
}

export async function signInWithGoogle({ remember = true, defaultRole = "client" } = {}) {
  if (!hasFirebase) {
    // Demo fallback
    await sleep(200);
    const demoGoogleEmail = "googleuser@flexidesk.com";
    const user = storeOrUpdateUser({ fullName: "Google User", email: demoGoogleEmail, role: defaultRole });
    persistLocalSession({ email: user.email, token: "demo-google-token", remember });
    cacheUser(serialiseUser(user));
    return { token: "demo-google-token", user: serialiseUser(user) };
  }

  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  const gUser = res.user;
  const idToken = await gUser.getIdToken(true);
  await persistFirebaseSession({ email: gUser.email, token: idToken, remember });
  await callApi("/profile", {
    method: "POST",
    body: { fullName: gUser.displayName || "Google User", role: defaultRole },
    token: idToken,
  });
  const safeUser = {
    uid: gUser.uid,
    email: gUser.email || "",
    fullName: gUser.displayName || "Google User",
    role: defaultRole,
  };
  cacheUser(safeUser);
  return { token: idToken, user: safeUser };
}

export async function logoutUser() {
  if (hasFirebase) { try { await signOut(auth); } catch {} }
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_KEY);
  sessionStorage.removeItem(CURRENT_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getUserToken() {
  return getFromBoth(TOKEN_KEY);
}

export function getCurrentUser() {
  const cached = readCachedUser();
  if (cached) return cached;

  if (hasFirebase && auth?.currentUser) {
    const u = auth.currentUser;
    return { uid: u.uid, email: u.email || getFromBoth(CURRENT_KEY) || "", fullName: u.displayName || "", role: "client" };
  }

  const email = getFromBoth(CURRENT_KEY);
  if (!email) return null;
  const all = getAllUsers();
  const found = all.find(u => u.email.toLowerCase() === email.toLowerCase());
  return serialiseUser(found) || null;
}
