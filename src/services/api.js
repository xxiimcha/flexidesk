// src/services/api.js
import axios from "axios";

export const TOKEN_KEY = "flexidesk_user_token";
export const CURRENT_KEY = "flexidesk_current_email";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
