from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.wechat import WechatArticle, ArticleStatus
from app.models.user import User
from app.schemas.common import PaginatedResponse

router = APIRouter()


# ---------- Schemas ----------
class ArticleCreate(BaseModel):
    title: str
    content: str | None = None
    cover_image: str | None = None


class ArticleUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    cover_image: str | None = None
    status: str | None = None


class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str | None = None
    cover_image: str | None = None
    status: str
    author_id: int | None = None
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- GET / ----------
@router.get("", response_model=PaginatedResponse[ArticleResponse])
async def list_articles(
    search: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List WeChat articles with search and status filter."""
    query = select(WechatArticle)
    count_query = select(func.count()).select_from(WechatArticle)

    if search:
        search_filter = WechatArticle.title.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status:
        query = query.where(WechatArticle.status == status)
        count_query = count_query.where(WechatArticle.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(WechatArticle.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[ArticleResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ---------- GET /{id} ----------
@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single article by ID."""
    result = await db.execute(select(WechatArticle).where(WechatArticle.id == article_id))
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="文章不存在")
    return ArticleResponse.model_validate(article)


# ---------- POST / ----------
@router.post("", response_model=ArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    body: ArticleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new WeChat article."""
    article = WechatArticle(
        **body.model_dump(),
        author_id=current_user.id,
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)
    return ArticleResponse.model_validate(article)


# ---------- PUT /{id} ----------
@router.put("/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: int,
    body: ArticleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a WeChat article."""
    result = await db.execute(select(WechatArticle).where(WechatArticle.id == article_id))
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="文章不存在")

    update_data = body.model_dump(exclude_unset=True)

    # If publishing, set published_at
    if update_data.get("status") == "published" and article.published_at is None:
        article.published_at = datetime.now()

    for key, value in update_data.items():
        setattr(article, key, value)

    await db.commit()
    await db.refresh(article)
    return ArticleResponse.model_validate(article)


# ---------- DELETE /{id} ----------
@router.delete("/{article_id}")
async def delete_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a WeChat article."""
    result = await db.execute(select(WechatArticle).where(WechatArticle.id == article_id))
    article = result.scalar_one_or_none()
    if article is None:
        raise HTTPException(status_code=404, detail="文章不存在")

    await db.delete(article)
    await db.commit()
    return {"message": "文章已删除"}
