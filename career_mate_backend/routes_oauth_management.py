"""
OAuth Account Management Routes

This module provides routes for managing OAuth provider linking/unlinking
and account conflict resolution.
"""

from flask import Blueprint, request, jsonify, session
import logging
import datetime
from utils.oauth_errors import (
    OAuthException, OAuthErrorType, OAuthErrorHandler, 
    AccountConflictException, handle_oauth_errors
)
from utils.account_merger import get_account_merger
from utils.oauth_account_linking import get_account_linking_security_manager
from utils.rate_limiter import rate_limit
from utils.google_oauth_service import google_oauth_service
from utils.github_oauth_service import github_oauth_service
from config import db as mongo
from db import find_user_by_email, find_user_by_username
from bson import ObjectId

logger = logging.getLogger(__name__)

# Create blueprint for OAuth management routes
oauth_mgmt_bp = Blueprint('oauth_management', __name__, url_prefix='/api/oauth')

@oauth_mgmt_bp.route('/link', methods=['POST'])
@rate_limit(limit=5, window=300)  # 5 linking attempts per 5 minutes
@handle_oauth_errors
def link_oauth_provider():
    """
    Link an OAuth provider to the current user's account
    
    Requirements: 4.2, 3.2
    """
    # Check if user is authenticated
    user_email_hash = session.get('user_email_hash')
    if not user_email_hash:
        raise OAuthException(
            OAuthErrorType.ACCOUNT_NOT_FOUND,
            message="User must be logged in to link OAuth providers"
        )
    
    data = request.json or {}
    provider = data.get('provider')
    
    if not provider:
        raise OAuthException(
            OAuthErrorType.INVALID_PROVIDER,
            message="Provider is required"
        )
    
    # Validate provider
    OAuthErrorHandler.validate_provider(provider)
    
    # Get current user
    from db import users
    user = users.find_one({'email_hash': user_email_hash})
    if not user:
        raise OAuthException(
            OAuthErrorType.ACCOUNT_NOT_FOUND,
            message="Current user not found"
        )
    
    # Get OAuth data based on provider
    if provider == 'google':
        token = data.get('token')
        if not token:
            raise OAuthException(
                OAuthErrorType.INVALID_TOKEN,
                message="Google OAuth token is required",
                details={'provider': 'google'}
            )
        
        oauth_profile = google_oauth_service.sign_in(token)
        oauth_data = {
            'id': oauth_profile['id'],
            'email': oauth_profile['email'],
            'name': oauth_profile.get('name', ''),
            'picture': oauth_profile.get('picture', '')
        }
        
    elif provider == 'github':
        code = data.get('code')
        if not code:
            raise OAuthException(
                OAuthErrorType.INVALID_TOKEN,
                message="GitHub authorization code is required",
                details={'provider': 'github'}
            )
        
        oauth_profile = github_oauth_service.sign_in_with_code(code)
        oauth_data = {
            'id': oauth_profile['id'],
            'username': oauth_profile['username'],
            'email': oauth_profile.get('email'),
            'name': oauth_profile.get('name', oauth_profile['username']),
            'avatar_url': oauth_profile.get('avatar_url', '')
        }
    
    # Check for conflicts
    account_merger = get_account_merger(mongo)
    conflict = account_merger.check_account_conflict(
        oauth_data['email'], 
        provider, 
        oauth_data['id']
    )
    
    if conflict and conflict['type'] == 'provider_account_mismatch':
        raise OAuthException(
            OAuthErrorType.LINKING_ERROR,
            message=f"A different {provider} account is already linked to this email",
            details=conflict
        )
    
    # Link the provider
    user_id = user['_id'] if isinstance(user['_id'], ObjectId) else ObjectId(user['_id'])
    success = account_merger.link_oauth_provider(user_id, provider, oauth_data)
    
    if not success:
        raise OAuthException(
            OAuthErrorType.LINKING_ERROR,
            message=f"Failed to link {provider} account"
        )
    
    # Get updated user
    updated_user = users.find_one({'_id': user_id})
    
    logger.info(f"Successfully linked {provider} provider to user {user['email_hash']}")
    
    return jsonify({
        'message': f'{provider.title()} account successfully linked',
        'user': {
            'name': updated_user.get('name'),
            'username': updated_user.get('username'),
            'oauth_providers': updated_user.get('oauth_providers', {}),
            'login_methods': updated_user.get('login_methods', [])
        }
    }), 200

