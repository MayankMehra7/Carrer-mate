#!/usr/bin/env python3
"""
Test script to verify case-insensitive username validation
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:5000"  # Adjust if your server runs on different port

def test_username_case_sensitivity():
    """Test that usernames are case-insensitive"""
    
    print("Testing Case-Insensitive Username Validation")
    print("=" * 50)
    
    # Test data
    test_cases = [
        {
            "name": "Test User 1",
            "username": "ONE_TWO_12",
            "email": "test1@example.com",
            "password": "password123"
        },
        {
            "name": "Test User 2", 
            "username": "One_Two_12",  # Different case, should be rejected
            "email": "test2@example.com",
            "password": "password123"
        },
        {
            "name": "Test User 3",
            "username": "one_two_12",  # Different case, should be rejected
            "email": "test3@example.com", 
            "password": "password123"
        }
    ]
    
    print("1. Testing username availability check...")
    
    # Test availability check for original username
    response = requests.post(f"{BASE_URL}/check-availability", json={
        "type": "username",
        "value": "ONE_TWO_12"
    })
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Username 'ONE_TWO_12' availability: {result.get('available', False)}")
    else:
        print(f"   Error checking availability: {response.status_code}")
    
    # Test availability for different case
    response = requests.post(f"{BASE_URL}/check-availability", json={
        "type": "username", 
        "value": "one_two_12"
    })
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Username 'one_two_12' availability: {result.get('available', False)}")
    else:
        print(f"   Error checking availability: {response.status_code}")
    
    print("\n2. Testing signup with different case variations...")
    
    for i, user_data in enumerate(test_cases, 1):
        print(f"\n   Attempting signup {i}: {user_data['username']}")
        
        response = requests.post(f"{BASE_URL}/signup", json=user_data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✓ Success: {result.get('message', 'Signup successful')}")
        else:
            result = response.json() if response.headers.get('content-type') == 'application/json' else {}
            print(f"   ✗ Failed: {result.get('error', f'HTTP {response.status_code}')}")
    
    print("\n3. Testing login with different case variations...")
    
    # Try logging in with different case variations
    login_attempts = ["ONE_TWO_12", "one_two_12", "One_Two_12"]
    
    for username in login_attempts:
        print(f"\n   Attempting login with: {username}")
        
        response = requests.post(f"{BASE_URL}/login", json={
            "identifier": username,
            "password": "password123"
        })
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✓ Login successful: {result.get('message', 'Success')}")
        else:
            result = response.json() if response.headers.get('content-type') == 'application/json' else {}
            print(f"   ✗ Login failed: {result.get('error', f'HTTP {response.status_code}')}")

def cleanup_test_users():
    """Clean up test users (requires direct database access)"""
    print("\nNote: To clean up test users, run the following MongoDB commands:")
    print("db.users.deleteMany({username_lower: {$in: ['one_two_12']}})")
    print("db.users.deleteMany({email_hash: {$in: [/* hashes for test emails */]}})")

if __name__ == "__main__":
    try:
        test_username_case_sensitivity()
        cleanup_test_users()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server.")
        print("Make sure your Flask server is running on the correct port.")
    except Exception as e:
        print(f"Test failed with error: {e}")