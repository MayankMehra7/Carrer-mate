#!/usr/bin/env python3
"""
Migration script to remove email and email_original fields from users collection
This improves privacy by keeping only the hashed email for lookups
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def remove_email_fields():
    """Remove email and email_original fields from all users"""
    
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
        otps_collection = db["otps"]
        resumes_collection = db["resumes"]
        cover_letters_collection = db["cover_letters"]
        
        print("Starting email field removal migration...")
        
        # Remove email fields from users collection
        print("\n1. Removing email fields from users collection...")
        result = users_collection.update_many(
            {},
            {"$unset": {"email": "", "email_original": ""}}
        )
        print(f"   Updated {result.modified_count} user records")
        
        # Remove email_original from otps collection
        print("\n2. Removing email_original from otps collection...")
        result = otps_collection.update_many(
            {},
            {"$unset": {"email_original": ""}}
        )
        print(f"   Updated {result.modified_count} otp records")
        
        # Remove email_original from resumes collection
        print("\n3. Removing email_original from resumes collection...")
        result = resumes_collection.update_many(
            {},
            {"$unset": {"email_original": ""}}
        )
        print(f"   Updated {result.modified_count} resume records")
        
        # Remove email_original from cover_letters collection
        print("\n4. Removing email_original from cover_letters collection...")
        result = cover_letters_collection.update_many(
            {},
            {"$unset": {"email_original": ""}}
        )
        print(f"   Updated {result.modified_count} cover letter records")
        
        print(f"\nMigration completed successfully!")
        print("Email fields have been removed from all collections.")
        print("Only email_hash is now stored for user identification.")
        
        # Verify the changes
        print("\nVerifying changes...")
        sample_user = users_collection.find_one({})
        if sample_user:
            has_email = "email" in sample_user
            has_email_original = "email_original" in sample_user
            has_email_hash = "email_hash" in sample_user
            
            print(f"Sample user check:")
            print(f"  - Has 'email' field: {has_email}")
            print(f"  - Has 'email_original' field: {has_email_original}")
            print(f"  - Has 'email_hash' field: {has_email_hash}")
            
            if not has_email and not has_email_original and has_email_hash:
                print("  ✓ Migration successful - only email_hash remains")
            else:
                print("  ⚠ Migration may not be complete")
        
        return True
        
    except Exception as e:
        print(f"Migration failed: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    print("Email Fields Removal Migration")
    print("=" * 35)
    print("This will remove 'email' and 'email_original' fields from all collections.")
    print("Only 'email_hash' will remain for user identification.")
    print("This improves privacy and security.")
    
    confirm = input("\nContinue with migration? (y/N): ")
    if confirm.lower() != 'y':
        print("Migration cancelled.")
        exit(0)
    
    success = remove_email_fields()
    if success:
        print("\n✅ Migration completed successfully!")
        print("Email fields have been removed for improved privacy.")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")