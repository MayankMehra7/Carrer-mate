"""
OAuth Session Cleanup Scheduler

This module provides scheduled cleanup tasks for OAuth sessions and audit logs.
It can be run as a background task or scheduled job.

Requirements: 3.4, 3.5
"""

import logging
import datetime
import time
import threading
from typing import Optional
from .oauth_session_manager import OAuthSessionManager, OAuthAuditLogger

logger = logging.getLogger(__name__)

class OAuthCleanupScheduler:
    """Scheduler for OAuth session and audit log cleanup tasks"""
    
    def __init__(self, mongo_db):
        self.db = mongo_db
        self.session_manager = OAuthSessionManager(mongo_db)
        self.audit_logger = OAuthAuditLogger(mongo_db)
        self.running = False
        self.cleanup_thread = None
        
        # Cleanup intervals (in seconds)
        self.session_cleanup_interval = 300  # 5 minutes
        self.audit_cleanup_interval = 86400  # 24 hours
        
        # Retention periods
        self.session_retention_days = 30
        self.audit_retention_days = 90
    
    def start_scheduler(self) -> None:
        """Start the cleanup scheduler in a background thread"""
        if self.running:
            logger.warning("OAuth cleanup scheduler is already running")
            return
        
        self.running = True
        self.cleanup_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.cleanup_thread.start()
        
        logger.info("OAuth cleanup scheduler started")
    
    def stop_scheduler(self) -> None:
        """Stop the cleanup scheduler"""
        if not self.running:
            logger.warning("OAuth cleanup scheduler is not running")
            return
        
        self.running = False
        if self.cleanup_thread:
            self.cleanup_thread.join(timeout=10)
        
        logger.info("OAuth cleanup scheduler stopped")
    
    def _run_scheduler(self) -> None:
        """Main scheduler loop"""
        last_session_cleanup = datetime.datetime.min
        last_audit_cleanup = datetime.datetime.min
        
        while self.running:
            try:
                now = datetime.datetime.utcnow()
                
                # Check if it's time for session cleanup
                if (now - last_session_cleanup).total_seconds() >= self.session_cleanup_interval:
                    self._cleanup_sessions()
                    last_session_cleanup = now
                
                # Check if it's time for audit log cleanup
                if (now - last_audit_cleanup).total_seconds() >= self.audit_cleanup_interval:
                    self._cleanup_audit_logs()
                    last_audit_cleanup = now
                
                # Sleep for a short interval
                time.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in OAuth cleanup scheduler: {str(e)}")
                time.sleep(60)  # Wait before retrying
    
    def _cleanup_sessions(self) -> None:
        """Perform session cleanup"""
        try:
            # Cleanup expired sessions
            expired_count = self.session_manager.cleanup_expired_sessions()
            
            # Cleanup old inactive sessions
            old_count = self.session_manager.cleanup_old_sessions(self.session_retention_days)
            
            if expired_count > 0 or old_count > 0:
                logger.info(f"OAuth session cleanup completed: {expired_count} expired, {old_count} old sessions removed")
            
        except Exception as e:
            logger.error(f"Error during OAuth session cleanup: {str(e)}")
    
    def _cleanup_audit_logs(self) -> None:
        """Perform audit log cleanup"""
        try:
            # Cleanup old audit logs
            deleted_count = self.audit_logger.cleanup_old_audit_logs(self.audit_retention_days)
            
            if deleted_count > 0:
                logger.info(f"OAuth audit log cleanup completed: {deleted_count} old entries removed")
            
        except Exception as e:
            logger.error(f"Error during OAuth audit log cleanup: {str(e)}")
    
    def run_manual_cleanup(self) -> dict:
        """Run manual cleanup and return results"""
        try:
            results = {
                'session_cleanup': {
                    'expired_sessions': 0,
                    'old_sessions': 0
                },
                'audit_cleanup': {
                    'deleted_entries': 0
                },
                'timestamp': datetime.datetime.utcnow().isoformat()
            }
            
            # Session cleanup
            results['session_cleanup']['expired_sessions'] = self.session_manager.cleanup_expired_sessions()
            results['session_cleanup']['old_sessions'] = self.session_manager.cleanup_old_sessions(self.session_retention_days)
            
            # Audit log cleanup
            results['audit_cleanup']['deleted_entries'] = self.audit_logger.cleanup_old_audit_logs(self.audit_retention_days)
            
            logger.info(f"Manual OAuth cleanup completed: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Error during manual OAuth cleanup: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.datetime.utcnow().isoformat()
            }
    
    def get_cleanup_status(self) -> dict:
        """Get current cleanup scheduler status"""
        try:
            # Get session statistics
            session_stats = self.session_manager.get_session_statistics()
            
            # Get database collection sizes
            session_count = self.db.oauth_sessions.count_documents({})
            audit_count = self.db.oauth_audit_log.count_documents({})
            
            return {
                'scheduler_running': self.running,
                'session_cleanup_interval': self.session_cleanup_interval,
                'audit_cleanup_interval': self.audit_cleanup_interval,
                'retention_periods': {
                    'sessions_days': self.session_retention_days,
                    'audit_days': self.audit_retention_days
                },
                'database_stats': {
                    'total_sessions': session_count,
                    'total_audit_entries': audit_count,
                    'session_statistics': session_stats
                },
                'timestamp': datetime.datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting cleanup status: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.datetime.utcnow().isoformat()
            }

