"""Seed script to create initial admin user and sample data."""
import asyncio

from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, async_session, Base
from app.models.user import User, Team, UserRole
from app.models.settings import DealTag, SystemConfig  # noqa: F401
from app.models.pricing import ItineraryPricing, FeeTemplate  # noqa: F401

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Check if admin exists
        result = await session.execute(select(User).where(User.email == "admin@admin.com"))
        if result.scalar_one_or_none():
            print("Seed data already exists, skipping.")
            return

        # Create default team
        team = Team(name="总部", description="奢享家总部团队")
        session.add(team)
        await session.flush()

        # Create admin user
        admin = User(
            email="admin@admin.com",
            phone="13800000000",
            password_hash=pwd_context.hash("admin1234"),
            name="管理员",
            role=UserRole.admin,
            team_id=team.id,
        )
        session.add(admin)

        # Create sample users for each role
        roles_data = [
            ("sales@test.com", "13800000001", "张三", UserRole.sales),
            ("planner@test.com", "13800000002", "李四", UserRole.planner),
            ("finance@test.com", "13800000003", "王五", UserRole.finance),
            ("operation@test.com", "13800000004", "赵六", UserRole.operation),
        ]
        for email, phone, name, role in roles_data:
            user = User(
                email=email,
                phone=phone,
                password_hash=pwd_context.hash("123456"),
                name=name,
                role=role,
                team_id=team.id,
            )
            session.add(user)

        # Create default deal tags
        tags = [
            ("VIP客户", "#c3b07d"),
            ("蜜月", "#ef4444"),
            ("家庭游", "#22c55e"),
            ("商务", "#3b82f6"),
            ("定制", "#a855f7"),
        ]
        for tag_name, color in tags:
            session.add(DealTag(name=tag_name, color=color))

        # Create default fee templates
        session.add(FeeTemplate(
            name="默认费用包含",
            type="included",
            content="✅【用车】：全程专车接送\n✅【司机】司机1名，不陪同进景区\n✅【住宿】：行程所列酒店住宿\n✅【门票】：行程所列景点首道门票\n✅【保险】80万高额旅游意外险/人\n✅【合同】签署国家旅游局监管平台12301全国旅游合同（12301官网可查）",
            is_default=True,
        ))
        session.add(FeeTemplate(
            name="默认费用不含",
            type="excluded",
            content="往返机票✈\n正餐餐费🍜\n费用包含中未提及的个人消费",
            is_default=True,
        ))
        session.add(FeeTemplate(
            name="默认费用说明",
            type="notes",
            content="酒店退改以酒店具体政策为准",
            is_default=True,
        ))

        await session.commit()
        print("Seed data created successfully!")
        print("Admin login: admin / admin1234")


if __name__ == "__main__":
    asyncio.run(seed())
