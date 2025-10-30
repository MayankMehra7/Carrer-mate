# --- Imports (Merged) ---
from flask import Blueprint, request, jsonify, session, current_app
from config import mail, MAIL_USERNAME  # mail is initialized in run.py
from db import (
    create_user, find_user_by_email, find_user_by_username, find_user_by_email_or_username, 
    store_otp, get_valid_otp, delete_otps_for_email,
    store_resume, store_cover_letter, accept_cover_letter, update_password, verify_user,
    resumes, cover_letters  # Import the collections
)
from config import db as mongo  # Import db as mongo for compatibility
from utils.helpers import sanitize_text, send_email # Merged helpers
from utils.password_validator import validate_password, PasswordValidationError # Password validation
from utils.rate_limiter import rate_limit # Rate limiting
from utils.google_oauth_service import google_oauth_service # Google OAuth service
from utils.github_oauth_service import github_oauth_service # GitHub OAuth service
from utils.oauth_errors import (
    OAuthException, OAuthErrorType, OAuthErrorHandler, AccountConflictException,
    InvalidTokenException, ProviderUnavailableException, handle_oauth_errors
)
from models import (
    analyze_resume_text, generate_cover_letter, suggest_resume_improvements, # From File 1
    get_user, get_user_by_username, generate_otp, verify_otp, # From File 2
    store_pending_user, get_pending_user, delete_pending_user,
    create_user as create_user_from_model, # Aliased to avoid conflict
    create_token, get_user_by_oauth_provider, link_oauth_provider, create_oauth_session,
    update_user_last_login
)
from flask_mail import Message
import bcrypt
import random
import io
import datetime # Added for File 2 logic
import logging

logger = logging.getLogger(__name__)

# --- Blueprint 1 (bp) from File 1 ---
bp = Blueprint("api", __name__)

def send_mail(to_email, subject, html_or_text):
    """Uses flask_mail to send an email."""
    try:
        msg = Message(subject=subject, sender=current_app.config.get("MAIL_USERNAME"), recipients=[to_email])
        msg.body = html_or_text
        mail.send(msg)
        return True
    except Exception as e:
        print("Mail send error:", e)
        return False

# Signup: receive name, username, email, password
@bp.route("/signup", methods=["POST"])
@rate_limit(limit=5, window=300)  # 5 signup attempts per 5 minutes
def signup():
    try:
        data = request.json or request.form
        
        # Requirements 5.1, 5.2: Use Pydantic schema for comprehensive validation
        from schemas import UserCreate, validate_user_create_data
        
        try:
            # Validate using Pydantic schema with comprehensive password validation
            user_data = validate_user_create_data(data)
            name = user_data.name
            username = user_data.username
            email = str(user_data.email)
            password = user_data.password
            
        except ValueError as e:
            # Requirement 5.2: Return HTTP 422 with detailed error messages
            logger.info(f"User validation failed: {str(e)}")
            return jsonify({
                "error": "Validation failed",
                "details": [str(e)]
            }), 422

        logger.info(f"Signup attempt - Name: {name}, Username: {username}, Email: {email}")

        # Check if email already exists
        existing_email_user = find_user_by_email(email)
        if existing_email_user:
            logger.info(f"Email already exists: {email}")
            return jsonify({"error": "Email already exists"}), 400
        
        # Check if username already exists (case-insensitive)
        existing_username_user = find_user_by_username(username)
        if existing_username_user:
            logger.info(f"Username already exists: {username} (case-insensitive)")
            return jsonify({"error": "Username already exists"}), 400

        logger.info("Creating new user...")
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        # Store user with temporary email for verification process
        user_doc = {"name": name, "username": username, "email": email, "password": hashed, "isVerified": False, "temp_email": email}
        create_user(user_doc)

        logger.info("Generating and sending OTP...")
        otp = str(random.randint(100000, 999999))
        # Store OTP with actual email for sending
        from db import otps, hash_email
        email_hash = hash_email(email)
        otp_doc = {
            "email_hash": email_hash,
            "temp_email": email,  # Temporary for email sending
            "otp": otp,
            "purpose": "verify",
            "created_at": datetime.datetime.utcnow(),
            "expires_at": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
        }
        otps.insert_one(otp_doc)
        
        mail_sent = send_mail(email, "CareerMate - Verify your email", f"Your verification OTP is: {otp}")
        if not mail_sent:
            logger.error("Failed to send email")
            return jsonify({"error": "Failed to send verification email"}), 500

        logger.info("Signup successful, OTP sent")
        return jsonify({"message": "OTP sent to email"}), 200

    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Signup failed: {str(e)}"}), 500

