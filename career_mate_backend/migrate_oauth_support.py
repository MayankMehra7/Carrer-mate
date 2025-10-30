#!/usr/bin/env python3
"""
Database migration script to add OAuth support to existing users
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

def migrate_users_for_oauth():
    """Add OAuth fields to existing user documents"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment variables")
        return False
    
    try:
        client = MongoClient(mongo_uri)
        db = client.get_default_database()
        users_collection = db["users"]
        
        print("Starting OAuth migration for existing users...")
        
        # Find users that don't have OAuth fields
        users_to_migrate = users_collection.find({
            "$or": [
                {"oauth_providers": {"$exists": False}},
                {"primary_auth_method": {"$exists": False}},
                {"login_methods": {"$exists": False}},
                {"last_login": {"$exists": False}}
            ]
        })
        
        migration_count = 0
        
        for user in users_to_migrate:
            user_id = user["_id"]
            
            # Prepare update document
            update_doc = {}
            
            # Add oauth_providers field if missing
            if "oauth_providers" not in user:
                update_doc["oauth_providers"] = {}
            
            # Add primary_auth_method if missing
            if "primary_auth_method" not in user:
                update_doc["primary_auth_method"] = "email"
            
            # Add login_methods if missing
            if "login_methods" not in user:
                update_doc["login_methods"] = ["email"]
            
            # Add last_login if missing (use created_at or current time)
            if "last_login" not in user:
                update_doc["last_login"] = user.get("created_at", datetime.utcnow())
            
            # Update the user document
            if update_doc:
                result = users_collection.update_one(
                    {"_id": user_id},
                    {"$set": update_doc}
                )
                
                if result.modified_count > 0:
                    migration_count += 1
                    print(f"✓ Migrated user: {user.get('username', 'Unknown')}")
        
        print(f"\nMigration completed! Updated {migration_count} users.")
        
        # Verify migration
        print("\nVerifying migration...")
        total_users = users_collection.count_documents({})
        users_with_oauth_fields = users_collection.count_documents({
            "oauth_providers": {"$exists": True},
            "primary_auth_method": {"$exists": True},
            "login_methods": {"$exists": True},
            "last_login": {"$exists": True}
        })
        
        print(f"Total users: {total_users}")
        print(f"Users with OAuth fields: {users_with_oauth_fields}")
        
        if total_users == users_with_oauth_fields:
            print("✓ All users successfully migrated!")
            return True
        else:
            print("⚠ Some users may not have been migrated properly")
            return False
        
    except Exception as e:
        print(f"Migration failed: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

def create_oauth_sessions_collection():
    """Create the OAuth sessions collection with proper structure"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment variables")
        return False
    
    try:
        client = MongoClient(mongo_uri)
        db = client.get_default_database()
        
        # Create oauth_sessions collection if it doesn't exist
        if "oauth_sessions" not in db.list_collection_names():
            db.create_collection("oauth_sessions")
            print("✓ Created oauth_sessions collection")
        else:
            print("✓ oauth_sessions collection already exists")
        
        return True
        
    except Exception as e:
        print(f"Failed to create oauth_sessions collection: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

def rollback_oauth_migration():
    """Rollback OAuth migration (remove OAuth fields from users)"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment variables")
        return False
    
    try:
        client = MongoClient(mongo_uri)
        db = client.get_default_database()
        users_collection = db["users"]
        
        print("Rolling back OAuth migration...")
        
        # Remove OAuth fields from all users
        result = users_collection.update_many(
            {},
            {
                "$unset": {
                    "oauth_providers": "",
                    "primary_auth_method": "",
                    "login_methods": "",
                    "last_login": ""
                }
            }
        )
        
        print(f"✓ Rolled back OAuth fields from {result.modified_count} users")
        
        # Drop oauth_sessions collection
        if "oauth_sessions" in db.list_collection_names():
            db.drop_collection("oauth_sessions")
            print("✓ Dropped oauth_sessions collection")
        
        return True
        
    except Exception as e:
        print(f"Rollback failed: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    import sys
    
    print("OAuth Migration Script")
    print("=" * 22)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--rollback":
        print("Rolling back OAuth migration...")
        success = rollback_oauth_migration()
        if success:
            print("\nRollback completed successfully!")
        else:
            print("\nRollback failed. Please check the error messages above.")
    else:
        print("Migrating users for OAuth support...")
        
        # Create OAuth sessions collection first
        collection_success = create_oauth_sessions_collection()
        
        # Then migrate users
        migration_success = migrate_users_for_oauth()
        
        if collection_success and migration_success:
            print("\nOAuth migration completed successfully!")
            print("\nNext steps:")
            print("1. Run setup_oauth_indexes.py to create OAuth-related indexes")
            print("2. Test OAuth functionality with the updated schema")
        else:
            print("\nMigration failed. Please check the error messages above.")
            print("You can rollback the migration by running:")
            print("python migrate_oauth_support.py --rollback")