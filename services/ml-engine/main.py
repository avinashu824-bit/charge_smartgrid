"""
main.py
ChargeSmart Grid - ML Engine
FastAPI application exposing load forecasting, city-level aggregation,
siting scoring, and EV-adoption simulation endpoints.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from forecaster import (
    compute_stress_score,
    generate_synthetic_24h_forecast,
    get_status,
    predict_time_to_red,
)
from siting_scorer import score_candidate
from simulator import simulate_growth

# ---------------------------------------------------------------------------
# App bootstrap
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-engine")

app = FastAPI(
    title="ChargeSmart Grid – ML Engine",
    description=(
        "Provides load forecasting, EV-station siting scores, "
        "and EV-adoption growth simulation for the ChargeSmart Grid platform."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

# --- /forecast/transformer ---
class TransformerForecastRequest(BaseModel):
    transformer_id: str = Field(..., description="Unique transformer identifier")
    current_load_kw: float = Field(..., ge=0, description="Current load in kW")
    capacity_kva: float = Field(..., gt=0, description="Rated capacity in kVA")
    hour_of_day: int = Field(..., ge=0, le=23, description="Current hour (0-23)")
    day_of_week: int = Field(0, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")


class TransformerForecastResponse(BaseModel):
    transformer_id: str
    hour_of_day: int
    forecast_24h: List[float]
    current_stress: float
    current_status: str
    time_to_red_hours: Optional[int]


# --- /forecast/city ---
class CityTransformerInput(BaseModel):
    id: str
    current_load_kw: float = Field(..., ge=0)
    capacity_kva: float = Field(..., gt=0)


class CityForecastRequest(BaseModel):
    transformers: List[CityTransformerInput]


class PerTransformerForecast(BaseModel):
    transformer_id: str
    current_load_kw: float
    capacity_kva: float
    current_stress: float
    current_status: str
    forecast_24h: List[float]


class CityForecastResponse(BaseModel):
    total_transformers: int
    red_count: int
    yellow_count: int
    green_count: int
    forecasts: List[PerTransformerForecast]


# --- /siting/score ---
class NearbyTransformer(BaseModel):
    id: str
    lat: float
    lng: float
    capacity_kva: float = Field(..., gt=0)
    current_load_kw: float = Field(..., ge=0)
    station_count: int = Field(0, ge=0)


class SitingScoreRequest(BaseModel):
    candidate_lat: float
    candidate_lng: float
    nearby_transformers: List[NearbyTransformer]


class ScoredCandidate(BaseModel):
    lat: float
    lng: float
    total_score: float
    spare_capacity_score: float
    demand_density_score: float
    accessibility_score: float
    recommended_transformer_id: Optional[str]
    reasons: List[str]


# --- /simulate ---
class SimulateTransformerInput(BaseModel):
    id: str
    current_load_kw: float = Field(..., ge=0)
    capacity_kva: float = Field(..., gt=0)


class SimulateRequest(BaseModel):
    transformers: List[SimulateTransformerInput]
    ev_growth_pct: float = Field(..., ge=0, description="Annual EV growth rate (%)")
    months_ahead: int = Field(..., ge=0, description="Simulation horizon in months")


class SimulatedTransformer(BaseModel):
    id: str
    current_load_kw: float
    projected_load_kw: float
    current_stress: float
    projected_stress: float
    current_status: str
    projected_status: str
    stress_delta: float


class SimulateResponse(BaseModel):
    ev_growth_pct: float
    months_ahead: int
    growth_factor: float
    results: List[SimulatedTransformer]
    summary: Dict[str, int]


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"])
def health_check() -> Dict[str, str]:
    """Liveness probe — always returns 200 OK."""
    return {"status": "ok", "service": "ml-engine"}


# ---------------------------------------------------------------------------
# POST /forecast/transformer
# ---------------------------------------------------------------------------

@app.post(
    "/forecast/transformer",
    response_model=TransformerForecastResponse,
    tags=["forecasting"],
)
def forecast_transformer(req: TransformerForecastRequest) -> TransformerForecastResponse:
    """
    Generate a 24-hour load forecast for a single transformer.

    Uses a realistic Indian EV-charging daily profile anchored to the
    supplied current load and hour.
    """
    logger.info(
        "forecast/transformer: id=%s load=%.1f kW cap=%.1f kVA hour=%d",
        req.transformer_id, req.current_load_kw, req.capacity_kva, req.hour_of_day,
    )

    try:
        forecast = generate_synthetic_24h_forecast(
            current_load_kw=req.current_load_kw,
            capacity_kva=req.capacity_kva,
            hour_of_day=req.hour_of_day,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    stress = compute_stress_score(req.current_load_kw, req.capacity_kva)
    status = get_status(stress)
    time_to_red = predict_time_to_red(
        req.current_load_kw, req.capacity_kva, req.hour_of_day
    )

    return TransformerForecastResponse(
        transformer_id=req.transformer_id,
        hour_of_day=req.hour_of_day,
        forecast_24h=forecast,
        current_stress=stress,
        current_status=status,
        time_to_red_hours=time_to_red,
    )


# ---------------------------------------------------------------------------
# POST /forecast/city
# ---------------------------------------------------------------------------

@app.post(
    "/forecast/city",
    response_model=CityForecastResponse,
    tags=["forecasting"],
)
def forecast_city(req: CityForecastRequest) -> CityForecastResponse:
    """
    Generate 24-hour load forecasts for every transformer in a city.

    Uses hour=12 (noon) as the default anchor hour when no specific hour is
    available per-transformer.  Returns per-transformer forecasts plus
    an aggregate RED / YELLOW / GREEN count.
    """
    logger.info("forecast/city: %d transformers", len(req.transformers))

    if not req.transformers:
        raise HTTPException(status_code=422, detail="transformers list must not be empty.")

    DEFAULT_HOUR = 12
    forecasts: List[PerTransformerForecast] = []
    status_counts = {"RED": 0, "YELLOW": 0, "GREEN": 0}

    for t in req.transformers:
        forecast = generate_synthetic_24h_forecast(
            current_load_kw=t.current_load_kw,
            capacity_kva=t.capacity_kva,
            hour_of_day=DEFAULT_HOUR,
        )
        stress = compute_stress_score(t.current_load_kw, t.capacity_kva)
        status = get_status(stress)
        status_counts[status] += 1

        forecasts.append(
            PerTransformerForecast(
                transformer_id=t.id,
                current_load_kw=t.current_load_kw,
                capacity_kva=t.capacity_kva,
                current_stress=stress,
                current_status=status,
                forecast_24h=forecast,
            )
        )

    return CityForecastResponse(
        total_transformers=len(forecasts),
        red_count=status_counts["RED"],
        yellow_count=status_counts["YELLOW"],
        green_count=status_counts["GREEN"],
        forecasts=forecasts,
    )


# ---------------------------------------------------------------------------
# POST /siting/score
# ---------------------------------------------------------------------------

@app.post(
    "/siting/score",
    response_model=ScoredCandidate,
    tags=["siting"],
)
def siting_score(req: SitingScoreRequest) -> ScoredCandidate:
    """
    Score a candidate EV charging station location.

    Evaluates spare electrical capacity (40%), demand density (30%),
    and simulated road accessibility (30%).
    """
    logger.info(
        "siting/score: candidate=(%.4f, %.4f) nearby=%d transformers",
        req.candidate_lat, req.candidate_lng, len(req.nearby_transformers),
    )

    candidate_dict = {
        "candidate_lat": req.candidate_lat,
        "candidate_lng": req.candidate_lng,
    }
    nearby_list = [t.model_dump() for t in req.nearby_transformers]

    result = score_candidate(candidate_dict, nearby_list)

    return ScoredCandidate(**result)


# ---------------------------------------------------------------------------
# POST /simulate
# ---------------------------------------------------------------------------

@app.post(
    "/simulate",
    response_model=SimulateResponse,
    tags=["simulation"],
)
def simulate(req: SimulateRequest) -> SimulateResponse:
    """
    Simulate transformer stress under EV-adoption growth.

    Projects how transformer loading evolves over months_ahead months
    assuming ev_growth_pct% annual EV adoption growth, with 30% of
    current load attributed to EV charging.
    """
    logger.info(
        "simulate: %d transformers, growth=%.1f%%, months=%d",
        len(req.transformers), req.ev_growth_pct, req.months_ahead,
    )

    if not req.transformers:
        raise HTTPException(status_code=422, detail="transformers list must not be empty.")

    transformers_input = [t.model_dump() for t in req.transformers]

    try:
        raw_results = simulate_growth(
            transformers=transformers_input,
            ev_growth_pct=req.ev_growth_pct,
            months_ahead=req.months_ahead,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    growth_factor = round(
        (1 + req.ev_growth_pct / 100) ** (req.months_ahead / 12), 4
    )

    summary: Dict[str, int] = {"RED": 0, "YELLOW": 0, "GREEN": 0}
    results: List[SimulatedTransformer] = []
    for r in raw_results:
        summary[r["projected_status"]] = summary.get(r["projected_status"], 0) + 1
        results.append(SimulatedTransformer(**r))

    return SimulateResponse(
        ev_growth_pct=req.ev_growth_pct,
        months_ahead=req.months_ahead,
        growth_factor=growth_factor,
        results=results,
        summary=summary,
    )
