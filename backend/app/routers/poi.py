from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.poi import POI
from app.models.user import User
from app.schemas.common import PaginatedResponse

router = APIRouter()


# ---------- Schemas ----------
class POICreate(BaseModel):
    name: str
    type: str
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    images: dict | None = None
    rating: float | None = None
    tags: dict | None = None
    price_range: str | None = None
    contact: str | None = None


class POIUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    images: dict | None = None
    rating: float | None = None
    tags: dict | None = None
    price_range: str | None = None
    contact: str | None = None


class POIResponse(BaseModel):
    id: int
    name: str
    type: str
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    images: dict | None = None
    rating: float | None = None
    tags: dict | None = None
    price_range: str | None = None
    contact: str | None = None
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- GET / ----------
@router.get("", response_model=PaginatedResponse[POIResponse])
async def list_pois(
    search: str | None = None,
    type: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List POIs with search and filter."""
    query = select(POI)
    count_query = select(func.count()).select_from(POI)

    if search:
        search_filter = or_(
            POI.name.ilike(f"%{search}%"),
            POI.location.ilike(f"%{search}%"),
            POI.description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if type:
        query = query.where(POI.type == type)
        count_query = count_query.where(POI.type == type)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(POI.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[POIResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- GET /{id} ----------
@router.get("/{poi_id}", response_model=POIResponse)
async def get_poi(
    poi_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single POI by ID."""
    result = await db.execute(select(POI).where(POI.id == poi_id))
    poi = result.scalar_one_or_none()
    if poi is None:
        raise HTTPException(status_code=404, detail="POI不存在")
    return POIResponse.model_validate(poi)


# ---------- POST / ----------
@router.post("", response_model=POIResponse, status_code=status.HTTP_201_CREATED)
async def create_poi(
    body: POICreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new POI."""
    poi = POI(**body.model_dump(), created_by=current_user.id)
    db.add(poi)
    await db.commit()
    await db.refresh(poi)
    return POIResponse.model_validate(poi)


# ---------- PUT /{id} ----------
@router.put("/{poi_id}", response_model=POIResponse)
async def update_poi(
    poi_id: int,
    body: POIUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a POI."""
    result = await db.execute(select(POI).where(POI.id == poi_id))
    poi = result.scalar_one_or_none()
    if poi is None:
        raise HTTPException(status_code=404, detail="POI不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(poi, key, value)

    await db.commit()
    await db.refresh(poi)
    return POIResponse.model_validate(poi)


# ---------- DELETE /{id} ----------
@router.delete("/{poi_id}")
async def delete_poi(
    poi_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a POI."""
    result = await db.execute(select(POI).where(POI.id == poi_id))
    poi = result.scalar_one_or_none()
    if poi is None:
        raise HTTPException(status_code=404, detail="POI不存在")

    await db.delete(poi)
    await db.commit()
    return {"message": "POI已删除"}
