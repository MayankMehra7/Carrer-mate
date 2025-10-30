#!/usr/bin/env python3
"""
Unit tests for GitHub OAuth functionality

Tests GitHub code exchange logic, user creation/update with GitHub data,
and error handling scenarios.

Requirements: 2.1, 2.2, 2.3
"""

import datetime
import json
from unittest.mock import Mock, MagicMock, patch
import sys
import os

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_github_code_exchange():
    """Test GitHub authorization code to access token exchange"""
    print("Testing GitHub code exchange...")
    
    # Mock successful response
    mock_response = Mock()
    mock_response.json.return_value = {
        "access_token": "gho_test_token_123",
        "token_type": "bearer",
        "scope": "user:email"
    }
    mock_response.raise_for_status.return_value = None
    
    # Mock environment variables
    with patch.dict(os.environ, {
        'GITHUB_OAUTH_CLIENT_ID': 'test_client_id',
        'GITHUB_OAUTH_CLIENT_SECRET': 'test_client_secret'
    }), patch('requests.post', return_value=mock_response):
        from utils.github_oauth_service import GitHubOAuthService
        
        # Create service instance with mocked env vars
        service = GitHubOAuthService()
        
        # Test successful code exchange
        success, token, error = service.exchange_code_for_token("test_code_123")
        
        assert success is True
        assert token == "gho_test_token_123"
        assert error is None
    
    print("✓ GitHub code exchange test passed")

def test_github_code_exchange_error():
    """Test GitHub code exchange error handling"""
    print("Testing GitHub code exchange error handling...")
    
    # Mock error response
    mock_response = Mock()
    mock_response.json.return_value = {
        "error": "bad_verification_code",
        "error_description": "The code passed is incorrect or expired."
    }
    mock_response.raise_for_status.return_value = None
    
    # Mock environment variables
    with patch.dict(os.environ, {
        'GITHUB_OAUTH_CLIENT_ID': 'test_client_id',
        'GITHUB_OAUTH_CLIENT_SECRET': 'test_client_secret'
    }), patch('requests.post', return_value=mock_response):
        from utils.github_oauth_service import GitHubOAuthService
        
        # Create service instance with mocked env vars
        service = GitHubOAuthService()
        
        # Test error handling
        success, token, error = service.exchange_code_for_token("invalid_code")
        
        assert success is False
        assert token is None
        assert "The code passed is incorrect or expired" in error
    
    print("✓ GitHub code exchange error handling test passed")

def test_github_profile_extraction():
    """Test GitHub user profile data extraction using PyGithub"""
    print("Testing GitHub profile extraction...")
    
    # Mock GitHub user object
    mock_user = Mock()
    mock_user.id = 12345
    mock_user.login = "testuser"
    mock_user.email = "test@example.com"
    mock_user.name = "Test User"
    mock_user.avatar_url = "https://avatars.githubusercontent.com/u/12345"
    mock_user.bio = "Test bio"
    mock_user.company = "Test Company"
    mock_user.location = "Test Location"
    mock_user.public_repos = 10
    mock_user.followers = 5
    mock_user.following = 3
    
    # Mock GitHub client
    mock_github = Mock()
    mock_github.get_user.return_value = mock_user
    
    with patch('github.Github', return_value=mock_github):
        from utils.github_oauth_service import GitHubOAuthService
        
        # Create service instance
        service = GitHubOAuthService()
        
        # Test profile extraction
        success, profile, error = service.validate_token_and_get_profile("test_token")
        
        assert success is True
        assert profile['id'] == 12345
        assert profile['username'] == "testuser"
        assert profile['email'] == "test@example.com"
        assert profile['name'] == "Test User"
        assert profile['avatar_url'] == "https://avatars.githubusercontent.com/u/12345"
        assert error is None
    
    print("✓ GitHub profile extraction test passed")