@bp.route("/verify-otp", methods=["POST"])
def verify_otp_route():
    data = request.json or request.form
    email = data.get("email")
    otp = data.get("otp")
    if not email or not otp:
        return jsonify({"error": "Missing"}), 400

    # Find OTP record with temp_email for verification
    from db import otps, hash_email, users
    email_hash = hash_email(email)
    
    valid_otp = otps.find_one({
        "email_hash": email_hash,
        "otp": otp,
        "purpose": "verify",
        "expires_at": {"$gt": datetime.datetime.utcnow()}
    })
    
    if not valid_otp:
        return jsonify({"error": "Invalid or expired OTP"}), 400

    # Verify user and clean up temporary email fields
    users.update_one(
        {"email_hash": email_hash}, 
        {
            "$set": {"isVerified": True},
            "$unset": {"temp_email": ""}
        }
    )
    
    # Clean up OTP records
    otps.delete_many({"email_hash": email_hash, "purpose": "verify"})
    
    return jsonify({"message": "Email verified. You may now login."}), 200

@bp.route("/login", methods=["POST"])
def login():
    data = request.json or request.form
    identifier = data.get("email") or data.get("username") or data.get("identifier")
    password = data.get("password")
    if not identifier or not password:
        return jsonify({"error": "Missing email/username or password"}), 400

    user = find_user_by_email_or_username(identifier)
    if not user or not user.get("isVerified"):
        return jsonify({"error": "Invalid credentials or account not verified"}), 400

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 400

    # Save minimal session info (we'll store email hash for session management)
    session["user_email_hash"] = user.get("email_hash")
    session["user_name"] = user.get("name")
    session["username"] = user.get("username")
    
    return jsonify({
        "message": "Login successful", 
        "user": {
            "name": user.get("name"),
            "username": user.get("username")
        }
    }), 200

@bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

# Forgot password: send OTP (requires both username and email for security)
@bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json or request.form
    username = data.get("username")
    email = data.get("email")
    
    if not username or not email:
        return jsonify({"error": "Both username and email are required for password reset"}), 400
    
    # Verify that the username and email belong to the same user
    user_by_username = find_user_by_username(username)
    user_by_email = find_user_by_email(email)
    
    if not user_by_username or not user_by_email:
        return jsonify({"error": "Invalid username or email"}), 404
    
    # Check if they're the same user
    if user_by_username["_id"] != user_by_email["_id"]:
        return jsonify({"error": "Username and email do not match"}), 400

    otp = str(random.randint(100000, 999999))
    
    # Store OTP with temporary email for sending
    from db import otps, hash_email
    email_hash = hash_email(email)
    otp_doc = {
        "email_hash": email_hash,
        "temp_email": email,  # Temporary for email sending
        "otp": otp,
        "purpose": "reset",
        "created_at": datetime.datetime.utcnow(),
        "expires_at": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    }
    otps.insert_one(otp_doc)
    
    send_mail(email, "CareerMate - Password Reset OTP", f"Your password reset OTP is: {otp}")
    
    return jsonify({
        "message": "OTP sent to email",
        "email": email  # Return email for the reset password step
    }), 200

