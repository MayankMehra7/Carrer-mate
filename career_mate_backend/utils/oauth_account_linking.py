"""
OAuth Account Linking Security Module

This module provides secure account linking functionality including:
- Email verification for account linking
- Authentication requirements for linking existing accounts
- Provider identity verification
- Security measures to prevent unauthorized account linking

Requirements: 3.2, 4.2
"""

import logging
import datetime
import secrets
import hashlib
import hmac
from typing import Dict, List, Optional, Any, Tuple
from bson import ObjectId
from .oauth_errors import OAuthException, OAuthErrorType
from .oauth_token_security import token_security_manager
from .rate_limiter import rate_limit

logger = logging.getLogger(__name__)

class AccountLinkingSecurityManager:
    """Manages secure OAuth account linking operations"""
    
    def __init__(self, mongo_db):
        self.db = mongo_db
        self.verification_timeout = 300  # 5 minutes
        self.max_verification_attempts = 3
        self.linking_session_timeout = 900  # 15 minutes
    
    def initiate_account_linking(self, user_id: ObjectId, provider: str, 
                               oauth_data: Dict[str, Any], 
                               current_session_token: str = None,
                               client_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Initiate secure account linking process
        
        Args:
            user_id (ObjectId): Current user's database ID
            provider (str): OAuth provider to link
            oauth_data (Dict): OAuth provider data
            current_session_token (str, optional): Current session token for verification
            client_info (Dict, optional): Client information (IP, user agent)
            
        Returns:
            Dict: Linking initiation result with verification requirements
        """
        try:
            # Validate current user session
            user = self.db.users.find_one({'_id': user_id})
            if not user:
                raise OAuthException(
                    OAuthErrorType.ACCOUNT_NOT_FOUND,
                    message="User account not found"
                )
            
            # Check if provider is already linked
            oauth_providers = user.get('oauth_providers', {})
            if provider in oauth_providers:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message=f"{provider.title()} account is already linked to this user",
                    details={'provider': provider, 'already_linked': True}
                )
            
            # Verify provider identity
            provider_verification = self._verify_provider_identity(
                provider, oauth_data, user.get('email_hash')
            )
            
            if not provider_verification['verified']:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message=provider_verification['error_message'],
                    details=provider_verification['details']
                )
            
            # Generate linking session
            linking_session = self._create_linking_session(
                user_id=user_id,
                provider=provider,
                oauth_data=oauth_data,
                client_info=client_info
            )
            
            # Determine verification requirements
            verification_requirements = self._determine_verification_requirements(
                user, provider, oauth_data
            )
            
            # Log linking initiation
            self._log_linking_activity(
                user_id=user_id,
                action='linking_initiated',
                provider=provider,
                details={
                    'verification_required': verification_requirements['email_verification_required'],
                    'password_required': verification_requirements['password_verification_required'],
                    'linking_session_id': str(linking_session['_id'])
                },
                client_info=client_info
            )
            
            return {
                'linking_session_id': str(linking_session['_id']),
                'verification_requirements': verification_requirements,
                'expires_at': linking_session['expires_at'].isoformat(),
                'provider': provider,
                'provider_email': oauth_data.get('email'),
                'message': 'Account linking initiated. Please complete verification steps.'
            }
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Error initiating account linking: {str(e)}")
            raise OAuthException(
                OAuthErrorType.LINKING_ERROR,
                details={'action': 'initiate_linking', 'provider': provider},
                original_error=e
            )
    
    def verify_email_for_linking(self, linking_session_id: str, 
                                verification_code: str) -> Dict[str, Any]:
        """
        Verify email ownership for account linking
        
        Args:
            linking_session_id (str): Linking session ID
            verification_code (str): Email verification code
            
        Returns:
            Dict: Verification result
        """
        try:
            # Get linking session
            linking_session = self._get_linking_session(linking_session_id)
            if not linking_session:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Invalid or expired linking session"
                )
            
            # Check verification attempts
            attempts = linking_session.get('email_verification_attempts', 0)
            if attempts >= self.max_verification_attempts:
                self._expire_linking_session(linking_session['_id'], 'max_attempts_exceeded')
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Maximum verification attempts exceeded. Please start over."
                )
            
            # Verify email code
            stored_code = linking_session.get('email_verification_code')
            code_expires_at = linking_session.get('email_verification_expires_at')
            
            if not stored_code or not code_expires_at:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Email verification not initiated"
                )
            
            if datetime.datetime.utcnow() > code_expires_at:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Email verification code has expired"
                )
            
            # Verify code using secure comparison
            if not hmac.compare_digest(stored_code, verification_code):
                # Increment attempts
                self.db.oauth_linking_sessions.update_one(
                    {'_id': linking_session['_id']},
                    {'$inc': {'email_verification_attempts': 1}}
                )
                
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Invalid verification code"
                )
            
            # Mark email as verified
            self.db.oauth_linking_sessions.update_one(
                {'_id': linking_session['_id']},
                {'$set': {
                    'email_verified': True,
                    'email_verified_at': datetime.datetime.utcnow()
                }}
            )
            
            # Log verification success
            self._log_linking_activity(
                user_id=linking_session['user_id'],
                action='email_verified',
                provider=linking_session['provider'],
                details={'linking_session_id': linking_session_id}
            )
            
            return {
                'email_verified': True,
                'message': 'Email verification successful',
                'next_step': self._get_next_verification_step(linking_session['_id'])
            }
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Error verifying email for linking: {str(e)}")
            raise OAuthException(
                OAuthErrorType.LINKING_ERROR,
                details={'action': 'verify_email', 'linking_session_id': linking_session_id},
                original_error=e
            )
    
    def verify_password_for_linking(self, linking_session_id: str, 
                                  password: str) -> Dict[str, Any]:
        """
        Verify current password for account linking
        
        Args:
            linking_session_id (str): Linking session ID
            password (str): Current account password
            
        Returns:
            Dict: Verification result
        """
        try:
            # Get linking session
            linking_session = self._get_linking_session(linking_session_id)
            if not linking_session:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Invalid or expired linking session"
                )
            
            # Get user
            user = self.db.users.find_one({'_id': linking_session['user_id']})
            if not user:
                raise OAuthException(
                    OAuthErrorType.ACCOUNT_NOT_FOUND,
                    message="User account not found"
                )
            
            # Check password verification attempts
            attempts = linking_session.get('password_verification_attempts', 0)
            if attempts >= self.max_verification_attempts:
                self._expire_linking_session(linking_session['_id'], 'max_attempts_exceeded')
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Maximum password verification attempts exceeded"
                )
            
            # Verify password
            import bcrypt
            stored_password = user.get('password')
            if not stored_password:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Account does not have a password set"
                )
            
            if not bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
                # Increment attempts
                self.db.oauth_linking_sessions.update_one(
                    {'_id': linking_session['_id']},
                    {'$inc': {'password_verification_attempts': 1}}
                )
                
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Invalid password"
                )
            
            # Mark password as verified
            self.db.oauth_linking_sessions.update_one(
                {'_id': linking_session['_id']},
                {'$set': {
                    'password_verified': True,
                    'password_verified_at': datetime.datetime.utcnow()
                }}
            )
            
            # Log verification success
            self._log_linking_activity(
                user_id=linking_session['user_id'],
                action='password_verified',
                provider=linking_session['provider'],
                details={'linking_session_id': linking_session_id}
            )
            
            return {
                'password_verified': True,
                'message': 'Password verification successful',
                'next_step': self._get_next_verification_step(linking_session['_id'])
            }
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Error verifying password for linking: {str(e)}")
            raise OAuthException(
                OAuthErrorType.LINKING_ERROR,
                details={'action': 'verify_password', 'linking_session_id': linking_session_id},
                original_error=e
            )
    
    def complete_account_linking(self, linking_session_id: str) -> Dict[str, Any]:
        """
        Complete the account linking process after all verifications
        
        Args:
            linking_session_id (str): Linking session ID
            
        Returns:
            Dict: Linking completion result
        """
        try:
            # Get linking session
            linking_session = self._get_linking_session(linking_session_id)
            if not linking_session:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Invalid or expired linking session"
                )
            
            # Verify all required verifications are complete
            verification_status = self._check_verification_status(linking_session)
            if not verification_status['all_verified']:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Not all verification requirements have been met",
                    details=verification_status
                )
            
            # Perform the actual account linking
            user_id = linking_session['user_id']
            provider = linking_session['provider']
            oauth_data = linking_session['oauth_data']
            
            # Link the OAuth provider
            from .account_merger import get_account_merger
            account_merger = get_account_merger(self.db)
            
            success = account_merger.link_oauth_provider(user_id, provider, oauth_data)
            
            if not success:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message=f"Failed to link {provider} account"
                )
            
            # Create OAuth session for the newly linked provider
            from models import create_oauth_session
            create_oauth_session(
                mongo={'db': self.db},
                user_id=user_id,
                provider=provider,
                provider_user_id=oauth_data.get('id'),
                access_token=linking_session.get('access_token', ''),
                expires_in=3600
            )
            
            # Mark linking session as completed
            self.db.oauth_linking_sessions.update_one(
                {'_id': linking_session['_id']},
                {'$set': {
                    'completed': True,
                    'completed_at': datetime.datetime.utcnow(),
                    'status': 'success'
                }}
            )
            
            # Log successful linking
            self._log_linking_activity(
                user_id=user_id,
                action='linking_completed',
                provider=provider,
                details={
                    'linking_session_id': linking_session_id,
                    'provider_email': oauth_data.get('email')
                }
            )
            
            # Get updated user
            updated_user = self.db.users.find_one({'_id': user_id})
            
            return {
                'success': True,
                'message': f'{provider.title()} account successfully linked',
                'provider': provider,
                'user': {
                    'oauth_providers': updated_user.get('oauth_providers', {}),
                    'login_methods': updated_user.get('login_methods', [])
                }
            }
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Error completing account linking: {str(e)}")
            raise OAuthException(
                OAuthErrorType.LINKING_ERROR,
                details={'action': 'complete_linking', 'linking_session_id': linking_session_id},
                original_error=e
            )
    
    def send_email_verification(self, linking_session_id: str) -> Dict[str, Any]:
        """
        Send email verification code for account linking
        
        Args:
            linking_session_id (str): Linking session ID
            
        Returns:
            Dict: Email sending result
        """
        try:
            # Get linking session
            linking_session = self._get_linking_session(linking_session_id)
            if not linking_session:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Invalid or expired linking session"
                )
            
            # Generate verification code
            verification_code = self._generate_verification_code()
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(
                seconds=self.verification_timeout
            )
            
            # Update linking session with verification code
            self.db.oauth_linking_sessions.update_one(
                {'_id': linking_session['_id']},
                {'$set': {
                    'email_verification_code': verification_code,
                    'email_verification_expires_at': expires_at,
                    'email_verification_sent_at': datetime.datetime.utcnow()
                }}
            )
            
            # Send email (using existing email utility)
            from utils.helpers import send_email
            oauth_data = linking_session['oauth_data']
            provider_email = oauth_data.get('email')
            
            email_subject = f"CareerMate - Verify {linking_session['provider'].title()} Account Linking"
            email_body = f"""
            You are attempting to link your {linking_session['provider'].title()} account to your CareerMate account.
            
            Verification Code: {verification_code}
            
            This code will expire in {self.verification_timeout // 60} minutes.
            
            If you did not initiate this request, please ignore this email.
            """
            
            email_sent = send_email(provider_email, email_subject, email_body)
            
            if not email_sent:
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message="Failed to send verification email"
                )
            
            return {
                'email_sent': True,
                'email': provider_email,
                'expires_at': expires_at.isoformat(),
                'message': f'Verification code sent to {provider_email}'
            }
            
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Error sending email verification: {str(e)}")
            raise OAuthException(
                OAuthErrorType.LINKING_ERROR,
                details={'action': 'send_email_verification', 'linking_session_id': linking_session_id},
                original_error=e
            )
    
    def cancel_account_linking(self, linking_session_id: str, 
                             reason: str = 'user_cancelled') -> Dict[str, Any]:
        """
        Cancel account linking process
        
        Args:
            linking_session_id (str): Linking session ID
            reason (str): Cancellation reason
            
        Returns:
            Dict: Cancellation result
        """
        try:
            # Get linking session
            linking_session = self._get_linking_session(linking_session_id)
            if not linking_session:
                return {'cancelled': True, 'message': 'Linking session not found or already expired'}
            
            # Mark as cancelled
            self.db.oauth_linking_sessions.update_one(
                {'_id': linking_session['_id']},
                {'$set': {
                    'cancelled': True,
                    'cancelled_at': datetime.datetime.utcnow(),
                    'cancellation_reason': reason,
                    'status': 'cancelled'
                }}
            )
            
            # Log cancellation
            self._log_linking_activity(
                user_id=linking_session['user_id'],
                action='linking_cancelled',
                provider=linking_session['provider'],
                details={
                    'linking_session_id': linking_session_id,
                    'reason': reason
                }
            )
            
            return {
                'cancelled': True,
                'message': 'Account linking cancelled successfully'
            }
            
        except Exception as e:
            logger.error(f"Error cancelling account linking: {str(e)}")
            return {
                'cancelled': True,
                'message': 'Account linking cancelled (with errors)'
            }
    
    def _verify_provider_identity(self, provider: str, oauth_data: Dict[str, Any], 
                                user_email_hash: str) -> Dict[str, Any]:
        """
        Verify OAuth provider identity and email ownership
        
        Args:
            provider (str): OAuth provider name
            oauth_data (Dict): OAuth provider data
            user_email_hash (str): Current user's email hash
            
        Returns:
            Dict: Verification result
        """
        try:
            provider_email = oauth_data.get('email')
            if not provider_email:
                return {
                    'verified': False,
                    'error_message': f'{provider.title()} account must have a verified email address',
                    'details': {'reason': 'no_email'}
                }
            
            # Hash provider email and compare with user email
            from db import hash_email
            provider_email_hash = hash_email(provider_email)
            
            if provider_email_hash != user_email_hash:
                return {
                    'verified': False,
                    'error_message': 'OAuth account email must match your current account email',
                    'details': {
                        'reason': 'email_mismatch',
                        'provider_email': provider_email
                    }
                }
            
            # Check if this provider account is already linked to another user
            existing_link = self.db.users.find_one({
                f'oauth_providers.{provider}.id': oauth_data.get('id'),
                'email_hash': {'$ne': user_email_hash}
            })
            
            if existing_link:
                return {
                    'verified': False,
                    'error_message': f'This {provider.title()} account is already linked to another user',
                    'details': {'reason': 'already_linked_elsewhere'}
                }
            
            return {
                'verified': True,
                'provider_email': provider_email
            }
            
        except Exception as e:
            logger.error(f"Error verifying provider identity: {str(e)}")
            return {
                'verified': False,
                'error_message': 'Failed to verify provider identity',
                'details': {'reason': 'verification_error'}
            }
    
    def _create_linking_session(self, user_id: ObjectId, provider: str, 
                              oauth_data: Dict[str, Any], 
                              client_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a new account linking session"""
        try:
            session_id = ObjectId()
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(
                seconds=self.linking_session_timeout
            )
            
            session_doc = {
                '_id': session_id,
                'user_id': user_id,
                'provider': provider,
                'oauth_data': oauth_data,
                'created_at': datetime.datetime.utcnow(),
                'expires_at': expires_at,
                'status': 'pending',
                'email_verified': False,
                'password_verified': False,
                'completed': False,
                'cancelled': False,
                'client_info': client_info or {},
                'email_verification_attempts': 0,
                'password_verification_attempts': 0
            }
            
            self.db.oauth_linking_sessions.insert_one(session_doc)
            return session_doc
            
        except Exception as e:
            logger.error(f"Error creating linking session: {str(e)}")
            raise
    
    def _get_linking_session(self, linking_session_id: str) -> Optional[Dict[str, Any]]:
        """Get linking session by ID"""
        try:
            session = self.db.oauth_linking_sessions.find_one({
                '_id': ObjectId(linking_session_id),
                'expires_at': {'$gt': datetime.datetime.utcnow()},
                'completed': False,
                'cancelled': False
            })
            return session
            
        except Exception as e:
            logger.error(f"Error getting linking session: {str(e)}")
            return None
    
    def _determine_verification_requirements(self, user: Dict[str, Any], 
                                           provider: str, 
                                           oauth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Determine what verification steps are required"""
        requirements = {
            'email_verification_required': True,  # Always require email verification
            'password_verification_required': bool(user.get('password')),  # Require if user has password
            'steps': []
        }
        
        if requirements['email_verification_required']:
            requirements['steps'].append({
                'step': 'email_verification',
                'description': f'Verify ownership of {oauth_data.get("email")} email address',
                'required': True
            })
        
        if requirements['password_verification_required']:
            requirements['steps'].append({
                'step': 'password_verification',
                'description': 'Enter your current account password',
                'required': True
            })
        
        return requirements
    
    def _check_verification_status(self, linking_session: Dict[str, Any]) -> Dict[str, Any]:
        """Check if all required verifications are complete"""
        user = self.db.users.find_one({'_id': linking_session['user_id']})
        
        email_required = True
        password_required = bool(user.get('password'))
        
        email_verified = linking_session.get('email_verified', False)
        password_verified = linking_session.get('password_verified', False)
        
        all_verified = (
            (not email_required or email_verified) and
            (not password_required or password_verified)
        )
        
        return {
            'all_verified': all_verified,
            'email_verification': {
                'required': email_required,
                'completed': email_verified
            },
            'password_verification': {
                'required': password_required,
                'completed': password_verified
            }
        }
    
    def _get_next_verification_step(self, linking_session_id: ObjectId) -> Optional[str]:
        """Get the next required verification step"""
        linking_session = self.db.oauth_linking_sessions.find_one({'_id': linking_session_id})
        if not linking_session:
            return None
        
        verification_status = self._check_verification_status(linking_session)
        
        if verification_status['email_verification']['required'] and not verification_status['email_verification']['completed']:
            return 'email_verification'
        
        if verification_status['password_verification']['required'] and not verification_status['password_verification']['completed']:
            return 'password_verification'
        
        if verification_status['all_verified']:
            return 'complete_linking'
        
        return None
    
    def _generate_verification_code(self) -> str:
        """Generate a secure verification code"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    def _expire_linking_session(self, session_id: ObjectId, reason: str) -> None:
        """Mark linking session as expired"""
        try:
            self.db.oauth_linking_sessions.update_one(
                {'_id': session_id},
                {'$set': {
                    'expired': True,
                    'expired_at': datetime.datetime.utcnow(),
                    'expiration_reason': reason,
                    'status': 'expired'
                }}
            )
        except Exception as e:
            logger.error(f"Error expiring linking session: {str(e)}")
    
    def _log_linking_activity(self, user_id: ObjectId, action: str, provider: str,
                            details: Dict[str, Any] = None, 
                            client_info: Dict[str, Any] = None) -> None:
        """Log account linking activity for audit purposes"""
        try:
            audit_entry = {
                'user_id': user_id,
                'action': action,
                'provider': provider,
                'timestamp': datetime.datetime.utcnow(),
                'details': details or {},
                'client_info': client_info or {}
            }
            
            self.db.oauth_linking_audit.insert_one(audit_entry)
            
        except Exception as e:
            logger.error(f"Error logging linking activity: {str(e)}")
    
    def cleanup_expired_linking_sessions(self) -> int:
        """Clean up expired linking sessions"""
        try:
            cutoff_date = datetime.datetime.utcnow()
            
            result = self.db.oauth_linking_sessions.delete_many({
                '$or': [
                    {'expires_at': {'$lt': cutoff_date}},
                    {'completed': True, 'created_at': {'$lt': cutoff_date - datetime.timedelta(days=1)}},
                    {'cancelled': True, 'created_at': {'$lt': cutoff_date - datetime.timedelta(days=1)}}
                ]
            })
            
            logger.info(f"Cleaned up {result.deleted_count} expired linking sessions")
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up linking sessions: {str(e)}")
            return 0

# Global instance for easy import
def get_account_linking_security_manager(db):
    """Get account linking security manager instance"""
    return AccountLinkingSecurityManager(db)