def test_github_profile_extraction_no_public_email():
    """Test GitHub profile extraction when email is not public"""
    print("Testing GitHub profile extraction with private email...")
    
    # Mock GitHub user object with no public email
    mock_user = Mock()
    mock_user.id = 12345
    mock_user.login = "testuser"
    mock_user.email = None  # No public email
    mock_user.name = "Test User"
    mock_user.avatar_url = "https://avatars.githubusercontent.com/u/12345"
    mock_user.bio = None
    mock_user.company = None
    mock_user.location = None
    mock_user.public_repos = 10
    mock_user.followers = 5
    mock_user.following = 3
    
    # Mock email object
    mock_email = Mock()
    mock_email.email = "private@example.com"
    mock_email.primary = True
    
    mock_user.get_emails.return_value = [mock_email]
    
    # Mock GitHub client
    mock_github = Mock()
    mock_github.get_user.return_value = mock_user
    
    with patch('github.Github', return_value=mock_github):
        from utils.github_oauth_service import GitHubOAuthService
        
        # Create service instance
        service = GitHubOAuthService()
        
        # Test profile extraction with private email
        success, profile, error = service.validate_token_and_get_profile("test_token")
        
        assert success is True
        assert profile['id'] == 12345
        assert profile['username'] == "testuser"
        assert profile['email'] == "private@example.com"  # Should get private email
        assert profile['name'] == "Test User"
        assert error is None
    
    print("✓ GitHub profile extraction with private email test passed")

def test_github_token_validation_error():
    """Test GitHub token validation error handling"""
    print("Testing GitHub token validation error handling...")
    
    # Mock GitHub exception
    from github import GithubException
    
    with patch('github.Github') as mock_github_class:
        mock_github = Mock()
        mock_github.get_user.side_effect = GithubException(401, "Bad credentials")
        mock_github_class.return_value = mock_github
        
        from utils.github_oauth_service import GitHubOAuthService
        
        # Create service instance
        service = GitHubOAuthService()
        
        # Test token validation error
        success, profile, error = service.validate_token_and_get_profile("invalid_token")
        
        assert success is False
        assert profile is None
        assert "Invalid or expired GitHub token" in error
    
    print("✓ GitHub token validation error handling test passed")

def test_github_user_creation():
    """Test user creation with GitHub OAuth data"""
    print("Testing GitHub user creation...")
    
    # Mock MongoDB
    mock_mongo = Mock()
    mock_collection = Mock()
    mock_mongo.db.users = mock_collection
    
    # Import after setting up mocks
    from models import create_user
    
    # Test creating user with GitHub OAuth data
    oauth_data = {
        'id': 12345,
        'username': 'testuser',
        'email': 'test@example.com',
        'name': 'Test User',
        'avatar_url': 'https://avatars.githubusercontent.com/u/12345'
    }
    
    create_user(
        mock_mongo, 
        name="Test User",
        username="testuser",
        email="test@example.com",
        oauth_provider="github",
        oauth_data=oauth_data
    )
    
    # Verify the insert_one was called
    assert mock_collection.insert_one.called
    
    # Get the document that was inserted
    inserted_doc = mock_collection.insert_one.call_args[0][0]
    
    # Verify GitHub OAuth fields are present
    assert "oauth_providers" in inserted_doc
    assert "github" in inserted_doc["oauth_providers"]
    assert inserted_doc["oauth_providers"]["github"]["id"] == 12345
    assert inserted_doc["oauth_providers"]["github"]["username"] == "testuser"
    assert inserted_doc["primary_auth_method"] == "github"
    assert "github" in inserted_doc["login_methods"]
    assert "linked_at" in inserted_doc["oauth_providers"]["github"]
    
    print("✓ GitHub user creation test passed")

