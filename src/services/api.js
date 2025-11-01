import axios from "axios";
import { getAuth } from "firebase/auth";

export const TOKEN_KEY = "flexidesk_user_token";
export const CURRENT_KEY = "flexidesk_current_email";

// Detect backend origin automatically
const BASE_URL =
  import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Automatically attach Firebase or stored token before each request
api.interceptors.request.use(async (config) => {
  try {
    // Try Firebase ID token first
    const auth = getAuth();
    const currentUser = auth.currentUser;
    let token = null;

    if (currentUser) {
      token = await currentUser.getIdToken();
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(CURRENT_KEY, currentUser.email || "");
    } else {
      // fallback to saved token (e.g., from custom auth)
      token =
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY) ||
        null;
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    console.warn("Token attach failed:", err);
  }

  return config;
});

// Optional: handle expired/invalid token globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      console.warn("Session expired or unauthorized. Logging out...");
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(CURRENT_KEY);
      window.location.href = "/login"; // or redirect by role if you prefer
    }
    return Promise.reject(err);
  }
);

export default api;
