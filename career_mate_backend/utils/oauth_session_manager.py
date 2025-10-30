"""
OAuth Session Management System

This module provides comprehensive OAuth session management including:
- OAuth session tracking and lifecycle management
- Session cleanup and expiration handling
- Audit logging for OAuth activities

Requirements: 3.4, 3.5
"""

import logging
import datetime
from typing import Dict, List, Optional, Any, Tuple
from bson import ObjectId
from .oauth_token_security import token_security_manager, token_refresh_manager
from .oauth_errors import OAuthException, OAuthErrorType

logger = logging.getLogger(__name__)

class OAuthSessionManager:
    """Manages OAuth session lifecycle and tracking"""
    
    def __init__(self, mongo_db):
        self.db = mongo_db
        self.session_timeout = 3600  # 1 hour default
        self.cleanup_interval = 300  # 5 minutes
        self.max_sessions_per_user = 10
    
    def create_session(self, user_id: ObjectId, provider: str, provider_user_id: str,
                      access_token: str, refresh_token: str = None, 
                      expires_in: int = 3600, scopes: List[str] = None,
                      client_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Create a new OAuth session with comprehensive tracking
        
        Args:
            user_id (ObjectId): User database ID
            provider (str): OAuth provider name
            provider_user_id (str): Provider's user ID
            access_token (str): OAuth access token
            refresh_token (str, optional): OAuth refresh token
            expires_in (int): Token expiration time in seconds
            scopes (List[str], optional): Token scopes
            client_info (Dict, optional): Client information (IP, user agent, etc.)
            
        Returns:
            Dict: Created session record
        """
        try:
            # Create secure token record
            token_record = token_security_manager.create_secure_token_record(
                token=access_token,
                provider=provider,
                expires_in=expires_in,
                refresh_token=refresh_token,
                scopes=scopes
            )
            
            # Generate session ID
            session_id = ObjectId()
            
            # Prepare session document
            session_doc = {
                '_id': session_id,
                'user_id': user_id,
                'provider': provider,
                'provider_user_id': str(provider_user_id),
                'session_id': str(session_id),
                **token_record,
                'client_info': client_info or {},
                'activity_log': [{
                    'action': 'session_created',
                    'timestamp': datetime.datetime.utcnow(),
                    'details': {'provider': provider}
                }]
            }
            
            # Check session limits
            self._enforce_session_limits(user_id, provider)
            
            # Insert session
            result = self.db.oauth_sessions.insert_one(session_doc)
            
            # Log session creation
            self._log_session_activity(
                session_id=session_id,
                user_id=user_id,
                action='session_created',
                details={
                    'provider': provider,
                    'expires_at': token_record['expires_at'].isoformat(),
                    'scopes': scopes or []
                }
            )
            
            logger.info(f"OAuth session created: {session_id} for user {user_id}, provider {provider}")
            
            # Return the created session
            return self.db.oauth_sessions.find_one({'_id': result.inserted_id})
            
        except Exception as e:
            logger.error(f"Error creating OAuth session: {str(e)}")
            raise OAuthException(
                OAuthErrorType.INTERNAL_ERROR,
                details={'action': 'create_session', 'provider': provider}
            )
    
    def get_session(self, user_id: ObjectId, provider: str) -> Optional[Dict[str, Any]]:
        """
        Get active OAuth session for user and provider
        
        Args:
            user_id (ObjectId): User database ID
            provider (str): OAuth provider name
            
        Returns:
            Optional[Dict]: Session record if active, None otherwise
        """
        try:
            # Find session
            session = self.db.oauth_sessions.find_one({
                'user_id': user_id,
                'provider': provider,
                'is_active': True
            })
            
            if not session:
                return None
            
            # Check expiration
            if token_security_manager.is_token_expired(session):
                self._expire_session(session['_id'], 'token_expired')
                return None
            
            # Update last used
            self._update_session_activity(session['_id'], 'session_accessed')
            
            return session
            
        except Exception as e:
            logger.error(f"Error getting OAuth session: {str(e)}")
            return None
    
    def get_session_by_id(self, session_id: ObjectId) -> Optional[Dict[str, Any]]:
        """
        Get OAuth session by session ID
        
        Args:
            session_id (ObjectId): Session ID
            
        Returns:
            Optional[Dict]: Session record if found and active
        """
        try:
            session = self.db.oauth_sessions.find_one({
                '_id': session_id,
                'is_active': True
            })
            
            if not session:
                return None
            
            # Check expiration
            if token_security_manager.is_token_expired(session):
                self._expire_session(session_id, 'token_expired')
                return None
            
            return session
            
        except Exception as e:
            logger.error(f"Error getting session by ID: {str(e)}")
            return None
    
    def refresh_session(self, session_id: ObjectId, new_access_token: str,
                       new_refresh_token: str = None, expires_in: int = 3600) -> bool:
        """
        Refresh OAuth session with new tokens
        
        Args:
            session_id (ObjectId): Session ID to refresh
            new_access_token (str): New access token
            new_refresh_token (str, optional): New refresh token
            expires_in (int): New token expiration time
            
        Returns:
            bool: True if refresh successful
        """
        try:
            session = self.get_session_by_id(session_id)
            if not session:
                return False
            
            # Create new token record
            new_token_record = token_security_manager.create_secure_token_record(
                token=new_access_token,
                provider=session['provider'],
                expires_in=expires_in,
                refresh_token=new_refresh_token,
                scopes=session.get('scopes', [])
            )
            
            # Update session
            update_doc = {
                **new_token_record,
                'refreshed_at': datetime.datetime.utcnow(),
                'refresh_count': session.get('refresh_count', 0) + 1
            }
            
            result = self.db.oauth_sessions.update_one(
                {'_id': session_id},
                {'$set': update_doc}
            )
            
            if result.modified_count > 0:
                self._log_session_activity(
                    session_id=session_id,
                    user_id=session['user_id'],
                    action='session_refreshed',
                    details={
                        'provider': session['provider'],
                        'new_expires_at': new_token_record['expires_at'].isoformat()
                    }
                )
                
                logger.info(f"OAuth session refreshed: {session_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error refreshing OAuth session: {str(e)}")
            return False
    
    def revoke_session(self, session_id: ObjectId, reason: str = 'user_logout') -> bool:
        """
        Revoke OAuth session
        
        Args:
            session_id (ObjectId): Session ID to revoke
            reason (str): Reason for revocation
            
        Returns:
            bool: True if revocation successful
        """
        try:
            session = self.db.oauth_sessions.find_one({'_id': session_id})
            if not session:
                return False
            
            # Revoke token securely
            revoked_session = token_security_manager.revoke_token(session)
            
            # Update session
            update_doc = {
                'is_active': False,
                'revoked_at': datetime.datetime.utcnow(),
                'revocation_reason': reason
            }
            
            result = self.db.oauth_sessions.update_one(
                {'_id': session_id},
                {'$set': update_doc}
            )
            
            if result.modified_count > 0:
                self._log_session_activity(
                    session_id=session_id,
                    user_id=session['user_id'],
                    action='session_revoked',
                    details={
                        'provider': session['provider'],
                        'reason': reason
                    }
                )
                
                logger.info(f"OAuth session revoked: {session_id}, reason: {reason}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error revoking OAuth session: {str(e)}")
            return False
    
    def get_user_sessions(self, user_id: ObjectId, active_only: bool = True) -> List[Dict[str, Any]]:
        """
        Get all OAuth sessions for a user
        
        Args:
            user_id (ObjectId): User database ID
            active_only (bool): Return only active sessions
            
        Returns:
            List[Dict]: List of session records
        """
        try:
            query = {'user_id': user_id}
            if active_only:
                query['is_active'] = True
            
            sessions = list(self.db.oauth_sessions.find(query).sort('created_at', -1))
            
            # Filter out expired sessions if active_only
            if active_only:
                active_sessions = []
                expired_session_ids = []
                
                for session in sessions:
                    if token_security_manager.is_token_expired(session):
                        expired_session_ids.append(session['_id'])
                    else:
                        active_sessions.append(session)
                
                # Mark expired sessions as inactive
                if expired_session_ids:
                    self.db.oauth_sessions.update_many(
                        {'_id': {'$in': expired_session_ids}},
                        {'$set': {
                            'is_active': False,
                            'expired_at': datetime.datetime.utcnow(),
                            'expiration_reason': 'token_expired'
                        }}
                    )
                
                return active_sessions
            
            return sessions
            
        except Exception as e:
            logger.error(f"Error getting user sessions: {str(e)}")
            return []
    
    def cleanup_expired_sessions(self) -> int:
        """
        Clean up expired OAuth sessions
        
        Returns:
            int: Number of sessions cleaned up
        """
        try:
            now = datetime.datetime.utcnow()
            
            # Find expired sessions
            expired_sessions = list(self.db.oauth_sessions.find({
                'is_active': True,
                'expires_at': {'$lt': now}
            }))
            
            if not expired_sessions:
                return 0
            
            # Mark as expired
            expired_ids = [session['_id'] for session in expired_sessions]
            result = self.db.oauth_sessions.update_many(
                {'_id': {'$in': expired_ids}},
                {'$set': {
                    'is_active': False,
                    'expired_at': now,
                    'expiration_reason': 'token_expired'
                }}
            )
            
            # Log cleanup
            for session in expired_sessions:
                self._log_session_activity(
                    session_id=session['_id'],
                    user_id=session['user_id'],
                    action='session_expired',
                    details={
                        'provider': session['provider'],
                        'cleanup_time': now.isoformat()
                    }
                )
            
            logger.info(f"Cleaned up {result.modified_count} expired OAuth sessions")
            return result.modified_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {str(e)}")
            return 0
    
    def cleanup_old_sessions(self, days_old: int = 30) -> int:
        """
        Clean up old inactive sessions
        
        Args:
            days_old (int): Age threshold in days
            
        Returns:
            int: Number of sessions deleted
        """
        try:
            cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=days_old)
            
            # Delete old inactive sessions
            result = self.db.oauth_sessions.delete_many({
                'is_active': False,
                'created_at': {'$lt': cutoff_date}
            })
            
            logger.info(f"Deleted {result.deleted_count} old OAuth sessions (older than {days_old} days)")
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old sessions: {str(e)}")
            return 0
    
    def get_session_statistics(self, user_id: ObjectId = None) -> Dict[str, Any]:
        """
        Get OAuth session statistics
        
        Args:
            user_id (ObjectId, optional): User ID for user-specific stats
            
        Returns:
            Dict: Session statistics
        """
        try:
            pipeline = []
            
            # Filter by user if specified
            if user_id:
                pipeline.append({'$match': {'user_id': user_id}})
            
            # Group by provider and status
            pipeline.extend([
                {
                    '$group': {
                        '_id': {
                            'provider': '$provider',
                            'is_active': '$is_active'
                        },
                        'count': {'$sum': 1},
                        'latest_created': {'$max': '$created_at'}
                    }
                },
                {
                    '$group': {
                        '_id': '$_id.provider',
                        'active_count': {
                            '$sum': {
                                '$cond': [{'$eq': ['$_id.is_active', True]}, '$count', 0]
                            }
                        },
                        'inactive_count': {
                            '$sum': {
                                '$cond': [{'$eq': ['$_id.is_active', False]}, '$count', 0]
                            }
                        },
                        'total_count': {'$sum': '$count'},
                        'latest_session': {'$max': '$latest_created'}
                    }
                }
            ])
            
            results = list(self.db.oauth_sessions.aggregate(pipeline))
            
            # Format results
            stats = {
                'providers': {},
                'total_active': 0,
                'total_inactive': 0,
                'total_sessions': 0
            }
            
            for result in results:
                provider = result['_id']
                stats['providers'][provider] = {
                    'active': result['active_count'],
                    'inactive': result['inactive_count'],
                    'total': result['total_count'],
                    'latest_session': result.get('latest_session')
                }
                stats['total_active'] += result['active_count']
                stats['total_inactive'] += result['inactive_count']
                stats['total_sessions'] += result['total_count']
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting session statistics: {str(e)}")
            return {}
    
    def _enforce_session_limits(self, user_id: ObjectId, provider: str) -> None:
        """Enforce session limits per user"""
        try:
            # Count active sessions for user and provider
            active_count = self.db.oauth_sessions.count_documents({
                'user_id': user_id,
                'provider': provider,
                'is_active': True
            })
            
            if active_count >= self.max_sessions_per_user:
                # Revoke oldest session
                oldest_session = self.db.oauth_sessions.find_one(
                    {
                        'user_id': user_id,
                        'provider': provider,
                        'is_active': True
                    },
                    sort=[('created_at', 1)]
                )
                
                if oldest_session:
                    self.revoke_session(oldest_session['_id'], 'session_limit_exceeded')
                    
        except Exception as e:
            logger.error(f"Error enforcing session limits: {str(e)}")
    
    def _expire_session(self, session_id: ObjectId, reason: str) -> None:
        """Mark session as expired"""
        try:
            self.db.oauth_sessions.update_one(
                {'_id': session_id},
                {'$set': {
                    'is_active': False,
                    'expired_at': datetime.datetime.utcnow(),
                    'expiration_reason': reason
                }}
            )
        except Exception as e:
            logger.error(f"Error expiring session: {str(e)}")
    
    def _update_session_activity(self, session_id: ObjectId, action: str) -> None:
        """Update session activity"""
        try:
            self.db.oauth_sessions.update_one(
                {'_id': session_id},
                {
                    '$set': {'last_used': datetime.datetime.utcnow()},
                    '$push': {
                        'activity_log': {
                            '$each': [{
                                'action': action,
                                'timestamp': datetime.datetime.utcnow()
                            }],
                            '$slice': -50  # Keep last 50 activities
                        }
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error updating session activity: {str(e)}")
    
    def _log_session_activity(self, session_id: ObjectId, user_id: ObjectId,
                            action: str, details: Dict[str, Any] = None) -> None:
        """Log session activity to audit log"""
        try:
            audit_entry = {
                'session_id': session_id,
                'user_id': user_id,
                'action': action,
                'timestamp': datetime.datetime.utcnow(),
                'details': details or {}
            }
            
            self.db.oauth_audit_log.insert_one(audit_entry)
            
        except Exception as e:
            logger.error(f"Error logging session activity: {str(e)}")

class OAuthAuditLogger:
    """OAuth audit logging system"""
    
    def __init__(self, mongo_db):
        self.db = mongo_db
    
    def log_oauth_event(self, user_id: ObjectId, action: str, provider: str,
                       details: Dict[str, Any] = None, session_id: ObjectId = None,
                       ip_address: str = None, user_agent: str = None) -> None:
        """
        Log OAuth-related events for audit purposes
        
        Args:
            user_id (ObjectId): User database ID
            action (str): Action performed
            provider (str): OAuth provider
            details (Dict, optional): Additional details
            session_id (ObjectId, optional): Related session ID
            ip_address (str, optional): Client IP address
            user_agent (str, optional): Client user agent
        """
        try:
            audit_entry = {
                'user_id': user_id,
                'action': action,
                'provider': provider,
                'timestamp': datetime.datetime.utcnow(),
                'details': details or {},
                'session_id': session_id,
                'client_info': {
                    'ip_address': ip_address,
                    'user_agent': user_agent
                }
            }
            
            self.db.oauth_audit_log.insert_one(audit_entry)
            logger.info(f"OAuth audit log entry created: {action} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error creating OAuth audit log entry: {str(e)}")
    
    def get_user_audit_log(self, user_id: ObjectId, limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit log entries for a user"""
        try:
            return list(self.db.oauth_audit_log.find(
                {'user_id': user_id}
            ).sort('timestamp', -1).limit(limit))
            
        except Exception as e:
            logger.error(f"Error getting user audit log: {str(e)}")
            return []
    
    def cleanup_old_audit_logs(self, days_old: int = 90) -> int:
        """Clean up old audit log entries"""
        try:
            cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(days=days_old)
            
            result = self.db.oauth_audit_log.delete_many({
                'timestamp': {'$lt': cutoff_date}
            })
            
            logger.info(f"Deleted {result.deleted_count} old OAuth audit log entries")
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up audit logs: {str(e)}")
            return 0