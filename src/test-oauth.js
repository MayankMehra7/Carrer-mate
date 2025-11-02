/**
 * Quick OAuth test to verify everything is working
 */

import { api } from './api/api';

// Test OAuth API endpoints
console.log('Testing OAuth API...');

// Test Google OAuth
api.oauthGoogle({ test: 'data' }).then(result => {
  console.log('Google OAuth API test:', result);
}).catch(error => {
  console.error('Google OAuth API error:', error);
});

// Test GitHub OAuth  
api.oauthGitHub({ test: 'data' }).then(result => {
  console.log('GitHub OAuth API test:', result);
}).catch(error => {
  console.error('GitHub OAuth API error:', error);
});

console.log('OAuth test completed');