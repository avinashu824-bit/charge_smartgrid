"""
simulator.py
EV adoption growth simulation module for ChargeSmart Grid ML engine.

Provides:
  - simulate_growth: project transformer stress under EV adoption scenarios
"""

from typing import Any, Dict, List

from forecaster import compute_stress_score, get_status


def simulate_growth(
    transformers: List[Dict[str, Any]],
    ev_growth_pct: float,
    months_ahead: int,
) -> List[Dict[str, Any]]:
    """
    Project transformer loading under an EV adoption growth scenario.

    Model
    -----
    30% of current transformer load is attributed to EV charging.
    EV load grows at ev_growth_pct% per year (compounded).

    growth_factor    = (1 + ev_growth_pct / 100) ** (months_ahead / 12)
    ev_addition      = current_load_kw * 0.30 * growth_factor
    projected_load   = current_load_kw + ev_addition
    projected_stress = projected_load / (capacity_kva * 0.8)

    Parameters
    ----------
    transformers : list of dict
        Each entry must contain: id, current_load_kw, capacity_kva.
    ev_growth_pct : float
        Annual EV adoption growth rate in percent (e.g. 25 for 25%).
    months_ahead : int
        Simulation horizon in months (e.g. 12 for one year).

    Returns
    -------
    list of dict:
        id, current_load_kw, projected_load_kw,
        current_stress, projected_stress,
        current_status, projected_status,
        stress_delta
    """
    if ev_growth_pct < 0:
        raise ValueError("ev_growth_pct must be non-negative.")
    if months_ahead < 0:
        raise ValueError("months_ahead must be non-negative.")

    growth_factor = (1 + ev_growth_pct / 100) ** (months_ahead / 12)

    results = []
    for t in transformers:
        transformer_id  = t.get("id", "unknown")
        current_load_kw = float(t.get("current_load_kw", 0))
        capacity_kva    = float(t.get("capacity_kva", 1))

        ev_load_addition  = current_load_kw * 0.30 * growth_factor
        projected_load_kw = current_load_kw + ev_load_addition

        current_stress   = compute_stress_score(current_load_kw, capacity_kva)
        projected_stress = compute_stress_score(projected_load_kw, capacity_kva)

        current_status   = get_status(current_stress)
        projected_status = get_status(projected_stress)

        stress_delta = round(projected_stress - current_stress, 4)

        results.append({
            "id":                 transformer_id,
            "current_load_kw":    round(current_load_kw, 2),
            "projected_load_kw":  round(projected_load_kw, 2),
            "current_stress":     current_stress,
            "projected_stress":   projected_stress,
            "current_status":     current_status,
            "projected_status":   projected_status,
            "stress_delta":       stress_delta,
        })

    return results
