import os
import uuid
from datetime import datetime
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.material import Material
from app.models.user import User
from app.schemas.common import PaginatedResponse

router = APIRouter()


# ---------- Schemas ----------
class MaterialCreate(BaseModel):
    name: str
    type: str  # image, video, document, template
    url: str
    category: str | None = None
    tags: dict | None = None
    file_size: int | None = None


class MaterialUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    tags: dict | None = None


class MaterialResponse(BaseModel):
    id: int
    name: str
    type: str
    url: str
    category: str | None = None
    tags: dict | None = None
    file_size: int | None = None
    uploaded_by: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------- GET / ----------
@router.get("", response_model=PaginatedResponse[MaterialResponse])
async def list_materials(
    search: str | None = None,
    type: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List materials with search and filters."""
    query = select(Material)
    count_query = select(func.count()).select_from(Material)

    if search:
        search_filter = or_(
            Material.name.ilike(f"%{search}%"),
            Material.category.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if type:
        query = query.where(Material.type == type)
        count_query = count_query.where(Material.type == type)

    if category:
        query = query.where(Material.category == category)
        count_query = count_query.where(Material.category == category)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Material.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[MaterialResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- GET /{id} ----------
@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single material by ID."""
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if material is None:
        raise HTTPException(status_code=404, detail="素材不存在")
    return MaterialResponse.model_validate(material)


# ---------- POST / ----------
@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_material(
    body: MaterialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new material record."""
    material = Material(
        **body.model_dump(),
        uploaded_by=current_user.id,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return MaterialResponse.model_validate(material)


# ---------- POST /upload (placeholder) ----------
@router.post("/upload", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    file: UploadFile = File(...),
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a file and create a material record."""
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    unique_filename = f"{uuid.uuid4()}{Path(file.filename).suffix}" if file.filename else f"{uuid.uuid4()}"
    file_path = os.path.join(upload_dir, unique_filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(await file.read())

    file_url = f"/uploads/{unique_filename}"
    file_size = file.size or 0

    # Determine type from content type
    content_type = file.content_type or ""
    if content_type.startswith("image/"):
        material_type = "image"
    elif content_type.startswith("video/"):
        material_type = "video"
    else:
        material_type = "document"

    material = Material(
        name=file.filename or "untitled",
        type=material_type,
        url=file_url,
        category=category,
        file_size=file_size,
        uploaded_by=current_user.id,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return MaterialResponse.model_validate(material)


# ---------- PUT /{id} ----------
@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: int,
    body: MaterialUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a material record."""
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if material is None:
        raise HTTPException(status_code=404, detail="素材不存在")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(material, key, value)

    await db.commit()
    await db.refresh(material)
    return MaterialResponse.model_validate(material)


# ---------- DELETE /{id} ----------
@router.delete("/{material_id}")
async def delete_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a material."""
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if material is None:
        raise HTTPException(status_code=404, detail="素材不存在")

    await db.delete(material)
    await db.commit()
    return {"message": "素材已删除"}
