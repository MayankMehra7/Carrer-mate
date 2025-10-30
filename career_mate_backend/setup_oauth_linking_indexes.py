"""
Setup database indexes for OAuth account linking security

This script creates the necessary indexes for OAuth account linking collections
to ensure optimal performance and security.

Requirements: 3.2, 4.2
"""

import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from config import MONGO_URI, DATABASE_NAME
import datetime

logger = logging.getLogger(__name__)

def setup_oauth_linking_indexes():
    """Setup indexes for OAuth account linking collections"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        
        print("Setting up OAuth account linking indexes...")
        
        # OAuth Linking Sessions Collection Indexes
        oauth_linking_sessions = db.oauth_linking_sessions
        
        # Primary lookup indexes
        oauth_linking_sessions.create_index([
            ("user_id", ASCENDING),
            ("provider", ASCENDING),
            ("status", ASCENDING)
        ], name="user_provider_status_idx")
        
        # Session expiration cleanup index
        oauth_linking_sessions.create_index([
            ("expires_at", ASCENDING)
        ], name="expires_at_idx")
        
        # Completed sessions cleanup index
        oauth_linking_sessions.create_index([
            ("completed", ASCENDING),
            ("created_at", ASCENDING)
        ], name="completed_created_idx")
        
        # Cancelled sessions cleanup index
        oauth_linking_sessions.create_index([
            ("cancelled", ASCENDING),
            ("created_at", ASCENDING)
        ], name="cancelled_created_idx")
        
        # Email verification lookup index
        oauth_linking_sessions.create_index([
            ("email_verification_code", ASCENDING),
            ("email_verification_expires_at", ASCENDING)
        ], name="email_verification_idx", sparse=True)
        
        # OAuth Linking Audit Collection Indexes
        oauth_linking_audit = db.oauth_linking_audit
        
        # User audit log index
        oauth_linking_audit.create_index([
            ("user_id", ASCENDING),
            ("timestamp", DESCENDING)
        ], name="user_timestamp_idx")
        
        # Action-based audit index
        oauth_linking_audit.create_index([
            ("action", ASCENDING),
            ("provider", ASCENDING),
            ("timestamp", DESCENDING)
        ], name="action_provider_timestamp_idx")
        
        # Audit log cleanup index
        oauth_linking_audit.create_index([
            ("timestamp", ASCENDING)
        ], name="audit_timestamp_idx")
        
        # Enhanced OAuth Sessions Collection Indexes (if not already created)
        oauth_sessions = db.oauth_sessions
        
        # User and provider lookup
        oauth_sessions.create_index([
            ("user_id", ASCENDING),
            ("provider", ASCENDING),
            ("is_active", ASCENDING)
        ], name="user_provider_active_idx")
        
        # Session expiration index
        oauth_sessions.create_index([
            ("expires_at", ASCENDING),
            ("is_active", ASCENDING)
        ], name="expires_active_idx")
        
        # Provider user ID lookup
        oauth_sessions.create_index([
            ("provider", ASCENDING),
            ("provider_user_id", ASCENDING)
        ], name="provider_user_id_idx")
        
        # Enhanced Users Collection Indexes for OAuth
        users = db.users
        
        # OAuth provider ID lookups
        users.create_index([
            ("oauth_providers.google.id", ASCENDING)
        ], name="google_oauth_id_idx", sparse=True)
        
        users.create_index([
            ("oauth_providers.github.id", ASCENDING)
        ], name="github_oauth_id_idx", sparse=True)
        
        # Login methods index
        users.create_index([
            ("login_methods", ASCENDING)
        ], name="login_methods_idx")
        
        # OAuth Audit Log Collection Indexes
        oauth_audit_log = db.oauth_audit_log
        
        # User audit lookup
        oauth_audit_log.create_index([
            ("user_id", ASCENDING),
            ("timestamp", DESCENDING)
        ], name="oauth_audit_user_timestamp_idx")
        
        # Session-based audit lookup
        oauth_audit_log.create_index([
            ("session_id", ASCENDING),
            ("timestamp", DESCENDING)
        ], name="oauth_audit_session_timestamp_idx", sparse=True)
        
        # Provider-based audit lookup
        oauth_audit_log.create_index([
            ("provider", ASCENDING),
            ("action", ASCENDING),
            ("timestamp", DESCENDING)
        ], name="oauth_audit_provider_action_idx")
        
        # Audit cleanup index
        oauth_audit_log.create_index([
            ("timestamp", ASCENDING)
        ], name="oauth_audit_cleanup_idx")
        
        print("✅ OAuth account linking indexes created successfully!")
        
        # Print index information
        print("\n📊 OAuth Linking Sessions Indexes:")
        for index in oauth_linking_sessions.list_indexes():
            print(f"  - {index['name']}: {index.get('key', 'N/A')}")
        
        print("\n📊 OAuth Linking Audit Indexes:")
        for index in oauth_linking_audit.list_indexes():
            print(f"  - {index['name']}: {index.get('key', 'N/A')}")
        
        print("\n📊 Enhanced OAuth Sessions Indexes:")
        for index in oauth_sessions.list_indexes():
            print(f"  - {index['name']}: {index.get('key', 'N/A')}")
        
        print("\n📊 Enhanced Users OAuth Indexes:")
        user_indexes = [idx for idx in users.list_indexes() if 'oauth' in idx['name'].lower()]
        for index in user_indexes:
            print(f"  - {index['name']}: {index.get('key', 'N/A')}")
        
        client.close()
        return True
        
    except Exception as e:
        logger.error(f"Error setting up OAuth linking indexes: {str(e)}")
        print(f"❌ Error setting up indexes: {str(e)}")
        return False

def verify_oauth_linking_indexes():
    """Verify that OAuth linking indexes are properly created"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        
        print("Verifying OAuth account linking indexes...")
        
        # Check required collections exist and have indexes
        required_collections = [
            'oauth_linking_sessions',
            'oauth_linking_audit',
            'oauth_sessions',
            'oauth_audit_log',
            'users'
        ]
        
        for collection_name in required_collections:
            collection = db[collection_name]
            indexes = list(collection.list_indexes())
            
            print(f"\n📋 {collection_name} ({len(indexes)} indexes):")
            for index in indexes:
                key_info = ", ".join([f"{k}:{v}" for k, v in index.get('key', [])])
                print(f"  ✓ {index['name']}: [{key_info}]")
        
        client.close()
        return True
        
    except Exception as e:
        logger.error(f"Error verifying OAuth linking indexes: {str(e)}")
        print(f"❌ Error verifying indexes: {str(e)}")
        return False

