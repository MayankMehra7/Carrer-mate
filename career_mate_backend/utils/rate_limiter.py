"""
Simple rate limiting utility for API endpoints.
Implements in-memory rate limiting based on IP addresses.
"""

import time
import logging
from collections import defaultdict, deque
from functools import wraps
from flask import request, jsonify

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Simple in-memory rate limiter using sliding window approach.
    """
    
    def __init__(self):
        # Store request timestamps for each IP
        self.requests = defaultdict(deque)
    
    def is_allowed(self, ip: str, limit: int, window: int) -> bool:
        """
        Check if request is allowed based on rate limit.
        
        Args:
            ip: Client IP address
            limit: Maximum number of requests allowed
            window: Time window in seconds
            
        Returns:
            bool: True if request is allowed, False if rate limited
        """
        now = time.time()
        
        # Clean old requests outside the window
        while self.requests[ip] and self.requests[ip][0] <= now - window:
            self.requests[ip].popleft()
        
        # Check if limit exceeded
        if len(self.requests[ip]) >= limit:
            return False
        
        # Add current request
        self.requests[ip].append(now)
        return True
    
    def cleanup_old_entries(self, max_age: int = 3600):
        """
        Clean up old entries to prevent memory leaks.
        
        Args:
            max_age: Maximum age of entries to keep in seconds
        """
        now = time.time()
        cutoff = now - max_age
        
        # Remove IPs with no recent requests
        ips_to_remove = []
        for ip, requests in self.requests.items():
            # Remove old requests
            while requests and requests[0] <= cutoff:
                requests.popleft()
            
            # If no requests left, mark IP for removal
            if not requests:
                ips_to_remove.append(ip)
        
        # Remove empty IP entries
        for ip in ips_to_remove:
            del self.requests[ip]

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit(limit: int, window: int = 60):
    """
    Decorator for rate limiting endpoints.
    
    Args:
        limit: Maximum number of requests allowed
        window: Time window in seconds (default: 60)
        
    Returns:
        Decorator function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client IP
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            if client_ip:
                # Handle comma-separated IPs from proxies
                client_ip = client_ip.split(',')[0].strip()
            else:
                client_ip = 'unknown'
            
            # Check rate limit
            if not rate_limiter.is_allowed(client_ip, limit, window):
                logger.warning(f"Rate limit exceeded for IP {client_ip}")
                return jsonify({
                    "error": "Too many requests",
                    "message": f"Rate limit exceeded. Maximum {limit} requests per {window} seconds."
                }), 429
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

# Periodic cleanup function (should be called periodically)
def cleanup_rate_limiter():
    """Clean up old rate limiter entries."""
    rate_limiter.cleanup_old_entries()