from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.insurance import Insurance, InsuranceStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse

router = APIRouter()


# ---------- Schemas ----------
class InsuranceCreate(BaseModel):
    order_id: int | None = None
    policy_no: str
    provider: str | None = None
    type: str | None = None
    coverage: str | None = None
    premium: float = 0
    start_date: date | None = None
    end_date: date | None = None
    beneficiaries: dict | None = None


class InsuranceUpdate(BaseModel):
    provider: str | None = None
    type: str | None = None
    coverage: str | None = None
    premium: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None
    beneficiaries: dict | None = None


class InsuranceResponse(BaseModel):
    id: int
    order_id: int | None = None
    policy_no: str
    provider: str | None = None
    type: str | None = None
    coverage: str | None = None
    premium: float
    start_date: date | None = None
    end_date: date | None = None
    status: str
    beneficiaries: dict | None = None
    created_by: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- GET / ----------
@router.get("", response_model=PaginatedResponse[InsuranceResponse])
async def list_insurances(
    order_id: int | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List insurance records with filters."""
    query = select(Insurance)
    count_query = select(func.count()).select_from(Insurance)

    if order_id is not None:
        query = query.where(Insurance.order_id == order_id)
        count_query = count_query.where(Insurance.order_id == order_id)

    if status:
        query = query.where(Insurance.status == status)
        count_query = count_query.where(Insurance.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Insurance.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[InsuranceResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- GET /{id} ----------
@router.get("/{insurance_id}", response_model=InsuranceResponse)
async def get_insurance(
    insurance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single insurance record by ID."""
    result = await db.execute(select(Insurance).where(Insurance.id == insurance_id))
    insurance = result.scalar_one_or_none()
    if insurance is None:
        raise HTTPException(status_code=404, detail="保险记录不存在")
    return InsuranceResponse.model_validate(insurance)


# ---------- POST / ----------
@router.post("", response_model=InsuranceResponse, status_code=status.HTTP_201_CREATED)
async def create_insurance(
    body: InsuranceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new insurance record."""
    insurance = Insurance(
        **body.model_dump(),
        created_by=current_user.id,
    )
    db.add(insurance)
    await db.commit()
    await db.refresh(insurance)
    return InsuranceResponse.model_validate(insurance)


# ---------- PUT /{id} ----------
@router.put("/{insurance_id}", response_model=InsuranceResponse)
async def update_insurance(
    insurance_id: int,
    body: InsuranceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an insurance record."""
    result = await db.execute(select(Insurance).where(Insurance.id == insurance_id))
    insurance = result.scalar_one_or_none()
    if insurance is None:
        raise HTTPException(status_code=404, detail="保险记录不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(insurance, key, value)

    await db.commit()
    await db.refresh(insurance)
    return InsuranceResponse.model_validate(insurance)


# ---------- DELETE /{id} ----------
@router.delete("/{insurance_id}")
async def delete_insurance(
    insurance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an insurance record."""
    result = await db.execute(select(Insurance).where(Insurance.id == insurance_id))
    insurance = result.scalar_one_or_none()
    if insurance is None:
        raise HTTPException(status_code=404, detail="保险记录不存在")

    await db.delete(insurance)
    await db.commit()
    return {"message": "保险记录已删除"}
