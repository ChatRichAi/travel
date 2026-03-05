import enum
from datetime import datetime, date

from sqlalchemy import String, Float, ForeignKey, Text, Date, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class InsuranceStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"


class Insurance(Base):
    __tablename__ = "insurances"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"))
    policy_no: Mapped[str] = mapped_column(String(100), unique=True)
    provider: Mapped[str | None] = mapped_column(String(200))
    type: Mapped[str | None] = mapped_column(String(50))
    coverage: Mapped[str | None] = mapped_column(Text)
    premium: Mapped[float] = mapped_column(Float, default=0)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[InsuranceStatus] = mapped_column(Enum(InsuranceStatus), default=InsuranceStatus.active)
    beneficiaries: Mapped[dict | None] = mapped_column(JSONB)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
