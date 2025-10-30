// src/api/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

async function fetchJson(path, opts = {}) {
  const url = `${BASE}${path}`;
  
  // Only set Content-Type for non-FormData requests
  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Append session token header if present in storage (fallback if cookies don't work)
  try {
    const token = await AsyncStorage.getItem("session_token");
    if (token) headers["X-Session-Token"] = token;
  } catch (e) { /* ignore */ }

  const finalOpts = {
    credentials: "include", // attempt to use cookies (server-side session)
    ...opts,
    headers,
  };

  const res = await fetch(url, finalOpts);
  const json = await res.json().catch(() => ({}));
  // If backend returns a session_token fallback, persist it.
  if (json?.session_token) {
    await AsyncStorage.setItem("session_token", json.session_token);
  }
  return { ok: res.ok, status: res.status, data: json };
}

export const api = {
  signup: (body) => fetchJson("/api/signup", { method: "POST", body: JSON.stringify(body) }),
  verifyOtp: (body) => fetchJson("/api/verify-otp", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => fetchJson("/api/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => fetchJson("/api/logout", { method: "POST" }),
  sendForgot: (body) => fetchJson("/api/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  resetPassword: (body) => fetchJson("/api/reset-password", { method: "POST", body: JSON.stringify(body) }),
  uploadResume: (body) => fetchJson("/api/upload_resume", { method: "POST", body: JSON.stringify(body) }),
  getResume: (email) => fetchJson(`/api/get_resume?email=${encodeURIComponent(email)}`, { method: "GET" }),
  generateCover: (body) => fetchJson("/api/generate_cover_letter", { method: "POST", body: JSON.stringify(body) }),
  generateCoverFromStored: (body) => fetchJson("/api/generate_cover_from_stored", { method: "POST", body: JSON.stringify(body) }),
  acceptCover: (body) => fetchJson("/api/accept_cover_letter", { method: "POST", body: JSON.stringify(body) }),
  extractFileText: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson("/api/extract_file_text", { 
      method: "POST", 
      body: formData,
      headers: {} // Remove Content-Type to let browser set it for FormData
    });
  },
  getAISuggestions: (body) => fetchJson("/api/get_ai_suggestions", { method: "POST", body: JSON.stringify(body) }),
  checkAvailability: (body) => fetchJson("/api/check-availability", { method: "POST", body: JSON.stringify(body) }),
  
  // OAuth authentication methods
  oauthGoogle: (body) => fetchJson("/api/oauth/google", { method: "POST", body: JSON.stringify(body) }),
  oauthGitHub: (body) => fetchJson("/api/oauth/github", { method: "POST", body: JSON.stringify(body) }),
  linkOAuthProvider: (body) => fetchJson("/api/oauth/link", { method: "POST", body: JSON.stringify(body) }),
  unlinkOAuthProvider: (body) => fetchJson("/api/oauth/unlink", { method: "POST", body: JSON.stringify(body) }),
  resolveAccountConflict: (body) => fetchJson("/api/oauth/resolve-conflict", { method: "POST", body: JSON.stringify(body) }),
  checkAccountConflict: (body) => fetchJson("/api/oauth/check-conflict", { method: "POST", body: JSON.stringify(body) }),
  getUserOAuthProviders: () => fetchJson("/api/oauth/providers", { method: "GET" }),
  updatePrimaryAuthMethod: (body) => fetchJson("/api/oauth/primary-auth", { method: "POST", body: JSON.stringify(body) }),
};
