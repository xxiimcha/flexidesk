// src/services/api.js
import axios from "axios";

export const USER_TOKEN_KEY = "flexidesk_user_token";
export const ADMIN_TOKEN_KEY = "flexidesk_admin_token";
export const CURRENT_KEY = "flexidesk_current_email";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:4000/api"
      : "https://flexidesk-api-0yb4.onrender.com/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const adminToken =
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY);

  const userToken =
    localStorage.getItem(USER_TOKEN_KEY) ||
    sessionStorage.getItem(USER_TOKEN_KEY);

  const token = adminToken || userToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔍 Debug log
  console.log("[API] Request", {
    url: config.url,
    method: config.method,
    hasAuthorizationHeader: !!config.headers.Authorization,
  });

  return config;
});

export default api;
