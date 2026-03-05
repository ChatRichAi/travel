from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.settings import ContractSubject, PaymentMethod, DealTag, SystemConfig
from app.models.user import User

router = APIRouter()


# ==================== Contract Subject ====================

class ContractSubjectCreate(BaseModel):
    name: str
    code: str | None = None
    address: str | None = None
    contact: str | None = None


class ContractSubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    address: str | None = None
    contact: str | None = None
    is_active: bool | None = None


class ContractSubjectResponse(BaseModel):
    id: int
    name: str
    code: str | None = None
    address: str | None = None
    contact: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/contract-subjects", response_model=list[ContractSubjectResponse])
async def list_contract_subjects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all contract subjects."""
    result = await db.execute(select(ContractSubject).order_by(ContractSubject.id))
    items = result.scalars().all()
    return [ContractSubjectResponse.model_validate(i) for i in items]


@router.post("/contract-subjects", response_model=ContractSubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_contract_subject(
    body: ContractSubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new contract subject."""
    item = ContractSubject(**body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return ContractSubjectResponse.model_validate(item)


@router.put("/contract-subjects/{item_id}", response_model=ContractSubjectResponse)
async def update_contract_subject(
    item_id: int,
    body: ContractSubjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a contract subject."""
    result = await db.execute(select(ContractSubject).where(ContractSubject.id == item_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="签约主体不存在")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return ContractSubjectResponse.model_validate(item)


@router.delete("/contract-subjects/{item_id}")
async def delete_contract_subject(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a contract subject."""
    result = await db.execute(select(ContractSubject).where(ContractSubject.id == item_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="签约主体不存在")

    await db.delete(item)
    await db.commit()
    return {"message": "签约主体已删除"}


# ==================== Payment Method ====================

class PaymentMethodCreate(BaseModel):
    name: str
    type: str | None = None
    account_no: str | None = None
    bank_name: str | None = None
    details: str | None = None


class PaymentMethodUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    account_no: str | None = None
    bank_name: str | None = None
    details: str | None = None
    is_active: bool | None = None


class PaymentMethodResponse(BaseModel):
    id: int
    name: str
    type: str | None = None
    account_no: str | None = None
    bank_name: str | None = None
    details: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/payment-methods", response_model=list[PaymentMethodResponse])
async def list_payment_methods(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all payment methods."""
    result = await db.execute(select(PaymentMethod).order_by(PaymentMethod.id))
    items = result.scalars().all()
    return [PaymentMethodResponse.model_validate(i) for i in items]


@router.post("/payment-methods", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_method(
    body: PaymentMethodCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new payment method."""
    item = PaymentMethod(**body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return PaymentMethodResponse.model_validate(item)


@router.put("/payment-methods/{item_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    item_id: int,
    body: PaymentMethodUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a payment method."""
    result = await db.execute(select(PaymentMethod).where(PaymentMethod.id == item_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="付款方式不存在")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return PaymentMethodResponse.model_validate(item)


@router.delete("/payment-methods/{item_id}")
async def delete_payment_method(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a payment method."""
    result = await db.execute(select(PaymentMethod).where(PaymentMethod.id == item_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="付款方式不存在")

    await db.delete(item)
    await db.commit()
    return {"message": "付款方式已删除"}


# ==================== Deal Tag ====================

class DealTagCreate(BaseModel):
    name: str
    color: str | None = None


class DealTagUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    is_active: bool | None = None


class DealTagResponse(BaseModel):
    id: int
    name: str
    color: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


@router.get("/deal-tags", response_model=list[DealTagResponse])
async def list_deal_tags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all deal tags."""
    result = await db.execute(select(DealTag).order_by(DealTag.id))
    items = result.scalars().all()
    return [DealTagResponse.model_validate(i) for i in items]


@router.post("/deal-tags", response_model=DealTagResponse, status_code=status.HTTP_201_CREATED)
async def create_deal_tag(
    body: DealTagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new deal tag."""
    item = DealTag(**body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return DealTagResponse.model_validate(item)


@router.put("/deal-tags/{item_id}", response_model=DealTagResponse)
async def update_deal_tag(
    item_id: int,
    body: DealTagUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a deal tag."""
    result = await db.execute(select(DealTag).where(DealTag.id == item_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="标签不存在")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return DealTagResponse.model_validate(item)


@router.delete("/deal-tags/{item_id}")
async def delete_deal_tag(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a deal tag."""
    result = await db.execute(select(DealTag).where(DealTag.id == item_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=404, detail="标签不存在")

    await db.delete(item)
    await db.commit()
    return {"message": "标签已删除"}


# ==================== Order Info / Miniprogram Config (placeholders) ====================

class OrderInfoConfig(BaseModel):
    """Placeholder for order-related configuration fields."""
    required_fields: list[str] = ["customer_name", "customer_phone", "destination"]
    optional_fields: list[str] = ["customer_email", "pax_count", "notes"]


class MiniprogramConfig(BaseModel):
    """Placeholder for miniprogram configuration."""
    app_id: str | None = None
    app_secret: str | None = None
    welcome_message: str | None = None
    enabled: bool = False


@router.get("/order-info")
async def get_order_info_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get order info configuration."""
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "order_info"))
    config = result.scalar_one_or_none()
    if config is None:
        return OrderInfoConfig()
    return OrderInfoConfig(**config.value)


@router.put("/order-info")
async def update_order_info_config(
    body: OrderInfoConfig,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update order info configuration."""
    config = SystemConfig(key="order_info", value=body.model_dump())
    await db.merge(config)
    await db.commit()
    return body


@router.get("/miniprogram")
async def get_miniprogram_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get miniprogram configuration."""
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "miniprogram"))
    config = result.scalar_one_or_none()
    if config is None:
        return MiniprogramConfig()
    return MiniprogramConfig(**config.value)


@router.put("/miniprogram")
async def update_miniprogram_config(
    body: MiniprogramConfig,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update miniprogram configuration."""
    config = SystemConfig(key="miniprogram", value=body.model_dump())
    await db.merge(config)
    await db.commit()
    return body
