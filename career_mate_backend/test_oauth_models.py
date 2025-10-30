#!/usr/bin/env python3
"""
Test script for OAuth model functions
"""

import datetime
from unittest.mock import Mock, MagicMock
import sys
import os

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_oauth_user_creation():
    """Test OAuth user creation functionality"""
    print("Testing OAuth user creation...")
    
    # Mock MongoDB
    mock_mongo = Mock()
    mock_collection = Mock()
    mock_mongo.db.users = mock_collection
    
    # Import after setting up mocks
    from models import create_user
    
    # Test creating user with OAuth data
    oauth_data = {
        "id": "12345",
        "email": "test@example.com",
        "name": "Test User",
        "picture": "https://example.com/avatar.jpg"
    }
    
    create_user(
        mock_mongo, 
        name="Test User",
        username="testuser",
        email="test@example.com",
        oauth_provider="google",
        oauth_data=oauth_data
    )
    
    # Verify the insert_one was called
    assert mock_collection.insert_one.called
    
    # Get the document that was inserted
    inserted_doc = mock_collection.insert_one.call_args[0][0]
    
    # Verify OAuth fields are present
    assert "oauth_providers" in inserted_doc
    assert "google" in inserted_doc["oauth_providers"]
    assert inserted_doc["oauth_providers"]["google"]["id"] == "12345"
    assert inserted_doc["primary_auth_method"] == "google"
    assert "google" in inserted_doc["login_methods"]
    assert "linked_at" in inserted_doc["oauth_providers"]["google"]
    
    print("✓ OAuth user creation test passed")

def test_oauth_provider_linking():
    """Test OAuth provider linking functionality"""
    print("Testing OAuth provider linking...")
    
    # Mock MongoDB
    mock_mongo = Mock()
    mock_collection = Mock()
    mock_mongo.db.users = mock_collection
    
    # Mock existing user
    existing_user = {
        "_id": "user123",
        "email_hash": "hashed_email",
        "login_methods": ["email"]
    }
    mock_collection.find_one.return_value = existing_user
    
    # Import after setting up mocks
    from models import link_oauth_provider
    
    # Test linking OAuth provider
    oauth_data = {
        "id": "github123",
        "username": "testuser",
        "email": "test@example.com",
        "name": "Test User"
    }
    
    link_oauth_provider(
        mock_mongo,
        user_email="test@example.com",
        provider="github",
        oauth_data=oauth_data
    )
    
    # Verify update_one was called
    assert mock_collection.update_one.called
    
    # Get the update document
    update_call = mock_collection.update_one.call_args
    update_doc = update_call[0][1]["$set"]
    
    # Verify OAuth provider was added
    assert "oauth_providers.github" in update_doc
    assert update_doc["oauth_providers.github"]["id"] == "github123"
    assert "linked_at" in update_doc["oauth_providers.github"]
    
    print("✓ OAuth provider linking test passed")

def test_oauth_session_creation():
    """Test OAuth session creation functionality"""
    print("Testing OAuth session creation...")
    
    # Mock MongoDB
    mock_mongo = Mock()
    mock_collection = Mock()
    mock_mongo.db.oauth_sessions = mock_collection
    
    # Import after setting up mocks
    from models import create_oauth_session
    
    # Test creating OAuth session
    create_oauth_session(
        mock_mongo,
        user_id="user123",
        provider="google",
        provider_user_id="google123",
        access_token="access_token_123",
        refresh_token="refresh_token_123",
        scopes=["email", "profile"]
    )
    
    # Verify update_one was called
    assert mock_collection.update_one.called
    
    # Get the session document
    update_call = mock_collection.update_one.call_args
    session_doc = update_call[0][1]["$set"]
    
    # Verify session fields
    assert session_doc["user_id"] == "user123"
    assert session_doc["provider"] == "google"
    assert session_doc["provider_user_id"] == "google123"
    assert "access_token_hash" in session_doc
    assert "refresh_token_hash" in session_doc
    assert session_doc["scopes"] == ["email", "profile"]
    assert "created_at" in session_doc
    assert "last_used" in session_doc
    
    print("✓ OAuth session creation test passed")

def test_oauth_db_functions():
    """Test OAuth database functions"""
    print("Testing OAuth database functions...")
    
    # Mock MongoDB collections
    mock_users = Mock()
    mock_oauth_sessions = Mock()
    
    # Import and patch db module
    import db
    db.users = mock_users
    db.oauth_sessions = mock_oauth_sessions
    
    # Test find_user_by_oauth_provider
    mock_users.find_one.return_value = {"_id": "user123", "name": "Test User"}
    
    result = db.find_user_by_oauth_provider("google", "google123")
    
    # Verify the query was correct
    query_call = mock_users.find_one.call_args[0][0]
    assert "oauth_providers.google.id" in query_call
    assert query_call["oauth_providers.google.id"] == "google123"
    
    print("✓ OAuth database functions test passed")

def run_all_tests():
    """Run all OAuth model tests"""
    print("OAuth Model Tests")
    print("=" * 17)
    
    try:
        test_oauth_user_creation()
        test_oauth_provider_linking()
        test_oauth_session_creation()
        test_oauth_db_functions()
        
        print("\n✓ All OAuth model tests passed!")
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)