import enum
from datetime import datetime, date

from sqlalchemy import String, Float, ForeignKey, Text, Date, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ContractStatus(str, enum.Enum):
    draft = "draft"
    signed = "signed"
    expired = "expired"
    cancelled = "cancelled"


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"))
    contract_no: Mapped[str] = mapped_column(String(100), unique=True)
    subject: Mapped[str | None] = mapped_column(String(200))
    type: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[ContractStatus] = mapped_column(Enum(ContractStatus), default=ContractStatus.draft)
    parties: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[float] = mapped_column(Float, default=0)
    sign_date: Mapped[date | None] = mapped_column(Date)
    expire_date: Mapped[date | None] = mapped_column(Date)
    file_url: Mapped[str | None] = mapped_column(String(500))
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
