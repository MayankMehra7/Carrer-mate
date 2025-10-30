"""
Test OAuth Account Linking Security Implementation

This test file validates the secure account linking functionality including:
- Email verification for account linking
- Password verification requirements
- Provider identity verification
- Security measures against unauthorized linking

Requirements: 3.2, 4.2
"""

import unittest
import datetime
from unittest.mock import Mock, patch, MagicMock
from bson import ObjectId
import bcrypt

# Mock the database and utilities
class MockDB:
    def __init__(self):
        self.users = Mock()
        self.oauth_linking_sessions = Mock()
        self.oauth_linking_audit = Mock()
        self.oauth_sessions = Mock()

class TestOAuthAccountLinkingSecurity(unittest.TestCase):
    """Test cases for OAuth account linking security"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_db = MockDB()
        
        # Import the module under test
        from utils.oauth_account_linking import AccountLinkingSecurityManager
        self.linking_manager = AccountLinkingSecurityManager(self.mock_db)
        
        # Test data
        self.user_id = ObjectId()
        self.user_email_hash = "test_email_hash"
        self.provider = "google"
        self.oauth_data = {
            'id': 'google_user_123',
            'email': 'test@example.com',
            'name': 'Test User',
            'picture': 'https://example.com/avatar.jpg'
        }
        
        self.test_user = {
            '_id': self.user_id,
            'email_hash': self.user_email_hash,
            'name': 'Test User',
            'username': 'testuser',
            'password': bcrypt.hashpw('testpassword'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            'oauth_providers': {},
            'login_methods': ['email']
        }
    
    def test_initiate_account_linking_success(self):
        """Test successful account linking initiation"""
        # Mock user lookup
        self.mock_db.users.find_one.return_value = self.test_user
        
        # Mock provider identity verification
        with patch.object(self.linking_manager, '_verify_provider_identity') as mock_verify:
            mock_verify.return_value = {'verified': True, 'provider_email': 'test@example.com'}
            
            # Mock linking session creation
            with patch.object(self.linking_manager, '_create_linking_session') as mock_create:
                mock_session = {
                    '_id': ObjectId(),
                    'user_id': self.user_id,
                    'provider': self.provider,
                    'expires_at': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
                }
                mock_create.return_value = mock_session
                
                # Mock verification requirements
                with patch.object(self.linking_manager, '_determine_verification_requirements') as mock_requirements:
                    mock_requirements.return_value = {
                        'email_verification_required': True,
                        'password_verification_required': True,
                        'steps': []
                    }
                    
                    # Mock logging
                    with patch.object(self.linking_manager, '_log_linking_activity'):
                        result = self.linking_manager.initiate_account_linking(
                            user_id=self.user_id,
                            provider=self.provider,
                            oauth_data=self.oauth_data
                        )
                        
                        # Assertions
                        self.assertIn('linking_session_id', result)
                        self.assertIn('verification_requirements', result)
                        self.assertEqual(result['provider'], self.provider)
                        self.assertTrue(result['verification_requirements']['email_verification_required'])
                        self.assertTrue(result['verification_requirements']['password_verification_required'])
    
    def test_initiate_account_linking_provider_already_linked(self):
        """Test account linking initiation when provider is already linked"""
        # Mock user with existing OAuth provider
        user_with_oauth = self.test_user.copy()
        user_with_oauth['oauth_providers'] = {
            'google': {
                'id': 'google_user_123',
                'email': 'test@example.com'
            }
        }
        self.mock_db.users.find_one.return_value = user_with_oauth
        
        # Test should raise exception
        from utils.oauth_errors import OAuthException, OAuthErrorType
        with self.assertRaises(OAuthException) as context:
            self.linking_manager.initiate_account_linking(
                user_id=self.user_id,
                provider=self.provider,
                oauth_data=self.oauth_data
            )
        
        self.assertEqual(context.exception.error_type, OAuthErrorType.LINKING_ERROR)
    
    def test_verify_provider_identity_success(self):
        """Test successful provider identity verification"""
        with patch('db.hash_email') as mock_hash:
            mock_hash.return_value = self.user_email_hash
            
            # Mock no existing links
            self.mock_db.users.find_one.return_value = None
            
            result = self.linking_manager._verify_provider_identity(
                provider=self.provider,
                oauth_data=self.oauth_data,
                user_email_hash=self.user_email_hash
            )
            
            self.assertTrue(result['verified'])
            self.assertEqual(result['provider_email'], 'test@example.com')
    
    def test_verify_provider_identity_email_mismatch(self):
        """Test provider identity verification with email mismatch"""
        with patch('db.hash_email') as mock_hash:
            mock_hash.return_value = 'different_email_hash'
            
            result = self.linking_manager._verify_provider_identity(
                provider=self.provider,
                oauth_data=self.oauth_data,
                user_email_hash=self.user_email_hash
            )
            
            self.assertFalse(result['verified'])
            self.assertEqual(result['details']['reason'], 'email_mismatch')
    
    def test_verify_provider_identity_already_linked_elsewhere(self):
        """Test provider identity verification when already linked to another user"""
        with patch('db.hash_email') as mock_hash:
            mock_hash.return_value = self.user_email_hash
            
            # Mock existing link to different user
            self.mock_db.users.find_one.return_value = {
                '_id': ObjectId(),  # Different user ID
                'email_hash': 'different_user_hash'
            }
            
            result = self.linking_manager._verify_provider_identity(
                provider=self.provider,
                oauth_data=self.oauth_data,
                user_email_hash=self.user_email_hash
            )
            
            self.assertFalse(result['verified'])
            self.assertEqual(result['details']['reason'], 'already_linked_elsewhere')
    
    def test_verify_email_for_linking_success(self):
        """Test successful email verification for linking"""
        linking_session_id = str(ObjectId())
        verification_code = '123456'
        
        # Mock linking session
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'email_verification_code': verification_code,
            'email_verification_expires_at': datetime.datetime.utcnow() + datetime.timedelta(minutes=5),
            'email_verification_attempts': 0
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            with patch.object(self.linking_manager, '_get_next_verification_step') as mock_next:
                mock_next.return_value = 'password_verification'
                
                with patch.object(self.linking_manager, '_log_linking_activity'):
                    result = self.linking_manager.verify_email_for_linking(
                        linking_session_id=linking_session_id,
                        verification_code=verification_code
                    )
                    
                    self.assertTrue(result['email_verified'])
                    self.assertEqual(result['next_step'], 'password_verification')
                    
                    # Verify database update was called
                    self.mock_db.oauth_linking_sessions.update_one.assert_called()
    
    def test_verify_email_for_linking_invalid_code(self):
        """Test email verification with invalid code"""
        linking_session_id = str(ObjectId())
        verification_code = '123456'
        wrong_code = '654321'
        
        # Mock linking session
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'email_verification_code': verification_code,
            'email_verification_expires_at': datetime.datetime.utcnow() + datetime.timedelta(minutes=5),
            'email_verification_attempts': 0
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            from utils.oauth_errors import OAuthException, OAuthErrorType
            with self.assertRaises(OAuthException) as context:
                self.linking_manager.verify_email_for_linking(
                    linking_session_id=linking_session_id,
                    verification_code=wrong_code
                )
            
            self.assertEqual(context.exception.error_type, OAuthErrorType.LINKING_ERROR)
            self.assertIn('Invalid verification code', str(context.exception))
    
    def test_verify_email_for_linking_expired_code(self):
        """Test email verification with expired code"""
        linking_session_id = str(ObjectId())
        verification_code = '123456'
        
        # Mock linking session with expired code
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'email_verification_code': verification_code,
            'email_verification_expires_at': datetime.datetime.utcnow() - datetime.timedelta(minutes=1),  # Expired
            'email_verification_attempts': 0
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            from utils.oauth_errors import OAuthException, OAuthErrorType
            with self.assertRaises(OAuthException) as context:
                self.linking_manager.verify_email_for_linking(
                    linking_session_id=linking_session_id,
                    verification_code=verification_code
                )
            
            self.assertEqual(context.exception.error_type, OAuthErrorType.LINKING_ERROR)
            self.assertIn('expired', str(context.exception))
    
    def test_verify_password_for_linking_success(self):
        """Test successful password verification for linking"""
        linking_session_id = str(ObjectId())
        password = 'testpassword'
        
        # Mock linking session
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'password_verification_attempts': 0
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            # Mock user lookup
            self.mock_db.users.find_one.return_value = self.test_user
            
            with patch.object(self.linking_manager, '_get_next_verification_step') as mock_next:
                mock_next.return_value = 'complete_linking'
                
                with patch.object(self.linking_manager, '_log_linking_activity'):
                    result = self.linking_manager.verify_password_for_linking(
                        linking_session_id=linking_session_id,
                        password=password
                    )
                    
                    self.assertTrue(result['password_verified'])
                    self.assertEqual(result['next_step'], 'complete_linking')
    
    def test_verify_password_for_linking_invalid_password(self):
        """Test password verification with invalid password"""
        linking_session_id = str(ObjectId())
        wrong_password = 'wrongpassword'
        
        # Mock linking session
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'password_verification_attempts': 0
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            # Mock user lookup
            self.mock_db.users.find_one.return_value = self.test_user
            
            from utils.oauth_errors import OAuthException, OAuthErrorType
            with self.assertRaises(OAuthException) as context:
                self.linking_manager.verify_password_for_linking(
                    linking_session_id=linking_session_id,
                    password=wrong_password
                )
            
            self.assertEqual(context.exception.error_type, OAuthErrorType.LINKING_ERROR)
            self.assertIn('Invalid password', str(context.exception))
    
    def test_complete_account_linking_success(self):
        """Test successful account linking completion"""
        linking_session_id = str(ObjectId())
        
        # Mock linking session
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'oauth_data': self.oauth_data,
            'email_verified': True,
            'password_verified': True
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            with patch.object(self.linking_manager, '_check_verification_status') as mock_check:
                mock_check.return_value = {'all_verified': True}
                
                # Mock account merger
                with patch('utils.account_merger.get_account_merger') as mock_merger_factory:
                    mock_merger = Mock()
                    mock_merger.link_oauth_provider.return_value = True
                    mock_merger_factory.return_value = mock_merger
                    
                    # Mock OAuth session creation
                    with patch('models.create_oauth_session'):
                        # Mock updated user
                        updated_user = self.test_user.copy()
                        updated_user['oauth_providers'] = {
                            'google': self.oauth_data
                        }
                        updated_user['login_methods'] = ['email', 'google']
                        self.mock_db.users.find_one.return_value = updated_user
                        
                        with patch.object(self.linking_manager, '_log_linking_activity'):
                            result = self.linking_manager.complete_account_linking(linking_session_id)
                            
                            self.assertTrue(result['success'])
                            self.assertEqual(result['provider'], self.provider)
                            self.assertIn('google', result['user']['oauth_providers'])
    
    def test_complete_account_linking_verification_incomplete(self):
        """Test account linking completion with incomplete verification"""
        linking_session_id = str(ObjectId())
        
        # Mock linking session
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'oauth_data': self.oauth_data,
            'email_verified': False,  # Not verified
            'password_verified': True
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            with patch.object(self.linking_manager, '_check_verification_status') as mock_check:
                mock_check.return_value = {
                    'all_verified': False,
                    'email_verification': {'required': True, 'completed': False},
                    'password_verification': {'required': True, 'completed': True}
                }
                
                from utils.oauth_errors import OAuthException, OAuthErrorType
                with self.assertRaises(OAuthException) as context:
                    self.linking_manager.complete_account_linking(linking_session_id)
                
                self.assertEqual(context.exception.error_type, OAuthErrorType.LINKING_ERROR)
                self.assertIn('verification requirements', str(context.exception))
    
    def test_send_email_verification_success(self):
        """Test successful email verification sending"""
        linking_session_id = str(ObjectId())
        
        # Mock linking session
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider,
            'oauth_data': self.oauth_data
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            with patch.object(self.linking_manager, '_generate_verification_code') as mock_code:
                mock_code.return_value = '123456'
                
                with patch('utils.helpers.send_email') as mock_send:
                    mock_send.return_value = True
                    
                    result = self.linking_manager.send_email_verification(linking_session_id)
                    
                    self.assertTrue(result['email_sent'])
                    self.assertEqual(result['email'], self.oauth_data['email'])
                    self.assertIn('expires_at', result)
    
    def test_cancel_account_linking_success(self):
        """Test successful account linking cancellation"""
        linking_session_id = str(ObjectId())
        
        # Mock linking session
        mock_session = {
            '_id': ObjectId(linking_session_id),
            'user_id': self.user_id,
            'provider': self.provider
        }
        
        with patch.object(self.linking_manager, '_get_linking_session') as mock_get:
            mock_get.return_value = mock_session
            
            with patch.object(self.linking_manager, '_log_linking_activity'):
                result = self.linking_manager.cancel_account_linking(
                    linking_session_id=linking_session_id,
                    reason='user_cancelled'
                )
                
                self.assertTrue(result['cancelled'])
                self.assertIn('cancelled successfully', result['message'])
                
                # Verify database update was called
                self.mock_db.oauth_linking_sessions.update_one.assert_called()
    
    def test_generate_verification_code(self):
        """Test verification code generation"""
        code = self.linking_manager._generate_verification_code()
        
        # Should be 6 digits
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())
    
    def test_determine_verification_requirements(self):
        """Test verification requirements determination"""
        # User with password
        user_with_password = self.test_user.copy()
        
        requirements = self.linking_manager._determine_verification_requirements(
            user=user_with_password,
            provider=self.provider,
            oauth_data=self.oauth_data
        )
        
        self.assertTrue(requirements['email_verification_required'])
        self.assertTrue(requirements['password_verification_required'])
        self.assertEqual(len(requirements['steps']), 2)
        
        # User without password
        user_without_password = self.test_user.copy()
        del user_without_password['password']
        
        requirements = self.linking_manager._determine_verification_requirements(
            user=user_without_password,
            provider=self.provider,
            oauth_data=self.oauth_data
        )
        
        self.assertTrue(requirements['email_verification_required'])
        self.assertFalse(requirements['password_verification_required'])
        self.assertEqual(len(requirements['steps']), 1)
    
    def test_cleanup_expired_linking_sessions(self):
        """Test cleanup of expired linking sessions"""
        # Mock delete result
        mock_result = Mock()
        mock_result.deleted_count = 5
        self.mock_db.oauth_linking_sessions.delete_many.return_value = mock_result
        
        count = self.linking_manager.cleanup_expired_linking_sessions()
        
        self.assertEqual(count, 5)
        self.mock_db.oauth_linking_sessions.delete_many.assert_called()

def run_security_tests():
    """Run all OAuth account linking security tests"""
    print("🧪 Running OAuth Account Linking Security Tests")
    print("=" * 60)
    
    # Create test suite
    test_suite = unittest.TestLoader().loadTestsFromTestCase(TestOAuthAccountLinkingSecurity)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print("\n" + "=" * 60)
    if result.wasSuccessful():
        print("✅ All OAuth account linking security tests passed!")
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
    success = run_security_tests()
    exit(0 if success else 1)