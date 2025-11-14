# OAuth Authentication Fix Design

## Overview

This design document outlines the architecture and implementation approach for fixing the OAuth authentication system in the Career Mate application. The solution addresses environment variable loading issues, implements complete backend OAuth handling, and ensures robust error handling for Google and GitHub authentication.

## Architecture

### High-Level Flow
```
Frontend (React Native) → OAuth Provider → Backend API → Database → Frontend
```

### Component Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │ AuthContext │ │    │ │ OAuth Routes │ │    │ │ User Model  │ │
│ │             │ │    │ │              │ │    │ │             │ │
│ │ OAuthButtons│ │    │ │ Token Handler│ │    │ │ OAuth Links │ │
│ └─────────────┘ │    │ │              │ │    │ └─────────────┘ │
│                 │    │ │ Env Manager  │ │    │                 │
│ ┌─────────────┐ │    │ └──────────────┘ │    │                 │
│ │ Login/Signup│ │    │                  │    │                 │
│ └─────────────┘ │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. Environment Manager (Backend)
**Purpose**: Load and validate OAuth credentials from environment variables

**Key Methods**:
- `load_oauth_config()`: Load all OAuth environment variables
- `validate_credentials()`: Validate credential format and presence
- `get_provider_status()`: Return configuration status for each provider

**Environment Variables Required**:
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `OAUTH_REDIRECT_URI`

### 2. OAuth Routes (Backend)
**Purpose**: Handle OAuth authentication requests from frontend

**Endpoints**:
- `POST /api/oauth/google`: Process Google OAuth token
- `POST /api/oauth/github`: Process GitHub OAuth code
- `GET /api/oauth/status`: Return OAuth provider availability

**Request/Response Format**:
```json
// Google OAuth Request
{
  "token": "google_access_token"
}

// GitHub OAuth Request
{
  "code": "github_authorization_code"
}

// Success Response
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "oauth_provider": "google|github"
  }
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "error_code": "OAUTH_TOKEN_INVALID"
}
```

### 3. Token Handler (Backend)
**Purpose**: Validate OAuth tokens and fetch user data from providers

**Key Methods**:
- `validate_google_token(token)`: Validate Google access token
- `validate_github_code(code)`: Exchange GitHub code for token
- `fetch_google_user_info(token)`: Get user data from Google
- `fetch_github_user_info(token)`: Get user data from GitHub

### 4. User Model Extensions (Backend)
**Purpose**: Store OAuth provider information and link accounts

**New Fields**:
```python
class User:
    oauth_providers = []  # List of linked OAuth providers
    google_id = None      # Google user ID
    github_id = None      # GitHub user ID
    oauth_created = False # Whether account was created via OAuth
```

### 5. Frontend OAuth Integration
**Purpose**: Improved error handling and user feedback

**Enhanced AuthContext Methods**:
- `handleOAuth(provider)`: Initiate OAuth flow with better error handling
- `processOAuthResponse(response)`: Process OAuth responses with retry logic
- `displayOAuthError(error)`: Show user-friendly error messages

## Data Models

### OAuth User Profile
```python
{
    "id": "unique_user_id",
    "email": "user@example.com",
    "name": "User Full Name",
    "username": "generated_or_provided_username",
    "oauth_providers": [
        {
            "provider": "google",
            "provider_id": "google_user_id",
            "linked_at": "2024-01-01T00:00:00Z"
        }
    ],
    "created_via_oauth": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
}
```

### OAuth Configuration Status
```python
{
    "google": {
        "configured": true,
        "client_id_set": true,
        "client_secret_set": true
    },
    "github": {
        "configured": true,
        "client_id_set": true,
        "client_secret_set": true
    }
}
```

## Error Handling

### Error Categories
1. **Configuration Errors**: Missing or invalid OAuth credentials
2. **Network Errors**: Failed requests to OAuth providers
3. **Token Errors**: Invalid or expired OAuth tokens
4. **User Errors**: Account linking or creation failures

### Error Response Codes
- `OAUTH_CONFIG_MISSING`: OAuth provider not configured
- `OAUTH_TOKEN_INVALID`: Invalid or expired token
- `OAUTH_NETWORK_ERROR`: Network request failed
- `OAUTH_USER_CREATE_FAILED`: User account creation failed
- `OAUTH_ACCOUNT_LINK_FAILED`: Account linking failed

### Retry Logic
- Network requests: 3 retries with exponential backoff
- Token validation: 2 retries for transient errors
- User creation: No retries (log and return error)

## Testing Strategy

### Unit Tests
- Environment variable loading and validation
- OAuth token validation functions
- User profile creation and linking logic
- Error handling for various failure scenarios

### Integration Tests
- Complete OAuth flow for Google authentication
- Complete OAuth flow for GitHub authentication
- Error handling with invalid tokens
- Account linking with existing users

### Manual Testing Scenarios
1. First-time OAuth sign-in (account creation)
2. Returning OAuth user sign-in
3. OAuth sign-in with existing email account (linking)
4. OAuth flow cancellation by user
5. Network failure during OAuth process
6. Invalid OAuth credentials configuration

## Security Considerations

### Token Security
- OAuth tokens are validated server-side only
- No OAuth secrets stored in frontend code
- Tokens are not logged in production

### User Data Protection
- Minimal user data requested from OAuth providers
- User consent required for account linking
- OAuth provider information stored securely

### Environment Security
- OAuth credentials stored in environment variables only
- Different credentials for development/production
- Credential validation on application startup

## Implementation Notes

### Backend Dependencies
- `requests`: For OAuth provider API calls
- `python-dotenv`: For environment variable loading
- `flask`: For OAuth route handling

### Frontend Dependencies
- `expo-auth-session`: For OAuth flow management
- `expo-auth-session/providers/google`: For Google OAuth
- `@react-native-async-storage/async-storage`: For session storage

### Configuration Requirements
- OAuth applications must be configured in Google Cloud Console
- OAuth applications must be configured in GitHub Developer Settings
- Redirect URIs must match between frontend and OAuth provider settings