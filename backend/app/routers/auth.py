from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User, Team, UserRole
from app.schemas.auth import LoginRequest, UserResponse, TeamResponse, TokenResponse

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ---------- POST /login ----------
@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Login with email or phone + password. Returns JWT in httpOnly cookie."""
    result = await db.execute(
        select(User).where(
            or_(User.email == body.account, User.phone == body.account)
        )
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号或密码错误",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )

    token = create_access_token(user.id, user.role.value)

    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # Set True in production with HTTPS
    )

    return TokenResponse(
        message="登录成功",
        user=UserResponse.model_validate(user),
    )


# ---------- GET /me ----------
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current logged-in user info."""
    return UserResponse.model_validate(current_user)


# ---------- GET /users ----------
@router.get("/users", response_model=list[UserResponse])
async def get_users(
    search: str | None = None,
    role: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user list with optional search and role filter."""
    query = select(User).where(User.is_active == True)

    if search:
        query = query.where(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.phone.ilike(f"%{search}%"),
            )
        )

    if role:
        query = query.where(User.role == role)

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


# ---------- GET /team ----------
@router.get("/team", response_model=list[TeamResponse])
async def get_teams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all teams."""
    result = await db.execute(select(Team))
    teams = result.scalars().all()
    return [TeamResponse.model_validate(t) for t in teams]


# ---------- GET /team/user_team ----------
@router.get("/team/user_team", response_model=TeamResponse | None)
async def get_user_team(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the team of the current user."""
    if current_user.team_id is None:
        return None
    result = await db.execute(select(Team).where(Team.id == current_user.team_id))
    return result.scalar_one_or_none()


# ---------- POST /logout ----------
@router.post("/logout")
async def logout(response: Response):
    """Clear the auth cookie."""
    response.delete_cookie("token")
    return {"message": "已退出登录"}
