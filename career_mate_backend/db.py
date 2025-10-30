# db.py
from config import db
from datetime import datetime, timedelta
from bson.objectid import ObjectId
import hashlib
import os

# Email hashing functions
def hash_email(email):
    """Hash email for privacy while maintaining searchability"""
    # Use a consistent salt for the application
    salt = os.getenv("EMAIL_SALT", "careermate_default_salt_2024")
    return hashlib.sha256((email.lower() + salt).encode()).hexdigest()

def hash_email_for_search(email):
    """Hash email for database queries"""
    return hash_email(email)

# Collections
users = db["users"]
otps = db["otps"]
resumes = db["resumes"]
cover_letters = db["cover_letters"]
oauth_sessions = db["oauth_sessions"]

# Users
def create_user(user_doc):
    # Hash the email before storing and remove plain email for privacy
    if "email" in user_doc:
        user_doc["email_hash"] = hash_email(user_doc["email"])
        # Remove plain email for privacy - only store hash
        del user_doc["email"]
    
    # Store lowercase username for case-insensitive uniqueness checking
    if "username" in user_doc:
        user_doc["username_lower"] = user_doc["username"].lower()
    
    user_doc["created_at"] = datetime.utcnow()
    return users.insert_one(user_doc)

def find_user_by_email(email):
    email_hash = hash_email(email)
    return users.find_one({"email_hash": email_hash})

def find_user_by_username(username):
    # Case-insensitive username search
    return users.find_one({"username_lower": username.lower()})

def find_user_by_email_or_username(identifier):
    """Find user by email or username"""
    # First try to find by username (exact match)
    user = find_user_by_username(identifier)
    if user:
        return user
    
    # If not found by username, try by email
    return find_user_by_email(identifier)

def verify_user(email):
    email_hash = hash_email(email)
    return users.update_one({"email_hash": email_hash}, {"$set": {"isVerified": True}})

def update_password(email, hashed_password):
    email_hash = hash_email(email)
    return users.update_one({"email_hash": email_hash}, {"$set": {"password": hashed_password}})

# OTPs
def store_otp(email, otp_code, purpose="verify"):
    # store OTP with expiry (5 minutes)
    email_hash = hash_email(email)
    doc = {
        "email_hash": email_hash,
        "otp": otp_code,
        "purpose": purpose,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }
    return otps.insert_one(doc)

def get_valid_otp(email, otp_code, purpose="verify"):
    email_hash = hash_email(email)
    doc = otps.find_one({
        "email_hash": email_hash,
        "otp": otp_code,
        "purpose": purpose,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    return doc

def delete_otps_for_email(email, purpose=None):
    email_hash = hash_email(email)
    query = {"email_hash": email_hash}
    if purpose:
        query["purpose"] = purpose
    return otps.delete_many(query)

# Resumes and analysis
def store_resume(email, resume_text, analysis_text):
    email_hash = hash_email(email)
    doc = {
        "email_hash": email_hash,
        "resume_text": resume_text,
        "analysis": analysis_text,
        "created_at": datetime.utcnow()
    }
    return resumes.insert_one(doc)

def get_resume_by_id(resume_id):
    return resumes.find_one({"_id": ObjectId(resume_id)})

# Cover letters
def store_cover_letter(email, job_title, cover_letter_text, accepted=False):
    email_hash = hash_email(email)
    doc = {
        "email_hash": email_hash,
        "job_title": job_title,
        "cover_letter": cover_letter_text,
        "accepted": accepted,
        "created_at": datetime.utcnow()
    }
    return cover_letters.insert_one(doc)

def accept_cover_letter(cover_letter_id):
    return cover_letters.update_one({"_id": ObjectId(cover_letter_id)}, {"$set": {"accepted": True}})

# OAuth-related functions
def find_user_by_oauth_provider(provider, provider_user_id):
    """Find user by OAuth provider and provider user ID"""
    query = {f"oauth_providers.{provider}.id": str(provider_user_id)}
    return users.find_one(query)

def update_user_oauth_data(email, provider, oauth_data):
    """Update user's OAuth provider data"""
    email_hash = hash_email(email)
    
    oauth_provider_data = {
        **oauth_data,
        "linked_at": datetime.utcnow()
    }
    
    # Update user document with OAuth provider data
    update_doc = {
        f"oauth_providers.{provider}": oauth_provider_data,
        "last_login": datetime.utcnow()
    }
    
    # Add provider to login_methods if not already present
    user = users.find_one({"email_hash": email_hash})
    if user:
        login_methods = user.get("login_methods", ["email"])
        if provider not in login_methods:
            login_methods.append(provider)
            update_doc["login_methods"] = login_methods
    
    return users.update_one(
        {"email_hash": email_hash},
        {"$set": update_doc}
    )

def create_user_with_oauth(user_data, provider, oauth_data):
    """Create a new user with OAuth provider data"""
    # Hash the email before storing and remove plain email for privacy
    if "email" in user_data:
        user_data["email_hash"] = hash_email(user_data["email"])
        # Remove plain email for privacy - only store hash
        del user_data["email"]
    
    # Store lowercase username for case-insensitive uniqueness checking
    if "username" in user_data:
        user_data["username_lower"] = user_data["username"].lower()
    
    # Add OAuth provider data
    user_data["oauth_providers"] = {
        provider: {
            **oauth_data,
            "linked_at": datetime.utcnow()
        }
    }
    
    # Set authentication method info
    user_data["primary_auth_method"] = provider
    user_data["login_methods"] = [provider]
    user_data["created_at"] = datetime.utcnow()
    user_data["last_login"] = datetime.utcnow()
    
    return users.insert_one(user_data)
