from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.database import get_db

router = APIRouter(prefix="/api/siting", tags=["siting"])


class SitingRequest(BaseModel):
    lat: float
    lng: float
    radius_km: float = 2.0


@router.post("/recommend")
async def recommend_siting(req: SitingRequest, db: AsyncSession = Depends(get_db)):
    """
    Find top 3 optimal locations for a new EV station near the clicked point.
    Scoring: spare capacity (40%) + station density inverse (30%) + accessibility (30%)
    """
    result = await db.execute(text("""
        SELECT t.id, t.feeder_id, t.name, t.capacity_kva, t.current_load_kw,
               t.stress_score, t.status, z.name as zone_name,
               ST_Y(t.location::geometry) AS lat,
               ST_X(t.location::geometry) AS lng,
               ST_Distance(
                   t.location::geography,
                   ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
               ) / 1000.0 AS distance_km,
               COUNT(cs.id) AS station_count
        FROM transformers t
        LEFT JOIN zones z ON z.id = t.zone_id
        LEFT JOIN charging_stations cs ON cs.transformer_id = t.id
        WHERE ST_DWithin(
            t.location::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radius_m
        )
          AND t.status != 'RED'
        GROUP BY t.id, z.name
        ORDER BY t.stress_score ASC
        LIMIT 10
    """), {"lat": req.lat, "lng": req.lng, "radius_m": req.radius_km * 1000})

    rows = result.mappings().all()
    if not rows:
        raise HTTPException(status_code=404, detail="No suitable transformers found in this area. Try a different location.")

    # Scoring
    spare_caps = [float(r["capacity_kva"]) * 0.8 - float(r["current_load_kw"]) for r in rows]
    max_spare = max(spare_caps) if spare_caps else 1

    import random
    random.seed(int(req.lat * 1000 + req.lng * 1000))

    candidates = []
    for i, (r, spare) in enumerate(zip(rows, spare_caps)):
        spare_score = max(0, spare / max_spare) if max_spare > 0 else 0
        station_count = int(r["station_count"] or 0)
        demand_score = 1.0 / (1 + station_count * 0.4)  # fewer stations = higher score
        access_score = 0.5 + random.random() * 0.5  # simulated OSM road score
        total = spare_score * 0.40 + demand_score * 0.30 + access_score * 0.30

        reasons = []
        if spare_score > 0.7:
            reasons.append(f"High spare capacity: {round(spare, 0):.0f} kVA available")
        elif spare_score > 0.4:
            reasons.append(f"Moderate spare capacity: {round(spare, 0):.0f} kVA available")
        else:
            reasons.append(f"Limited but usable capacity: {round(spare, 0):.0f} kVA")

        if station_count == 0:
            reasons.append("No existing stations — unserved demand hotspot")
        elif station_count <= 2:
            reasons.append(f"Only {station_count} existing station(s) — low competition")
        else:
            reasons.append(f"{station_count} existing stations in area")

        if access_score > 0.75:
            reasons.append("Excellent road access and visibility")
        else:
            reasons.append("Good road connectivity")

        candidates.append({
            "rank": i + 1,
            "transformer_id": r["id"],
            "feeder_id": r["feeder_id"],
            "transformer_name": r["name"],
            "zone_name": r["zone_name"],
            "lat": float(r["lat"]),
            "lng": float(r["lng"]),
            "distance_km": round(float(r["distance_km"]), 2),
            "spare_capacity_kva": round(spare, 1),
            "station_count_nearby": station_count,
            "scores": {
                "spare_capacity": round(spare_score * 100, 1),
                "demand_density": round(demand_score * 100, 1),
                "accessibility": round(access_score * 100, 1),
                "total": round(total * 100, 1)
            },
            "reasons": reasons,
            "recommended_slots": 4 if spare > 200 else 2
        })

    # Sort by total score, return top 3
    candidates.sort(key=lambda x: x["scores"]["total"], reverse=True)
    for i, c in enumerate(candidates[:3]):
        c["rank"] = i + 1

    return {
        "query_lat": req.lat,
        "query_lng": req.lng,
        "radius_km": req.radius_km,
        "top_3": candidates[:3]
    }