def cleanup_oauth_linking_data():
    """Clean up expired OAuth linking data"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        
        print("Cleaning up expired OAuth linking data...")
        
        now = datetime.datetime.utcnow()
        
        # Clean up expired linking sessions
        expired_sessions = db.oauth_linking_sessions.delete_many({
            'expires_at': {'$lt': now}
        })
        print(f"  ✓ Removed {expired_sessions.deleted_count} expired linking sessions")
        
        # Clean up old completed/cancelled sessions (older than 24 hours)
        old_cutoff = now - datetime.timedelta(hours=24)
        old_sessions = db.oauth_linking_sessions.delete_many({
            '$or': [
                {'completed': True, 'created_at': {'$lt': old_cutoff}},
                {'cancelled': True, 'created_at': {'$lt': old_cutoff}}
            ]
        })
        print(f"  ✓ Removed {old_sessions.deleted_count} old completed/cancelled sessions")
        
        # Clean up old audit logs (older than 90 days)
        audit_cutoff = now - datetime.timedelta(days=90)
        old_audit = db.oauth_linking_audit.delete_many({
            'timestamp': {'$lt': audit_cutoff}
        })
        print(f"  ✓ Removed {old_audit.deleted_count} old audit log entries")
        
        # Clean up old OAuth audit logs (older than 90 days)
        old_oauth_audit = db.oauth_audit_log.delete_many({
            'timestamp': {'$lt': audit_cutoff}
        })
        print(f"  ✓ Removed {old_oauth_audit.deleted_count} old OAuth audit log entries")
        
        client.close()
        return True
        
    except Exception as e:
        logger.error(f"Error cleaning up OAuth linking data: {str(e)}")
        print(f"❌ Error cleaning up data: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 OAuth Account Linking Security Setup")
    print("=" * 50)
    
    # Setup indexes
    if setup_oauth_linking_indexes():
        print("\n✅ Index setup completed successfully!")
    else:
        print("\n❌ Index setup failed!")
        exit(1)
    
    # Verify indexes
    print("\n" + "=" * 50)
    if verify_oauth_linking_indexes():
        print("\n✅ Index verification completed successfully!")
    else:
        print("\n❌ Index verification failed!")
        exit(1)
    
    # Cleanup old data
    print("\n" + "=" * 50)
    if cleanup_oauth_linking_data():
        print("\n✅ Data cleanup completed successfully!")
    else:
        print("\n❌ Data cleanup failed!")
    
    print("\n🎉 OAuth account linking security setup complete!")