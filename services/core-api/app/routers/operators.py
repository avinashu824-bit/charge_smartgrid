from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api/operators", tags=["operators"])


@router.get("")
async def list_operators(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT id, name, email, company FROM operators ORDER BY id"))
    return [dict(r) for r in result.mappings().all()]


@router.get("/{operator_id}/stations")
async def operator_stations(operator_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT cs.id, cs.name, cs.address, cs.total_slots, cs.available_slots,
               cs.current_price_inr, cs.status, cs.avg_wait_minutes,
               cs.connector_types,
               ST_Y(cs.location::geometry) AS lat,
               ST_X(cs.location::geometry) AS lng,
               t.feeder_id, t.stress_score as transformer_stress,
               z.name as zone_name
        FROM charging_stations cs
        JOIN transformers t ON t.id = cs.transformer_id
        JOIN zones z ON z.id = t.zone_id
        WHERE cs.operator_id = :oid
        ORDER BY cs.id
    """), {"oid": operator_id})
    return [dict(r) for r in result.mappings().all()]


@router.get("/{operator_id}/upgrade-requests")
async def operator_upgrade_requests(operator_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("""
        SELECT ur.id, ur.transformer_id, t.feeder_id, t.name as transformer_name,
               z.name as zone_name, ur.reason, ur.requested_capacity_kva,
               ur.discom_status, ur.created_at
        FROM upgrade_requests ur
        JOIN transformers t ON t.id = ur.transformer_id
        JOIN zones z ON z.id = t.zone_id
        WHERE ur.operator_id = :oid
        ORDER BY ur.created_at DESC
    """), {"oid": operator_id})
    return [dict(r) for r in result.mappings().all()]


@router.post("/{operator_id}/upgrade-requests")
async def submit_upgrade_request(operator_id: int, body: dict, db: AsyncSession = Depends(get_db)):
    await db.execute(text("""
        INSERT INTO upgrade_requests (transformer_id, operator_id, reason, requested_capacity_kva)
        VALUES (:tid, :oid, :reason, :cap)
    """), {"tid": body["transformer_id"], "oid": operator_id,
           "reason": body.get("reason", "Capacity required for EV growth"),
           "cap": body.get("requested_capacity_kva", 500)})
    await db.commit()
    return {"status": "submitted"}