@oauth_mgmt_bp.route('/unlink', methods=['POST'])
@rate_limit(limit=5, window=300)  # 5 unlinking attempts per 5 minutes
@handle_oauth_errors
def unlink_oauth_provider():
    """
    Unlink an OAuth provider from the current user's account
    
    Requirements: 4.2, 4.4
    """
    # Check if user is authenticated
    user_email_hash = session.get('user_email_hash')
    if not user_email_hash:
        raise OAuthException(
            OAuthErrorType.ACCOUNT_NOT_FOUND,
            message="User must be logged in to unlink OAuth providers"
        )
    
    data = request.json or {}
    provider = data.get('provider')
    
    if not provider:
        raise OAuthException(
            OAuthErrorType.INVALID_PROVIDER,
            message="Provider is required"
        )
    
    # Validate provider
    OAuthErrorHandler.validate_provider(provider)
    
    # Get current user
    from db import users
    user = users.find_one({'email_hash': user_email_hash})
    if not user:
        raise OAuthException(
            OAuthErrorType.ACCOUNT_NOT_FOUND,
            message="Current user not found"
        )
    
    # Unlink the provider
    account_merger = get_account_merger(mongo)
    user_id = user['_id'] if isinstance(user['_id'], ObjectId) else ObjectId(user['_id'])
    success = account_merger.unlink_oauth_provider(user_id, provider)
    
    if not success:
        raise OAuthException(
            OAuthErrorType.UNLINKING_ERROR,
            message=f"Failed to unlink {provider} account"
        )
    
    # Get updated user
    updated_user = users.find_one({'_id': user_id})
    
    logger.info(f"Successfully unlinked {provider} provider from user {user['email_hash']}")
    
    return jsonify({
        'message': f'{provider.title()} account successfully unlinked',
        'user': {
            'name': updated_user.get('name'),
            'username': updated_user.get('username'),
            'oauth_providers': updated_user.get('oauth_providers', {}),
            'login_methods': updated_user.get('login_methods', [])
        }
    }), 200

@oauth_mgmt_bp.route('/resolve-conflict', methods=['POST'])
@rate_limit(limit=3, window=300)  # 3 conflict resolution attempts per 5 minutes
@handle_oauth_errors
def resolve_account_conflict():
    """
    Resolve an account conflict during OAuth authentication
    
    Requirements: 4.2, 3.2
    """
    data = request.json or {}
    resolution = data.get('resolution')  # 'link', 'switch', 'cancel'
    conflict_data = data.get('conflict_data', {})
    oauth_data = data.get('oauth_data', {})
    
    if not resolution:
        raise OAuthException(
            OAuthErrorType.UNKNOWN_ERROR,
            message="Resolution type is required"
        )
    
    if not conflict_data:
        raise OAuthException(
            OAuthErrorType.UNKNOWN_ERROR,
            message="Conflict data is required"
        )
    
    account_merger = get_account_merger(mongo)
    result = account_merger.resolve_account_conflict(
        conflict_data, 
        resolution, 
        oauth_data=oauth_data
    )
    
    logger.info(f"Account conflict resolved with action: {result.get('action')}")
    
    return jsonify(result), 200

@oauth_mgmt_bp.route('/providers', methods=['GET'])
def get_user_oauth_providers():
    """
    Get OAuth providers linked to the current user's account
    
    Requirements: 4.4
    """
    # Check if user is authenticated
    user_email_hash = session.get('user_email_hash')
    if not user_email_hash:
        return jsonify({'error': 'User not authenticated'}), 401
    
    # Get current user
    from db import users
    user = users.find_one({'email_hash': user_email_hash})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    oauth_providers = user.get('oauth_providers', {})
    login_methods = user.get('login_methods', [])
    
    # Sanitize provider data (remove sensitive information)
    sanitized_providers = {}
    for provider, data in oauth_providers.items():
        sanitized_providers[provider] = {
            'email': data.get('email'),
            'name': data.get('name'),
            'username': data.get('username'),
            'linked_at': data.get('linked_at'),
            'avatar_url': data.get('avatar_url') or data.get('picture')
        }
    
    return jsonify({
        'oauth_providers': sanitized_providers,
        'login_methods': login_methods,
        'has_password': bool(user.get('password'))
    }), 200

