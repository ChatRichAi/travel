from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.payment import Payment, PaymentType, PaymentStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse

router = APIRouter()


# ---------- Schemas ----------
class PaymentCreate(BaseModel):
    order_id: int | None = None
    type: str
    amount: float
    payer: str | None = None
    payee: str | None = None
    method: str | None = None
    notes: str | None = None
    attachment_url: str | None = None


class PaymentUpdate(BaseModel):
    amount: float | None = None
    payer: str | None = None
    payee: str | None = None
    method: str | None = None
    notes: str | None = None
    attachment_url: str | None = None


class PaymentStatusUpdate(BaseModel):
    status: str


class PaymentResponse(BaseModel):
    id: int
    order_id: int | None = None
    type: str
    amount: float
    status: str
    payer: str | None = None
    payee: str | None = None
    method: str | None = None
    notes: str | None = None
    attachment_url: str | None = None
    created_by: int | None = None
    approved_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- GET / ----------
@router.get("", response_model=PaginatedResponse[PaymentResponse])
async def list_payments(
    order_id: int | None = None,
    type: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List payments with filters by type, order, status."""
    query = select(Payment)
    count_query = select(func.count()).select_from(Payment)

    if order_id is not None:
        query = query.where(Payment.order_id == order_id)
        count_query = count_query.where(Payment.order_id == order_id)

    if type:
        query = query.where(Payment.type == type)
        count_query = count_query.where(Payment.type == type)

    if status:
        query = query.where(Payment.status == status)
        count_query = count_query.where(Payment.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Payment.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[PaymentResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- GET /{id} ----------
@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single payment by ID."""
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if payment is None:
        raise HTTPException(status_code=404, detail="付款记录不存在")
    return PaymentResponse.model_validate(payment)


# ---------- POST / ----------
@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    body: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new payment record."""
    payment = Payment(
        **body.model_dump(),
        created_by=current_user.id,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return PaymentResponse.model_validate(payment)


# ---------- PUT /{id} ----------
@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    body: PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a payment record."""
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if payment is None:
        raise HTTPException(status_code=404, detail="付款记录不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payment, key, value)

    await db.commit()
    await db.refresh(payment)
    return PaymentResponse.model_validate(payment)


# ---------- PATCH /{id}/status ----------
@router.patch("/{payment_id}/status", response_model=PaymentResponse)
async def update_payment_status(
    payment_id: int,
    body: PaymentStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve / reject / mark paid."""
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if payment is None:
        raise HTTPException(status_code=404, detail="付款记录不存在")

    payment.status = body.status
    if body.status == "approved":
        payment.approved_by = current_user.id

    await db.commit()
    await db.refresh(payment)
    return PaymentResponse.model_validate(payment)


# ---------- DELETE /{id} ----------
@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a payment record (only pending ones)."""
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if payment is None:
        raise HTTPException(status_code=404, detail="付款记录不存在")

    current_status = payment.status.value if isinstance(payment.status, PaymentStatus) else payment.status
    if current_status != "pending":
        raise HTTPException(status_code=400, detail="只能删除待处理的付款记录")

    await db.delete(payment)
    await db.commit()
    return {"message": "付款记录已删除"}
