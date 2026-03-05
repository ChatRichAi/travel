from datetime import datetime

from sqlalchemy import String, Text, Float, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class POI(Base):
    __tablename__ = "pois"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(50))  # hotel, restaurant, attraction, transport
    location: Mapped[str | None] = mapped_column(String(500))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(Text)
    images: Mapped[dict | None] = mapped_column(JSONB)  # list of image URLs
    rating: Mapped[float | None] = mapped_column(Float)
    tags: Mapped[dict | None] = mapped_column(JSONB)  # list of tags
    price_range: Mapped[str | None] = mapped_column(String(100))
    contact: Mapped[str | None] = mapped_column(String(200))
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