# Verify reset OTP and set new password
@bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.json or request.form
    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("new_password")
    if not (email and otp and new_password):
        return jsonify({"error": "Missing fields"}), 400

    # Find OTP record for password reset
    from db import otps, hash_email, users
    email_hash = hash_email(email)
    
    valid_otp = otps.find_one({
        "email_hash": email_hash,
        "otp": otp,
        "purpose": "reset",
        "expires_at": {"$gt": datetime.datetime.utcnow()}
    })
    
    if not valid_otp:
        return jsonify({"error": "Invalid or expired OTP"}), 400

    # Get user info for password validation
    user = users.find_one({"email_hash": email_hash})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Requirements 5.1, 5.2: Validate new password with user context using Pydantic
    # Requirement 5.4: Ensure validation cannot be bypassed
    from schemas import validate_password_only
    
    validation_result = validate_password_only(new_password, user.get("username"), email)
    if not validation_result.is_valid:
        # Requirement 5.4: Sanitize log messages to prevent password exposure
        logger.info(f"Password validation failed for password reset: {len(validation_result.errors)} validation errors")
        # Requirement 5.2: Return HTTP 422 with detailed error messages
        return jsonify({
            "error": "Password validation failed",
            "details": validation_result.errors,
            "requirements": validation_result.requirements
        }), 422

    hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    users.update_one({"email_hash": email_hash}, {"$set": {"password": hashed}})
    
    # Clean up OTP records and temporary email
    otps.delete_many({"email_hash": email_hash, "purpose": "reset"})
    return jsonify({"message": "Password updated. Please login."}), 200

# Upload resume (accept text in JSON) -> analyze and store
@bp.route("/upload_resume", methods=["POST"])
def upload_resume():
    data = request.json or {}
    resume_text = data.get("resume_text")
    email = data.get("email") or session.get("user_email")
    if not resume_text or not email:
        return jsonify({"error": "Missing resume_text or email"}), 400

    analysis = analyze_resume_text(resume_text)
    store_resume(email, sanitize_text(resume_text), analysis)
    return jsonify({"feedback": analysis}), 200

# Generate cover letter -> store
@bp.route("/generate_cover_letter", methods=["POST"])
def gen_cover_letter():
    data = request.json or {}
    resume_text = data.get("resume_text")
    jd_text = data.get("job_description")
    user_name = data.get("name") or session.get("user_name", "Candidate")
    email = data.get("email") or session.get("user_email")
    if not (resume_text and jd_text and email):
        return jsonify({"error": "Missing fields"}), 400

    cover_letter = generate_cover_letter(resume_text, jd_text, user_name)
    # store with job title (if provided)
    job_title = data.get("job_title", "Unknown")
    res = store_cover_letter(email, job_title, cover_letter)
    return jsonify({"cover_letter": cover_letter, "cover_id": str(res.inserted_id)}), 200

# Accept cover letter (user accepts -> mark in DB)
@bp.route("/accept_cover_letter", methods=["POST"])
def accept_letter():
    data = request.json or {}
    cover_id = data.get("cover_id")
    if not cover_id:
        return jsonify({"error": "Missing cover_id"}), 400
    accept_cover_letter(cover_id)
    return jsonify({"message": "Cover letter accepted"}), 200

# Extract text from uploaded file
@bp.route("/extract_file_text", methods=["POST"])
def extract_file_text():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    try:
        import fitz  # PyMuPDF
        import io
        
        # Read file content
        file_content = file.read()
        file_extension = file.filename.lower().split('.')[-1]
        
        extracted_text = ""
        
        if file_extension == 'pdf':
            # Extract text from PDF
            pdf_document = fitz.open(stream=file_content, filetype="pdf")
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                extracted_text += page.get_text() + "\n"
            pdf_document.close()
            
        elif file_extension == 'txt':
            # Handle text files
            extracted_text = file_content.decode('utf-8')
            
        elif file_extension in ['doc', 'docx']:
            # For Word documents, we'll need python-docx
            return jsonify({"error": "Word document processing not yet implemented. Please copy and paste the text manually."}), 400
            
        else:
            return jsonify({"error": f"Unsupported file type: {file_extension}"}), 400
        
        if not extracted_text.strip():
            return jsonify({"error": "No text could be extracted from the file"}), 400
            
        return jsonify({
            "text": extracted_text.strip(),
            "filename": file.filename,
            "message": "Text extracted successfully"
        }), 200
        
    except Exception as e:
        print(f"File extraction error: {e}")
        return jsonify({"error": f"Failed to extract text from file: {str(e)}"}), 500

