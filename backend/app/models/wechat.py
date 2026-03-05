import enum
from datetime import datetime

from sqlalchemy import String, ForeignKey, Text, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ArticleStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class WechatArticle(Base):
    __tablename__ = "wechat_articles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str | None] = mapped_column(Text)
    cover_image: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[ArticleStatus] = mapped_column(Enum(ArticleStatus), default=ArticleStatus.draft)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
