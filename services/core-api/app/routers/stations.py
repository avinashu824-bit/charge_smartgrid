"""
ChargeSmart Grid - Stations Router
GET  /api/stations                         - list all stations
GET  /api/stations/{id}                    - station detail
PUT  /api/stations/{id}/price              - update price (operator)
GET  /api/stations/{id}/sessions           - recent sessions
POST /api/stations/{station_id}/coupons    - create off-peak coupon
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
import random

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter()


# ──────────────────────────────────────────────
# SCHEMAS
# ──────────────────────────────────────────────
class StationOut(BaseModel):
    id: int
    name: str
    address: str
    lat: float
    lng: float
    status: str
    current_price_inr: float
    available_slots: int
    total_slots: int
    avg_wait_minutes: int
    connector_types: List[str]
    operator_id: Optional[int]
    transformer_id: Optional[int]


class PriceUpdate(BaseModel):
    price_inr: float


class CouponCreate(BaseModel):
    discount_pct: float
    start_hour: int
    end_hour: int
    valid_days: int = 7


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────
def _row_to_station(row) -> dict:
    return {
        "id":                row.id,
        "name":              row.name,
        "address":           row.address or "",
        "lat":               row.lat,
        "lng":               row.lng,
        "status":            row.status,
        "current_price_inr": row.current_price_inr,
        "available_slots":   row.available_slots,
        "total_slots":       row.total_slots,
        "avg_wait_minutes":  row.avg_wait_minutes,
        "connector_types":   list(row.connector_types) if row.connector_types else [],
        "operator_id":       row.operator_id,
        "transformer_id":    row.transformer_id,
    }


# ──────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────
@router.get("", response_model=List[dict])
async def list_stations(
    lat:       Optional[float] = Query(None),
    lng:       Optional[float] = Query(None),
    radius_km: Optional[float] = Query(None, ge=0.1, le=100),
    db:        AsyncSession    = Depends(get_db),
):
    """Return all stations; if lat/lng/radius_km are supplied, filter by proximity."""
    if lat is not None and lng is not None and radius_km is not None:
        sql = text("""
            SELECT
                cs.id, cs.name, cs.address,
                ST_Y(cs.location::geometry) AS lat,
                ST_X(cs.location::geometry) AS lng,
                cs.status, cs.current_price_inr, cs.available_slots,
                cs.total_slots, cs.avg_wait_minutes, cs.connector_types,
                cs.operator_id, cs.transformer_id,
                ST_Distance(
                    cs.location::geography,
                    ST_MakePoint(:lng, :lat)::geography
                ) / 1000 AS distance_km
            FROM charging_stations cs
            WHERE ST_DWithin(
                cs.location::geography,
                ST_MakePoint(:lng, :lat)::geography,
                :radius_m
            )
            ORDER BY distance_km
        """)
        result = await db.execute(sql, {"lat": lat, "lng": lng, "radius_m": radius_km * 1000})
    else:
        sql = text("""
            SELECT
                cs.id, cs.name, cs.address,
                ST_Y(cs.location::geometry) AS lat,
                ST_X(cs.location::geometry) AS lng,
                cs.status, cs.current_price_inr, cs.available_slots,
                cs.total_slots, cs.avg_wait_minutes, cs.connector_types,
                cs.operator_id, cs.transformer_id
            FROM charging_stations cs
            ORDER BY cs.id
        """)
        result = await db.execute(sql)

    rows = result.fetchall()
    return [_row_to_station(r) for r in rows]


@router.get("/{station_id}", response_model=dict)
async def get_station(station_id: int, db: AsyncSession = Depends(get_db)):
    sql = text("""
        SELECT
            cs.id, cs.name, cs.address,
            ST_Y(cs.location::geometry) AS lat,
            ST_X(cs.location::geometry) AS lng,
            cs.status, cs.current_price_inr, cs.available_slots,
            cs.total_slots, cs.avg_wait_minutes, cs.connector_types,
            cs.operator_id, cs.transformer_id,
            t.feeder_id, t.capacity_kva, t.stress_score AS transformer_stress
        FROM charging_stations cs
        LEFT JOIN transformers t ON t.id = cs.transformer_id
        WHERE cs.id = :sid
    """)
    result = await db.execute(sql, {"sid": station_id})
    row = result.fetchone()
    if not row:
        raise HTTPException(404, f"Station {station_id} not found")

    # Synthetic 24h price history (last 24h, hourly)
    now = datetime.now(timezone.utc)
    price_history = []
    for h in range(24):
        ts = now - timedelta(hours=23 - h)
        # Simple ToD-inspired price variation
        hour = ts.hour
        if 7 <= hour < 11 or 17 <= hour < 21:
            p = 18.0
        elif 23 <= hour or hour < 6:
            p = 8.0
        else:
            p = 12.0
        price_history.append({"timestamp": ts.isoformat(), "price_inr": p})

    station = _row_to_station(row)
    station["feeder_id"]          = row.feeder_id
    station["capacity_kva"]       = row.capacity_kva
    station["transformer_stress"] = row.transformer_stress
    station["price_history_24h"]  = price_history
    return station


@router.put("/{station_id}/price", response_model=dict)
async def update_price(
    station_id: int,
    body:       PriceUpdate,
    db:         AsyncSession = Depends(get_db),
    current_user: dict      = Depends(get_current_user),
):
    if current_user.get("role") not in ("operator", "admin"):
        raise HTTPException(403, "Operator or admin access required")

    if body.price_inr < 0 or body.price_inr > 100:
        raise HTTPException(400, "Price must be between 0 and 100 INR/kWh")

    await db.execute(
        text("UPDATE charging_stations SET current_price_inr = :p WHERE id = :sid"),
        {"p": body.price_inr, "sid": station_id},
    )
    await db.commit()
    return {"station_id": station_id, "new_price_inr": body.price_inr, "updated": True}


@router.get("/{station_id}/sessions", response_model=List[dict])
async def station_sessions(
    station_id: int,
    limit:      int          = Query(20, ge=1, le=200),
    db:         AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT id, user_id, start_time, end_time, energy_kwh, cost_inr, connector_type
            FROM charging_sessions
            WHERE station_id = :sid
            ORDER BY start_time DESC
            LIMIT :lim
        """),
        {"sid": station_id, "lim": limit},
    )
    rows = result.fetchall()
    return [
        {
            "id":             r.id,
            "user_id":        r.user_id,
            "start_time":     r.start_time.isoformat() if r.start_time else None,
            "end_time":       r.end_time.isoformat()   if r.end_time   else None,
            "energy_kwh":     r.energy_kwh,
            "cost_inr":       r.cost_inr,
            "connector_type": r.connector_type,
        }
        for r in rows
    ]


