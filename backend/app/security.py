"""Environment-backed role checks and HS256 JWT issue/verification."""

import base64
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError


bearer_scheme = HTTPBearer(auto_error=False)


def _signing_key() -> bytes:
    """Decode the Base64 JWT_SECRET used by the previous Spring backend.

    The old application used a Base64-encoded 256-bit HMAC secret. Supporting
    raw bytes as a fallback also makes local development more convenient.
    """
    configured_secret = os.getenv("JWT_SECRET", "")
    if not configured_secret:
        # Only suitable for local development; set JWT_SECRET in .env for use.
        configured_secret = "local-development-only-change-me-before-deploying"
    try:
        decoded = base64.b64decode(configured_secret, validate=True)
        if len(decoded) >= 32:
            return decoded
    except (ValueError, base64.binascii.Error):
        pass
    return configured_secret.encode("utf-8")


def create_access_token(username: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "role": role.upper(),
        "iat": now,
        "exp": now + timedelta(minutes=60),
    }
    return jwt.encode(payload, _signing_key(), algorithm="HS256")


def verify_credentials(username: str, password: str) -> str | None:
    """Return the account role when credentials match, otherwise None."""
    accounts = (
        (os.getenv("ADMIN_USERNAME", "admin"), os.getenv("ADMIN_PASSWORD", ""), "ADMIN"),
        (os.getenv("VIEWER_USERNAME", "viewer"), os.getenv("VIEWER_PASSWORD", ""), "VIEWER"),
    )
    for expected_username, expected_password, role in accounts:
        if not expected_password:
            continue
        username_matches = hmac.compare_digest(username, expected_username)
        password_matches = hmac.compare_digest(password, expected_password)
        if username_matches and password_matches:
            return role
    return None


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Administrator authentication required")

    try:
        claims = jwt.decode(credentials.credentials, _signing_key(), algorithms=["HS256"])
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired access token") from exc

    username = claims.get("sub")
    role = claims.get("role")
    if not username or role not in {"ADMIN", "VIEWER"}:
        raise HTTPException(status_code=401, detail="Invalid access token claims")
    return {"username": username, "role": role}


def require_admin(user: dict[str, Any] = Depends(current_user)) -> dict[str, Any]:
    if user["role"] != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrator role required")
    return user