# Get user's stored resume
@bp.route("/get_resume", methods=["GET"])
def get_user_resume():
    email = request.args.get("email") or session.get("user_email")
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    # Import hash function
    from db import hash_email
    email_hash = hash_email(email)
    
    # Get the most recent resume for this user
    resume = resumes.find_one({"email_hash": email_hash}, sort=[("created_at", -1)])
    if not resume:
        return jsonify({"error": "No resume found"}), 404
    
    return jsonify({
        "resume_text": resume["resume_text"],
        "analysis": resume.get("analysis", ""),
        "created_at": resume["created_at"].isoformat()
    }), 200

# Generate cover letter from stored resume + new JD
@bp.route("/generate_cover_from_stored", methods=["POST"])
def generate_cover_from_stored():
    data = request.json or {}
    job_description = data.get("job_description")
    email = data.get("email") or session.get("user_email")
    user_name = data.get("name") or session.get("user_name", "Candidate")
    
    if not job_description or not email:
        return jsonify({"error": "Missing job_description or email"}), 400
    
    # Import hash function
    from db import hash_email
    email_hash = hash_email(email)
    
    # Get the most recent resume for this user
    resume = resumes.find_one({"email_hash": email_hash}, sort=[("created_at", -1)])
    if not resume:
        return jsonify({"error": "No resume found. Please upload a resume first."}), 404
    
    resume_text = resume["resume_text"]
    
    # Generate cover letter
    cover_letter = generate_cover_letter(resume_text, job_description, user_name)
    
    # Generate resume improvement suggestions
    suggestions = suggest_resume_improvements(resume_text, job_description)
    
    # Store cover letter
    job_title = data.get("job_title", "Position from Job Description")
    res = store_cover_letter(email, job_title, cover_letter)
    
    return jsonify({
        "cover_letter": cover_letter,
        "resume_suggestions": suggestions,
        "cover_id": str(res.inserted_id)
    }), 200

