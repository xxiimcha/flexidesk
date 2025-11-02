// src/services/adminAuth.js
import api, { ADMIN_TOKEN_KEY, CURRENT_KEY } from "@/services/api";

function storeToken(token, remember) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem(ADMIN_TOKEN_KEY, token);
}

export async function loginAdmin({ email, password, remember }) {
  const { data } = await api.post("/admin/login", {
    email: String(email || "").trim().toLowerCase(),
    password,
    remember,
  });
  if (!data?.token || !data?.user) {
    throw new Error(data?.error || "Login failed.");
  }

  // keep a copy client-side for Authorization header (server also set httpOnly cookie)
  storeToken(data.token, remember);
  if (data.user.email) (remember ? localStorage : sessionStorage).setItem(CURRENT_KEY, data.user.email);

  return data.user; // { id, email, role, fullName, avatar }
}

export async function getAdminMe() {
  const { data } = await api.get("/admin/me");
  return data?.user; // requires valid token/cookie
}

export async function logoutAdmin() {
  try { await api.post("/admin/logout"); } catch {}
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(CURRENT_KEY);
  sessionStorage.removeItem(CURRENT_KEY);
}
