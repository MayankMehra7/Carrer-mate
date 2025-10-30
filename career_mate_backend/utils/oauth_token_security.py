"""
OAuth Token Security Module

This module provides secure token handling for OAuth authentication including:
- Token hashing before database storage
- Secure token validation with providers
- Token expiration and refresh handling

Requirements: 3.1, 3.2, 3.3
"""

import hashlib
import hmac
import secrets
import datetime
import logging
from typing import Dict, Optional, Tuple, Any
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import json

logger = logging.getLogger(__name__)

class TokenSecurityManager:
    """Manages secure token operations for OAuth authentication"""
    
    def __init__(self):
        self.secret_key = os.getenv('OAUTH_TOKEN_SECRET_KEY', self._generate_secret_key())
        self.salt = os.getenv('OAUTH_TOKEN_SALT', self._generate_salt())
        self._cipher_suite = None
    
    def _generate_secret_key(self) -> str:
        """Generate a secure secret key for token encryption"""
        return secrets.token_urlsafe(32)
    
    def _generate_salt(self) -> str:
        """Generate a secure salt for key derivation"""
        return secrets.token_urlsafe(16)
    
    def _get_cipher_suite(self) -> Fernet:
        """Get or create cipher suite for token encryption"""
        if self._cipher_suite is None:
            # Derive key from secret and salt
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=self.salt.encode(),
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.secret_key.encode()))
            self._cipher_suite = Fernet(key)
        return self._cipher_suite
    
    def hash_token(self, token: str, provider: str = None) -> str:
        """
        Create a secure hash of an OAuth token for database storage
        
        Args:
            token (str): The OAuth token to hash
            provider (str, optional): OAuth provider name for additional security
            
        Returns:
            str: Secure hash of the token
        """
        try:
            # Use HMAC-SHA256 for secure token hashing
            key = f"{self.secret_key}:{provider or 'oauth'}".encode()
            token_hash = hmac.new(key, token.encode(), hashlib.sha256).hexdigest()
            
            logger.debug(f"Token hashed successfully for provider: {provider}")
            return token_hash
            
        except Exception as e:
            logger.error(f"Error hashing token: {str(e)}")
            raise SecurityException("Failed to hash token securely")
    
    def encrypt_token(self, token: str) -> str:
        """
        Encrypt a token for secure storage
        
        Args:
            token (str): The token to encrypt
            
        Returns:
            str: Encrypted token as base64 string
        """
        try:
            cipher_suite = self._get_cipher_suite()
            encrypted_token = cipher_suite.encrypt(token.encode())
            return base64.urlsafe_b64encode(encrypted_token).decode()
            
        except Exception as e:
            logger.error(f"Error encrypting token: {str(e)}")
            raise SecurityException("Failed to encrypt token")
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """
        Decrypt a token from secure storage
        
        Args:
            encrypted_token (str): The encrypted token as base64 string
            
        Returns:
            str: Decrypted token
        """
        try:
            cipher_suite = self._get_cipher_suite()
            encrypted_data = base64.urlsafe_b64decode(encrypted_token.encode())
            decrypted_token = cipher_suite.decrypt(encrypted_data)
            return decrypted_token.decode()
            
        except Exception as e:
            logger.error(f"Error decrypting token: {str(e)}")
            raise SecurityException("Failed to decrypt token")
    
    def verify_token_hash(self, token: str, token_hash: str, provider: str = None) -> bool:
        """
        Verify a token against its stored hash
        
        Args:
            token (str): The token to verify
            token_hash (str): The stored hash to verify against
            provider (str, optional): OAuth provider name
            
        Returns:
            bool: True if token matches hash, False otherwise
        """
        try:
            computed_hash = self.hash_token(token, provider)
            return hmac.compare_digest(computed_hash, token_hash)
            
        except Exception as e:
            logger.error(f"Error verifying token hash: {str(e)}")
            return False
    
    def create_secure_token_record(self, token: str, provider: str, 
                                 expires_in: int = 3600, 
                                 refresh_token: str = None,
                                 scopes: list = None) -> Dict[str, Any]:
        """
        Create a secure token record for database storage
        
        Args:
            token (str): OAuth access token
            provider (str): OAuth provider name
            expires_in (int): Token expiration time in seconds
            refresh_token (str, optional): OAuth refresh token
            scopes (list, optional): Token scopes
            
        Returns:
            Dict: Secure token record for database storage
        """
        try:
            now = datetime.datetime.utcnow()
            expires_at = now + datetime.timedelta(seconds=expires_in)
            
            # Hash the access token
            token_hash = self.hash_token(token, provider)
            
            # Hash refresh token if provided
            refresh_token_hash = None
            if refresh_token:
                refresh_token_hash = self.hash_token(refresh_token, f"{provider}_refresh")
            
            # Create secure record
            token_record = {
                'access_token_hash': token_hash,
                'refresh_token_hash': refresh_token_hash,
                'provider': provider,
                'expires_at': expires_at,
                'created_at': now,
                'last_used': now,
                'scopes': scopes or [],
                'is_active': True
            }
            
            logger.info(f"Secure token record created for provider: {provider}")
            return token_record
            
        except Exception as e:
            logger.error(f"Error creating secure token record: {str(e)}")
            raise SecurityException("Failed to create secure token record")
    
    def is_token_expired(self, token_record: Dict[str, Any]) -> bool:
        """
        Check if a token record is expired
        
        Args:
            token_record (Dict): Token record from database
            
        Returns:
            bool: True if token is expired, False otherwise
        """
        try:
            expires_at = token_record.get('expires_at')
            if not expires_at:
                return True
            
            now = datetime.datetime.utcnow()
            return now >= expires_at
            
        except Exception as e:
            logger.error(f"Error checking token expiration: {str(e)}")
            return True  # Assume expired on error for security
    
    def update_token_usage(self, token_record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update token usage timestamp
        
        Args:
            token_record (Dict): Token record to update
            
        Returns:
            Dict: Updated token record
        """
        token_record['last_used'] = datetime.datetime.utcnow()
        return token_record
    
    def revoke_token(self, token_record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Revoke a token by marking it as inactive
        
        Args:
            token_record (Dict): Token record to revoke
            
        Returns:
            Dict: Updated token record
        """
        token_record['is_active'] = False
        token_record['revoked_at'] = datetime.datetime.utcnow()
        return token_record
    
    def generate_token_fingerprint(self, token: str, user_agent: str = None, 
                                 ip_address: str = None) -> str:
        """
        Generate a fingerprint for token validation
        
        Args:
            token (str): OAuth token
            user_agent (str, optional): User agent string
            ip_address (str, optional): Client IP address
            
        Returns:
            str: Token fingerprint
        """
        try:
            fingerprint_data = f"{token}:{user_agent or ''}:{ip_address or ''}"
            fingerprint = hashlib.sha256(fingerprint_data.encode()).hexdigest()
            return fingerprint[:16]  # Use first 16 characters
            
        except Exception as e:
            logger.error(f"Error generating token fingerprint: {str(e)}")
            return ""

class TokenRefreshManager:
    """Manages OAuth token refresh operations"""
    
    def __init__(self, security_manager: TokenSecurityManager):
        self.security_manager = security_manager
    
    def should_refresh_token(self, token_record: Dict[str, Any], 
                           refresh_threshold: int = 300) -> bool:
        """
        Check if a token should be refreshed based on expiration time
        
        Args:
            token_record (Dict): Token record from database
            refresh_threshold (int): Seconds before expiration to trigger refresh
            
        Returns:
            bool: True if token should be refreshed
        """
        try:
            expires_at = token_record.get('expires_at')
            if not expires_at:
                return True
            
            now = datetime.datetime.utcnow()
            refresh_time = expires_at - datetime.timedelta(seconds=refresh_threshold)
            
            return now >= refresh_time
            
        except Exception as e:
            logger.error(f"Error checking token refresh requirement: {str(e)}")
            return True  # Refresh on error for safety
    
    def create_refresh_request(self, provider: str, refresh_token_hash: str) -> Dict[str, Any]:
        """
        Create a token refresh request
        
        Args:
            provider (str): OAuth provider name
            refresh_token_hash (str): Hashed refresh token
            
        Returns:
            Dict: Refresh request data
        """
        return {
            'provider': provider,
            'refresh_token_hash': refresh_token_hash,
            'requested_at': datetime.datetime.utcnow(),
            'status': 'pending'
        }
    
    def process_refresh_response(self, refresh_response: Dict[str, Any], 
                               provider: str) -> Dict[str, Any]:
        """
        Process OAuth provider refresh response
        
        Args:
            refresh_response (Dict): Response from OAuth provider
            provider (str): OAuth provider name
            
        Returns:
            Dict: Processed token record
        """
        try:
            access_token = refresh_response.get('access_token')
            refresh_token = refresh_response.get('refresh_token')
            expires_in = refresh_response.get('expires_in', 3600)
            
            if not access_token:
                raise SecurityException("No access token in refresh response")
            
            # Create new secure token record
            return self.security_manager.create_secure_token_record(
                token=access_token,
                provider=provider,
                expires_in=expires_in,
                refresh_token=refresh_token
            )
            
        except Exception as e:
            logger.error(f"Error processing refresh response: {str(e)}")
            raise SecurityException("Failed to process token refresh response")

class SecurityException(Exception):
    """Exception for OAuth token security operations"""
    pass

# Global instances for easy import
token_security_manager = TokenSecurityManager()
token_refresh_manager = TokenRefreshManager(token_security_manager)