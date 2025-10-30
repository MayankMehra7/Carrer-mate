// src/context/AuthContext.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";
import { api } from "../api/api";
import { OAuthService } from "../services/OAuthService";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
      setLoadingAuth(false);
    })();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.login({ identifier, password });
    if (res.ok) {
      const user = res.data.user || { email: identifier };
      setUser(user);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      return { ok: true };
    }
    return { ok: false, message: res.data?.error || res.data?.message || "Login failed" };
  };

  const loginWithOAuth = async (provider, oauthData, options = {}) => {
    try {
      let res;
      
      if (provider === 'google') {
        res = await api.oauthGoogle(oauthData);
      } else if (provider === 'github') {
        res = await api.oauthGitHub(oauthData);
      } else {
        return { ok: false, message: "Unsupported OAuth provider" };
      }

      if (res.ok) {
        const user = res.data.user;
        setUser(user);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        
        // Store OAuth session data if provided
        if (res.data.oauth_session) {
          await AsyncStorage.setItem("oauth_session", JSON.stringify(res.data.oauth_session));
        }
        
        return { ok: true, user };
      }
      
      return { 
        ok: false, 
        message: res.data?.error || res.data?.message || "OAuth authentication failed",
        errorType: res.data?.error_type,
        details: res.data?.details
      };
    } catch (error) {
      return { 
        ok: false, 
        message: "Network error during OAuth authentication",
        errorType: "network_error"
      };
    }
  };

  const linkOAuthProvider = async (provider, oauthData) => {
    try {
      const res = await api.linkOAuthProvider({ provider, ...oauthData });
      
      if (res.ok) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        return { ok: true, user: updatedUser };
      }
      
      return { 
        ok: false, 
        message: res.data?.error || res.data?.message || "Failed to link OAuth provider",
        errorType: res.data?.error_type,
        details: res.data?.details
      };
    } catch (error) {
      return { 
        ok: false, 
        message: "Network error during provider linking",
        errorType: "network_error"
      };
    }
  };

  const unlinkOAuthProvider = async (provider) => {
    try {
      const res = await api.unlinkOAuthProvider({ provider });
      
      if (res.ok) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        return { ok: true, user: updatedUser };
      }
      
      return { 
        ok: false, 
        message: res.data?.error || res.data?.message || "Failed to unlink OAuth provider",
        errorType: res.data?.error_type
      };
    } catch (error) {
      return { 
        ok: false, 
        message: "Network error during provider unlinking",
        errorType: "network_error"
      };
    }
  };

  const resolveAccountConflict = async (conflictData, resolution, oauthData) => {
    try {
      const res = await api.resolveAccountConflict({
        conflict_data: conflictData,
        resolution,
        oauth_data: oauthData
      });
      
      if (res.ok) {
        const result = res.data;
        
        // If account was linked, update user state
        if (result.action === 'linked' && result.user) {
          setUser(result.user);
          await AsyncStorage.setItem("user", JSON.stringify(result.user));
        }
        
        return { ok: true, ...result };
      }
      
      return { 
        ok: false, 
        message: res.data?.error || res.data?.message || "Failed to resolve account conflict",
        errorType: res.data?.error_type,
        details: res.data?.details
      };
    } catch (error) {
      return { 
        ok: false, 
        message: "Network error during conflict resolution",
        errorType: "network_error"
      };
    }
  };

  const logout = async () => {
    try {
      // Sign out from OAuth providers first
      const oauthResult = await OAuthService.signOutAllProviders();
      if (!oauthResult.success) {
        console.warn("OAuth sign out had issues:", oauthResult.results);
      }
      
      // Call backend logout API
      await api.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout process had errors:", error);
    }
    
    // Clear all authentication data
    setUser(null);
    await AsyncStorage.multiRemove([
      "user", 
      "session_token", 
      "oauth_session",
      "google_oauth_data",
      "github_oauth_data"
    ]);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      loginWithOAuth,
      linkOAuthProvider,
      unlinkOAuthProvider,
      resolveAccountConflict,
      logout, 
      loadingAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
