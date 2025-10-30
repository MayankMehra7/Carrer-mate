#!/usr/bin/env python3
"""
Setup OAuth-specific database indexes for optimal performance
"""

import os
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_oauth_indexes():
    """Create OAuth-specific database indexes"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment variables")
        return False
    
    try:
        client = MongoClient(mongo_uri)
        db = client.get_default_database()
        
        print("Setting up OAuth-specific database indexes...")
        
        # Users collection OAuth indexes
        users_collection = db["users"]
        
        # Create indexes for OAuth provider lookups
        users_collection.create_index(
            [("oauth_providers.google.id", ASCENDING)], 
            sparse=True,
            name="oauth_google_id_index"
        )
        print("✓ Created index on oauth_providers.google.id")
        
        users_collection.create_index(
            [("oauth_providers.github.id", ASCENDING)], 
            sparse=True,
            name="oauth_github_id_index"
        )
        print("✓ Created index on oauth_providers.github.id")
        
        # Create compound index for OAuth provider email lookups
        users_collection.create_index(
            [("oauth_providers.google.email", ASCENDING)], 
            sparse=True,
            name="oauth_google_email_index"
        )
        print("✓ Created index on oauth_providers.google.email")
        
        users_collection.create_index(
            [("oauth_providers.github.email", ASCENDING)], 
            sparse=True,
            name="oauth_github_email_index"
        )
        print("✓ Created index on oauth_providers.github.email")
        
        # Create index on primary_auth_method for analytics
        users_collection.create_index(
            [("primary_auth_method", ASCENDING)], 
            name="primary_auth_method_index"
        )
        print("✓ Created index on primary_auth_method")
        
        # Create index on login_methods for user management
        users_collection.create_index(
            [("login_methods", ASCENDING)], 
            name="login_methods_index"
        )
        print("✓ Created index on login_methods")
        
        # Create index on last_login for user activity tracking
        users_collection.create_index(
            [("last_login", -1)], 
            name="last_login_desc_index"
        )
        print("✓ Created index on last_login")
        
        # OAuth sessions collection indexes
        oauth_sessions_collection = db["oauth_sessions"]
        
        # Create compound index on user_id and provider for session lookups
        oauth_sessions_collection.create_index(
            [("user_id", ASCENDING), ("provider", ASCENDING)], 
            unique=True,
            name="user_provider_unique"
        )
        print("✓ Created unique compound index on user_id and provider")
        
        # Create index on provider_user_id for OAuth provider lookups
        oauth_sessions_collection.create_index(
            [("provider", ASCENDING), ("provider_user_id", ASCENDING)], 
            name="provider_user_id_index"
        )
        print("✓ Created index on provider and provider_user_id")
        
        # Create TTL index on expires_at for automatic session cleanup
        oauth_sessions_collection.create_index(
            [("expires_at", ASCENDING)], 
            expireAfterSeconds=0,
            name="expires_at_ttl"
        )
        print("✓ Created TTL index on expires_at for OAuth sessions")
        
        # Create index on last_used for session management
        oauth_sessions_collection.create_index(
            [("last_used", ASCENDING)], 
            name="last_used_index"
        )
        print("✓ Created index on last_used")
        
        # Create index on user_id for user session queries
        oauth_sessions_collection.create_index(
            [("user_id", ASCENDING), ("last_used", -1)], 
            name="user_last_used_index"
        )
        print("✓ Created index on user_id and last_used")
        
        print("\nAll OAuth indexes created successfully!")
        
        # List OAuth-related indexes for verification
        print("\nOAuth-related indexes:")
        
        print("\nusers collection OAuth indexes:")
        users_indexes = users_collection.list_indexes()
        for index in users_indexes:
            index_name = index['name']
            if any(keyword in index_name.lower() for keyword in ['oauth', 'auth', 'login', 'primary']):
                print(f"  - {index_name}: {index.get('key', {})}")
        
        print("\noauth_sessions collection indexes:")
        oauth_indexes = oauth_sessions_collection.list_indexes()
        for index in oauth_indexes:
            print(f"  - {index['name']}: {index.get('key', {})}")
        
        return True
        
    except Exception as e:
        print(f"OAuth index setup failed: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

def drop_oauth_indexes():
    """Drop OAuth-specific indexes (for rollback)"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment variables")
        return False
    
    try:
        client = MongoClient(mongo_uri)
        db = client.get_default_database()
        
        print("Dropping OAuth-specific indexes...")
        
        users_collection = db["users"]
        oauth_sessions_collection = db["oauth_sessions"]
        
        # OAuth indexes to drop from users collection
        oauth_user_indexes = [
            "oauth_google_id_index",
            "oauth_github_id_index", 
            "oauth_google_email_index",
            "oauth_github_email_index",
            "primary_auth_method_index",
            "login_methods_index",
            "last_login_desc_index"
        ]
        
        for index_name in oauth_user_indexes:
            try:
                users_collection.drop_index(index_name)
                print(f"✓ Dropped {index_name} from users collection")
            except Exception as e:
                print(f"⚠ Could not drop {index_name}: {e}")
        
        # Drop all indexes from oauth_sessions collection
        try:
            oauth_sessions_collection.drop_indexes()
            print("✓ Dropped all indexes from oauth_sessions collection")
        except Exception as e:
            print(f"⚠ Could not drop oauth_sessions indexes: {e}")
        
        return True
        
    except Exception as e:
        print(f"Failed to drop OAuth indexes: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    import sys
    
    print("OAuth Index Setup")
    print("=" * 17)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--drop":
        print("Dropping OAuth indexes...")
        success = drop_oauth_indexes()
        if success:
            print("\nOAuth indexes dropped successfully!")
        else:
            print("\nFailed to drop OAuth indexes. Please check the error messages above.")
    else:
        print("Creating OAuth indexes...")
        success = setup_oauth_indexes()
        if success:
            print("\nOAuth index setup completed successfully!")
            print("\nOAuth indexes are now ready for use.")
        else:
            print("\nOAuth index setup failed. Please check the error messages above.")
            print("You can drop the indexes by running:")
            print("python setup_oauth_indexes.py --drop")