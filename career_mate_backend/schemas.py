"""
Pydantic schemas for request/response validation
Implements comprehensive password validation with HIBP integration
Requirements: 1.1-1.5, 2.1-2.4, 3.1-3.2, 5.1-5.2, 6.1-6.4
"""

from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List, Dict, Any
import re
from datetime import datetime
from utils.password_validator import validate_password_with_hibp_sync

class UserCreate(BaseModel):
    """
    User creation schema with comprehensive password validation
    Requirements: 5.1, 5.2 - Backend validation with detailed error messages
    """
    name: str = Field(..., min_length=1, max_length=100, description="User's full name")
    username: str = Field(..., min_length=3, max_length=30, description="Unique username")
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=10, description="User's password")
    
    @validator('name')
    def validate_name(cls, v):
        """Validate user name"""
        if not v or not v.strip():
            raise ValueError('Name is required')
        
        # Remove extra whitespace
        v = v.strip()
        
        # Check for valid characters (letters, spaces, hyphens, apostrophes)
        if not re.match(r"^[a-zA-Z\s\-']+$", v):
            raise ValueError('Name can only contain letters, spaces, hyphens, and apostrophes')
        
        return v
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username format"""
        if not v or not v.strip():
            raise ValueError('Username is required')
        
        v = v.strip().lower()
        
        # Username format: alphanumeric and underscores only
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        
        # Must start with a letter
        if not v[0].isalpha():
            raise ValueError('Username must start with a letter')
        
        return v
    
    @validator('password')
    def validate_password(cls, password, values):
        """
        Comprehensive password validation with HIBP integration
        Requirements: 1.1-1.5, 2.1-2.4, 3.1-3.2, 5.1-5.2, 6.1-6.4
        """
        if not password:
            raise ValueError('Password is required')
        
        # Get username and email from other fields for personal info checking
        username = values.get('username', '')
        email = values.get('email', '')
        
        # Use the comprehensive password validator
        errors = validate_password_with_hibp_sync(password, username, str(email) if email else '')
        
        # Requirement 5.2: Return HTTP 422 with detailed error messages
        if errors:
            # Join multiple errors with semicolons for detailed feedback
            error_message = '; '.join(errors)
            raise ValueError(error_message)
        
        return password

class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=1, description="User's password")

class UserResponse(BaseModel):
    """User response schema (excludes sensitive data)"""
    name: str
    username: str
    email: EmailStr
    created_at: datetime

class TokenResponse(BaseModel):
    """Authentication token response"""
    token: str
    expires_at: datetime
    user: UserResponse

class OTPRequest(BaseModel):
    """OTP generation request"""
    email: EmailStr = Field(..., description="Email address for OTP")

class OTPVerify(BaseModel):
    """OTP verification request"""
    email: EmailStr = Field(..., description="Email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    
    @validator('otp')
    def validate_otp(cls, v):
        """Validate OTP format"""
        if not v.isdigit():
            raise ValueError('OTP must contain only digits')
        return v

class PasswordValidationRequest(BaseModel):
    """
    Password validation request for testing endpoint
    Requirements: 5.1, 5.2 - Allow frontend to validate passwords without creating accounts
    """
    password: str = Field(..., description="Password to validate")
    username: Optional[str] = Field(None, description="Username for personal info checking")
    email: Optional[EmailStr] = Field(None, description="Email for personal info checking")

class PasswordValidationResponse(BaseModel):
    """
    Password validation response with detailed feedback
    Requirements: 6.1, 6.4 - Detailed error messages and user-friendly language
    """
    is_valid: bool = Field(..., description="Whether password meets all requirements")
    errors: List[str] = Field(default_factory=list, description="List of validation errors")
    requirements: Dict[str, Any] = Field(default_factory=dict, description="Individual requirement status")
    hibp_checked: bool = Field(default=False, description="Whether HIBP check was performed")
    hibp_error: Optional[str] = Field(None, description="HIBP check error if any")

class ResumeAnalysisRequest(BaseModel):
    """Resume analysis request"""
    resume_text: str = Field(..., min_length=10, description="Resume text content")

class ResumeAnalysisResponse(BaseModel):
    """Resume analysis response"""
    analysis: str = Field(..., description="AI-generated resume analysis")
    word_count: int = Field(..., description="Resume word count")
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)

class CoverLetterRequest(BaseModel):
    """Cover letter generation request"""
    resume_text: str = Field(..., min_length=10, description="Resume text content")
    job_description: str = Field(..., min_length=10, description="Job description")
    user_name: Optional[str] = Field("Candidate", description="User's name for personalization")

class CoverLetterResponse(BaseModel):
    """Cover letter generation response"""
    cover_letter: str = Field(..., description="Generated cover letter")
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class ResumeImprovementRequest(BaseModel):
    """Resume improvement suggestions request"""
    resume_text: str = Field(..., min_length=10, description="Current resume text")
    job_description: str = Field(..., min_length=10, description="Target job description")

class ResumeImprovementResponse(BaseModel):
    """Resume improvement suggestions response"""
    suggestions: str = Field(..., description="AI-generated improvement suggestions")
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Validation helper functions

def validate_user_create_data(data: dict) -> UserCreate:
    """
    Validate user creation data and return UserCreate instance
    Requirements: 5.1, 5.2 - Server-side validation with detailed error messages
    """
    try:
        return UserCreate(**data)
    except ValueError as e:
        # Re-raise with more context for API error handling
        raise ValueError(f"User validation failed: {str(e)}")

def validate_password_only(password: str, username: str = "", email: str = "") -> PasswordValidationResponse:
    """
    Validate password only and return detailed response
    Requirements: 6.1, 6.4 - Specific error messages and user-friendly language
    """
    try:
        # Use the comprehensive password validator
        errors = validate_password_with_hibp_sync(password, username, email)
        
        # Determine individual requirement status
        requirements = {
            'length': len(password) >= 10,
            'uppercase': bool(re.search(r'[A-Z]', password)),
            'lowercase': bool(re.search(r'[a-z]', password)),
            'number': bool(re.search(r'[0-9]', password)),
            'special': bool(re.search(r'[~`!@#$%^&*()_=\-+/?><\\|{}[\].,]', password)),
            'no_personal_info': True,  # Will be updated by validator
            'not_compromised': None   # Will be updated by HIBP check
        }
        
        # Check personal info
        if username and username.lower() in password.lower():
            requirements['no_personal_info'] = False
        
        if email:
            email_username = email.split('@')[0]
            if (email_username.lower() in password.lower() or 
                email.lower() in password.lower()):
                requirements['no_personal_info'] = False
        
        # HIBP status based on errors
        hibp_error = None
        hibp_checked = True
        
        # Check if HIBP-related error exists
        for error in errors:
            if "data breach" in error.lower():
                requirements['not_compromised'] = False
                break
        else:
            # No HIBP error found, assume safe if no other errors
            if not errors:
                requirements['not_compromised'] = True
        
        return PasswordValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            requirements=requirements,
            hibp_checked=hibp_checked,
            hibp_error=hibp_error
        )
        
    except Exception as e:
        # Return error response for unexpected issues
        return PasswordValidationResponse(
            is_valid=False,
            errors=[f"Password validation system error: {str(e)}"],
            requirements={},
            hibp_checked=False,
            hibp_error=str(e)
        )