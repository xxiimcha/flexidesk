// src/services/userAuth.js
import api, { USER_TOKEN_KEY, CURRENT_KEY } from "@/services/api";

// Save token (persist if remember=true, else session)
function saveToken(token, remember = true) {
  if (remember) localStorage.setItem(USER_TOKEN_KEY, token);
  else sessionStorage.setItem(USER_TOKEN_KEY, token);
}

export async function registerUser({ fullName, email, password, role = "client", remember = true }) {
  const { data } = await api.post("/auth/register", { fullName, email, password, role });
  saveToken(data.token, remember);
  // Optional: store current email for convenience
  try {
    localStorage.setItem(CURRENT_KEY, data.user?.email || email);
  } catch {}
  return data.user;
}

export async function loginUser({ email, password, remember = true }) {
  const { data } = await api.post("/auth/login", { email, password });
  saveToken(data.token, remember);
  try {
    localStorage.setItem(CURRENT_KEY, data.user?.email || email);
  } catch {}
  return data.user;
}

// ---- helpers your app expects ----
export function getUserToken() {
  return (
    localStorage.getItem(USER_TOKEN_KEY) ||
    sessionStorage.getItem(USER_TOKEN_KEY) ||
    null
  );
}

export async function logoutUser() {
  // If you later add a server-side session, call /auth/logout here.
  try {
    localStorage.removeItem(USER_TOKEN_KEY);
    sessionStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(CURRENT_KEY);
    sessionStorage.removeItem(CURRENT_KEY);
  } catch {}
  return true; // keep it async-friendly for existing callers
}

// keep stub so imports don’t break while Google is disabled
export async function signInWithGoogle() {
  throw new Error("Google sign-in is disabled.");
}