@oauth_mgmt_bp.route('/check-conflict', methods=['POST'])
@rate_limit(limit=10, window=300)  # 10 conflict checks per 5 minutes
@handle_oauth_errors
def check_account_conflict():
    """
    Check if there would be an account conflict for OAuth authentication
    
    Requirements: 4.2, 3.2
    """
    data = request.json or {}
    email = data.get('email')
    provider = data.get('provider')
    provider_user_id = data.get('provider_user_id')
    
    if not all([email, provider, provider_user_id]):
        raise OAuthException(
            OAuthErrorType.UNKNOWN_ERROR,
            message="Email, provider, and provider_user_id are required"
        )
    
    # Validate provider
    OAuthErrorHandler.validate_provider(provider)
    
    account_merger = get_account_merger(mongo)
    conflict = account_merger.check_account_conflict(email, provider, provider_user_id)
    
    if conflict:
        return jsonify({
            'has_conflict': True,
            'conflict_data': conflict
        }), 200
    else:
        return jsonify({
            'has_conflict': False
        }), 200

# Error handler for OAuth management routes
@oauth_mgmt_bp.errorhandler(OAuthException)
def handle_oauth_exception(error):
    return OAuthErrorHandler.create_error_response(error)

@oauth_mgmt_bp.route('/secure-link/initiate', methods=['POST'])
@rate_limit(limit=3, window=300)  # 3 secure linking attempts per 5 minutes
@handle_oauth_errors
def initiate_secure_account_linking():
    """
    Initiate secure account linking with verification requirements
    
    Requirements: 3.2, 4.2
    """
    # Check if user is authenticated
    user_email_hash = session.get('user_email_hash')
    if not user_email_hash:
        raise OAuthException(
            OAuthErrorType.ACCOUNT_NOT_FOUND,
            message="User must be logged in to link OAuth providers"
        )
    
    data = request.json or {}
    provider = data.get('provider')
    
    if not provider:
        raise OAuthException(
            OAuthErrorType.INVALID_PROVIDER,
            message="Provider is required"
        )
    
    # Validate provider
    OAuthErrorHandler.validate_provider(provider)
    
    # Get current user
    from db import users
    user = users.find_one({'email_hash': user_email_hash})
    if not user:
        raise OAuthException(
            OAuthErrorType.ACCOUNT_NOT_FOUND,
            message="Current user not found"
        )
    
    # Get OAuth data based on provider
    if provider == 'google':
        token = data.get('token')
        if not token:
            raise OAuthException(
                OAuthErrorType.INVALID_TOKEN,
                message="Google OAuth token is required",
                details={'provider': 'google'}
            )
        
        oauth_profile = google_oauth_service.sign_in(token)
        oauth_data = {
            'id': oauth_profile['id'],
            'email': oauth_profile['email'],
            'name': oauth_profile.get('name', ''),
            'picture': oauth_profile.get('picture', '')
        }
        
    elif provider == 'github':
        code = data.get('code')
        if not code:
            raise OAuthException(
                OAuthErrorType.INVALID_TOKEN,
                message="GitHub authorization code is required",
                details={'provider': 'github'}
            )
        
        oauth_profile = github_oauth_service.sign_in_with_code(code)
        oauth_data = {
            'id': oauth_profile['id'],
            'username': oauth_profile['username'],
            'email': oauth_profile.get('email'),
            'name': oauth_profile.get('name', oauth_profile['username']),
            'avatar_url': oauth_profile.get('avatar_url', '')
        }
    
    # Get client info
    client_info = {
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', ''),
        'timestamp': datetime.datetime.utcnow()
    }
    
    # Initiate secure linking
    linking_manager = get_account_linking_security_manager(mongo.db)
    user_id = user['_id'] if isinstance(user['_id'], ObjectId) else ObjectId(user['_id'])
    
    result = linking_manager.initiate_account_linking(
        user_id=user_id,
        provider=provider,
        oauth_data=oauth_data,
        client_info=client_info
    )
    
    logger.info(f"Secure account linking initiated for user {user['email_hash']}, provider {provider}")
    
    return jsonify(result), 200

