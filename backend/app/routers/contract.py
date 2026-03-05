from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.contract import Contract, ContractStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse

router = APIRouter()


# ---------- Schemas ----------
class ContractCreate(BaseModel):
    order_id: int | None = None
    contract_no: str
    subject: str | None = None
    type: str | None = None
    parties: str | None = None
    amount: float = 0
    sign_date: date | None = None
    expire_date: date | None = None
    file_url: str | None = None


class ContractUpdate(BaseModel):
    subject: str | None = None
    type: str | None = None
    parties: str | None = None
    amount: float | None = None
    sign_date: date | None = None
    expire_date: date | None = None
    file_url: str | None = None
    status: str | None = None


class ContractResponse(BaseModel):
    id: int
    order_id: int | None = None
    contract_no: str
    subject: str | None = None
    type: str | None = None
    status: str
    parties: str | None = None
    amount: float
    sign_date: date | None = None
    expire_date: date | None = None
    file_url: str | None = None
    created_by: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- GET / ----------
@router.get("", response_model=PaginatedResponse[ContractResponse])
async def list_contracts(
    order_id: int | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List contracts with filters."""
    query = select(Contract)
    count_query = select(func.count()).select_from(Contract)

    if order_id is not None:
        query = query.where(Contract.order_id == order_id)
        count_query = count_query.where(Contract.order_id == order_id)

    if status:
        query = query.where(Contract.status == status)
        count_query = count_query.where(Contract.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Contract.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[ContractResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- GET /{id} ----------
@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single contract by ID."""
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    if contract is None:
        raise HTTPException(status_code=404, detail="合同不存在")
    return ContractResponse.model_validate(contract)


# ---------- POST / ----------
@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(
    body: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new contract."""
    contract = Contract(
        **body.model_dump(),
        created_by=current_user.id,
    )
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return ContractResponse.model_validate(contract)


# ---------- PUT /{id} ----------
@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: int,
    body: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a contract."""
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    if contract is None:
        raise HTTPException(status_code=404, detail="合同不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contract, key, value)

    await db.commit()
    await db.refresh(contract)
    return ContractResponse.model_validate(contract)


# ---------- DELETE /{id} ----------
@router.delete("/{contract_id}")
async def delete_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a contract."""
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    if contract is None:
        raise HTTPException(status_code=404, detail="合同不存在")

    await db.delete(contract)
    await db.commit()
    return {"message": "合同已删除"}