@router.post("/{station_id}/coupons", response_model=dict)
async def create_coupon(
    station_id:   int,
    body:         CouponCreate,
    db:           AsyncSession = Depends(get_db),
    current_user: dict         = Depends(get_current_user),
):
    if current_user.get("role") not in ("operator", "admin"):
        raise HTTPException(403, "Operator or admin access required")

    # Validate station exists
    res = await db.execute(
        text("SELECT id, current_price_inr FROM charging_stations WHERE id = :sid"),
        {"sid": station_id},
    )
    station = res.fetchone()
    if not station:
        raise HTTPException(404, f"Station {station_id} not found")

    now = datetime.now(timezone.utc)
    valid_to = now + timedelta(days=body.valid_days)
    discounted_price = round(station.current_price_inr * (1 - body.discount_pct / 100), 2)

    coupon_code = f"OFFPEAK{random.randint(1000, 9999)}"
    return {
        "coupon_code":      coupon_code,
        "station_id":       station_id,
        "discount_pct":     body.discount_pct,
        "start_hour":       body.start_hour,
        "end_hour":         body.end_hour,
        "valid_until":      valid_to.isoformat(),
        "discounted_price": discounted_price,
        "message":          f"Use {coupon_code} to get {body.discount_pct}% off between {body.start_hour}:00–{body.end_hour}:00",
    }
