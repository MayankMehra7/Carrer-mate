// src/api/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// Simple feature flag fallbacks (to avoid complex dependencies)
const featureFlagManager = {
  getFlag: async (flag) => {
    // Return true for all OAuth flags to enable functionality
    if (flag?.includes?.('OAUTH') || flag?.includes?.('oauth')) return true;
    return true; // Default to enabled
  }
};

const FeatureFlags = {
  CACHING_ENABLED: 'CACHING_ENABLED',
  DEBUG_MODE: 'DEBUG_MODE',
  COVER_LETTER_GENERATION: 'COVER_LETTER_GENERATION',
  AI_SUGGESTIONS_ENABLED: 'AI_SUGGESTIONS_ENABLED',
  OAUTH_GOOGLE_ENABLED: 'OAUTH_GOOGLE_ENABLED',
  OAUTH_GITHUB_ENABLED: 'OAUTH_GITHUB_ENABLED',
};

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

  // Add feature flag context headers for backend processing
  try {
    const cachingEnabled = await featureFlagManager.getFlag(FeatureFlags.CACHING_ENABLED);
    const debugMode = await featureFlagManager.getFlag(FeatureFlags.DEBUG_MODE);
    
    if (cachingEnabled) headers["X-Enable-Caching"] = "true";
    if (debugMode) headers["X-Debug-Mode"] = "true";
  } catch (error) {
    // Don't fail the request if feature flags are unavailable
    console.debug('Could not load feature flags for API request:', error);
  }

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

/**
 * Check if a feature is enabled before making API calls
 * Requirements: 3.4 - Ensure core application features remain functional when flags are unavailable
 */
async function checkFeatureEnabled(featureFlag, fallbackValue = true) {
  try {
    return await featureFlagManager.getFlag(featureFlag);
  } catch (error) {
    console.warn(`Feature flag ${featureFlag} unavailable, using fallback:`, fallbackValue);
    return fallbackValue;
  }
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
  generateCover: async (body) => {
    // Check if cover letter generation is enabled (Requirements: 3.4)
    const coverEnabled = await checkFeatureEnabled(FeatureFlags.COVER_LETTER_GENERATION, true);
    if (!coverEnabled) {
      return { 
        ok: false, 
        status: 503, 
        data: { error: "Cover letter generation is currently disabled" } 
      };
    }
    return fetchJson("/api/generate_cover_letter", { method: "POST", body: JSON.stringify(body) });
  },
  generateCoverFromStored: async (body) => {
    // Check if cover letter generation is enabled (Requirements: 3.4)
    const coverEnabled = await checkFeatureEnabled(FeatureFlags.COVER_LETTER_GENERATION, true);
    if (!coverEnabled) {
      return { 
        ok: false, 
        status: 503, 
        data: { error: "Cover letter generation is currently disabled" } 
      };
    }
    return fetchJson("/api/generate_cover_from_stored", { method: "POST", body: JSON.stringify(body) });
  },
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
  getAISuggestions: async (body) => {
    // Check if AI suggestions are enabled (Requirements: 3.4)
    const aiEnabled = await checkFeatureEnabled(FeatureFlags.AI_SUGGESTIONS_ENABLED, true);
    if (!aiEnabled) {
      return { 
        ok: false, 
        status: 503, 
        data: { error: "AI suggestions are currently disabled" } 
      };
    }
    return fetchJson("/api/get_ai_suggestions", { method: "POST", body: JSON.stringify(body) });
  },
  checkAvailability: (body) => fetchJson("/api/check-availability", { method: "POST", body: JSON.stringify(body) }),
  
  // OAuth authentication methods
  oauthGoogle: async (body) => {
    // Check if Google OAuth is enabled (Requirements: 3.4)
    const googleEnabled = await checkFeatureEnabled(FeatureFlags.OAUTH_GOOGLE_ENABLED, true);
    if (!googleEnabled) {
      return { 
        ok: false, 
        status: 503, 
        data: { error: "Google OAuth is currently disabled" } 
      };
    }
    return fetchJson("/api/oauth/google", { method: "POST", body: JSON.stringify(body) });
  },
  oauthGitHub: async (body) => {
    // Check if GitHub OAuth is enabled (Requirements: 3.4)
    const githubEnabled = await checkFeatureEnabled(FeatureFlags.OAUTH_GITHUB_ENABLED, true);
    if (!githubEnabled) {
      return { 
        ok: false, 
        status: 503, 
        data: { error: "GitHub OAuth is currently disabled" } 
      };
    }
    return fetchJson("/api/oauth/github", { method: "POST", body: JSON.stringify(body) });
  },
  linkOAuthProvider: (body) => fetchJson("/api/oauth/link", { method: "POST", body: JSON.stringify(body) }),
  unlinkOAuthProvider: (body) => fetchJson("/api/oauth/unlink", { method: "POST", body: JSON.stringify(body) }),
  resolveAccountConflict: (body) => fetchJson("/api/oauth/resolve-conflict", { method: "POST", body: JSON.stringify(body) }),
  checkAccountConflict: (body) => fetchJson("/api/oauth/check-conflict", { method: "POST", body: JSON.stringify(body) }),
  getUserOAuthProviders: () => fetchJson("/api/oauth/providers", { method: "GET" }),
  updatePrimaryAuthMethod: (body) => fetchJson("/api/oauth/primary-auth", { method: "POST", body: JSON.stringify(body) }),
};
