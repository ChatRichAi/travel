from datetime import datetime, date

from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, Text, Date, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ItineraryPricing(Base):
    __tablename__ = "itinerary_pricings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    itinerary_id: Mapped[int] = mapped_column(ForeignKey("itineraries.id", ondelete="CASCADE"), unique=True)
    quote_date: Mapped[date | None] = mapped_column(Date)
    valid_until: Mapped[date | None] = mapped_column(Date)
    adult_count: Mapped[int] = mapped_column(Integer, default=2)
    child_count: Mapped[int] = mapped_column(Integer, default=0)

    # Cost categories (JSONB): {items:[{name,adult_price,child_price,quantity,days,subtotal}], adult_total, child_total, total}
    vehicle_costs: Mapped[dict | None] = mapped_column(JSONB)
    accommodation_costs: Mapped[dict | None] = mapped_column(JSONB)
    ticket_costs: Mapped[dict | None] = mapped_column(JSONB)
    insurance_costs: Mapped[dict | None] = mapped_column(JSONB)
    special_costs: Mapped[dict | None] = mapped_column(JSONB)

    # Computed totals
    cost_total: Mapped[float] = mapped_column(Float, default=0)
    profit_margin: Mapped[float] = mapped_column(Float, default=0.25)
    quote_total: Mapped[float] = mapped_column(Float, default=0)
    estimated_profit: Mapped[float] = mapped_column(Float, default=0)
    per_adult_price: Mapped[float | None] = mapped_column(Float)
    per_child_price: Mapped[float | None] = mapped_column(Float)
    show_price: Mapped[bool] = mapped_column(Boolean, default=False)

    # Fee notes
    fees_included: Mapped[str | None] = mapped_column(Text)
    fees_excluded: Mapped[str | None] = mapped_column(Text)
    fee_notes: Mapped[str | None] = mapped_column(Text)
    extra_notes: Mapped[str | None] = mapped_column(Text)

    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class FeeTemplate(Base):
    __tablename__ = "fee_templates"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(20))  # "included" or "excluded" or "notes"
    content: Mapped[str] = mapped_column(Text)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
