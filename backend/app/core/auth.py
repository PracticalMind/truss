import uuid
import datetime

import bcrypt
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.services.db import get_db
from app.services.models import User

security = HTTPBearer()

_jwks_client: PyJWKClient | None = None
_ASYMMETRIC_ALGS = {"ES256", "ES384", "ES512", "RS256", "RS384", "RS512", "EdDSA"}


# Supabase auth

def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(
            f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json",
            cache_keys=True,
        )
    return _jwks_client


def _decode_supabase_token(token: str) -> dict:
    """Decodes a Supabase JWT - supports both JWKS (asymmetric) and legacy HS256."""
    try:
        header = jwt.get_unverified_header(token)
    except jwt.DecodeError as exc:
        raise jwt.InvalidTokenError(f"Malformed token: {exc}")

    alg = header.get("alg", "HS256")

    if alg in _ASYMMETRIC_ALGS:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=list(_ASYMMETRIC_ALGS),
            audience="authenticated",
        )

    return jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated",
    )


async def _get_current_user_supabase(
    credentials: HTTPAuthorizationCredentials,
    db: AsyncSession,
) -> User:
    try:
        payload = _decode_supabase_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Token missing subject")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user id in token")

    email: str = payload.get("email", "")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(id=user_id, email=email, plan="free")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


# Local auth

def create_local_token(user_id: uuid.UUID, email: str) -> str:
    """Issues a signed JWT for local auth mode."""
    exp = datetime.datetime.utcnow() + datetime.timedelta(
        days=settings.LOCAL_JWT_EXPIRE_DAYS
    )
    return jwt.encode(
        {"sub": str(user_id), "email": email, "exp": exp},
        settings.LOCAL_JWT_SECRET,
        algorithm="HS256",
    )


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


async def _get_current_user_local(
    credentials: HTTPAuthorizationCredentials,
    db: AsyncSession,
) -> User:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.LOCAL_JWT_SECRET,
            algorithms=["HS256"],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    user_id_str: str | None = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Token missing subject")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user id in token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# Public dependency

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if settings.AUTH_PROVIDER == "local":
        return await _get_current_user_local(credentials, db)
    return await _get_current_user_supabase(credentials, db)