@oauth_mgmt_bp.route('/secure-link/send-verification', methods=['POST'])
@rate_limit(limit=5, window=300)  # 5 verification emails per 5 minutes
@handle_oauth_errors
def send_linking_verification():
    """
    Send email verification for secure account linking
    
    Requirements: 3.2
    """
    data = request.json or {}
    linking_session_id = data.get('linking_session_id')
    
    if not linking_session_id:
        raise OAuthException(
            OAuthErrorType.LINKING_ERROR,
            message="Linking session ID is required"
        )
    
    linking_manager = get_account_linking_security_manager(mongo.db)
    result = linking_manager.send_email_verification(linking_session_id)
    
    return jsonify(result), 200

@oauth_mgmt_bp.route('/secure-link/verify-email', methods=['POST'])
@rate_limit(limit=10, window=300)  # 10 verification attempts per 5 minutes
@handle_oauth_errors
def verify_linking_email():
    """
    Verify email for secure account linking
    
    Requirements: 3.2
    """
    data = request.json or {}
    linking_session_id = data.get('linking_session_id')
    verification_code = data.get('verification_code')
    
    if not linking_session_id or not verification_code:
        raise OAuthException(
            OAuthErrorType.LINKING_ERROR,
            message="Linking session ID and verification code are required"
        )
    
    linking_manager = get_account_linking_security_manager(mongo.db)
    result = linking_manager.verify_email_for_linking(linking_session_id, verification_code)
    
    return jsonify(result), 200

@oauth_mgmt_bp.route('/secure-link/verify-password', methods=['POST'])
@rate_limit(limit=5, window=300)  # 5 password verification attempts per 5 minutes
@handle_oauth_errors
def verify_linking_password():
    """
    Verify password for secure account linking
    
    Requirements: 4.2
    """
    data = request.json or {}
    linking_session_id = data.get('linking_session_id')
    password = data.get('password')
    
    if not linking_session_id or not password:
        raise OAuthException(
            OAuthErrorType.LINKING_ERROR,
            message="Linking session ID and password are required"
        )
    
    linking_manager = get_account_linking_security_manager(mongo.db)
    result = linking_manager.verify_password_for_linking(linking_session_id, password)
    
    return jsonify(result), 200

@oauth_mgmt_bp.route('/secure-link/complete', methods=['POST'])
@rate_limit(limit=3, window=300)  # 3 completion attempts per 5 minutes
@handle_oauth_errors
def complete_secure_linking():
    """
    Complete secure account linking after all verifications
    
    Requirements: 3.2, 4.2
    """
    data = request.json or {}
    linking_session_id = data.get('linking_session_id')
    
    if not linking_session_id:
        raise OAuthException(
            OAuthErrorType.LINKING_ERROR,
            message="Linking session ID is required"
        )
    
    linking_manager = get_account_linking_security_manager(mongo.db)
    result = linking_manager.complete_account_linking(linking_session_id)
    
    return jsonify(result), 200

@oauth_mgmt_bp.route('/secure-link/cancel', methods=['POST'])
@rate_limit(limit=10, window=300)  # 10 cancellation attempts per 5 minutes
def cancel_secure_linking():
    """
    Cancel secure account linking process
    
    Requirements: 3.2, 4.2
    """
    data = request.json or {}
    linking_session_id = data.get('linking_session_id')
    reason = data.get('reason', 'user_cancelled')
    
    if not linking_session_id:
        return jsonify({'error': 'Linking session ID is required'}), 400
    
    linking_manager = get_account_linking_security_manager(mongo.db)
    result = linking_manager.cancel_account_linking(linking_session_id, reason)
    
    return jsonify(result), 200

# Register the blueprint (this should be done in the main app file)
def register_oauth_management_routes(app):
    """Register OAuth management routes with the Flask app"""
    app.register_blueprint(oauth_mgmt_bp)