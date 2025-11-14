#!/usr/bin/env python3
"""
Interactive script to test the signup, login, and other auth flows.
"""

import requests
import getpass

BASE_URL = "http://localhost:5000"

def signup_flow():
    """Interactive signup flow"""
    print("\n--- Interactive Signup ---")
    name = input("Enter name: ")
    username = input("Enter username: ")
    email = input("Enter email: ")
    password = getpass.getpass("Enter password: ")

    user_data = {
        "name": name,
        "username": username,
        "email": email,
        "password": password
    }

    print("\n1. Attempting signup...")
    response = requests.post(f"{BASE_URL}/api/signup", json=user_data)

    if response.status_code == 200:
        result = response.json()
        print(f"   ✓ Signup successful: {result.get('message')}")
        return user_data
    else:
        result = response.json() if response.headers.get('content-type') == 'application/json' else {}
        print(f"   ✗ Signup failed: {result.get('error', f'HTTP {response.status_code}')}")
        return None

def login_flow():
    """Interactive login flow"""
    print("\n--- Interactive Login ---")
    identifier = input("Enter username or email: ")
    password = getpass.getpass("Enter password: ")

    login_data = {
        "identifier": identifier,
        "password": password
    }

    print("\n1. Attempting login...")
    response = requests.post(f"{BASE_URL}/api/login", json=login_data)

    if response.status_code == 200:
        result = response.json()
        print(f"   ✓ Login successful: {result.get('message')}")
        user_data = result.get('user', {})
        print(f"   Logged in as: {user_data.get('name')} ({user_data.get('username')})")
        if 'email' not in user_data:
            print("   ✓ Privacy maintained: Email not in login response.")
        else:
            print("   ⚠ Privacy issue: Email present in login response.")
    else:
        result = response.json() if response.headers.get('content-type') == 'application/json' else {}
        print(f"   ✗ Login failed: {result.get('error', f'HTTP {response.status_code}')}")

def check_availability_flow():
    """Interactive availability check flow"""
    print("\n--- Check Username/Email Availability ---")
    check_type = input("Check 'username' or 'email'? ").lower()
    if check_type not in ["username", "email"]:
        print("   ✗ Invalid type. Please enter 'username' or 'email'.")
        return

    value = input(f"Enter {check_type} to check: ")

    response = requests.post(f"{BASE_URL}/api/check-availability", json={
        "type": check_type,
        "value": value
    })

    if response.status_code == 200:
        result = response.json()
        if result.get('available'):
            print(f"   ✓ '{value}' is available.")
        else:
            print(f"   ✗ '{value}' is not available: {result.get('message')}")
    else:
        print(f"   ✗ Availability check error: HTTP {response.status_code}")

def password_reset_flow():
    """Interactive password reset flow"""
    print("\n--- Forgot Password Flow ---")
    username = input("Enter your username: ")
    email = input("Enter your email: ")

    reset_data = {
        "username": username,
        "email": email
    }

    response = requests.post(f"{BASE_URL}/api/forgot-password", json=reset_data)

    if response.status_code == 200:
        result = response.json()
        print(f"   ✓ Password reset request successful: {result.get('message')}")
        print("   (Note: This sends an email if the user exists. Check your backend logs/email.)")
    else:
        result = response.json() if response.headers.get('content-type') == 'application/json' else {}
        print(f"   ✗ Password reset failed: {result.get('error', f'HTTP {response.status_code}')}")

if __name__ == "__main__":
    print("Interactive Auth Flow Tester")
    print("=" * 40)
    try:
        while True:
            print("\nChoose an action:")
            print("1. Signup")
            print("2. Login")
            print("3. Check Username/Email Availability")
            print("4. Forgot Password")
            print("5. Exit")
            choice = input("Enter choice (1-5): ")

            if choice == '1':
                signup_flow()
            elif choice == '2':
                login_flow()
            elif choice == '3':
                check_availability_flow()
            elif choice == '4':
                password_reset_flow()
            elif choice == '5':
                print("Exiting.")
                break
            else:
                print("Invalid choice, please try again.")

    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server.")
        print("Make sure your Flask server is running on http://localhost:5000")
    except KeyboardInterrupt:
        print("\nExiting.")
    except Exception as e:
        print(f"Test failed with error: {e}")