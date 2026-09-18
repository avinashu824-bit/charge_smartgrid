"""
ChargeSmart Grid - Auth Router
POST /api/auth/login   → JWT token
GET  /api/auth/me      → current user info
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.database import get_db

router = APIRouter()

JWT_SECRET    = os.getenv("JWT_SECRET", "chargesmart_jwt_secret_2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_H  = 24

pwd_ctx  = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


# ──────────────────────────────────────────────
# SCHEMAS
# ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    email:    str
    password: str
    role:     Literal["user", "operator", "admin"]


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    role:         str
    name:         str
    id:           int


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────
TABLE_MAP = {
    "user":     "users",
    "operator": "operators",
    "admin":    "discom_admins",
}


def create_token(payload: dict) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_H)
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    return decode_token(credentials.credentials)


# ──────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    table = TABLE_MAP.get(body.role)
    if not table:
        raise HTTPException(400, "Invalid role")

    result = await db.execute(
        text(f"SELECT id, name, password_hash FROM {table} WHERE email = :email"),
        {"email": body.email},
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(401, "Invalid credentials")

    uid, name, pw_hash = row
    if not pwd_ctx.verify(body.password, pw_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_token({"sub": str(uid), "role": body.role, "name": name, "email": body.email})
    return TokenResponse(access_token=token, role=body.role, name=name, id=uid)


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id":    int(current_user["sub"]),
        "name":  current_user.get("name"),
        "email": current_user.get("email"),
        "role":  current_user.get("role"),
    }
