import api, { USER_TOKEN_KEY, CURRENT_KEY } from "@/services/api";

const USER_PROFILE_KEY = "flexidesk_current_user";

function saveToStorage(key, value, remember = true) {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (remember) localStorage.setItem(key, str);
  else sessionStorage.setItem(key, str);
}

function removeFromBoth(key) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {}
}

function loadFromEither(key) {
  try {
    const v = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    return v;
  } catch {
    return null;
  }
}

function saveToken(token, remember = true) {
  if (!token) throw new Error("Missing token in auth response");
  saveToStorage(USER_TOKEN_KEY, token, remember);
}

function saveProfile(user, remember = true) {
  if (!user) return;
  const mini = {
    id: user.id || user._id || null,
    email: user.email || null,
    role: user.role || "client",
    name: user.fullName || user.name || null,
  };
  saveToStorage(USER_PROFILE_KEY, mini, remember);
  if (mini.email) saveToStorage(CURRENT_KEY, mini.email, remember);
}

export async function registerUser({
  fullName,
  email,
  password,
  role = "client",
  remember = true,
}) {
  const { data } = await api.post("/auth/register", {
    fullName,
    email,
    password,
    role,
  });
  if (data?.token) {
    saveToken(data.token, remember);
    saveProfile(data.user, remember);
  }
  return data.user || null;
}

export async function loginUser({ email, password, remember = true }) {
  const { data } = await api.post("/auth/login", { email, password });
  if (!data?.token) throw new Error(data?.message || "Login failed: missing token");
  saveToken(data.token, remember);
  saveProfile(data.user || { email }, remember);
  return data.user;
}

export function getUserToken() {
  return loadFromEither(USER_TOKEN_KEY);
}

export function getCurrentUser() {
  const raw = loadFromEither(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getUserToken();
}

export async function logoutUser() {
  removeFromBoth(USER_TOKEN_KEY);
  removeFromBoth(CURRENT_KEY);
  removeFromBoth(USER_PROFILE_KEY);
  return true;
}

export async function signInWithGoogle() {
  throw new Error("Google sign-in is disabled.");
}

export async function verifyOtp({ email, code, remember = true }) {
  const { data } = await api.post("/auth/verify-otp", { email, code });
  if (data?.token) {
    saveToken(data.token, remember);
    saveProfile(data.user || { email }, remember);
  }
  return data;
}

export async function resendOtp({ email }) {
  const { data } = await api.post("/auth/resend-otp", { email });
  return data;
}
