from datetime import datetime

from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Login with email or phone + password."""
    account: str  # email or phone
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    phone: str | None = None
    name: str
    avatar: str | None = None
    role: str
    team_id: int | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    message: str
    user: UserResponse
