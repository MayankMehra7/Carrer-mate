import datetime
import random, string, secrets
import logging

logger = logging.getLogger(__name__)

# ---------- USER MANAGEMENT ----------

def get_user(mongo, email):
    from db import hash_email
    email_hash = hash_email(email)
    # mongo is the database object, not the client
    return mongo.users.find_one({"email_hash": email_hash})

def get_user_by_username(mongo, username):
    return mongo.users.find_one({"username_lower": username.lower()})

def get_user_by_oauth_provider(mongo, provider, provider_user_id):
    """Get user by OAuth provider and provider user ID"""
    query = {f"oauth_providers.{provider}.id": provider_user_id}
    return mongo.users.find_one(query)

def link_oauth_provider(mongo, user_email, provider, oauth_data):
    """Link an OAuth provider to an existing user account"""
    from db import hash_email
    email_hash = hash_email(user_email)
    
    oauth_provider_data = {
        **oauth_data,
        "linked_at": datetime.datetime.utcnow()
    }
    
    # Update user document with OAuth provider data
    update_doc = {
        f"oauth_providers.{provider}": oauth_provider_data,
        "last_login": datetime.datetime.utcnow()
    }
    
    # Add provider to login_methods if not already present
    user = mongo.users.find_one({"email_hash": email_hash})
    if user and provider not in user.get("login_methods", []):
        update_doc["$addToSet"] = {"login_methods": provider}
    
    return mongo.users.update_one(
        {"email_hash": email_hash},
        {"$set": update_doc}
    )

def unlink_oauth_provider(mongo, user_email, provider):
    """Unlink an OAuth provider from a user account"""
    from db import hash_email
    email_hash = hash_email(user_email)
    
    # Remove OAuth provider data and update login methods
    return mongo.users.update_one(
        {"email_hash": email_hash},
        {
            "$unset": {f"oauth_providers.{provider}": ""},
            "$pull": {"login_methods": provider}
        }
    )

def update_user_last_login(mongo, user_email):
    """Update user's last login timestamp"""
    from db import hash_email
    email_hash = hash_email(user_email)
    
    return mongo.users.update_one(
        {"email_hash": email_hash},
        {"$set": {"last_login": datetime.datetime.utcnow()}}
    )

def create_user(mongo, name, username, email, password=None, oauth_provider=None, oauth_data=None):
    user_doc = {
        "name": name,
        "username": username,
        "username_lower": username.lower(),  # Store lowercase for case-insensitive uniqueness
        "email": email,
        "created_at": datetime.datetime.utcnow(),
        "oauth_providers": {},
        "primary_auth_method": "email",
        "login_methods": ["email"],
        "last_login": datetime.datetime.utcnow()
    }
    
    # Add password if provided (for email-based registration)
    if password:
        user_doc["password"] = password
    
    # Add OAuth provider data if provided
    if oauth_provider and oauth_data:
        user_doc["oauth_providers"][oauth_provider] = {
            **oauth_data,
            "linked_at": datetime.datetime.utcnow()
        }
        user_doc["primary_auth_method"] = oauth_provider
        user_doc["login_methods"] = [oauth_provider]
        
        # For OAuth-only users, password is optional
        if not password:
            user_doc["login_methods"] = [oauth_provider]
    
    mongo.users.insert_one(user_doc)

# ---------- OTP + PENDING USER ----------

def generate_otp(mongo, email):
    otp = "".join(random.choices(string.digits, k=6))
    expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    mongo.otps.update_one({"email": email}, {"$set": {"otp": otp, "expiry": expiry}}, upsert=True)
    return otp

def verify_otp(mongo, email, otp):
    record = mongo.otps.find_one({"email": email})
    if record and record["otp"] == otp and record["expiry"] > datetime.datetime.utcnow():
        mongo.otps.delete_one({"email": email})
        return True
    return False

def store_pending_user(mongo, data):
    """Stores temporary signup data until OTP verified."""
    email = data["email"]
    mongo.pending_users.update_one({"email": email}, {"$set": {
        **data,
        "created_at": datetime.datetime.utcnow(),
        "expires_at": datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    }}, upsert=True)

def get_pending_user(mongo, email):
    return mongo.pending_users.find_one({"email": email})

def delete_pending_user(mongo, email):
    mongo.pending_users.delete_one({"email": email})

def cleanup_expired_pending_users(mongo):
    """Remove unverified users after expiry (10 min default)."""
    now = datetime.datetime.utcnow()
    result = mongo.pending_users.delete_many({"expires_at": {"$lt": now}})
    return result.deleted_count

# ---------- TOKENS ----------

def create_token(mongo, email):
    token = secrets.token_hex(16)
    expiry = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    mongo.tokens.update_one({"email": email}, {"$set": {"token": token, "expiry": expiry}}, upsert=True)
    return token

