"""
Account Merger Utility

This module provides functionality for merging OAuth accounts with existing accounts,
handling account conflicts, and managing multiple OAuth provider scenarios.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from bson import ObjectId
from .oauth_errors import OAuthException, OAuthErrorType, AccountConflictException

logger = logging.getLogger(__name__)

class AccountMerger:
    """Utility class for handling account merging and conflict resolution"""
    
    def __init__(self, db):
        self.db = db
        self.users = db.users
        self.oauth_sessions = db.oauth_sessions
    
    def check_account_conflict(self, email: str, provider: str, provider_user_id: str) -> Dict[str, Any]:
        """
        Check if there's an account conflict for the given email and provider
        
        Args:
            email (str): User's email address
            provider (str): OAuth provider name
            provider_user_id (str): Provider-specific user ID
            
        Returns:
            Dict containing conflict information or None if no conflict
        """
        # Find existing user by email
        from db import find_user_by_email
        existing_user = find_user_by_email(email)
        
        if not existing_user:
            return None
        
        # Check if this provider is already linked
        oauth_providers = existing_user.get('oauth_providers', {})
        if provider in oauth_providers:
            # Check if it's the same provider account
            if str(oauth_providers[provider].get('id')) == str(provider_user_id):
                return None  # Same account, no conflict
            else:
                # Different account for same provider
                return {
                    'type': 'provider_account_mismatch',
                    'email': email,
                    'provider': provider,
                    'existing_provider_id': oauth_providers[provider].get('id'),
                    'attempted_provider_id': provider_user_id,
                    'existing_providers': list(oauth_providers.keys()) + (['email'] if existing_user.get('password') else [])
                }
        
        # Provider not linked, check what auth methods exist
        existing_providers = []
        
        # Check for email/password authentication
        if existing_user.get('password'):
            existing_providers.append('email')
        
        # Add existing OAuth providers
        existing_providers.extend(oauth_providers.keys())
        
        if existing_providers:
            return {
                'type': 'account_exists',
                'email': email,
                'provider': provider,
                'existing_providers': existing_providers,
                'can_link': True,
                'user_id': existing_user['_id']
            }
        
        return None
    
    def can_link_provider(self, user_id: ObjectId, provider: str, provider_user_id: str) -> bool:
        """
        Check if a provider can be linked to an existing user account
        
        Args:
            user_id (ObjectId): User's database ID
            provider (str): OAuth provider name
            provider_user_id (str): Provider-specific user ID
            
        Returns:
            bool: True if provider can be linked
        """
        try:
            user = self.users.find_one({'_id': user_id})
            if not user:
                return False
            
            oauth_providers = user.get('oauth_providers', {})
            
            # Check if provider is already linked
            if provider in oauth_providers:
                # Can only link if it's the same provider account
                return str(oauth_providers[provider].get('id')) == str(provider_user_id)
            
            # Check if this provider account is linked to another user
            existing_link = self.users.find_one({
                f'oauth_providers.{provider}.id': provider_user_id
            })
            
            return existing_link is None
            
        except Exception as e:
            logger.error(f"Error checking if provider can be linked: {e}")
            return False
    
    def link_oauth_provider(self, user_id: ObjectId, provider: str, oauth_data: Dict[str, Any]) -> bool:
        """
        Link an OAuth provider to an existing user account
        
        Args:
            user_id (ObjectId): User's database ID
            provider (str): OAuth provider name
            oauth_data (Dict): OAuth provider data
            
        Returns:
            bool: True if linking was successful
        """
        try:
            # Validate that linking is allowed
            provider_user_id = oauth_data.get('id')
            if not self.can_link_provider(user_id, provider, provider_user_id):
                raise OAuthException(
                    OAuthErrorType.LINKING_ERROR,
                    message=f"Cannot link {provider} account - already linked to another user",
                    details={'provider': provider, 'user_id': str(user_id)}
                )
            
            # Prepare OAuth provider data
            provider_data = {
                **oauth_data,
                'linked_at': datetime.utcnow()
            }
            
            # Update user document
            result = self.users.update_one(
                {'_id': user_id},
                {
                    '$set': {
                        f'oauth_providers.{provider}': provider_data,
                        'updated_at': datetime.utcnow()
                    },
                    '$addToSet': {
                        'login_methods': provider
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.info(f"Successfully linked {provider} provider to user {user_id}")
                return True
            else:
                logger.warning(f"Failed to link {provider} provider to user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error linking OAuth provider: {e}")
            raise OAuthException(
                OAuthErrorType.LINKING_ERROR,
                details={'provider': provider, 'user_id': str(user_id)},
                original_error=e
            )
    
    def unlink_oauth_provider(self, user_id: ObjectId, provider: str) -> bool:
        """
        Unlink an OAuth provider from a user account
        
        Args:
            user_id (ObjectId): User's database ID
            provider (str): OAuth provider name
            
        Returns:
            bool: True if unlinking was successful
        """
        try:
            # Get user to check current state
            user = self.users.find_one({'_id': user_id})
            if not user:
                raise OAuthException(
                    OAuthErrorType.ACCOUNT_NOT_FOUND,
                    details={'user_id': str(user_id)}
                )
            
            oauth_providers = user.get('oauth_providers', {})
            
            # Check if provider is linked
            if provider not in oauth_providers:
                raise OAuthException(
                    OAuthErrorType.UNLINKING_ERROR,
                    message=f"{provider} is not linked to this account",
                    details={'provider': provider, 'user_id': str(user_id)}
                )
            
            # Check if user will have at least one authentication method left
            remaining_providers = [p for p in oauth_providers.keys() if p != provider]
            has_password = bool(user.get('password'))
            
            if not remaining_providers and not has_password:
                raise OAuthException(
                    OAuthErrorType.UNLINKING_ERROR,
                    message="Cannot unlink the only authentication method. Please set a password first.",
                    details={'provider': provider, 'user_id': str(user_id)}
                )
            
            # Remove OAuth provider
            result = self.users.update_one(
                {'_id': user_id},
                {
                    '$unset': {
                        f'oauth_providers.{provider}': ""
                    },
                    '$pull': {
                        'login_methods': provider
                    },
                    '$set': {
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                # Clean up OAuth sessions for this provider
                self.oauth_sessions.delete_many({
                    'user_id': user_id,
                    'provider': provider
                })
                
                logger.info(f"Successfully unlinked {provider} provider from user {user_id}")
                return True
            else:
                logger.warning(f"Failed to unlink {provider} provider from user {user_id}")
                return False
                
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Error unlinking OAuth provider: {e}")
            raise OAuthException(
                OAuthErrorType.UNLINKING_ERROR,
                details={'provider': provider, 'user_id': str(user_id)},
                original_error=e
            )
    
    def merge_user_data(self, target_user_id: ObjectId, source_oauth_data: Dict[str, Any], provider: str) -> bool:
        """
        Merge OAuth user data with existing user data
        
        Args:
            target_user_id (ObjectId): Target user's database ID
            source_oauth_data (Dict): OAuth data to merge
            provider (str): OAuth provider name
            
        Returns:
            bool: True if merge was successful
        """
        try:
            user = self.users.find_one({'_id': target_user_id})
            if not user:
                return False
            
            # Prepare update data
            update_data = {
                'updated_at': datetime.utcnow()
            }
            
            # Update name if not set or if OAuth provides a better name
            if not user.get('name') or (source_oauth_data.get('name') and len(source_oauth_data['name']) > len(user.get('name', ''))):
                update_data['name'] = source_oauth_data['name']
            
            # Update profile picture if not set (for providers that provide it)
            if provider == 'google' and source_oauth_data.get('picture') and not user.get('profile_picture'):
                update_data['profile_picture'] = source_oauth_data['picture']
            elif provider == 'github' and source_oauth_data.get('avatar_url') and not user.get('profile_picture'):
                update_data['profile_picture'] = source_oauth_data['avatar_url']
            
            # Apply updates if any
            if len(update_data) > 1:  # More than just updated_at
                result = self.users.update_one(
                    {'_id': target_user_id},
                    {'$set': update_data}
                )
                
                if result.modified_count > 0:
                    logger.info(f"Successfully merged {provider} data for user {target_user_id}")
                    return True
            
            return True  # No updates needed is also success
            
        except Exception as e:
            logger.error(f"Error merging user data: {e}")
            return False
    
    def get_user_auth_methods(self, user_id: ObjectId) -> List[str]:
        """
        Get all authentication methods available for a user
        
        Args:
            user_id (ObjectId): User's database ID
            
        Returns:
            List[str]: List of available authentication methods
        """
        try:
            user = self.users.find_one({'_id': user_id})
            if not user:
                return []
            
            methods = []
            
            # Check for password authentication
            if user.get('password'):
                methods.append('email')
            
            # Check for OAuth providers
            oauth_providers = user.get('oauth_providers', {})
            methods.extend(oauth_providers.keys())
            
            return methods
            
        except Exception as e:
            logger.error(f"Error getting user auth methods: {e}")
            return []
    
    def resolve_account_conflict(self, conflict_data: Dict[str, Any], resolution: str, **kwargs) -> Dict[str, Any]:
        """
        Resolve an account conflict based on user's choice
        
        Args:
            conflict_data (Dict): Conflict information
            resolution (str): Resolution choice ('link', 'switch', 'cancel')
            **kwargs: Additional resolution parameters
            
        Returns:
            Dict: Resolution result
        """
        try:
            if resolution == 'link':
                return self._resolve_by_linking(conflict_data, **kwargs)
            elif resolution == 'switch':
                return self._resolve_by_switching(conflict_data, **kwargs)
            elif resolution == 'cancel':
                return {'action': 'cancelled', 'message': 'Account linking cancelled by user'}
            else:
                raise OAuthException(
                    OAuthErrorType.UNKNOWN_ERROR,
                    message=f"Unknown resolution type: {resolution}"
                )
                
        except OAuthException:
            raise
        except Exception as e:
            logger.error(f"Error resolving account conflict: {e}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                original_error=e
            )
    
    def _resolve_by_linking(self, conflict_data: Dict[str, Any], oauth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve conflict by linking OAuth provider to existing account"""
        user_id = conflict_data.get('user_id')
        provider = conflict_data.get('provider')
        
        if not user_id or not provider:
            raise OAuthException(
                OAuthErrorType.LINKING_ERROR,
                message="Missing user ID or provider for account linking"
            )
        
        # Link the provider
        success = self.link_oauth_provider(user_id, provider, oauth_data)
        
        if success:
            # Merge user data
            self.merge_user_data(user_id, oauth_data, provider)
            
            # Get updated user
            user = self.users.find_one({'_id': user_id})
            
            return {
                'action': 'linked',
                'user': user,
                'provider': provider,
                'message': f'{provider.title()} account successfully linked'
            }
        else:
            raise OAuthException(
                OAuthErrorType.LINKING_ERROR,
                message=f"Failed to link {provider} account"
            )
    
    def _resolve_by_switching(self, conflict_data: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve conflict by switching to a different OAuth account"""
        return {
            'action': 'switch',
            'provider': conflict_data.get('provider'),
            'message': 'Please sign in with a different account'
        }

# Global account merger instance
def get_account_merger(db):
    """Get account merger instance for the given database"""
    return AccountMerger(db)