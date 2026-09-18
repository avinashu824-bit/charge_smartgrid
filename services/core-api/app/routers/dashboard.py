from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
import math, random
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/operator/{operator_id}")
async def operator_dashboard(operator_id: int, db: AsyncSession = Depends(get_db)):
    # Revenue today
    rev_today = await db.execute(text("""
        SELECT COALESCE(SUM(cost_inr),0) as revenue
        FROM charging_sessions cs
        JOIN charging_stations st ON st.id = cs.station_id
        WHERE st.operator_id = :oid
          AND cs.start_time >= CURRENT_DATE
    """), {"oid": operator_id})
    today = rev_today.scalar() or 0

    # Revenue this week
    rev_week = await db.execute(text("""
        SELECT COALESCE(SUM(cost_inr),0) as revenue
        FROM charging_sessions cs
        JOIN charging_stations st ON st.id = cs.station_id
        WHERE st.operator_id = :oid
          AND cs.start_time >= CURRENT_DATE - INTERVAL '7 days'
    """), {"oid": operator_id})
    week = rev_week.scalar() or 0

    # Station count
    st_result = await db.execute(text("""
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'GREEN' THEN 1 ELSE 0 END) as active
        FROM charging_stations WHERE operator_id = :oid
    """), {"oid": operator_id})
    st_row = st_result.mappings().first()
    total_stations = st_row["total"] if st_row else 0
    active_stations = st_row["active"] if st_row else 0

    # Avg utilization
    util_result = await db.execute(text("""
        SELECT COALESCE(AVG(
            1.0 - (available_slots::float / NULLIF(total_slots,0))
        ), 0) * 100 AS avg_util
        FROM charging_stations WHERE operator_id = :oid
    """), {"oid": operator_id})
    avg_util = round(util_result.scalar() or 0, 1)

    # Alerts (transformers at risk)
    alert_result = await db.execute(text("""
        SELECT t.feeder_id, t.stress_score, t.status, z.name as zone_name,
               ROUND(CAST((0.85 - t.stress_score) / 0.02 AS NUMERIC),1) AS hours_to_red
        FROM transformers t
        JOIN zones z ON z.id = t.zone_id
        JOIN charging_stations cs ON cs.transformer_id = t.id
        WHERE cs.operator_id = :oid AND t.stress_score > 0.72
        GROUP BY t.id, z.name
        ORDER BY t.stress_score DESC LIMIT 3
    """), {"oid": operator_id})
    alerts = [dict(r) for r in alert_result.mappings().all()]

    # Last 7 days revenue trend
    trend_result = await db.execute(text("""
        SELECT DATE(cs.start_time) as date,
               COALESCE(SUM(cs.cost_inr), 0) as revenue
        FROM charging_sessions cs
        JOIN charging_stations st ON st.id = cs.station_id
        WHERE st.operator_id = :oid
          AND cs.start_time >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(cs.start_time)
        ORDER BY date
    """), {"oid": operator_id})
    trend = [dict(r) for r in trend_result.mappings().all()]

    return {
        "revenue_today_inr": round(today, 2),
        "revenue_week_inr": round(week, 2),
        "avg_utilization_pct": avg_util,
        "total_stations": total_stations,
        "active_stations": active_stations,
        "alerts": alerts,
        "revenue_trend": trend
    }


@router.get("/operator/{operator_id}/utilization")
async def operator_utilization(operator_id: int, db: AsyncSession = Depends(get_db)):
    """Return hourly utilization heatmap data for last 7 days."""
    result = await db.execute(text("""
        SELECT EXTRACT(DOW FROM cs.start_time)::int AS day_of_week,
               EXTRACT(HOUR FROM cs.start_time)::int AS hour,
               COUNT(*) AS session_count
        FROM charging_sessions cs
        JOIN charging_stations st ON st.id = cs.station_id
        WHERE st.operator_id = :oid
          AND cs.start_time >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY day_of_week, hour
        ORDER BY day_of_week, hour
    """), {"oid": operator_id})
    rows = result.mappings().all()
    max_count = max((r["session_count"] for r in rows), default=1)
    return [{"day_of_week": r["day_of_week"], "hour": r["hour"],
             "count": r["session_count"],
             "pct": round(r["session_count"] / max_count * 100, 1)} for r in rows]


@router.get("/discom")
async def discom_dashboard(db: AsyncSession = Depends(get_db)):
    t_result = await db.execute(text("""
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status='RED' THEN 1 ELSE 0 END) as red_count,
               SUM(CASE WHEN status='YELLOW' THEN 1 ELSE 0 END) as yellow_count,
               SUM(CASE WHEN status='GREEN' THEN 1 ELSE 0 END) as green_count,
               COALESCE(SUM(current_load_kw), 0) / 1000.0 AS total_load_mw
        FROM transformers
    """))
    t = t_result.mappings().first()

    s_result = await db.execute(text("""
        SELECT COUNT(*) as total_stations,
               SUM(total_slots - available_slots) AS active_sessions
        FROM charging_stations
    """))
    s = s_result.mappings().first()

    return {
        "total_transformers": t["total"] or 0,
        "red_count": t["red_count"] or 0,
        "yellow_count": t["yellow_count"] or 0,
        "green_count": t["green_count"] or 0,
        "total_load_mw": round(float(t["total_load_mw"] or 0), 2),
        "total_stations": s["total_stations"] or 0,
        "active_sessions": s["active_sessions"] or 0
    }


@router.get("/discom/heatmap")
async def discom_heatmap(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT t.id, t.feeder_id, t.name, t.capacity_kva, t.current_load_kw,
               t.stress_score, t.status, z.name as zone_name,
               ST_Y(t.location::geometry) AS lat,
               ST_X(t.location::geometry) AS lng,
               COUNT(cs.id) AS station_count
        FROM transformers t
        LEFT JOIN zones z ON z.id = t.zone_id
        LEFT JOIN charging_stations cs ON cs.transformer_id = t.id
        GROUP BY t.id, z.name
        ORDER BY t.stress_score DESC
    """))
    return [dict(r) for r in result.mappings().all()]
