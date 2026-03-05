from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.payment import Payment, Invoice, InvoiceStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse

router = APIRouter()


# ---------- Schemas ----------
class InvoiceCreate(BaseModel):
    payment_id: int | None = None
    invoice_no: str
    amount: float
    type: str | None = None
    file_url: str | None = None


class InvoiceUpdate(BaseModel):
    amount: float | None = None
    type: str | None = None
    status: str | None = None
    file_url: str | None = None


class InvoiceResponse(BaseModel):
    id: int
    payment_id: int | None = None
    invoice_no: str
    amount: float
    type: str | None = None
    status: str
    file_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentSummary(BaseModel):
    total_received: float
    total_paid: float
    total_pending: float
    count: int


class PaymentRecordResponse(BaseModel):
    id: int
    order_id: int | None = None
    type: str
    amount: float
    status: str
    payer: str | None = None
    payee: str | None = None
    method: str | None = None
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- GET /summary ----------
@router.get("/summary", response_model=PaymentSummary)
async def get_payment_summary(
    order_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get total payment summary (received, paid, pending)."""
    base_query = select(Payment)
    if order_id is not None:
        base_query = base_query.where(Payment.order_id == order_id)

    # Total received (customer_collection with status=paid)
    received_q = select(func.coalesce(func.sum(Payment.amount), 0)).where(
        Payment.type == "customer_collection",
        Payment.status == "paid",
    )
    if order_id is not None:
        received_q = received_q.where(Payment.order_id == order_id)
    received_result = await db.execute(received_q)
    total_received = float(received_result.scalar() or 0)

    # Total paid (supplier, local_agent with status=paid)
    paid_q = select(func.coalesce(func.sum(Payment.amount), 0)).where(
        Payment.type.in_(["supplier", "local_agent", "planner_pay", "sales_pay"]),
        Payment.status == "paid",
    )
    if order_id is not None:
        paid_q = paid_q.where(Payment.order_id == order_id)
    paid_result = await db.execute(paid_q)
    total_paid = float(paid_result.scalar() or 0)

    # Total pending
    pending_q = select(func.coalesce(func.sum(Payment.amount), 0)).where(
        Payment.status == "pending",
    )
    if order_id is not None:
        pending_q = pending_q.where(Payment.order_id == order_id)
    pending_result = await db.execute(pending_q)
    total_pending = float(pending_result.scalar() or 0)

    # Count
    count_q = select(func.count()).select_from(Payment)
    if order_id is not None:
        count_q = count_q.where(Payment.order_id == order_id)
    count_result = await db.execute(count_q)
    count = count_result.scalar() or 0

    return PaymentSummary(
        total_received=total_received,
        total_paid=total_paid,
        total_pending=total_pending,
        count=count,
    )


# ---------- GET /records ----------
@router.get("/records", response_model=PaginatedResponse[PaymentRecordResponse])
async def list_payment_records(
    order_id: int | None = None,
    type: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all payment records for finance overview."""
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
        items=[PaymentRecordResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- Invoice CRUD ----------

# GET /invoices
@router.get("/invoices", response_model=PaginatedResponse[InvoiceResponse])
async def list_invoices(
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List invoices with optional status filter."""
    query = select(Invoice)
    count_query = select(func.count()).select_from(Invoice)

    if status:
        query = query.where(Invoice.status == status)
        count_query = count_query.where(Invoice.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Invoice.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[InvoiceResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# GET /invoices/{id}
@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single invoice by ID."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if invoice is None:
        raise HTTPException(status_code=404, detail="发票不存在")
    return InvoiceResponse.model_validate(invoice)


# POST /invoices
@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    body: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new invoice."""
    invoice = Invoice(**body.model_dump())
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return InvoiceResponse.model_validate(invoice)


# PUT /invoices/{id}
@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: int,
    body: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an invoice."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if invoice is None:
        raise HTTPException(status_code=404, detail="发票不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(invoice, key, value)

    await db.commit()
    await db.refresh(invoice)
    return InvoiceResponse.model_validate(invoice)


# DELETE /invoices/{id}
@router.delete("/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an invoice."""
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if invoice is None:
        raise HTTPException(status_code=404, detail="发票不存在")

    await db.delete(invoice)
    await db.commit()
    return {"message": "发票已删除"}
