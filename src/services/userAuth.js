// services/userAuth.js
const TOKEN_KEY   = "flexidesk_user_token";
const USER_KEY    = "flexidesk_user_profile";
const CURRENT_KEY = "flexidesk_current_email"; // who is currently signed in

// ---- Demo seed (only if empty)
const seed = [
  { fullName: "Demo Client", email: "user@flexidesk.com",  password: "user123",  role: "client" },
  { fullName: "Demo Owner",  email: "owner@flexidesk.com", password: "owner123", role: "owner"  },
];
if (!localStorage.getItem(USER_KEY)) localStorage.setItem(USER_KEY, JSON.stringify(seed));

// ---- Helpers
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getAllUsers = () => JSON.parse(localStorage.getItem(USER_KEY) || "[]");
const saveAllUsers = (list) => localStorage.setItem(USER_KEY, JSON.stringify(list));
const pickStorage = (remember) => (remember ? localStorage : sessionStorage);
const getFromBoth = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

const storeOrUpdateUser = (u) => {
  const all = getAllUsers();
  const i = all.findIndex(x => x.email.toLowerCase() === u.email.toLowerCase());
  if (i >= 0) {
    // keep password if not supplied (e.g., Google user)
    all[i] = { ...all[i], ...u, password: u.password ?? all[i].password };
  } else {
    all.push(u);
  }
  saveAllUsers(all);
  return { ...u }; // return shallow copy
};

const serialiseUser = (u) => {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
};

const persistSession = ({ email, token, remember }) => {
  const st = pickStorage(remember);
  st.setItem(TOKEN_KEY, token);
  st.setItem(CURRENT_KEY, email.toLowerCase());
};

// ---- Public API
export async function registerUser({ fullName, email, password, role }) {
  await sleep(400);
  const all = getAllUsers();
  if (all.some(u => u.email.toLowerCase() === email.toLowerCase()))
    throw new Error("Email already registered.");

  const user = { fullName, email: email.toLowerCase(), password, role };
  storeOrUpdateUser(user);

  // default to persistent token on signup (like your original)
  localStorage.setItem(TOKEN_KEY, "demo-user-token");
  localStorage.setItem(CURRENT_KEY, user.email);

  return { token: "demo-user-token", user: serialiseUser(user) };
}

export async function loginUser({ email, password, remember }) {
  await sleep(300);
  const all = getAllUsers();
  const found = all.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!found) throw new Error("Invalid email or password.");

  persistSession({ email: found.email, token: "demo-user-token", remember });
  return { token: "demo-user-token", user: serialiseUser(found) };
}

/**
 * Google sign-in
 * - Works now with a demo/local fallback (creates/uses a "Google User")
 * - Swap in Firebase Auth by uncommenting the block below when ready
 */
export async function signInWithGoogle({ remember = true, defaultRole = "client" } = {}) {
  // ===== Real Firebase Auth (uncomment when you have Firebase set up) =====
  /*
  const { getAuth, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  const gUser = res.user; // FirebaseUser
  // derive a profile record for local persistence / role mapping
  const user = storeOrUpdateUser({
    fullName: gUser.displayName || "Google User",
    email: (gUser.email || "").toLowerCase(),
    role: defaultRole, // or fetch from your DB/claims after 1st login
  });
  persistSession({ email: user.email, token: await gUser.getIdToken(), remember });
  return { token: getFromBoth(TOKEN_KEY), user: serialiseUser(user) };
  */
  // ======================= Demo/local fallback ============================
  await sleep(250);
  const demoGoogleEmail = "googleuser@flexidesk.com";
  const user = storeOrUpdateUser({
    fullName: "Google User",
    email: demoGoogleEmail,
    role: defaultRole,
    // no password for OAuth users
  });
  persistSession({ email: user.email, token: "demo-google-token", remember });
  return { token: "demo-google-token", user: serialiseUser(user) };
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CURRENT_KEY);
  sessionStorage.removeItem(CURRENT_KEY);
}

export function getUserToken() {
  return getFromBoth(TOKEN_KEY);
}

export function getCurrentUser() {
  const email = getFromBoth(CURRENT_KEY);
  if (!email) return null;
  const all = getAllUsers();
  const found = all.find(u => u.email.toLowerCase() === email.toLowerCase());
  return serialiseUser(found) || null;
}
