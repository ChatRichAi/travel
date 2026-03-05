import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, chat, team, poi, itinerary, order, payment, contract, insurance, materials, finance, wechat, admin_settings, pricing

app = FastAPI(title="我的家定制游 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(team.router, prefix="/api/team", tags=["team"])
app.include_router(poi.router, prefix="/api/poi", tags=["poi"])
app.include_router(itinerary.router, prefix="/api/itinerary", tags=["itinerary"])
app.include_router(order.router, prefix="/api/order", tags=["order"])
app.include_router(payment.router, prefix="/api/payment", tags=["payment"])
app.include_router(contract.router, prefix="/api/contract", tags=["contract"])
app.include_router(insurance.router, prefix="/api/insurance", tags=["insurance"])
app.include_router(materials.router, prefix="/api/materials", tags=["materials"])
app.include_router(finance.router, prefix="/api/finance", tags=["finance"])
app.include_router(wechat.router, prefix="/api/wechat", tags=["wechat"])
app.include_router(admin_settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(pricing.router, prefix="/api/pricing", tags=["pricing"])

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
