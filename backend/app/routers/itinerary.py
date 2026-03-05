import json
import os
import uuid
from datetime import datetime, date
from datetime import date as DateType
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form as FastAPIForm, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db, async_session
from app.middleware.auth import get_current_user
from app.models.itinerary import Itinerary, ItineraryDay, ItineraryItem, ItineraryStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.services.itinerary_generator import generate_itinerary_stream, parse_text_to_itinerary_stream

router = APIRouter()


# ---------- Schemas ----------
class ItineraryItemCreate(BaseModel):
    poi_id: int | None = None
    time_start: str | None = None
    time_end: str | None = None
    description: str | None = None
    transport: str | None = None
    sort_order: int = 0


class ItineraryItemResponse(BaseModel):
    id: int
    day_id: int
    poi_id: int | None = None
    time_start: str | None = None
    time_end: str | None = None
    description: str | None = None
    transport: str | None = None
    sort_order: int

    model_config = {"from_attributes": True}


class ItineraryDayCreate(BaseModel):
    day_number: int
    date: Optional[DateType] = None
    title: str | None = None
    items: list[ItineraryItemCreate] = []


class ItineraryDayResponse(BaseModel):
    id: int
    itinerary_id: int
    day_number: int
    date: Optional[DateType] = None
    title: str | None = None
    city_route: str | None = None
    location_desc: str | None = None
    attractions: str | None = None
    transport_info: str | None = None
    accommodation: str | None = None
    accommodation_rating: int | None = None
    daily_notes: str | None = None
    images: dict | None = None
    items: list[ItineraryItemResponse] = []

    model_config = {"from_attributes": True}


class ItineraryCreate(BaseModel):
    title: str
    order_id: int | None = None
    start_date: Optional[DateType] = None
    end_date: Optional[DateType] = None
    days: list[ItineraryDayCreate] = []


class ItineraryUpdate(BaseModel):
    title: str | None = None
    order_id: int | None = None
    start_date: Optional[DateType] = None
    end_date: Optional[DateType] = None
    status: str | None = None
    adults: int | None = None
    children: int | None = None
    departure_city: str | None = None
    return_city: str | None = None
    destination: str | None = None
    highlights: str | None = None
    notes: str | None = None
    cover_images: list | None = None
    pace: str | None = None
    is_shared: bool | None = None
    is_featured: bool | None = None
    is_closed: bool | None = None


class ItineraryResponse(BaseModel):
    id: int
    title: str
    order_id: int | None = None
    start_date: Optional[DateType] = None
    end_date: Optional[DateType] = None
    status: str
    adults: int | None = None
    children: int | None = None
    departure_city: str | None = None
    return_city: str | None = None
    destination: str | None = None
    highlights: str | None = None
    notes: str | None = None
    cover_images: list | None = None
    pace: str | None = None
    is_shared: bool = False
    is_featured: bool = False
    is_closed: bool = False
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime
    days: list[ItineraryDayResponse] = []

    model_config = {"from_attributes": True}


class ItineraryListResponse(BaseModel):
    id: int
    title: str
    order_id: int | None = None
    start_date: Optional[DateType] = None
    end_date: Optional[DateType] = None
    status: str
    destination: str | None = None
    highlights: str | None = None
    is_shared: bool = False
    is_featured: bool = False
    is_closed: bool = False
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- Schema: Generate Request ----------
class ItineraryGenerateRequest(BaseModel):
    title: str
    start_date: str  # "YYYY-MM-DD"
    end_date: str
    adults: int = 2
    children: int = 0
    departure_city: str = ""
    return_city: str = ""
    destination: str
    attractions: str = ""
    pace: str = "standard"  # compact/standard/relaxed/any
    notes: str = ""


