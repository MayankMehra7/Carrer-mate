# OAuth Authentication Design Document

## Overview

The OAuth authentication system provides seamless user registration and login through Google and GitHub providers. The design emphasizes security, user experience, and developer-friendly testing capabilities through demo mode functionality.

## Architecture

### High-Level Flow
```
User Interface → OAuth Buttons → Provider Redirect → Callback Handler → User Creation/Login → Main App
```

### Component Structure
- **OAuth Buttons**: UI components for Google and GitHub authentication
- **OAuth Service**: Handles provider-specific authentication logic
- **User Service**: Manages user account creation and retrieval
- **Demo Mode Handler**: Simulates OAuth flows for development
- **Error Handler**: Manages OAuth-specific error scenarios

## Components and Interfaces

### OAuth Button Components
- **Location**: Login and Signup screens
- **Functionality**: 
  - Display provider-specific branding
  - Handle loading states during authentication
  - Trigger OAuth flow initiation
  - Show demo mode indicators when active

### OAuth Service Layer
```javascript
class OAuthService {
  // Initiate OAuth flow with provider
  initiateOAuth(provider, mode = 'login')
  
  // Handle OAuth callback and token exchange
  handleCallback(provider, authCode)
  
  // Extract user profile from provider response
  extractUserProfile(provider, tokenResponse)
  
  // Demo mode simulation
  simulateOAuthFlow(provider, mode)
}
```

### User Account Management
```javascript
class UserAccountService {
  // Create new user from OAuth profile
  createUserFromOAuth(provider, profile)
  
  // Find existing user by OAuth provider ID
  findUserByOAuthId(provider, providerId)
  
  // Link OAuth account to existing user
  linkOAuthAccount(userId, provider, profile)
}
```

## Data Models

### OAuth User Profile
```javascript
{
  provider: 'google' | 'github',
  providerId: string,
  email: string,
  name: string,
  username?: string, // GitHub only
  avatar: string,
  accessToken: string,
  refreshToken?: string,
  idToken?: string // Google only
}
```

### User Account
```javascript
{
  id: string,
  email: string,
  name: string,
  username?: string,
  avatar?: string,
  oauthAccounts: [{
    provider: string,
    providerId: string,
    linkedAt: Date
  }],
  createdAt: Date,
  lastLoginAt: Date
}
```

## Error Handling

### OAuth-Specific Errors
- **Authorization Denied**: User cancels OAuth flow
- **Invalid Credentials**: OAuth configuration issues
- **Network Errors**: Provider service unavailable
- **Account Conflicts**: Email already exists with different provider
- **Demo Mode Errors**: Configuration or simulation failures

### Error Recovery Strategies
- Graceful fallback to manual registration
- Clear error messaging with actionable steps
- Retry mechanisms for transient failures
- Demo mode error simulation for testing

## Testing Strategy

### Demo Mode Implementation
- Environment variable controlled (`EXPO_PUBLIC_OAUTH_DEMO_MODE=true`)
- Simulated provider responses with realistic data
- Configurable delay to mimic network requests
- Visual indicators for demo mode status

### Test Scenarios
- Successful OAuth flow for both providers
- User cancellation handling
- Network failure simulation
- Account creation vs. existing user login
- Demo mode functionality verification

### Integration Points
- Frontend OAuth button interactions
- Backend user account creation/retrieval
- Provider-specific API integrations
- Error boundary testing

## Security Considerations

### OAuth Security
- PKCE (Proof Key for Code Exchange) implementation
- Secure token storage and transmission
- State parameter validation to prevent CSRF
- Proper scope limitation for provider permissions

### Demo Mode Security
- Clear separation from production credentials
- No real API calls or data persistence in demo mode
- Environment-based configuration isolation
- Development-only activation safeguards