# Get AI suggestions for specific resume sections
@bp.route("/get_ai_suggestions", methods=["POST"])
def get_ai_suggestions():
    data = request.json or {}
    section = data.get("section", "general")
    resume_text = data.get("resume_text", "")
    email = data.get("email") or session.get("user_email")
    
    if not resume_text:
        return jsonify({"error": "Resume text is required"}), 400
    
    try:
        from models import genai
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""
        As a professional resume expert, provide specific, actionable suggestions to improve the {section} section of this resume:

        CURRENT RESUME:
        {resume_text}

        Please provide:
        1. Specific improvements for the {section} section
        2. Better wording suggestions
        3. Missing elements that should be added
        4. Industry best practices for this section
        5. ATS optimization tips

        Focus only on the {section} section and provide concrete, implementable advice.
        """
        
        response = model.generate_content(prompt)
        return jsonify({
            "suggestions": response.text,
            "section": section
        }), 200
        
    except Exception as e:
        print(f"AI Suggestions Error: {e}")
        return jsonify({"error": "Failed to generate AI suggestions"}), 500

# Check username/email availability for signup validation
@bp.route("/check-availability", methods=["POST"])
def check_availability():
    data = request.json or {}
    field_type = data.get("type")  # 'username' or 'email'
    field_value = data.get("value")
    
    if not field_type or not field_value:
        return jsonify({"error": "Missing type or value"}), 400
    
    if field_type not in ["username", "email"]:
        return jsonify({"error": "Invalid type. Must be 'username' or 'email'"}), 400
    
    try:
        if field_type == "email":
            # Check if email exists using the hashed email lookup
            existing_user = find_user_by_email(field_value)
            available = existing_user is None
        elif field_type == "username":
            # Check if username exists (case-insensitive)
            from db import users
            existing_user = users.find_one({"username_lower": field_value.lower()})
            available = existing_user is None
        
        return jsonify({
            "available": available,
            "message": f"{field_type.capitalize()} is {'available' if available else 'already taken'}"
        }), 200
        
    except Exception as e:
        print(f"Availability check error: {e}")
        return jsonify({"error": "Failed to check availability"}), 500

# Password validation testing endpoint (Requirements 5.1, 5.2)
@bp.route("/validate-password", methods=["POST"])
@rate_limit(limit=20, window=60)  # 20 password validation attempts per minute
def validate_password_endpoint():
    """
    Optional endpoint for testing password validation without creating accounts.
    Allows frontend to validate passwords and provide real-time feedback.
    
    Requirements:
    - 5.1: Backend validation implementation
    - 5.2: Detailed error messages in HTTP 422 responses
    - 6.1, 6.4: Detailed error messages and user-friendly language
    """
    try:
        data = request.json or request.form
        
        # Use Pydantic schema for validation
        from schemas import PasswordValidationRequest, validate_password_only
        
        try:
            # Validate request data
            request_data = PasswordValidationRequest(**data)
            password = request_data.password
            username = request_data.username or ""
            email = str(request_data.email) if request_data.email else ""
            
        except ValueError as e:
            return jsonify({"error": f"Invalid request: {str(e)}"}), 400
        
        # Validate password and get detailed response
        validation_result = validate_password_only(password, username, email)
        
        if not validation_result.is_valid:
            # Return detailed validation errors with requirement status
            return jsonify({
                "valid": False,
                "errors": validation_result.errors,
                "requirements": validation_result.requirements,
                "hibp_checked": validation_result.hibp_checked,
                "hibp_error": validation_result.hibp_error,
                "message": "Password does not meet security requirements"
            }), 422
        
        return jsonify({
            "valid": True,
            "requirements": validation_result.requirements,
            "hibp_checked": validation_result.hibp_checked,
            "message": "Password meets all security requirements"
        }), 200
        
    except Exception as e:
        logger.error(f"Password validation endpoint error: {e}")
        return jsonify({"error": "Password validation failed"}), 500

# Security audit endpoint for development/testing (Requirements 5.1, 5.2, 5.4)
@bp.route("/security-audit", methods=["GET"])
def security_audit():
    """
    Development endpoint for security audit of password validation system.
    Requirements:
    - 5.4: Security review of validation bypass prevention
    """
    try:
        from utils.password_validator import perform_security_audit
        
        # Only allow in development environment
        if current_app.config.get('ENV') != 'development':
            return jsonify({"error": "Security audit only available in development"}), 403
        
        audit_results = perform_security_audit()
        
        return jsonify({
            "audit": audit_results,
            "message": "Security audit completed"
        }), 200
        
    except Exception as e:
        logger.error(f"Security audit error: {e}")
        return jsonify({"error": "Security audit failed"}), 500

# Google OAuth authentication endpoint
@bp.route("/oauth/google", methods=["POST"])
@rate_limit(limit=10, window=300)  # 10 OAuth attempts per 5 minutes
@handle_oauth_errors
def google_oauth():
    """
    Google OAuth authentication endpoint
    
    Validates Google OAuth token, creates or updates user account,
    and returns session data.
    
    Requirements: 1.2, 1.3, 1.4
    """
    data = request.json or {}
    token = data.get("token")
    
    if not token:
        raise OAuthException(
            OAuthErrorType.INVALID_TOKEN,
            message="Google OAuth token is required",
            details={"provider": "google"}
        )
    
    # Validate provider
    OAuthErrorHandler.validate_provider("google")
    
    # Validate token using Google OAuth service
    user_profile = google_oauth_service.sign_in(token)
    
    email = user_profile['email']
    google_id = user_profile['id']
    name = user_profile.get('name', '')
    picture = user_profile.get('picture', '')
    
    # Check if user already exists with this Google account
    existing_oauth_user = get_user_by_oauth_provider(mongo, 'google', google_id)
    
    if existing_oauth_user:
        # User exists with this Google account - sign them in
        user = existing_oauth_user
        logger.info(f"Existing Google OAuth user signed in: {email}")
    else:
        # Check if user exists with this email (for account linking)
        existing_email_user = find_user_by_email(email)
        
        if existing_email_user:
            # Check for account conflict and handle appropriately
            OAuthErrorHandler.check_account_conflict(email, existing_email_user, 'google')
            
            # Link Google account to existing user
            oauth_data = {
                'id': google_id,
                'email': email,
                'name': name,
                'picture': picture
            }
            
            link_oauth_provider(mongo, email, 'google', oauth_data)
            user = find_user_by_email(email)  # Get updated user
            logger.info(f"Google account linked to existing user: {email}")
        else:
            # Create new user with Google OAuth
            oauth_data = {
                'id': google_id,
                'email': email,
                'name': name,
                'picture': picture
            }
            
            # Generate username from email or name
            username = email.split('@')[0]
            # Ensure username is unique
            counter = 1
            original_username = username
            while find_user_by_username(username):
                username = f"{original_username}{counter}"
                counter += 1
            
            create_user_from_model(mongo, name, username, email, 
                                 oauth_provider='google', oauth_data=oauth_data)
            user = find_user_by_email(email)
            logger.info(f"New Google OAuth user created: {email}")
    
    # Create OAuth session with secure token handling
    from bson import ObjectId
    user_id = user['_id'] if isinstance(user['_id'], ObjectId) else ObjectId(user['_id'])
    
    # Get token expiration from Google profile (if available)
    expires_in = 3600  # Default 1 hour
    if 'expires_at' in user_profile:
        expires_in = int((user_profile['expires_at'] - datetime.datetime.utcnow()).total_seconds())
    
    create_oauth_session(mongo, user_id, 'google', google_id, token, expires_in=expires_in)
    
    # Update last login
    update_user_last_login(mongo, email)
    
    # Set session data
    session["user_email_hash"] = user.get("email_hash")
    session["user_name"] = user.get("name")
    session["username"] = user.get("username")
    session["oauth_provider"] = "google"
    
    return jsonify({
        "message": "Google OAuth authentication successful",
        "user": {
            "name": user.get("name"),
            "username": user.get("username"),
            "email": email,
            "oauth_providers": user.get("oauth_providers", {}),
            "primary_auth_method": user.get("primary_auth_method", "google")
        }
    }), 200

# GitHub OAuth authentication endpoint
@bp.route("/oauth/github", methods=["POST"])
@rate_limit(limit=10, window=300)  # 10 OAuth attempts per 5 minutes
@handle_oauth_errors
def github_oauth():
    """
    GitHub OAuth authentication endpoint
    
    Validates GitHub authorization code, exchanges for access token,
    creates or updates user account, and returns session data.
    
    Requirements: 2.2, 2.3, 2.4
    """
    data = request.json or {}
    code = data.get("code")
    state = data.get("state")
    
    if not code:
        raise OAuthException(
            OAuthErrorType.INVALID_TOKEN,
            message="GitHub authorization code is required",
            details={"provider": "github"}
        )
    
    # Validate provider
    OAuthErrorHandler.validate_provider("github")
    
    # Exchange code for token and get user profile using GitHub OAuth service
    user_profile = github_oauth_service.sign_in_with_code(code)
    
    github_id = user_profile['id']
    username = user_profile['username']
    email = user_profile.get('email')
    name = user_profile.get('name', username)
    avatar_url = user_profile.get('avatar_url', '')
    access_token = user_profile.get('access_token')
    
    # Validate that we have required data
    if not email:
        raise OAuthException(
            OAuthErrorType.PROVIDER_ERROR,
            message="Email address is required but not available from GitHub. Please make your email public in GitHub settings.",
            details={"provider": "github", "reason": "email_not_available"}
        )
    
    # Check if user already exists with this GitHub account
    existing_oauth_user = get_user_by_oauth_provider(mongo, 'github', github_id)
    
    if existing_oauth_user:
        # User exists with this GitHub account - sign them in
        user = existing_oauth_user
        logger.info(f"Existing GitHub OAuth user signed in: {username}")
    else:
        # Check if user exists with this email (for account linking)
        existing_email_user = find_user_by_email(email)
        
        if existing_email_user:
            # Check for account conflict and handle appropriately
            OAuthErrorHandler.check_account_conflict(email, existing_email_user, 'github')
            
            # Link GitHub account to existing user
            oauth_data = {
                'id': github_id,
                'username': username,
                'email': email,
                'name': name,
                'avatar_url': avatar_url
            }
            
            link_oauth_provider(mongo, email, 'github', oauth_data)
            user = find_user_by_email(email)  # Get updated user
            logger.info(f"GitHub account linked to existing user: {email}")
        else:
            # Create new user with GitHub OAuth
            oauth_data = {
                'id': github_id,
                'username': username,
                'email': email,
                'name': name,
                'avatar_url': avatar_url
            }
            
            # Use GitHub username, but ensure it's unique
            new_username = username
            counter = 1
            while find_user_by_username(new_username):
                new_username = f"{username}{counter}"
                counter += 1
            
            create_user_from_model(mongo, name, new_username, email, 
                                 oauth_provider='github', oauth_data=oauth_data)
            user = find_user_by_email(email)
            logger.info(f"New GitHub OAuth user created: {email}")
    
    # Create OAuth session with secure token handling
    from bson import ObjectId
    user_id = user['_id'] if isinstance(user['_id'], ObjectId) else ObjectId(user['_id'])
    
    # GitHub tokens typically expire in 8 hours
    expires_in = 28800  # 8 hours
    
    create_oauth_session(mongo, user_id, 'github', github_id, access_token, expires_in=expires_in)
    
    # Update last login
    update_user_last_login(mongo, email)
    
    # Set session data
    session["user_email_hash"] = user.get("email_hash")
    session["user_name"] = user.get("name")
    session["username"] = user.get("username")
    session["oauth_provider"] = "github"
    
    return jsonify({
        "message": "GitHub OAuth authentication successful",
        "user": {
            "name": user.get("name"),
            "username": user.get("username"),
            "email": email,
            "oauth_providers": user.get("oauth_providers", {}),
            "primary_auth_method": user.get("primary_auth_method", "github")
        }
    }), 200


# Update primary authentication method endpoint
@bp.route("/oauth/primary-auth", methods=["POST"])
@rate_limit(limit=5, window=300)  # 5 attempts per 5 minutes
def update_primary_auth_method():
    """
    Update user's primary authentication method
    
    Allows users to set their preferred authentication method from
    their available login methods.
    
    Requirements: 4.2, 4.4
    """
    data = request.json or {}
    primary_auth_method = data.get("primary_auth_method")
    
    if not primary_auth_method:
        return jsonify({
            "error": "primary_auth_method is required"
        }), 400
    
    # Validate primary auth method
    valid_methods = ["email", "google", "github"]
    if primary_auth_method not in valid_methods:
        return jsonify({
            "error": f"Invalid primary authentication method. Must be one of: {', '.join(valid_methods)}"
        }), 400
    
    # Get current user from session
    user_email_hash = session.get("user_email_hash")
    if not user_email_hash:
        return jsonify({"error": "Authentication required"}), 401
    
    # Find user by email hash
    users_collection = mongo.db.users
    user = users_collection.find_one({"email_hash": user_email_hash})
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Check if user has access to the requested authentication method
    user_login_methods = user.get("login_methods", ["email"])
    
    if primary_auth_method not in user_login_methods:
        return jsonify({
            "error": f"You don't have {primary_auth_method} authentication enabled. Please link your {primary_auth_method} account first.",
            "available_methods": user_login_methods
        }), 400
    
    # Update primary authentication method
    try:
        result = users_collection.update_one(
            {"email_hash": user_email_hash},
            {
                "$set": {
                    "primary_auth_method": primary_auth_method,
                    "last_login": datetime.datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            return jsonify({"error": "Failed to update primary authentication method"}), 500
        
        # Get updated user data
        updated_user = users_collection.find_one({"email_hash": user_email_hash})
        
        logger.info(f"Primary auth method updated to {primary_auth_method} for user: {user.get('username', 'unknown')}")
        
        return jsonify({
            "message": "Primary authentication method updated successfully",
            "user": {
                "name": updated_user.get("name"),
                "username": updated_user.get("username"),
                "email": updated_user.get("email"),
                "oauth_providers": updated_user.get("oauth_providers", {}),
                "primary_auth_method": updated_user.get("primary_auth_method"),
                "login_methods": updated_user.get("login_methods", ["email"])
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating primary auth method: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


# Get user OAuth providers endpoint
@bp.route("/oauth/providers", methods=["GET"])
@rate_limit(limit=20, window=300)  # 20 requests per 5 minutes
def get_user_oauth_providers():
    """
    Get user's OAuth provider information
    
    Returns information about linked OAuth providers for the current user.
    
    Requirements: 4.4, 1.4, 2.4
    """
    # Get current user from session
    user_email_hash = session.get("user_email_hash")
    if not user_email_hash:
        return jsonify({"error": "Authentication required"}), 401
    
    # Find user by email hash
    users_collection = mongo.db.users
    user = users_collection.find_one({"email_hash": user_email_hash})
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Return OAuth provider information
    oauth_providers = user.get("oauth_providers", {})
    
    # Remove sensitive information like tokens
    safe_providers = {}
    for provider, data in oauth_providers.items():
        if data:  # Only include if provider data exists
            safe_providers[provider] = {
                "id": data.get("id"),
                "name": data.get("name"),
                "email": data.get("email"),
                "username": data.get("username"),
                "avatar_url": data.get("avatar_url"),
                "picture": data.get("picture"),
                "linked_at": data.get("linked_at")
            }
    
    return jsonify({
        "providers": safe_providers,
        "primary_auth_method": user.get("primary_auth_method", "email"),
        "login_methods": user.get("login_methods", ["email"])
    }), 200


# --- Blueprint 2 (routes) from File 2 ---
routes = Blueprint("routes", __name__)

# ---------- SIGNUP (Renamed to signup_v2) ----------
@routes.route("/signup", methods=["POST"])
def signup_v2(): # Renamed to avoid conflict with bp.signup
    data = request.get_json()
    name = data.get("name")
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not name or not username or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    # check if email or username already exists
    if get_user(mongo, email) or get_user_by_username(mongo, username):
        return jsonify({"message": "Email or username already exists"}), 400

    # check if pending user with same email/username exists
    pending = get_pending_user(mongo, email)
    if pending and pending.get("expires_at") > datetime.datetime.utcnow():
        return jsonify({"message": "Verification already pending. Please verify OTP."}), 400

    # store pending user and send OTP
    store_pending_user(mongo, {
        "name": name,
        "username": username,
        "email": email,
        "password": password
    })
    otp = generate_otp(mongo, email)
    send_email(email, "CareerMate Signup OTP", f"Your OTP for verification is: {otp}") # Uses imported send_email

    return jsonify({"message": "OTP sent to email for verification"}), 200


# ---------- VERIFY OTP ----------
@routes.route("/verify-otp", methods=["POST"])
def verify_user_otp(): # Function name was already unique
    data = request.get_json()
    email = data.get("email")
    otp = data.get("otp")

    if not verify_otp(mongo, email, otp):
        return jsonify({"message": "Invalid or expired OTP"}), 400

    pending_user = get_pending_user(mongo, email)
    if not pending_user:
        return jsonify({"message": "No pending registration found"}), 404

    # create verified user
    # Using aliased import 'create_user_from_model'
    create_user_from_model(mongo, pending_user["name"], pending_user["username"], pending_user["email"], pending_user["password"])
    delete_pending_user(mongo, email)

    return jsonify({"message": "Email verified successfully. You can now log in."}), 200