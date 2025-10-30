#!/usr/bin/env python3
"""
Test the new privacy-enhanced signup and login flow
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_signup_flow():
    """Test the complete signup and login flow"""
    
    print("Testing Privacy-Enhanced Signup Flow")
    print("=" * 40)
    
    # Test data
    test_user = {
        "name": "Test User",
        "username": "TestUser123",
        "email": "testuser123@example.com",
        "password": "TestPassword123"
    }
    
    print("1. Testing signup...")
    response = requests.post(f"{BASE_URL}/api/signup", json=test_user)
    
    if response.status_code == 200:
        result = response.json()
        print(f"   ✓ Signup successful: {result.get('message')}")
    else:
        result = response.json() if response.headers.get('content-type') == 'application/json' else {}
        print(f"   ✗ Signup failed: {result.get('error', f'HTTP {response.status_code}')}")
        return False
    
    print("\n2. Testing case-insensitive username validation...")
    
    # Try to signup with different case
    duplicate_user = test_user.copy()
    duplicate_user["username"] = "testuser123"  # Different case
    duplicate_user["email"] = "different@example.com"
    
    response = requests.post(f"{BASE_URL}/api/signup", json=duplicate_user)
    
    if response.status_code == 400:
        result = response.json()
        if "Username already exists" in result.get('error', ''):
            print(f"   ✓ Case-insensitive validation working: {result.get('error')}")
        else:
            print(f"   ? Unexpected error: {result.get('error')}")
    else:
        print(f"   ✗ Case-insensitive validation failed: Should have rejected duplicate username")
    
    print("\n3. Testing username availability check...")
    
    # Check availability of existing username (different case)
    response = requests.post(f"{BASE_URL}/api/check-availability", json={
        "type": "username",
        "value": "testuser123"  # Different case
    })
    
    if response.status_code == 200:
        result = response.json()
        if not result.get('available'):
            print(f"   ✓ Availability check working: {result.get('message')}")
        else:
            print(f"   ✗ Availability check failed: Should show as unavailable")
    else:
        print(f"   ✗ Availability check error: HTTP {response.status_code}")
    
    print("\n4. Testing login with different case...")
    
    # Try login with different case username
    login_data = {
        "identifier": "testuser123",  # Different case
        "password": "TestPassword123"
    }
    
    response = requests.post(f"{BASE_URL}/api/login", json=login_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"   ✓ Case-insensitive login working: {result.get('message')}")
        user_data = result.get('user', {})
        print(f"   User data: name={user_data.get('name')}, username={user_data.get('username')}")
        # Note: email should not be in the response for privacy
        if 'email' not in user_data:
            print(f"   ✓ Privacy maintained: No email in response")
        else:
            print(f"   ⚠ Privacy issue: Email present in response")
    else:
        result = response.json() if response.headers.get('content-type') == 'application/json' else {}
        print(f"   ✗ Login failed: {result.get('error', f'HTTP {response.status_code}')}")
    
    return True

def test_password_reset():
    """Test the new password reset flow"""
    
    print("\n5. Testing password reset flow...")
    
    # Test password reset (requires both username and email)
    reset_data = {
        "username": "TestUser123",
        "email": "testuser123@example.com"
    }
    
    response = requests.post(f"{BASE_URL}/api/forgot-password", json=reset_data)
    
    if response.status_code == 200:
        result = response.json()
        print(f"   ✓ Password reset request successful: {result.get('message')}")
    else:
        result = response.json() if response.headers.get('content-type') == 'application/json' else {}
        print(f"   ✗ Password reset failed: {result.get('error', f'HTTP {response.status_code}')}")

if __name__ == "__main__":
    try:
        success = test_signup_flow()
        if success:
            test_password_reset()
        
        print("\n" + "=" * 40)
        print("Test completed!")
        print("\nNote: To clean up test data, run:")
        print("db.users.deleteMany({username_lower: 'testuser123'})")
        print("db.otps.deleteMany({temp_email: 'testuser123@example.com'})")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server.")
        print("Make sure your Flask server is running on http://localhost:5000")
    except Exception as e:
        print(f"Test failed with error: {e}")