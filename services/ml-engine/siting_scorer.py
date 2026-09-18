"""
siting_scorer.py
Siting recommendation module for ChargeSmart Grid ML engine.

Provides:
  - score_candidate: multi-criteria score for a candidate EV station location
  - rank_candidates: top-N scoring locations from a list of candidates
"""

import random
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Scoring weights (must sum to 1.0)
# ---------------------------------------------------------------------------
_W_SPARE_CAPACITY = 0.40   # electrical headroom
_W_DEMAND_DENSITY = 0.30   # unmet demand proxy
_W_ACCESSIBILITY  = 0.30   # road / OSM accessibility (simulated)

_MAX_SPARE_KW_REFERENCE  = 500.0
_MAX_STATIONS_REFERENCE  = 20


def _compute_spare_capacity_score(nearby_transformers: List[Dict[str, Any]]) -> float:
    """Score based on maximum spare kW across nearby transformers, normalized to [0,1]."""
    if not nearby_transformers:
        return 0.0
    spare_values = [
        t.get("capacity_kva", 0) * 0.8 - t.get("current_load_kw", 0)
        for t in nearby_transformers
    ]
    max_spare = max(spare_values)
    return round(min(max(max_spare / _MAX_SPARE_KW_REFERENCE, 0.0), 1.0), 4)


def _compute_demand_density_score(nearby_transformers: List[Dict[str, Any]]) -> float:
    """Fewer existing stations -> higher unmet demand -> higher score."""
    if not nearby_transformers:
        return 1.0
    total_stations = sum(t.get("station_count", 0) for t in nearby_transformers)
    normalized = total_stations / _MAX_STATIONS_REFERENCE
    return round(1.0 - min(normalized, 1.0), 4)


def _compute_accessibility_score() -> float:
    """Simulate OSM road-accessibility score in [0.5, 1.0]."""
    return round(random.uniform(0.5, 1.0), 4)


def _pick_recommended_transformer(nearby_transformers: List[Dict[str, Any]]) -> Optional[str]:
    """Return id of transformer with most spare capacity."""
    if not nearby_transformers:
        return None
    best = max(
        nearby_transformers,
        key=lambda t: t.get("capacity_kva", 0) * 0.8 - t.get("current_load_kw", 0),
    )
    return str(best.get("id", "unknown"))


def _build_reasons(
    spare_capacity_score: float,
    demand_density_score: float,
    accessibility_score: float,
    recommended_transformer_id: Optional[str],
) -> List[str]:
    reasons = []
    if spare_capacity_score >= 0.75:
        reasons.append(f"High electrical headroom available (spare capacity score: {spare_capacity_score:.2f})")
    elif spare_capacity_score >= 0.40:
        reasons.append(f"Moderate electrical headroom (spare capacity score: {spare_capacity_score:.2f})")
    else:
        reasons.append(f"Limited nearby transformer capacity - consider grid upgrade (score: {spare_capacity_score:.2f})")

    if demand_density_score >= 0.70:
        reasons.append(f"Underserved area with few existing EV charging stations - high unmet demand (score: {demand_density_score:.2f})")
    elif demand_density_score >= 0.40:
        reasons.append(f"Moderate EV-charging coverage gap in the area (demand density score: {demand_density_score:.2f})")
    else:
        reasons.append(f"Area already has substantial EV charging infrastructure (score: {demand_density_score:.2f})")

    if accessibility_score >= 0.80:
        reasons.append(f"Excellent road accessibility / OSM score: {accessibility_score:.2f}")
    elif accessibility_score >= 0.60:
        reasons.append(f"Good road accessibility / OSM score: {accessibility_score:.2f}")
    else:
        reasons.append(f"Limited road access - verify site before deployment (OSM score: {accessibility_score:.2f})")

    return reasons


def score_candidate(
    candidate: Dict[str, Any],
    nearby_transformers: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Score a single candidate EV station location.

    Parameters
    ----------
    candidate : dict
        Must contain ''candidate_lat'' and ''candidate_lng'' (or ''lat''/''lng'').
    nearby_transformers : list of dict
        Each entry: id, lat, lng, capacity_kva, current_load_kw, station_count.

    Returns
    -------
    dict:
        lat, lng, total_score, spare_capacity_score, demand_density_score,
        accessibility_score, recommended_transformer_id, reasons (list[str])
    """
    spare_cap_score  = _compute_spare_capacity_score(nearby_transformers)
    demand_den_score = _compute_demand_density_score(nearby_transformers)
    access_score     = _compute_accessibility_score()

    total_score = round(
        _W_SPARE_CAPACITY * spare_cap_score
        + _W_DEMAND_DENSITY * demand_den_score
        + _W_ACCESSIBILITY  * access_score,
        4,
    )

    recommended_tid = _pick_recommended_transformer(nearby_transformers)
    reasons = _build_reasons(spare_cap_score, demand_den_score, access_score, recommended_tid)

    return {
        "lat": candidate.get("candidate_lat", candidate.get("lat")),
        "lng": candidate.get("candidate_lng", candidate.get("lng")),
        "total_score": total_score,
        "spare_capacity_score": spare_cap_score,
        "demand_density_score": demand_den_score,
        "accessibility_score": access_score,
        "recommended_transformer_id": recommended_tid,
        "reasons": reasons,
    }


def rank_candidates(
    candidates: List[Dict[str, Any]],
    all_transformers: List[Dict[str, Any]],
    top_n: int = 3,
) -> List[Dict[str, Any]]:
    """
    Score all candidate locations and return the top-N ranked results.

    Parameters
    ----------
    candidates : list of dict  (each with ''lat'' and ''lng'')
    all_transformers : list of dict
    top_n : int

    Returns
    -------
    list of scored dicts, sorted descending by total_score, limited to top_n.
    """
    scored = [score_candidate(c, all_transformers) for c in candidates]
    scored.sort(key=lambda x: x["total_score"], reverse=True)
    return scored[:top_n]
