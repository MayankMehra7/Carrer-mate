"""
Have I Been Pwned (HIBP) API integration utility
Implements password checking against compromised password database
Requirements: 3.1, 3.2, 3.4, 3.5
"""

import hashlib
import httpx
import logging
import asyncio
from typing import Tuple, Optional
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger(__name__)

class HIBPError(Exception):
    """Custom exception for HIBP API errors"""
    def __init__(self, message: str, error_type: str = "UNKNOWN", status_code: int = None):
        super().__init__(message)
        self.error_type = error_type
        self.status_code = status_code
        self.timestamp = datetime.utcnow()

class HIBPChecker:
    """
    Have I Been Pwned API integration for checking compromised passwords
    Implements k-anonymity model for privacy protection
    """
    
    def __init__(self):
        # Requirement 3.1: HIBP API integration
        self.base_url = "https://api.pwnedpasswords.com/range/"
        
        # Requirement 3.5: 5-second timeout
        self.timeout = 5.0
        self.retry_attempts = 2
        self.retry_delay = 1.0
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 0.1  # 100ms between requests
        
    async def _enforce_rate_limit(self):
        """Enforce rate limiting between requests"""
        now = datetime.utcnow().timestamp()
        time_since_last = now - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            delay = self.min_request_interval - time_since_last
            await asyncio.sleep(delay)
        
        self.last_request_time = datetime.utcnow().timestamp()
    
    def _hash_password(self, password: str) -> str:
        """
        Requirement 3.3: Use SHA-1 hashing for HIBP API compatibility
        Returns uppercase SHA-1 hash of password
        """
        return hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    
    async def check_password(self, password: str) -> Tuple[bool, Optional[str]]:
        """
        Check if password appears in HIBP database
        
        Args:
            password: The password to check
            
        Returns:
            Tuple of (is_compromised, error_message)
            - is_compromised: True if password found in breach database
            - error_message: Error message if check failed, None if successful
        """
        try:
            # Requirement 3.3: Use SHA-1 hashing with k-anonymity (first 5 characters)
            sha1_hash = self._hash_password(password)
            prefix = sha1_hash[:5]
            suffix = sha1_hash[5:]
            
            # Enforce rate limiting
            await self._enforce_rate_limit()
            
            # Retry logic for transient failures
            last_error = None
            
            for attempt in range(self.retry_attempts + 1):
                try:
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        response = await client.get(
                            f"{self.base_url}{prefix}",
                            headers={
                                'User-Agent': 'CareerMate-Backend-Password-Checker',
                                'Accept': 'text/plain'
                            }
                        )
                    
                    # Handle different response codes
                    if response.status_code == 429:
                        raise HIBPError("Rate limit exceeded", "RATE_LIMIT", 429)
                    
                    if response.status_code == 503:
                        raise HIBPError("Service temporarily unavailable", "SERVICE_UNAVAILABLE", 503)
                    
                    if response.status_code != 200:
                        raise HIBPError(f"API error: {response.status_code}", "API_ERROR", response.status_code)
                    
                    # Parse response
                    data = response.text.strip()
                    if not data:
                        # Empty response means no matches found
                        logger.debug(f"HIBP check completed - no matches for prefix: {prefix}")
                        return False, None
                    
                    # Check if password hash suffix appears in response
                    hashes = data.split('\n')
                    for line in hashes:
                        if ':' in line:
                            hash_suffix, count = line.split(':', 1)
                            if hash_suffix.strip() == suffix:
                                # Password found in breach database
                                logger.info(f"Password found in HIBP database (count: {count.strip()})")
                                return True, None
                    
                    # Password not found in breach database
                    logger.debug(f"HIBP check completed - password not found in breaches")
                    return False, None
                    
                except (httpx.TimeoutException, httpx.ConnectTimeout):
                    last_error = HIBPError("Request timed out", "TIMEOUT")
                    logger.warning(f"HIBP API timeout on attempt {attempt + 1}")
                    
                except (httpx.NetworkError, httpx.ConnectError):
                    last_error = HIBPError("Network connection failed", "NETWORK_ERROR")
                    logger.warning(f"HIBP API network error on attempt {attempt + 1}")
                    
                except HIBPError as e:
                    last_error = e
                    logger.warning(f"HIBP API error on attempt {attempt + 1}: {e.error_type}")
                    
                    # Don't retry for certain error types
                    if e.error_type in ["RATE_LIMIT", "PARSE_ERROR"]:
                        break
                
                except Exception as e:
                    last_error = HIBPError(f"Unexpected error: {str(e)}", "UNKNOWN")
                    logger.error(f"Unexpected HIBP error on attempt {attempt + 1}: {str(e)}")
                
                # Wait before retry (except on last attempt)
                if attempt < self.retry_attempts:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
            
            # All retries failed
            # Requirement 3.4: Graceful handling of HIBP API failures
            error_msg = f"HIBP API unavailable after {self.retry_attempts + 1} attempts: {last_error.error_type}"
            logger.warning(error_msg)
            
            # Return error message for caller to handle gracefully
            return False, error_msg
            
        except Exception as e:
            # Requirement 3.4: Graceful fallback behavior
            error_msg = f"HIBP check failed with unexpected error: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    async def check_password_simple(self, password: str) -> bool:
        """
        Simple boolean check if password is compromised
        
        Args:
            password: The password to check
            
        Returns:
            True if password is compromised, False if safe or check failed
        """
        is_compromised, error = await self.check_password(password)
        
        if error:
            # Requirement 3.4: If HIBP API is unavailable, assume password is safe
            logger.warning(f"HIBP check failed, assuming password is safe: {error}")
            return False
        
        return is_compromised
    
    def check_password_sync(self, password: str) -> Tuple[bool, Optional[str]]:
        """
        Synchronous wrapper for password checking
        """
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(self.check_password(password))
        except RuntimeError:
            # No event loop running, create a new one
            return asyncio.run(self.check_password(password))
    
    def is_password_compromised(self, password: str) -> bool:
        """
        Synchronous simple check if password is compromised
        Used for integration with existing synchronous code
        """
        is_compromised, error = self.check_password_sync(password)
        
        if error:
            # Requirement 3.4: Graceful fallback - assume safe if check fails
            logger.warning(f"HIBP check failed, assuming password is safe: {error}")
            return False
        
        return is_compromised

# Global HIBP checker instance
hibp_checker = HIBPChecker()

# Convenience functions for easy integration
async def check_password_hibp(password: str) -> Tuple[bool, Optional[str]]:
    """
    Async convenience function to check password against HIBP
    
    Returns:
        Tuple of (is_compromised, error_message)
    """
    return await hibp_checker.check_password(password)

def is_password_pwned(password: str) -> bool:
    """
    Synchronous convenience function to check if password is compromised
    
    Returns:
        True if password is found in breach database, False if safe or check failed
    """
    return hibp_checker.is_password_compromised(password)

async def is_password_pwned_async(password: str) -> bool:
    """
    Async convenience function to check if password is compromised
    
    Returns:
        True if password is found in breach database, False if safe or check failed
    """
    return await hibp_checker.check_password_simple(password)