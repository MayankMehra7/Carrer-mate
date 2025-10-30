#!/usr/bin/env python3
"""
Clean up duplicate users in the database
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def cleanup_duplicates():
    """Remove duplicate users keeping only the most recent one"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("Error: MONGO_URI not found in environment variables")
        return False
    
    try:
        client = MongoClient(mongo_uri)
        try:
            db = client.get_default_database()
        except:
            db = client["career_mate_ai"]
        
        users_collection = db["users"]
        
        print("Finding duplicate users...")
        
        # Find duplicates by username_lower
        pipeline = [
            {"$group": {
                "_id": "$username_lower",
                "count": {"$sum": 1},
                "users": {"$push": {"id": "$_id", "username": "$username", "created_at": "$created_at"}}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        duplicates = list(users_collection.aggregate(pipeline))
        
        if not duplicates:
            print("No duplicates found.")
            return True
        
        print(f"Found {len(duplicates)} groups of duplicate users:")
        
        for duplicate_group in duplicates:
            username_lower = duplicate_group["_id"]
            users = duplicate_group["users"]
            
            print(f"\nDuplicate group for '{username_lower}':")
            for user in users:
                print(f"  - ID: {user['id']}, Username: {user['username']}, Created: {user.get('created_at', 'Unknown')}")
            
            # Sort by created_at (keep the most recent, or first if no created_at)
            users_sorted = sorted(users, key=lambda x: x.get('created_at', ''), reverse=True)
            keep_user = users_sorted[0]
            remove_users = users_sorted[1:]
            
            print(f"  Keeping: {keep_user['username']} (ID: {keep_user['id']})")
            print(f"  Removing: {[u['username'] for u in remove_users]}")
            
            # Remove duplicate users
            for user_to_remove in remove_users:
                result = users_collection.delete_one({"_id": user_to_remove["id"]})
                if result.deleted_count > 0:
                    print(f"    ✓ Removed user {user_to_remove['username']}")
                else:
                    print(f"    ✗ Failed to remove user {user_to_remove['username']}")
        
        print(f"\nCleanup completed!")
        return True
        
    except Exception as e:
        print(f"Cleanup failed: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    print("Database Duplicate Cleanup")
    print("=" * 25)
    
    confirm = input("This will remove duplicate users. Continue? (y/N): ")
    if confirm.lower() != 'y':
        print("Cleanup cancelled.")
        exit(0)
    
    success = cleanup_duplicates()
    if success:
        print("\nCleanup completed successfully!")
    else:
        print("\nCleanup failed. Please check the error messages above.")