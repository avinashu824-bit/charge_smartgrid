from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.database import get_db
from datetime import datetime

router = APIRouter(prefix="/api/tod", tags=["tod"])


class TodBand(BaseModel):
    zone_id: int
    label: str
    start_hour: int
    end_hour: int
    price_inr_kwh: float
    discount_pct: float = 0.0
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None


@router.get("/bands")
async def get_tod_bands(zone_id: Optional[int] = Query(None), db: AsyncSession = Depends(get_db)):
    where = "WHERE zone_id = :zone_id" if zone_id else ""
    params = {"zone_id": zone_id} if zone_id else {}
    result = await db.execute(text(f"""
        SELECT tb.id, tb.zone_id, z.name as zone_name, tb.label,
               tb.start_hour, tb.end_hour, tb.price_inr_kwh, tb.discount_pct,
               tb.valid_from, tb.valid_to
        FROM tod_bands tb
        LEFT JOIN zones z ON z.id = tb.zone_id
        {where}
        ORDER BY tb.zone_id, tb.start_hour
    """), params)
    return [dict(r) for r in result.mappings().all()]


@router.get("/current-price")
async def current_price(station_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    hour = datetime.utcnow().hour + 5  # IST offset approx
    result = await db.execute(text("""
        SELECT tb.price_inr_kwh, tb.label, tb.discount_pct
        FROM tod_bands tb
        JOIN charging_stations cs ON cs.transformer_id IN (
            SELECT t.id FROM transformers t
            JOIN zones z ON z.id = t.zone_id
            WHERE t.id = cs.transformer_id
        )
        WHERE cs.id = :sid
          AND tb.zone_id = (
            SELECT t.zone_id FROM transformers t
            JOIN charging_stations cs2 ON cs2.transformer_id = t.id
            WHERE cs2.id = :sid LIMIT 1
          )
          AND :hour BETWEEN tb.start_hour AND tb.end_hour
        LIMIT 1
    """), {"sid": station_id, "hour": hour % 24})
    row = result.mappings().first()
    if row:
        return dict(row)
    # Default fallback
    cs_result = await db.execute(text(
        "SELECT current_price_inr FROM charging_stations WHERE id = :id"
    ), {"id": station_id})
    cs = cs_result.mappings().first()
    return {"price_inr_kwh": cs["current_price_inr"] if cs else 12.0, "label": "Standard", "discount_pct": 0}


@router.get("/nudge")
async def get_nudge(station_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    """Return off-peak nudge message for a station."""
    cs_result = await db.execute(text(
        "SELECT current_price_inr FROM charging_stations WHERE id = :id"
    ), {"id": station_id})
    cs = cs_result.mappings().first()
    current_price = cs["current_price_inr"] if cs else 12.0
    off_peak_price = 8.0
    session_kwh = 15.0  # avg session
    savings = round((current_price - off_peak_price) * session_kwh)
    return {
        "message": f"Charge after 11 PM for {round((1 - off_peak_price/current_price)*100)}% off",
        "detail": f"Off-peak rate ₹{off_peak_price}/kWh vs current ₹{current_price}/kWh",
        "savings_inr": savings,
        "off_peak_start": "23:00",
        "off_peak_end": "06:00",
        "off_peak_price": off_peak_price
    }


@router.put("/bands")
async def upsert_tod_bands(bands: List[TodBand], db: AsyncSession = Depends(get_db)):
    """Upsert ToD bands for a zone (discom admin)."""
    # Delete existing for the zone
    if bands:
        await db.execute(text("DELETE FROM tod_bands WHERE zone_id = :zone_id"),
                         {"zone_id": bands[0].zone_id})
    for band in bands:
        await db.execute(text("""
            INSERT INTO tod_bands (zone_id, label, start_hour, end_hour, price_inr_kwh, discount_pct, valid_from, valid_to)
            VALUES (:zone_id, :label, :start_hour, :end_hour, :price, :disc, :vf, :vt)
        """), {
            "zone_id": band.zone_id, "label": band.label,
            "start_hour": band.start_hour, "end_hour": band.end_hour,
            "price": band.price_inr_kwh, "disc": band.discount_pct,
            "vf": band.valid_from, "vt": band.valid_to
        })
    await db.commit()
    return {"status": "ok", "updated": len(bands)}
