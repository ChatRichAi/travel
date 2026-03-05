import uuid
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse

router = APIRouter()


# ---------- Schemas ----------
class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str | None = None
    customer_email: str | None = None
    travel_start: date | None = None
    travel_end: date | None = None
    destination: str | None = None
    pax_count: int = 1
    total_amount: float = 0
    cost_amount: float = 0
    deal_tags: dict | None = None
    notes: str | None = None
    planner_id: int | None = None


class OrderUpdate(BaseModel):
    customer_name: str | None = None
    customer_phone: str | None = None
    customer_email: str | None = None
    travel_start: date | None = None
    travel_end: date | None = None
    destination: str | None = None
    pax_count: int | None = None
    total_amount: float | None = None
    cost_amount: float | None = None
    deal_tags: dict | None = None
    notes: str | None = None
    planner_id: int | None = None
    itinerary_id: int | None = None


class OrderStatusUpdate(BaseModel):
    status: str


class OrderResponse(BaseModel):
    id: int
    order_no: str
    customer_name: str
    customer_phone: str | None = None
    customer_email: str | None = None
    travel_start: date | None = None
    travel_end: date | None = None
    destination: str | None = None
    pax_count: int
    status: str
    total_amount: float
    cost_amount: float
    itinerary_id: int | None = None
    salesperson_id: int | None = None
    planner_id: int | None = None
    deal_tags: dict | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


def _generate_order_no() -> str:
    """Generate a unique order number."""
    now = datetime.now()
    return f"ORD{now.strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"


# Valid status transitions
VALID_TRANSITIONS: dict[str, list[str]] = {
    "draft": ["confirmed", "cancelled"],
    "confirmed": ["in_progress", "cancelled"],
    "in_progress": ["completed", "cancelled"],
    "completed": [],
    "cancelled": [],
}


# ---------- GET / ----------
@router.get("", response_model=PaginatedResponse[OrderResponse])
async def list_orders(
    search: str | None = None,
    status: str | None = None,
    salesperson_id: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List orders with search and filters."""
    query = select(Order)
    count_query = select(func.count()).select_from(Order)

    if search:
        search_filter = or_(
            Order.order_no.ilike(f"%{search}%"),
            Order.customer_name.ilike(f"%{search}%"),
            Order.customer_phone.ilike(f"%{search}%"),
            Order.destination.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status:
        query = query.where(Order.status == status)
        count_query = count_query.where(Order.status == status)

    if salesperson_id is not None:
        query = query.where(Order.salesperson_id == salesperson_id)
        count_query = count_query.where(Order.salesperson_id == salesperson_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Order.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[OrderResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- GET /{id} ----------
@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single order by ID."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="订单不存在")
    return OrderResponse.model_validate(order)


# ---------- POST / ----------
@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new order."""
    order = Order(
        order_no=_generate_order_no(),
        salesperson_id=current_user.id,
        **body.model_dump(),
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return OrderResponse.model_validate(order)


# ---------- PUT /{id} ----------
@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    body: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an order."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="订单不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)

    await db.commit()
    await db.refresh(order)
    return OrderResponse.model_validate(order)


# ---------- PATCH /{id}/status ----------
@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update order status with transition validation."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="订单不存在")

    current_status = order.status.value if isinstance(order.status, OrderStatus) else order.status
    allowed = VALID_TRANSITIONS.get(current_status, [])
    if body.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"无法从 '{current_status}' 转为 '{body.status}'，允许的状态: {allowed}",
        )

    order.status = body.status
    await db.commit()
    await db.refresh(order)
    return OrderResponse.model_validate(order)


# ---------- DELETE /{id} ----------
@router.delete("/{order_id}")
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an order (only drafts)."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="订单不存在")

    current_status = order.status.value if isinstance(order.status, OrderStatus) else order.status
    if current_status != "draft":
        raise HTTPException(status_code=400, detail="只能删除草稿状态的订单")

    await db.delete(order)
    await db.commit()
    return {"message": "订单已删除"}
