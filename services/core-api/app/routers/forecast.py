from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import List
from app.database import get_db
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("/city")
async def city_forecast(db: AsyncSession = Depends(get_db)):
    """Aggregate 24-hour city-wide load forecast."""
    result = await db.execute(text(
        "SELECT id, current_load_kw, capacity_kva FROM transformers"
    ))
    transformers = result.mappings().all()
    total_load = sum(float(t["current_load_kw"] or 0) for t in transformers)
    total_cap = sum(float(t["capacity_kva"] or 0) for t in transformers)

    profile = [0.40,0.35,0.30,0.28,0.30,0.36,0.55,0.75,0.88,0.92,
               0.82,0.66,0.61,0.59,0.61,0.67,0.74,0.84,0.93,0.89,
               0.77,0.66,0.56,0.46]
    peak = max(profile)
    now = datetime.utcnow()
    forecast = []
    for h, p in enumerate(profile):
        load_mw = total_load * p / peak / 1000
        forecast.append({
            "hour": h,
            "timestamp": (now + timedelta(hours=h)).strftime("%H:00"),
            "load_mw": round(load_mw, 2),
            "stress_pct": round(load_mw * 1000 / max(total_cap * 0.8, 1) * 100, 1)
        })
    return {
        "total_transformers": len(transformers),
        "current_total_load_mw": round(total_load / 1000, 2),
        "total_capacity_mva": round(total_cap / 1000, 2),
        "forecast_24h": forecast
    }