def verify_token(mongo, token):
    record = mongo.tokens.find_one({"token": token})
    if record and record["expiry"] > datetime.datetime.utcnow():
        return record["email"]
    return None

# ---------- OAUTH SESSION MANAGEMENT ----------

def create_oauth_session(mongo, user_id, provider, provider_user_id, access_token, refresh_token=None, expires_at=None, scopes=None, expires_in=3600, client_info=None):
    """Create or update OAuth session for a user with enhanced security and session management"""
    from utils.oauth_session_manager import OAuthSessionManager
    
    try:
        # Initialize session manager - mongo is the database object
        session_manager = OAuthSessionManager(mongo)
        
        # Create session with comprehensive tracking
        session = session_manager.create_session(
            user_id=user_id,
            provider=provider,
            provider_user_id=provider_user_id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            scopes=scopes,
            client_info=client_info
        )
        
        logger.info(f"OAuth session created with session manager for user {user_id}, provider {provider}")
        return session
        
    except Exception as e:
        logger.error(f"Error creating OAuth session: {str(e)}")
        raise

def get_oauth_session(mongo, user_id, provider):
    """Get OAuth session for a user and provider with enhanced session management"""
    from utils.oauth_session_manager import OAuthSessionManager
    
    try:
        # Initialize session manager - mongo is the database object
        session_manager = OAuthSessionManager(mongo)
        
        # Get session with automatic expiration handling
        session = session_manager.get_session(user_id, provider)
        
        return session
        
    except Exception as e:
        logger.error(f"Error getting OAuth session: {str(e)}")
        return None

def update_oauth_session_usage(mongo, user_id, provider):
    """Update last_used timestamp for OAuth session"""
    return mongo.oauth_sessions.update_one(
        {"user_id": user_id, "provider": provider},
        {"$set": {"last_used": datetime.datetime.utcnow()}}
    )

def delete_oauth_session(mongo, user_id, provider):
    """Delete OAuth session for a user and provider with enhanced session management"""
    from utils.oauth_session_manager import OAuthSessionManager
    
    try:
        # Initialize session manager - mongo is the database object
        session_manager = OAuthSessionManager(mongo)
        
        # Get the session first
        session = session_manager.get_session(user_id, provider)
        if not session:
            return None
        
        # Revoke the session securely
        result = session_manager.revoke_session(session['_id'], 'user_logout')
        
        logger.info(f"OAuth session deleted for user {user_id}, provider {provider}")
        return result
        
    except Exception as e:
        logger.error(f"Error deleting OAuth session: {str(e)}")
        raise

def cleanup_expired_oauth_sessions(mongo):
    """Remove expired OAuth sessions using session manager"""
    from utils.oauth_session_manager import OAuthSessionManager
    
    try:
        # Initialize session manager - mongo is the database object
        session_manager = OAuthSessionManager(mongo)
        
        # Cleanup expired sessions
        expired_count = session_manager.cleanup_expired_sessions()
        
        # Also cleanup old inactive sessions (older than 30 days)
        old_count = session_manager.cleanup_old_sessions(days_old=30)
        
        logger.info(f"OAuth session cleanup: {expired_count} expired, {old_count} old sessions removed")
        return expired_count + old_count
        
    except Exception as e:
        logger.error(f"Error during OAuth session cleanup: {str(e)}")
        return 0

def get_user_oauth_sessions(mongo, user_id):
    """Get all active OAuth sessions for a user with enhanced session management"""
    from utils.oauth_session_manager import OAuthSessionManager
    
    try:
        # Initialize session manager - mongo is the database object
        session_manager = OAuthSessionManager(mongo)
        
        # Get user sessions with automatic expiration handling
        sessions = session_manager.get_user_sessions(user_id, active_only=True)
        
        return sessions
        
    except Exception as e:
        logger.error(f"Error getting user OAuth sessions: {str(e)}")
        return []

def validate_oauth_token(mongo, user_id, provider, token):
    """Validate an OAuth token against stored hash"""
    from utils.oauth_token_security import token_security_manager
    
    try:
        # Get the session
        session = get_oauth_session(mongo, user_id, provider)
        if not session:
            return False
        
        # Verify token hash
        stored_hash = session.get("access_token_hash")
        if not stored_hash:
            return False
        
        return token_security_manager.verify_token_hash(token, stored_hash, provider)
        
    except Exception as e:
        logger.error(f"Error validating OAuth token: {str(e)}")
        return False

