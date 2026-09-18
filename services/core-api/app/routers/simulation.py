from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


class SimulationRequest(BaseModel):
    ev_growth_pct: float = 20.0
    months_ahead: int = 6


@router.post("/run")
async def run_simulation(req: SimulationRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT t.id, t.feeder_id, t.name, t.capacity_kva, t.current_load_kw,
               t.stress_score, t.status, z.name as zone_name,
               ST_Y(t.location::geometry) AS lat,
               ST_X(t.location::geometry) AS lng
        FROM transformers t
        LEFT JOIN zones z ON z.id = t.zone_id
        ORDER BY t.id
    """))
    transformers = result.mappings().all()

    ev_share = 0.30  # 30% of current load is EV-attributable
    growth_factor = (1 + req.ev_growth_pct / 100) ** (req.months_ahead / 12)

    output = []
    summary = {"total": 0, "new_red": 0, "new_yellow": 0, "additional_mw": 0.0}

    for t in transformers:
        cur_load = float(t["current_load_kw"] or 0)
        cap = float(t["capacity_kva"] or 1)
        usable_cap = cap * 0.8

        ev_addition = cur_load * ev_share * (growth_factor - 1)
        proj_load = cur_load + ev_addition
        proj_stress = proj_load / usable_cap

        cur_status = t["status"]
        proj_status = "RED" if proj_stress > 0.85 else "YELLOW" if proj_stress > 0.6 else "GREEN"

        if proj_status == "RED" and cur_status != "RED":
            summary["new_red"] += 1
        if proj_status == "YELLOW" and cur_status == "GREEN":
            summary["new_yellow"] += 1

        summary["total"] += 1
        summary["additional_mw"] += max(0, ev_addition) / 1000

        output.append({
            "id": t["id"],
            "feeder_id": t["feeder_id"],
            "name": t["name"],
            "zone_name": t["zone_name"],
            "lat": float(t["lat"]),
            "lng": float(t["lng"]),
            "current_load_kw": round(cur_load, 1),
            "projected_load_kw": round(proj_load, 1),
            "capacity_kva": round(cap, 1),
            "current_stress": round(float(t["stress_score"]), 3),
            "projected_stress": round(min(proj_stress, 1.2), 3),
            "current_status": cur_status,
            "projected_status": proj_status,
            "stress_delta": round(proj_stress - float(t["stress_score"]), 3),
        })

    summary["additional_mw"] = round(summary["additional_mw"], 2)
    return {
        "params": {"ev_growth_pct": req.ev_growth_pct, "months_ahead": req.months_ahead},
        "summary": summary,
        "transformers": output
    }
