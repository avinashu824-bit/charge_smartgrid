"""
forecaster.py
Load forecasting module for ChargeSmart Grid ML engine.

Provides:
  - generate_synthetic_24h_forecast: realistic Indian EV charging daily profile
  - compute_stress_score: normalized 0-1 stress metric
  - get_status: GREEN / YELLOW / RED classification
  - predict_time_to_red: hours until transformer hits RED zone
"""

import math
import random
from typing import List, Optional

# ---------------------------------------------------------------------------
# Indian EV Charging Daily Load Profile
# Weights represent the relative demand fraction for each hour (0-23).
# Calibrated to:
#   - Low overnight (12 AM - 6 AM):  off-peak, minimal EV charging
#   - Morning ramp (7 AM):           early commuters plug in
#   - Morning peak (8-10 AM):        office commute + morning fast-charge
#   - Midday dip (11 AM - 3 PM):     vehicles in use / residential lull
#   - Evening ramp (4-6 PM):         return commute begins
#   - Evening peak (7-9 PM):         home + commercial charging surge
#   - Late-night drop (10 PM+):      wind-down
# ---------------------------------------------------------------------------
_HOURLY_PROFILE: List[float] = [
    0.30,  # 00:00
    0.25,  # 01:00
    0.22,  # 02:00
    0.20,  # 03:00
    0.20,  # 04:00
    0.22,  # 05:00
    0.30,  # 06:00
    0.55,  # 07:00
    0.80,  # 08:00
    0.90,  # 09:00
    0.85,  # 10:00
    0.70,  # 11:00
    0.60,  # 12:00
    0.58,  # 13:00
    0.60,  # 14:00
    0.65,  # 15:00
    0.72,  # 16:00
    0.82,  # 17:00
    0.88,  # 18:00
    0.95,  # 19:00
    0.92,  # 20:00
    0.80,  # 21:00
    0.60,  # 22:00
    0.42,  # 23:00
]

# Stress thresholds (fraction of capacity)
_YELLOW_THRESHOLD = 0.70
_RED_THRESHOLD = 0.85


def generate_synthetic_24h_forecast(
    current_load_kw: float,
    capacity_kva: float,
    hour_of_day: int,
    noise_sigma: float = 0.04,
) -> List[float]:
    """
    Generate a 24-hour load forecast anchored to current_load_kw.

    The forecast covers all 24 hours (index 0=midnight to 23=11 PM).
    Each hour''s load is computed by scaling the profile relative to the
    profile weight at hour_of_day, then adding Gaussian noise.

    Parameters
    ----------
    current_load_kw : float
        Observed load at the current hour (kW).
    capacity_kva : float
        Transformer rated capacity (kVA).
    hour_of_day : int
        Current hour (0-23).
    noise_sigma : float
        Std-dev of Gaussian noise as a fraction of max capacity.

    Returns
    -------
    List[float]
        24 floats representing predicted load (kW) for hours 0-23.
    """
    if not (0 <= hour_of_day <= 23):
        raise ValueError(f"hour_of_day must be 0-23, got {hour_of_day}")

    max_capacity_kw = capacity_kva * 0.95  # hard ceiling

    anchor_weight = _HOURLY_PROFILE[hour_of_day]
    if anchor_weight == 0:
        anchor_weight = 1e-6

    base_load = current_load_kw / anchor_weight

    forecast: List[float] = []
    for h in range(24):
        weight = _HOURLY_PROFILE[h]
        predicted = base_load * weight
        noise = random.gauss(0, noise_sigma * max_capacity_kw)
        predicted += noise
        predicted = max(0.0, min(predicted, max_capacity_kw))
        forecast.append(round(predicted, 2))

    return forecast


def compute_stress_score(load_kw: float, capacity_kva: float) -> float:
    """
    Compute a normalised stress score in [0, 1].

    Score = load_kw / (capacity_kva * 0.8)
    Uses 80% of nameplate capacity as the operational ceiling.
    """
    operational_limit = capacity_kva * 0.8
    if operational_limit <= 0:
        return 1.0
    score = load_kw / operational_limit
    return round(min(max(score, 0.0), 1.0), 4)


def get_status(stress_score: float) -> str:
    """
    Classify transformer health from stress score.

    < 0.70  -> GREEN
    0.70-0.84 -> YELLOW
    >= 0.85 -> RED
    """
    if stress_score >= _RED_THRESHOLD:
        return "RED"
    if stress_score >= _YELLOW_THRESHOLD:
        return "YELLOW"
    return "GREEN"


def predict_time_to_red(
    current_load_kw: float,
    capacity_kva: float,
    hour_of_day: int,
) -> Optional[int]:
    """
    Predict hours from now until transformer enters RED status.

    Scans the 24-hour forecast forward from (hour_of_day + 1).

    Returns
    -------
    Optional[int]
        Hours until RED, or None if RED not predicted in next 24 h.
    """
    forecast = generate_synthetic_24h_forecast(
        current_load_kw, capacity_kva, hour_of_day
    )
    red_threshold_kw = _RED_THRESHOLD * capacity_kva * 0.8

    for offset in range(1, 25):
        future_hour = (hour_of_day + offset) % 24
        if forecast[future_hour] >= red_threshold_kw:
            return offset

    return None