class OAuthMaintenanceTask:
    """OAuth maintenance task for database optimization"""
    
    def __init__(self, mongo_db):
        self.db = mongo_db
    
    def create_indexes(self) -> dict:
        """Create necessary indexes for OAuth collections"""
        try:
            results = {
                'oauth_sessions': [],
                'oauth_audit_log': []
            }
            
            # OAuth sessions indexes
            session_indexes = [
                [('user_id', 1), ('provider', 1)],  # User-provider lookup
                [('is_active', 1), ('expires_at', 1)],  # Active session cleanup
                [('created_at', 1)],  # Time-based queries
                [('provider', 1), ('is_active', 1)],  # Provider statistics
                [('user_id', 1), ('is_active', 1)]  # User session lookup
            ]
            
            for index_spec in session_indexes:
                try:
                    index_name = self.db.oauth_sessions.create_index(index_spec)
                    results['oauth_sessions'].append(f"Created index: {index_name}")
                except Exception as e:
                    if "already exists" not in str(e):
                        results['oauth_sessions'].append(f"Error creating index {index_spec}: {str(e)}")
            
            # OAuth audit log indexes
            audit_indexes = [
                [('user_id', 1), ('timestamp', -1)],  # User audit lookup
                [('timestamp', 1)],  # Time-based cleanup
                [('action', 1), ('timestamp', -1)],  # Action-based queries
                [('provider', 1), ('timestamp', -1)],  # Provider-based queries
                [('session_id', 1)]  # Session-based lookup
            ]
            
            for index_spec in audit_indexes:
                try:
                    index_name = self.db.oauth_audit_log.create_index(index_spec)
                    results['oauth_audit_log'].append(f"Created index: {index_name}")
                except Exception as e:
                    if "already exists" not in str(e):
                        results['oauth_audit_log'].append(f"Error creating index {index_spec}: {str(e)}")
            
            logger.info("OAuth database indexes created/verified")
            return results
            
        except Exception as e:
            logger.error(f"Error creating OAuth indexes: {str(e)}")
            return {'error': str(e)}
    
    def optimize_collections(self) -> dict:
        """Optimize OAuth collections"""
        try:
            results = {}
            
            # Get collection statistics
            session_stats = self.db.command("collStats", "oauth_sessions")
            audit_stats = self.db.command("collStats", "oauth_audit_log")
            
            results['collection_stats'] = {
                'oauth_sessions': {
                    'count': session_stats.get('count', 0),
                    'size': session_stats.get('size', 0),
                    'avgObjSize': session_stats.get('avgObjSize', 0)
                },
                'oauth_audit_log': {
                    'count': audit_stats.get('count', 0),
                    'size': audit_stats.get('size', 0),
                    'avgObjSize': audit_stats.get('avgObjSize', 0)
                }
            }
            
            # Compact collections if they're large
            if session_stats.get('count', 0) > 10000:
                try:
                    self.db.command("compact", "oauth_sessions")
                    results['oauth_sessions_compacted'] = True
                except Exception as e:
                    results['oauth_sessions_compact_error'] = str(e)
            
            if audit_stats.get('count', 0) > 50000:
                try:
                    self.db.command("compact", "oauth_audit_log")
                    results['oauth_audit_log_compacted'] = True
                except Exception as e:
                    results['oauth_audit_log_compact_error'] = str(e)
            
            logger.info("OAuth collection optimization completed")
            return results
            
        except Exception as e:
            logger.error(f"Error optimizing OAuth collections: {str(e)}")
            return {'error': str(e)}

# Global cleanup scheduler instance
_cleanup_scheduler: Optional[OAuthCleanupScheduler] = None

def initialize_oauth_cleanup_scheduler(mongo_db) -> OAuthCleanupScheduler:
    """Initialize and return the global cleanup scheduler"""
    global _cleanup_scheduler
    
    if _cleanup_scheduler is None:
        _cleanup_scheduler = OAuthCleanupScheduler(mongo_db)
    
    return _cleanup_scheduler

def get_oauth_cleanup_scheduler() -> Optional[OAuthCleanupScheduler]:
    """Get the global cleanup scheduler instance"""
    return _cleanup_scheduler