def test_github_account_linking():
    """Test linking GitHub account to existing user"""
    print("Testing GitHub account linking...")
    
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
    
    # Test linking GitHub provider
    oauth_data = {
        'id': 12345,
        'username': 'testuser',
        'email': 'test@example.com',
        'name': 'Test User',
        'avatar_url': 'https://avatars.githubusercontent.com/u/12345'
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
    
    # Verify GitHub provider was added
    assert "oauth_providers.github" in update_doc
    assert update_doc["oauth_providers.github"]["id"] == 12345
    assert update_doc["oauth_providers.github"]["username"] == "testuser"
    assert "linked_at" in update_doc["oauth_providers.github"]
    
    print("✓ GitHub account linking test passed")

def test_github_oauth_session_creation():
    """Test GitHub OAuth session creation"""
    print("Testing GitHub OAuth session creation...")
    
    # Mock MongoDB
    mock_mongo = Mock()
    mock_collection = Mock()
    mock_mongo.db.oauth_sessions = mock_collection
    
    # Import after setting up mocks
    from models import create_oauth_session
    
    # Test creating GitHub OAuth session
    create_oauth_session(
        mock_mongo,
        user_id="user123",
        provider="github",
        provider_user_id="12345",
        access_token="gho_test_token_123",
        scopes=["user:email", "read:user"]
    )
    
    # Verify update_one was called
    assert mock_collection.update_one.called
    
    # Get the session document
    update_call = mock_collection.update_one.call_args
    session_doc = update_call[0][1]["$set"]
    
    # Verify session fields
    assert session_doc["user_id"] == "user123"
    assert session_doc["provider"] == "github"
    assert session_doc["provider_user_id"] == "12345"
    assert "access_token_hash" in session_doc
    assert session_doc["scopes"] == ["user:email", "read:user"]
    assert "created_at" in session_doc
    assert "last_used" in session_doc
    
    print("✓ GitHub OAuth session creation test passed")

def test_github_sign_in_complete_flow():
    """Test complete GitHub sign-in flow with authorization code"""
    print("Testing complete GitHub sign-in flow...")
    
    # Mock successful token exchange
    mock_token_response = Mock()
    mock_token_response.json.return_value = {
        "access_token": "gho_test_token_123",
        "token_type": "bearer",
        "scope": "user:email"
    }
    mock_token_response.raise_for_status.return_value = None
    
    # Mock GitHub user object
    mock_user = Mock()
    mock_user.id = 12345
    mock_user.login = "testuser"
    mock_user.email = "test@example.com"
    mock_user.name = "Test User"
    mock_user.avatar_url = "https://avatars.githubusercontent.com/u/12345"
    mock_user.bio = "Test bio"
    mock_user.company = "Test Company"
    mock_user.location = "Test Location"
    mock_user.public_repos = 10
    mock_user.followers = 5
    mock_user.following = 3
    
    # Mock GitHub client
    mock_github = Mock()
    mock_github.get_user.return_value = mock_user
    
    # Mock environment variables
    with patch.dict(os.environ, {
        'GITHUB_OAUTH_CLIENT_ID': 'test_client_id',
        'GITHUB_OAUTH_CLIENT_SECRET': 'test_client_secret'
    }), patch('requests.post', return_value=mock_token_response), \
         patch('github.Github', return_value=mock_github):
        
        from utils.github_oauth_service import GitHubOAuthService
        
        # Create service instance with mocked env vars
        service = GitHubOAuthService()
        
        # Test complete sign-in flow
        success, profile, error = service.sign_in_with_code("test_code_123")
        
        assert success is True
        assert profile['id'] == 12345
        assert profile['username'] == "testuser"
        assert profile['email'] == "test@example.com"
        assert profile['access_token'] == "gho_test_token_123"
        assert error is None
    
    print("✓ Complete GitHub sign-in flow test passed")

def run_all_tests():
    """Run all GitHub OAuth tests"""
    print("GitHub OAuth Tests")
    print("=" * 18)
    
    try:
        test_github_code_exchange()
        test_github_code_exchange_error()
        test_github_profile_extraction()
        test_github_profile_extraction_no_public_email()
        test_github_token_validation_error()
        test_github_user_creation()
        test_github_account_linking()
        test_github_oauth_session_creation()
        test_github_sign_in_complete_flow()
        
        print("\n✓ All GitHub OAuth tests passed!")
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)