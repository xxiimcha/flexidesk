const TOKEN_KEY = "flexidesk_user_token";
const USER_KEY  = "flexidesk_user_profile";

// Seed a demo user & owner for quick testing (optional)
const seed = [
  { fullName: "Demo Client", email: "user@flexidesk.com",  password: "user123",  role: "client" },
  { fullName: "Demo Owner",  email: "owner@flexidesk.com", password: "owner123", role: "owner"  },
];
if (!localStorage.getItem(USER_KEY)) localStorage.setItem(USER_KEY, JSON.stringify(seed));

export async function registerUser({ fullName, email, password, role }) {
  await new Promise(r => setTimeout(r, 400));
  const all = JSON.parse(localStorage.getItem(USER_KEY) || "[]");
  if (all.some(u => u.email.toLowerCase() === email.toLowerCase()))
    throw new Error("Email already registered.");
  const user = { fullName, email: email.toLowerCase(), password, role };
  all.push(user);
  localStorage.setItem(USER_KEY, JSON.stringify(all));
  localStorage.setItem(TOKEN_KEY, "demo-user-token");
  return { token: "demo-user-token", user: { fullName, email, role } };
}

export async function loginUser({ email, password, remember }) {
  await new Promise(r => setTimeout(r, 300));
  const all = JSON.parse(localStorage.getItem(USER_KEY) || "[]");
  const found = all.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!found) throw new Error("Invalid email or password.");
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, "demo-user-token");
  return { token: "demo-user-token", user: { fullName: found.fullName, email: found.email, role: found.role } };
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getUserToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const all = JSON.parse(localStorage.getItem(USER_KEY) || "[]");
  // naive: return the first account that matches the email in session/local storage if you store it;
  // for demo we just return null here—your app pages can carry user object in state if needed.
  return null;
}