# ---------- POST /generate/stream ----------
@router.post("/generate/stream")
async def generate_itinerary_sse(
    body: ItineraryGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate an itinerary via LangChain and stream results as SSE."""

    async def event_stream():
        itinerary_data = None
        try:
            async for chunk in generate_itinerary_stream(body.model_dump()):
                if "error" in chunk:
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                    return

                if chunk.get("done"):
                    itinerary_data = chunk.get("itinerary")
                    # Save to database
                    itinerary_id = None
                    if itinerary_data:
                        try:
                            itinerary_id = await _save_itinerary_to_db(
                                itinerary_data, body, current_user.id
                            )
                        except Exception as e:
                            yield f"data: {json.dumps({'error': f'保存失败: {str(e)}'}, ensure_ascii=False)}\n\n"
                            return

                    yield f"data: {json.dumps({'done': True, 'itinerary_id': itinerary_id}, ensure_ascii=False)}\n\n"
                else:
                    yield f"data: {json.dumps({'content': chunk.get('content', '')}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'生成失败: {str(e)}'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ---------- Schema: Parse Text Request ----------
class ItineraryParseTextRequest(BaseModel):
    raw_text: str
    title: str = "定制行程"
    adults: int = 2
    children: int = 0


# ---------- POST /parse-text/stream ----------
@router.post("/parse-text/stream")
async def parse_text_itinerary_sse(
    body: ItineraryParseTextRequest,
    current_user: User = Depends(get_current_user),
):
    """Parse pasted text into a structured itinerary via LLM and stream as SSE."""

    async def event_stream():
        try:
            async for chunk in parse_text_to_itinerary_stream(body.model_dump()):
                if "error" in chunk:
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                    return

                if chunk.get("done"):
                    itinerary_data = chunk.get("itinerary")
                    itinerary_id = None
                    if itinerary_data:
                        try:
                            itinerary_id = await _save_parsed_itinerary_to_db(
                                itinerary_data, body, current_user.id
                            )
                        except Exception as e:
                            yield f"data: {json.dumps({'error': f'保存失败: {str(e)}'}, ensure_ascii=False)}\n\n"
                            return

                    yield f"data: {json.dumps({'done': True, 'itinerary_id': itinerary_id}, ensure_ascii=False)}\n\n"
                else:
                    yield f"data: {json.dumps({'content': chunk.get('content', '')}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'解析失败: {str(e)}'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


async def _save_parsed_itinerary_to_db(
    itinerary_data: dict,
    request: ItineraryParseTextRequest,
    user_id: int,
) -> int:
    """Save parsed text itinerary to database."""
    async with async_session() as db:
        itinerary = Itinerary(
            title=itinerary_data.get("title", request.title),
            highlights=itinerary_data.get("highlights"),
            notes=itinerary_data.get("notes"),
            adults=request.adults,
            children=request.children,
            raw_text_input=request.raw_text,
            created_by=user_id,
        )
        db.add(itinerary)
        await db.flush()

        for day_data in itinerary_data.get("days", []):
            day = ItineraryDay(
                itinerary_id=itinerary.id,
                day_number=day_data.get("day_number", 1),
                title=day_data.get("title", ""),
                city_route=day_data.get("city_route"),
                location_desc=day_data.get("location_desc"),
                attractions=day_data.get("attractions"),
                transport_info=day_data.get("transport_info"),
                accommodation=day_data.get("accommodation"),
                accommodation_rating=day_data.get("accommodation_rating", 5),
                daily_notes=day_data.get("daily_notes"),
            )
            db.add(day)
            await db.flush()

            for item_data in day_data.get("items", []):
                item = ItineraryItem(
                    day_id=day.id,
                    time_start=item_data.get("time_start"),
                    time_end=item_data.get("time_end"),
                    description=item_data.get("description"),
                    transport=item_data.get("transport"),
                    sort_order=item_data.get("sort_order", 0),
                )
                db.add(item)

        await db.commit()
        return itinerary.id


async def _save_itinerary_to_db(
    itinerary_data: dict,
    request: ItineraryGenerateRequest,
    user_id: int,
) -> int:
    """Save generated itinerary to database, return itinerary id."""
    async with async_session() as db:
        itinerary = Itinerary(
            title=itinerary_data.get("title", request.title),
            start_date=date.fromisoformat(request.start_date),
            end_date=date.fromisoformat(request.end_date),
            adults=request.adults,
            children=request.children,
            departure_city=request.departure_city or None,
            return_city=request.return_city or None,
            destination=request.destination,
            highlights=itinerary_data.get("highlights"),
            notes=itinerary_data.get("notes"),
            pace=request.pace,
            created_by=user_id,
        )
        db.add(itinerary)
        await db.flush()

        for day_data in itinerary_data.get("days", []):
            day = ItineraryDay(
                itinerary_id=itinerary.id,
                day_number=day_data.get("day_number", 1),
                title=day_data.get("title", ""),
                city_route=day_data.get("city_route"),
                location_desc=day_data.get("location_desc"),
                attractions=day_data.get("attractions"),
                transport_info=day_data.get("transport_info"),
                accommodation=day_data.get("accommodation"),
                accommodation_rating=day_data.get("accommodation_rating", 5),
                daily_notes=day_data.get("daily_notes"),
            )
            db.add(day)
            await db.flush()

            for item_data in day_data.get("items", []):
                item = ItineraryItem(
                    day_id=day.id,
                    time_start=item_data.get("time_start"),
                    time_end=item_data.get("time_end"),
                    description=item_data.get("description"),
                    transport=item_data.get("transport"),
                    sort_order=item_data.get("sort_order", 0),
                )
                db.add(item)

        await db.commit()
        return itinerary.id


# ---------- GET /latest ----------
@router.get("/latest")
async def get_latest_itinerary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the most recently updated itinerary for the current user."""
    result = await db.execute(
        select(Itinerary)
        .where(Itinerary.created_by == current_user.id)
        .order_by(Itinerary.updated_at.desc())
        .limit(1)
    )
    it = result.scalar_one_or_none()
    if not it:
        return None
    return {
        "id": it.id,
        "title": it.title,
        "destination": it.destination,
        "start_date": str(it.start_date) if it.start_date else None,
        "end_date": str(it.end_date) if it.end_date else None,
        "departure_city": it.departure_city,
        "return_city": it.return_city,
        "adults": it.adults,
        "children": it.children,
        "pace": it.pace,
        "highlights": it.highlights,
        "notes": it.notes,
    }


# ---------- GET / ----------
@router.get("", response_model=PaginatedResponse[ItineraryListResponse])
async def list_itineraries(
    order_id: int | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List itineraries with optional filters."""
    query = select(Itinerary)
    count_query = select(func.count()).select_from(Itinerary)

    if order_id is not None:
        query = query.where(Itinerary.order_id == order_id)
        count_query = count_query.where(Itinerary.order_id == order_id)

    if status:
        query = query.where(Itinerary.status == status)
        count_query = count_query.where(Itinerary.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Itinerary.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[ItineraryListResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- GET /library ----------
@router.get("/library", response_model=PaginatedResponse[ItineraryListResponse])
async def list_library(
    tab: str = Query("personal"),  # personal / closed / featured / shared
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List itineraries for plan library with tab filters."""
    query = select(Itinerary)
    count_query = select(func.count()).select_from(Itinerary)

    if tab == "personal":
        query = query.where(Itinerary.created_by == current_user.id)
        count_query = count_query.where(Itinerary.created_by == current_user.id)
    elif tab == "closed":
        query = query.where(Itinerary.is_closed == True)
        count_query = count_query.where(Itinerary.is_closed == True)
    elif tab == "featured":
        query = query.where(Itinerary.is_featured == True)
        count_query = count_query.where(Itinerary.is_featured == True)
    elif tab == "shared":
        query = query.where(Itinerary.is_shared == True)
        count_query = count_query.where(Itinerary.is_shared == True)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Itinerary.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[ItineraryListResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- PUT /{id}/tags ----------
class ItineraryTagsUpdate(BaseModel):
    is_shared: bool | None = None
    is_featured: bool | None = None
    is_closed: bool | None = None


@router.put("/{itinerary_id}/tags")
async def update_tags(
    itinerary_id: int,
    body: ItineraryTagsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update itinerary library tags."""
    result = await db.execute(select(Itinerary).where(Itinerary.id == itinerary_id))
    itinerary = result.scalar_one_or_none()
    if itinerary is None:
        raise HTTPException(status_code=404, detail="行程不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(itinerary, key, value)

    await db.commit()
    return {"message": "标签更新成功"}


# ---------- GET /{id} ----------
@router.get("/{itinerary_id}", response_model=ItineraryResponse)
async def get_itinerary(
    itinerary_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single itinerary with days and items."""
    result = await db.execute(
        select(Itinerary)
        .where(Itinerary.id == itinerary_id)
        .options(
            selectinload(Itinerary.days).selectinload(ItineraryDay.items)
        )
    )
    itinerary = result.scalar_one_or_none()
    if itinerary is None:
        raise HTTPException(status_code=404, detail="行程不存在")
    return ItineraryResponse.model_validate(itinerary)


# ---------- POST / ----------
@router.post("", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED)
async def create_itinerary(
    body: ItineraryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new itinerary with days and items."""
    itinerary = Itinerary(
        title=body.title,
        order_id=body.order_id,
        start_date=body.start_date,
        end_date=body.end_date,
        created_by=current_user.id,
    )
    db.add(itinerary)
    await db.flush()

    for day_data in body.days:
        day = ItineraryDay(
            itinerary_id=itinerary.id,
            day_number=day_data.day_number,
            date=day_data.date,
            title=day_data.title,
        )
        db.add(day)
        await db.flush()

        for item_data in day_data.items:
            item = ItineraryItem(
                day_id=day.id,
                **item_data.model_dump(),
            )
            db.add(item)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Itinerary)
        .where(Itinerary.id == itinerary.id)
        .options(
            selectinload(Itinerary.days).selectinload(ItineraryDay.items)
        )
    )
    itinerary = result.scalar_one()
    return ItineraryResponse.model_validate(itinerary)


# ---------- PUT /{id} ----------
@router.put("/{itinerary_id}", response_model=ItineraryResponse)
async def update_itinerary(
    itinerary_id: int,
    body: ItineraryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an itinerary's top-level fields."""
    result = await db.execute(
        select(Itinerary)
        .where(Itinerary.id == itinerary_id)
        .options(
            selectinload(Itinerary.days).selectinload(ItineraryDay.items)
        )
    )
    itinerary = result.scalar_one_or_none()
    if itinerary is None:
        raise HTTPException(status_code=404, detail="行程不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(itinerary, key, value)

    await db.commit()
    await db.refresh(itinerary)
    return ItineraryResponse.model_validate(itinerary)


# ---------- DELETE /{id} ----------
@router.delete("/{itinerary_id}")
async def delete_itinerary(
    itinerary_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an itinerary and all its days/items."""
    result = await db.execute(select(Itinerary).where(Itinerary.id == itinerary_id))
    itinerary = result.scalar_one_or_none()
    if itinerary is None:
        raise HTTPException(status_code=404, detail="行程不存在")

    await db.delete(itinerary)
    await db.commit()
    return {"message": "行程已删除"}


# ---------- POST /{id}/days ----------
@router.post("/{itinerary_id}/days", response_model=ItineraryDayResponse, status_code=status.HTTP_201_CREATED)
async def add_day(
    itinerary_id: int,
    body: ItineraryDayCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a day to an itinerary."""
    result = await db.execute(select(Itinerary).where(Itinerary.id == itinerary_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="行程不存在")

    day = ItineraryDay(
        itinerary_id=itinerary_id,
        day_number=body.day_number,
        date=body.date,
        title=body.title,
    )
    db.add(day)
    await db.flush()

    for item_data in body.items:
        item = ItineraryItem(day_id=day.id, **item_data.model_dump())
        db.add(item)

    await db.commit()

    result = await db.execute(
        select(ItineraryDay)
        .where(ItineraryDay.id == day.id)
        .options(selectinload(ItineraryDay.items))
    )
    day = result.scalar_one()
    return ItineraryDayResponse.model_validate(day)


# ---------- POST /days/{day_id}/items ----------
@router.post("/days/{day_id}/items", response_model=ItineraryItemResponse, status_code=status.HTTP_201_CREATED)
async def add_item(
    day_id: int,
    body: ItineraryItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add an item to a day."""
    result = await db.execute(select(ItineraryDay).where(ItineraryDay.id == day_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="行程日不存在")

    item = ItineraryItem(day_id=day_id, **body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return ItineraryItemResponse.model_validate(item)


# ---------- Schema: Day Update ----------
class ItineraryDayUpdate(BaseModel):
    title: str | None = None
    city_route: str | None = None
    location_desc: str | None = None
    attractions: str | None = None
    transport_info: str | None = None
    accommodation: str | None = None
    accommodation_rating: int | None = None
    daily_notes: str | None = None
    images: dict | None = None


# ---------- PUT /{id}/days/{day_id} ----------
@router.put("/{itinerary_id}/days/{day_id}", response_model=ItineraryDayResponse)
async def update_day(
    itinerary_id: int,
    day_id: int,
    body: ItineraryDayUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a single day's fields."""
    result = await db.execute(
        select(ItineraryDay)
        .where(ItineraryDay.id == day_id, ItineraryDay.itinerary_id == itinerary_id)
        .options(selectinload(ItineraryDay.items))
    )
    day = result.scalar_one_or_none()
    if day is None:
        raise HTTPException(status_code=404, detail="行程日不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(day, key, value)

    await db.commit()
    await db.refresh(day)
    return ItineraryDayResponse.model_validate(day)


# ---------- POST /{id}/days/{day_id}/upload-image ----------
@router.post("/{itinerary_id}/days/{day_id}/upload-image")
async def upload_day_image(
    itinerary_id: int,
    day_id: int,
    section: str = FastAPIForm(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload an image for a day section (location/attractions/transport/accommodation)."""
    valid_sections = {"location", "attractions", "transport", "accommodation"}
    if section not in valid_sections:
        raise HTTPException(status_code=400, detail=f"section 必须为 {valid_sections}")

    result = await db.execute(
        select(ItineraryDay)
        .where(ItineraryDay.id == day_id, ItineraryDay.itinerary_id == itinerary_id)
    )
    day = result.scalar_one_or_none()
    if day is None:
        raise HTTPException(status_code=404, detail="行程日不存在")

    # Save file
    upload_dir = "uploads/itinerary"
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "img.jpg")[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    file_url = f"/uploads/itinerary/{unique_name}"

    # Update images JSONB
    images = day.images or {}
    section_images = images.get(section, [])
    if len(section_images) >= 3:
        raise HTTPException(status_code=400, detail="每个分区最多上传3张图片")
    section_images.append(file_url)
    images[section] = section_images
    day.images = images

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(day, "images")

    await db.commit()
    return {"url": file_url, "images": images}


# ---------- DELETE /{id}/days/{day_id}/image ----------
@router.delete("/{itinerary_id}/days/{day_id}/image")
async def delete_day_image(
    itinerary_id: int,
    day_id: int,
    section: str = Query(...),
    url: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an image from a day section."""
    result = await db.execute(
        select(ItineraryDay)
        .where(ItineraryDay.id == day_id, ItineraryDay.itinerary_id == itinerary_id)
    )
    day = result.scalar_one_or_none()
    if day is None:
        raise HTTPException(status_code=404, detail="行程日不存在")

    images = day.images or {}
    section_images = images.get(section, [])
    if url in section_images:
        section_images.remove(url)
    images[section] = section_images
    day.images = images

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(day, "images")

    await db.commit()
    return {"images": images}
