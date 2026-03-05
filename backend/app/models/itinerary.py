import enum
from datetime import datetime, date

from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, Date, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ItineraryStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"


class Itinerary(Base):
    __tablename__ = "itineraries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200))
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[ItineraryStatus] = mapped_column(Enum(ItineraryStatus), default=ItineraryStatus.draft)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Extended fields
    adults: Mapped[int | None] = mapped_column(Integer)
    children: Mapped[int | None] = mapped_column(Integer)
    departure_city: Mapped[str | None] = mapped_column(String(100))
    return_city: Mapped[str | None] = mapped_column(String(100))
    destination: Mapped[str | None] = mapped_column(String(200))
    highlights: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    cover_images: Mapped[dict | None] = mapped_column(JSONB)
    pace: Mapped[str | None] = mapped_column(String(20))
    raw_text_input: Mapped[str | None] = mapped_column(Text)

    # Plan library fields
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    destination_tags: Mapped[dict | None] = mapped_column(JSONB)

    days: Mapped[list["ItineraryDay"]] = relationship(back_populates="itinerary", order_by="ItineraryDay.day_number", cascade="all, delete-orphan")


class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    itinerary_id: Mapped[int] = mapped_column(ForeignKey("itineraries.id", ondelete="CASCADE"))
    day_number: Mapped[int] = mapped_column(Integer)
    date: Mapped[date | None] = mapped_column(Date)
    title: Mapped[str | None] = mapped_column(String(200))

    # Extended fields
    city_route: Mapped[str | None] = mapped_column(String(200))
    location_desc: Mapped[str | None] = mapped_column(Text)
    attractions: Mapped[str | None] = mapped_column(Text)
    transport_info: Mapped[str | None] = mapped_column(Text)
    accommodation: Mapped[str | None] = mapped_column(Text)
    accommodation_rating: Mapped[int | None] = mapped_column(Integer, default=5)
    daily_notes: Mapped[str | None] = mapped_column(Text)
    images: Mapped[dict | None] = mapped_column(JSONB)

    itinerary: Mapped[Itinerary] = relationship(back_populates="days")
    items: Mapped[list["ItineraryItem"]] = relationship(back_populates="day", order_by="ItineraryItem.sort_order", cascade="all, delete-orphan")


class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    day_id: Mapped[int] = mapped_column(ForeignKey("itinerary_days.id", ondelete="CASCADE"))
    poi_id: Mapped[int | None] = mapped_column(ForeignKey("pois.id"))
    time_start: Mapped[str | None] = mapped_column(String(10))
    time_end: Mapped[str | None] = mapped_column(String(10))
    description: Mapped[str | None] = mapped_column(Text)
    transport: Mapped[str | None] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    day: Mapped[ItineraryDay] = relationship(back_populates="items")
