import enum
from datetime import datetime, date

from sqlalchemy import String, Float, Integer, ForeignKey, Text, Date, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OrderStatus(str, enum.Enum):
    draft = "draft"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(100))
    customer_phone: Mapped[str | None] = mapped_column(String(20))
    customer_email: Mapped[str | None] = mapped_column(String(255))
    travel_start: Mapped[date | None] = mapped_column(Date)
    travel_end: Mapped[date | None] = mapped_column(Date)
    destination: Mapped[str | None] = mapped_column(String(200))
    pax_count: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.draft)
    total_amount: Mapped[float] = mapped_column(Float, default=0)
    cost_amount: Mapped[float] = mapped_column(Float, default=0)
    itinerary_id: Mapped[int | None] = mapped_column(ForeignKey("itineraries.id"))
    salesperson_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    planner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    deal_tags: Mapped[dict | None] = mapped_column(JSONB)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
