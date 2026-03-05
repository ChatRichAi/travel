import enum
from datetime import datetime

from sqlalchemy import String, Float, ForeignKey, Text, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PaymentType(str, enum.Enum):
    sales_pay = "sales_pay"
    sales_receive = "sales_receive"
    planner_pay = "planner_pay"
    planner_receive = "planner_receive"
    supplier = "supplier"
    customer_collection = "customer_collection"
    local_agent = "local_agent"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    paid = "paid"
    rejected = "rejected"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"))
    type: Mapped[PaymentType] = mapped_column(Enum(PaymentType))
    amount: Mapped[float] = mapped_column(Float)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending)
    payer: Mapped[str | None] = mapped_column(String(200))
    payee: Mapped[str | None] = mapped_column(String(200))
    method: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text)
    attachment_url: Mapped[str | None] = mapped_column(String(500))
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class InvoiceStatus(str, enum.Enum):
    pending = "pending"
    issued = "issued"
    cancelled = "cancelled"


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    payment_id: Mapped[int | None] = mapped_column(ForeignKey("payments.id"))
    invoice_no: Mapped[str] = mapped_column(String(100), unique=True)
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus), default=InvoiceStatus.pending)
    file_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
