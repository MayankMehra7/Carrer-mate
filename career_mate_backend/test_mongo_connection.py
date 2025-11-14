#!/usr/bin/env python3
"""
Test MongoDB connection
"""
import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("❌ ERROR: MONGO_URI not found in .env file")
    sys.exit(1)

print(f"Attempting to connect to MongoDB: {MONGO_URI}")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Test connection
    server_info = client.server_info()
    print(f"✓ Successfully connected to MongoDB!")
    print(f"  Server version: {server_info.get('version', 'unknown')}")
    
    # Test database access
    db = client["career_mate_ai"]
    collections = db.list_collection_names()
    print(f"✓ Database 'career_mate_ai' accessible")
    print(f"  Collections: {', '.join(collections) if collections else 'None (empty database)'}")
    
    # Test a simple query
    user_count = db.users.count_documents({})
    print(f"  Users in database: {user_count}")
    
    print("\n✅ MongoDB connection test PASSED!")
    
except Exception as e:
    print(f"\n❌ MongoDB connection test FAILED!")
    print(f"  Error: {e}")
    print("\nTroubleshooting:")
    print("  1. Make sure MongoDB is running:")
    print("     - Windows: Check Services or run 'mongod'")
    print("     - Linux/Mac: Run 'sudo systemctl start mongod' or 'brew services start mongodb-community'")
    print("  2. Check your MONGO_URI in .env file")
    print("  3. Default MongoDB URI: mongodb://localhost:27017/")
    sys.exit(1)

