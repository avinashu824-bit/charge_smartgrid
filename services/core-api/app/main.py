"""
ChargeSmart Grid - Core API
Main FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import (
    auth,
    stations,
    transformers,
    forecast,
    siting,
    tod,
    operators,
    dashboard,
    simulation,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup / shutdown hooks."""
    # Tables are created via init.sql; no auto-create here.
    yield


app = FastAPI(
    title="ChargeSmart Grid - Core API",
    description="EV Charging Load Forecasting & Grid-Stress Advisory Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ──────────────────────────────────────────────────────────
# CORS  (open for demo; tighten for production)
# ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────
# ROUTERS
# ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(stations.router)
app.include_router(transformers.router)
app.include_router(forecast.router)
app.include_router(siting.router)
app.include_router(tod.router)
app.include_router(operators.router)
app.include_router(dashboard.router)
app.include_router(simulation.router)


# ──────────────────────────────────────────────────────────
# HEALTH CHECK
# ──────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "chargesmart-core-api", "version": "1.0.0"}
