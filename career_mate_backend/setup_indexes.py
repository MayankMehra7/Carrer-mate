#!/usr/bin/env python3
"""
Setup database indexes for optimal performance and uniqueness constraints
"""

import os
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def setup_indexes():
    """Create necessary database indexes"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment variables")
        return False
    
    try:
        client = MongoClient(mongo_uri)
        db = client.get_default_database()
        
        print("Setting up database indexes...")
        
        # Users collection indexes
        users_collection = db["users"]
        
        # Create unique index on username_lower for case-insensitive uniqueness
        users_collection.create_index(
            [("username_lower", ASCENDING)], 
            unique=True, 
            name="username_lower_unique"
        )
        print("✓ Created unique index on username_lower")
        
        # Create unique index on email_hash
        users_collection.create_index(
            [("email_hash", ASCENDING)], 
            unique=True, 
            name="email_hash_unique"
        )
        print("✓ Created unique index on email_hash")
        
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
        
        # OTPs collection indexes
        otps_collection = db["otps"]
        
        # Create compound index on email_hash and purpose
        otps_collection.create_index(
            [("email_hash", ASCENDING), ("purpose", ASCENDING)], 
            name="email_purpose_index"
        )
        print("✓ Created compound index on email_hash and purpose")
        
        # Create TTL index on expires_at for automatic cleanup
        otps_collection.create_index(
            [("expires_at", ASCENDING)], 
            expireAfterSeconds=0,
            name="expires_at_ttl"
        )
        print("✓ Created TTL index on expires_at")
        
        # Resumes collection indexes
        resumes_collection = db["resumes"]
        
        # Create index on email_hash for faster user resume lookups
        resumes_collection.create_index(
            [("email_hash", ASCENDING), ("created_at", -1)], 
            name="email_created_index"
        )
        print("✓ Created index on email_hash and created_at")
        
        # Cover letters collection indexes
        cover_letters_collection = db["cover_letters"]
        
        # Create index on email_hash for faster user cover letter lookups
        cover_letters_collection.create_index(
            [("email_hash", ASCENDING), ("created_at", -1)], 
            name="email_created_index"
        )
        print("✓ Created index on email_hash and created_at")
        
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
        
        print("\nAll indexes created successfully!")
        
        # List all indexes for verification
        print("\nCurrent indexes:")
        for collection_name in ["users", "otps", "resumes", "cover_letters", "oauth_sessions"]:
            collection = db[collection_name]
            indexes = collection.list_indexes()
            print(f"\n{collection_name}:")
            for index in indexes:
                print(f"  - {index['name']}: {index.get('key', {})}")
        
        return True
        
    except Exception as e:
        print(f"Index setup failed: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    print("Database Index Setup")
    print("=" * 20)
    
    success = setup_indexes()
    if success:
        print("\nIndex setup completed successfully!")
    else:
        print("\nIndex setup failed. Please check the error messages above.")