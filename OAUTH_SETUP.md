# OAuth Setup Instructions

This document provides instructions for setting up OAuth authentication with Google and GitHub providers.

## Prerequisites

1. Google Cloud Console account
2. GitHub account with developer access
3. React Native development environment set up

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### 2. Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Career Mate AI"
   - User support email: Your email
   - Developer contact information: Your email

### 3. Create OAuth Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as application type
4. Add authorized redirect URIs:
   - `aicarrermateapp://oauth` (for mobile app)
   - `http://localhost:5000/api/oauth/google/callback` (for backend)
5. Copy the Client ID and Client Secret

### 4. Configure iOS (if building for iOS)

1. In Google Cloud Console, create another OAuth client ID
2. Choose "iOS" as application type
3. Enter your iOS bundle identifier: `com.anonymous.aicarrermateapp`
4. Copy the iOS Client ID

## GitHub OAuth Setup

### 1. Create GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: "Career Mate AI"
   - Homepage URL: `https://your-app-domain.com` (or localhost for development)
   - Authorization callback URL: `aicarrermateapp://oauth`
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

## Environment Configuration

### 1. Backend Configuration

Update `career_mate_backend/.env`:

```env
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_google_web_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=your_github_client_id_here
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret_here

# OAuth Redirect URI
OAUTH_REDIRECT_URI=aicarrermateapp://oauth
```

### 2. Frontend Configuration

Update `.env` in the root directory:

```env
# Google OAuth (use web client ID for React Native)
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=your_google_web_client_id_here

# GitHub OAuth
EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID=your_github_client_id_here

# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:5000

# OAuth Redirect URI
EXPO_PUBLIC_OAUTH_REDIRECT_URI=aicarrermateapp://oauth
```

### 3. App Configuration

Update `app.json` with your Google iOS client ID:

```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID_HERE"
        }
      ]
    ]
  }
}
```

## Testing OAuth Setup

### 1. Validate Configuration

Run the configuration validation:

```bash
# Backend validation
cd career_mate_backend
python -c "from oauth_config import OAuthConfig; print('Errors:', OAuthConfig.validate_config())"

# Frontend validation
cd ..
npm start
# Check console for OAuth configuration warnings
```

### 2. Test OAuth Flows

1. Start the backend server: `cd career_mate_backend && python run.py`
2. Start the React Native app: `npm start`
3. Test Google and GitHub sign-in buttons (once implemented)

## Security Notes

1. **Never commit real OAuth credentials to version control**
2. Use different OAuth apps for development and production
3. Regularly rotate OAuth client secrets
4. Monitor OAuth usage in provider dashboards
5. Implement proper token validation and storage

## Troubleshooting

### Common Issues

1. **"Invalid client" error**: Check that client IDs match between environment files and provider settings
2. **"Redirect URI mismatch"**: Ensure redirect URIs are exactly configured in OAuth provider settings
3. **"Unauthorized" error**: Verify client secrets are correct and not expired
4. **iOS build issues**: Ensure iOS client ID is properly configured in app.json

### Debug Steps

1. Check environment variables are loaded correctly
2. Verify OAuth provider configurations in respective dashboards
3. Test OAuth flows in web browser first
4. Check network requests in development tools
5. Review provider-specific documentation for any updates

## Next Steps

After completing this setup:

1. Implement OAuth service classes
2. Create OAuth UI components
3. Add OAuth endpoints to backend API
4. Test end-to-end OAuth flows
5. Add error handling and user feedback