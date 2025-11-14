// API client wrapper for compatibility
import { api } from './api.js';

// Create axios-like interface for compatibility with existing code
const apiClient = {
  post: async (url, data) => {
    // Map URLs to API methods
    if (url === '/api/login') {
      return api.login(data);
    } else if (url === '/api/logout') {
      return api.logout();
    } else if (url === '/api/signup') {
      return api.signup(data);
    } else if (url === '/api/oauth/google') {
      return api.oauthGoogle(data);
    } else if (url === '/api/oauth/github') {
      return api.oauthGitHub(data);
    } else {
      // Generic fallback
      const BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${BASE}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      return {
        status: response.status,
        data: responseData,
      };
    }
  },
  
  get: async (url) => {
    const BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
    const response = await fetch(`${BASE}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    const responseData = await response.json();
    return {
      status: response.status,
      data: responseData,
    };
  }
};

export default apiClient;