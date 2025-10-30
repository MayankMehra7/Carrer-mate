#!/usr/bin/env python3
"""
Migration script to add username_lower field to existing users
Run this once to update existing user records with case-insensitive username support
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate_usernames():
    """Add username_lower field to all existing users"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment variables")
        return False
    
    try:
        client = MongoClient(mongo_uri)
        # Use a default database name if not specified in URI
        try:
            db = client.get_default_database()
        except:
            db = client["career_mate_ai"]
        users_collection = db["users"]
        
        print("Starting username migration...")
        
        # Find all users that don't have username_lower field
        users_to_update = users_collection.find({"username_lower": {"$exists": False}})
        
        updated_count = 0
        for user in users_to_update:
            if "username" in user:
                # Add username_lower field
                result = users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"username_lower": user["username"].lower()}}
                )
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"Updated user: {user['username']} -> {user['username'].lower()}")
        
        print(f"\nMigration completed successfully!")
        print(f"Updated {updated_count} user records")
        
        # Check for potential conflicts
        print("\nChecking for username conflicts...")
        pipeline = [
            {"$group": {
                "_id": "$username_lower",
                "count": {"$sum": 1},
                "usernames": {"$push": "$username"}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        conflicts = list(users_collection.aggregate(pipeline))
        if conflicts:
            print("WARNING: Found username conflicts that need manual resolution:")
            for conflict in conflicts:
                print(f"  Lowercase '{conflict['_id']}' conflicts: {conflict['usernames']}")
        else:
            print("No username conflicts found.")
        
        return True
        
    except Exception as e:
        print(f"Migration failed: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    print("Username Case-Insensitive Migration")
    print("=" * 40)
    
    confirm = input("This will update all existing user records. Continue? (y/N): ")
    if confirm.lower() != 'y':
        print("Migration cancelled.")
        sys.exit(0)
    
    success = migrate_usernames()
    if success:
        print("\nMigration completed successfully!")
        print("You can now use case-insensitive username validation.")
    else:
        print("\nMigration failed. Please check the error messages above.")
        sys.exit(1)