def refresh_oauth_token(mongo, user_id, provider, new_access_token, new_refresh_token=None, expires_in=3600):
    """Refresh OAuth token with enhanced session management"""
    from utils.oauth_session_manager import OAuthSessionManager
    
    try:
        # Initialize session manager - mongo is the database object
        session_manager = OAuthSessionManager(mongo)
        
        # Get existing session
        session = session_manager.get_session(user_id, provider)
        if not session:
            raise ValueError("No existing OAuth session found")
        
        # Refresh the session
        result = session_manager.refresh_session(
            session_id=session['_id'],
            new_access_token=new_access_token,
            new_refresh_token=new_refresh_token,
            expires_in=expires_in
        )
        
        logger.info(f"OAuth token refreshed for user {user_id}, provider {provider}")
        return result
        
    except Exception as e:
        logger.error(f"Error refreshing OAuth token: {str(e)}")
        raise

def log_oauth_activity(mongo, user_id, action, provider, details=None, session_id=None, ip_address=None, user_agent=None):
    """Log OAuth activity for audit purposes"""
    from utils.oauth_session_manager import OAuthAuditLogger
    
    try:
        # Initialize audit logger - mongo is the database object
        audit_logger = OAuthAuditLogger(mongo)
        
        # Log the OAuth event
        audit_logger.log_oauth_event(
            user_id=user_id,
            action=action,
            provider=provider,
            details=details,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
    except Exception as e:
        logger.error(f"Error logging OAuth activity: {str(e)}")

def get_oauth_audit_log(mongo, user_id, limit=100):
    """Get OAuth audit log for a user"""
    from utils.oauth_session_manager import OAuthAuditLogger
    
    try:
        # Initialize audit logger - mongo is the database object
        audit_logger = OAuthAuditLogger(mongo)
        
        # Get audit log entries
        return audit_logger.get_user_audit_log(user_id, limit)
        
    except Exception as e:
        logger.error(f"Error getting OAuth audit log: {str(e)}")
        return []

def get_oauth_session_statistics(mongo, user_id=None):
    """Get OAuth session statistics"""
    from utils.oauth_session_manager import OAuthSessionManager
    
    try:
        # Initialize session manager - mongo is the database object
        session_manager = OAuthSessionManager(mongo)
        
        # Get session statistics
        return session_manager.get_session_statistics(user_id)
        
    except Exception as e:
        logger.error(f"Error getting OAuth session statistics: {str(e)}")
        return {}

# ---------- AI FUNCTIONS ----------

import google.generativeai as genai
import os

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def analyze_resume_text(resume_text):
    """
    Use Gemini AI to analyze resume and provide detailed feedback.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""
        Please analyze the following resume and provide detailed, constructive feedback:

        RESUME:
        {resume_text}

        Please provide feedback on:
        1. Overall structure and formatting
        2. Content quality and relevance
        3. Skills and experience presentation
        4. Areas for improvement
        5. Strengths to highlight
        6. Missing sections or information
        7. ATS (Applicant Tracking System) optimization suggestions

        Provide specific, actionable advice in a professional tone.
        """
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        # Fallback to basic analysis
        word_count = len(resume_text.split())
        return f"Resume analysis completed. Word count: {word_count}. For detailed AI analysis, please check your API configuration."

def generate_cover_letter(resume_text, job_description, user_name="Candidate"):
    """
    Use Gemini AI to generate a personalized cover letter.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""
        Generate a professional, personalized cover letter based on the following:

        CANDIDATE NAME: {user_name}
        
        RESUME:
        {resume_text}
        
        JOB DESCRIPTION:
        {job_description}

        Requirements:
        1. Make it professional and engaging
        2. Highlight relevant skills and experience from the resume that match the job requirements
        3. Show enthusiasm for the specific role and company
        4. Keep it concise (3-4 paragraphs)
        5. Include specific examples from the resume when possible
        6. Tailor the language to match the job posting tone
        7. End with a strong call to action

        Generate a complete cover letter ready to send.
        """
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"Cover Letter Generation Error: {e}")
        # Fallback to basic template
        return f"""Dear Hiring Manager,

I am writing to express my strong interest in the position you have posted. Based on my background and experience outlined in my resume, I believe I would be a valuable addition to your team.

My experience and skills align well with your requirements, and I am excited about the opportunity to contribute to your organization.

Thank you for considering my application. I look forward to hearing from you.

Sincerely,
{user_name}"""

def suggest_resume_improvements(resume_text, job_description):
    """
    Use Gemini AI to suggest resume improvements based on a specific job description.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""
        Compare this resume against the job description and suggest specific improvements:

        CURRENT RESUME:
        {resume_text}
        
        TARGET JOB DESCRIPTION:
        {job_description}

        Please provide:
        1. Keywords from the job description that should be added to the resume
        2. Skills that should be emphasized more
        3. Experience that should be highlighted or reworded
        4. Sections that could be improved or added
        5. Specific phrases or terminology to include
        6. Format or structure improvements for this type of role

        Provide actionable, specific suggestions that will help this resume better match the job requirements.
        """
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"Resume Improvement Error: {e}")
        return "Unable to generate resume improvement suggestions at this time. Please check your AI configuration."