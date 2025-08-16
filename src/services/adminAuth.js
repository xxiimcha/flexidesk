// Super-simple mock. Replace with real API later.
const KEY = "flexidesk_admin_token";

export async function loginAdmin({ email, password, remember }) {
  // demo rule: accept admin@flexidesk.com / admin123
  const ok = email?.toLowerCase() === "admin@flexidesk.com" && password === "admin123";

  await new Promise((r) => setTimeout(r, 500)); // simulate network

  if (!ok) throw new Error("Invalid email or password.");

  const token = "demo-admin-token";
  if (remember) localStorage.setItem(KEY, token);
  else sessionStorage.setItem(KEY, token);
  return { token };
}

export function logoutAdmin() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}

export function getAdminToken() {
  return localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
}
