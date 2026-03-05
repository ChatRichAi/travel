"""Pricing module: cost calculation, fee templates, and quote management."""

from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.pricing import ItineraryPricing, FeeTemplate
from app.models.user import User

router = APIRouter()


# ---------- Schemas ----------
class CostCategoryData(BaseModel):
    items: list[dict] = []
    adult_total: float = 0
    child_total: float = 0
    total: float = 0


class PricingCreate(BaseModel):
    quote_date: Optional[date] = None
    valid_until: Optional[date] = None
    adult_count: int = 2
    child_count: int = 0
    vehicle_costs: dict | None = None
    accommodation_costs: dict | None = None
    ticket_costs: dict | None = None
    insurance_costs: dict | None = None
    special_costs: dict | None = None
    profit_margin: float = 0.25
    fees_included: str | None = None
    fees_excluded: str | None = None
    fee_notes: str | None = None
    extra_notes: str | None = None
    show_price: bool = False


class PricingUpdate(PricingCreate):
    pass


class PricingResponse(BaseModel):
    id: int
    itinerary_id: int
    quote_date: Optional[date] = None
    valid_until: Optional[date] = None
    adult_count: int
    child_count: int
    vehicle_costs: dict | None = None
    accommodation_costs: dict | None = None
    ticket_costs: dict | None = None
    insurance_costs: dict | None = None
    special_costs: dict | None = None
    cost_total: float
    profit_margin: float
    quote_total: float
    estimated_profit: float
    per_adult_price: float | None = None
    per_child_price: float | None = None
    show_price: bool
    fees_included: str | None = None
    fees_excluded: str | None = None
    fee_notes: str | None = None
    extra_notes: str | None = None
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FeeTemplateCreate(BaseModel):
    name: str
    type: str  # "included" / "excluded" / "notes"
    content: str
    is_default: bool = False


class FeeTemplateResponse(BaseModel):
    id: int
    name: str
    type: str
    content: str
    is_default: bool
    created_by: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- Calculation ----------
def _calculate_pricing(pricing: ItineraryPricing) -> None:
    """Recalculate totals from cost categories."""
    total = 0.0
    for field in ("vehicle_costs", "accommodation_costs", "ticket_costs", "insurance_costs", "special_costs"):
        cat = getattr(pricing, field)
        if cat and isinstance(cat, dict):
            total += cat.get("total", 0)

    pricing.cost_total = total
    margin = pricing.profit_margin or 0.25
    if margin >= 1:
        margin = 0.25
    pricing.quote_total = total / (1 - margin) if margin < 1 else total
    pricing.estimated_profit = pricing.quote_total - total

    pax = (pricing.adult_count or 0) + (pricing.child_count or 0)
    if pax > 0:
        pricing.per_adult_price = pricing.quote_total / pax
        pricing.per_child_price = pricing.per_adult_price
    else:
        pricing.per_adult_price = pricing.quote_total
        pricing.per_child_price = 0


# ---------- GET /{itinerary_id} ----------
@router.get("/{itinerary_id}", response_model=PricingResponse)
async def get_pricing(
    itinerary_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ItineraryPricing).where(ItineraryPricing.itinerary_id == itinerary_id)
    )
    pricing = result.scalar_one_or_none()
    if pricing is None:
        raise HTTPException(status_code=404, detail="核价记录不存在")
    return PricingResponse.model_validate(pricing)


# ---------- POST /{itinerary_id} ----------
@router.post("/{itinerary_id}", response_model=PricingResponse, status_code=status.HTTP_201_CREATED)
async def create_pricing(
    itinerary_id: int,
    body: PricingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check not already exists
    result = await db.execute(
        select(ItineraryPricing).where(ItineraryPricing.itinerary_id == itinerary_id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该行程已有核价记录，请使用更新接口")

    pricing = ItineraryPricing(
        itinerary_id=itinerary_id,
        created_by=current_user.id,
        **body.model_dump(),
    )
    _calculate_pricing(pricing)

    db.add(pricing)
    await db.commit()
    await db.refresh(pricing)
    return PricingResponse.model_validate(pricing)


# ---------- PUT /{itinerary_id} ----------
@router.put("/{itinerary_id}", response_model=PricingResponse)
async def update_pricing(
    itinerary_id: int,
    body: PricingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ItineraryPricing).where(ItineraryPricing.itinerary_id == itinerary_id)
    )
    pricing = result.scalar_one_or_none()
    if pricing is None:
        raise HTTPException(status_code=404, detail="核价记录不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pricing, key, value)

    _calculate_pricing(pricing)

    from sqlalchemy.orm.attributes import flag_modified
    for field in ("vehicle_costs", "accommodation_costs", "ticket_costs", "insurance_costs", "special_costs"):
        if field in update_data:
            flag_modified(pricing, field)

    await db.commit()
    await db.refresh(pricing)
    return PricingResponse.model_validate(pricing)


# ---------- POST /{itinerary_id}/calculate ----------
@router.post("/{itinerary_id}/calculate", response_model=PricingResponse)
async def recalculate_pricing(
    itinerary_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ItineraryPricing).where(ItineraryPricing.itinerary_id == itinerary_id)
    )
    pricing = result.scalar_one_or_none()
    if pricing is None:
        raise HTTPException(status_code=404, detail="核价记录不存在")

    _calculate_pricing(pricing)
    await db.commit()
    await db.refresh(pricing)
    return PricingResponse.model_validate(pricing)


# ---------- Fee Templates ----------
@router.get("/templates/fees", response_model=list[FeeTemplateResponse])
async def list_fee_templates(
    type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(FeeTemplate)
    if type:
        query = query.where(FeeTemplate.type == type)
    result = await db.execute(query.order_by(FeeTemplate.created_at.desc()))
    return [FeeTemplateResponse.model_validate(t) for t in result.scalars().all()]


@router.post("/templates/fees", response_model=FeeTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_fee_template(
    body: FeeTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = FeeTemplate(
        **body.model_dump(),
        created_by=current_user.id,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return FeeTemplateResponse.model_validate(template)
