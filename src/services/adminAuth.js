import api from "@/services/api";

export const ADMIN_TOKEN_KEY = "flexidesk_admin_token";

export async function loginAdmin({ email, password, remember }) {
  try {
    const res = await api.post("/admin/login", { email, password });
    const { token } = res.data;
    if (remember) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.error || "Login failed.";
    throw new Error(msg);
  }
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getAdminToken() {
  return (
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY)
  );
}
