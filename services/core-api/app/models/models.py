"""
ChargeSmart Grid - SQLAlchemy ORM Models
Mirrors infra/db/init.sql schema with GeoAlchemy2 geometry columns.
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    BigInteger, Boolean, Column, Date, Float, ForeignKey,
    Integer, String, Text, ARRAY, TIMESTAMP, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String(100))
    city     = Column(String(100), default="Bengaluru")
    boundary = Column(Geometry("POLYGON", srid=4326))

    transformers   = relationship("Transformer",   back_populates="zone")
    tod_bands      = relationship("TodBand",        back_populates="zone")
    discom_admins  = relationship("DiscomAdmin",    back_populates="zone")


class Transformer(Base):
    __tablename__ = "transformers"

    id               = Column(Integer, primary_key=True, index=True)
    feeder_id        = Column(String(20), unique=True)
    zone_id          = Column(Integer, ForeignKey("zones.id"))
    name             = Column(String(100))
    location         = Column(Geometry("POINT", srid=4326))
    capacity_kva     = Column(Float)
    current_load_kw  = Column(Float, default=0)
    stress_score     = Column(Float, default=0)
    status           = Column(String(10), default="GREEN")
    last_updated     = Column(TIMESTAMP(timezone=True), server_default=func.now())

    zone             = relationship("Zone",         back_populates="transformers")
    stations         = relationship("ChargingStation", back_populates="transformer")
    forecast_runs    = relationship("ForecastRun",  back_populates="transformer")
    upgrade_requests = relationship("UpgradeRequest", back_populates="transformer")


class ChargingStation(Base):
    __tablename__ = "charging_stations"

    id                = Column(Integer, primary_key=True, index=True)
    operator_id       = Column(Integer, ForeignKey("operators.id"))
    transformer_id    = Column(Integer, ForeignKey("transformers.id"))
    name              = Column(String(100))
    address           = Column(Text)
    location          = Column(Geometry("POINT", srid=4326))
    total_slots       = Column(Integer, default=4)
    available_slots   = Column(Integer, default=4)
    current_price_inr = Column(Float, default=12.0)
    connector_types   = Column(ARRAY(String))
    status            = Column(String(10), default="GREEN")
    avg_wait_minutes  = Column(Integer, default=0)
    created_at        = Column(TIMESTAMP(timezone=True), server_default=func.now())

    operator          = relationship("Operator",     back_populates="stations")
    transformer       = relationship("Transformer",  back_populates="stations")
    sessions          = relationship("ChargingSession", back_populates="station")
    approvals         = relationship("StationApproval", back_populates="station")


class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    id             = Column(Integer, primary_key=True, index=True)
    station_id     = Column(Integer, ForeignKey("charging_stations.id"))
    user_id        = Column(Integer, ForeignKey("users.id"))
    start_time     = Column(TIMESTAMP(timezone=True))
    end_time       = Column(TIMESTAMP(timezone=True))
    energy_kwh     = Column(Float)
    cost_inr       = Column(Float)
    connector_type = Column(String(20))

    station = relationship("ChargingStation", back_populates="sessions")
    user    = relationship("User",            back_populates="sessions")


class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id                = Column(Integer, primary_key=True, index=True)
    transformer_id    = Column(Integer, ForeignKey("transformers.id"))
    horizon_hours     = Column(Integer, default=24)
    predicted_load_kw = Column(ARRAY(Float))
    timestamps        = Column(ARRAY(TIMESTAMP(timezone=True)))
    scenario_label    = Column(String(50), default="baseline")
    run_at            = Column(TIMESTAMP(timezone=True), server_default=func.now())

    transformer = relationship("Transformer", back_populates="forecast_runs")


class TodBand(Base):
    __tablename__ = "tod_bands"

    id            = Column(Integer, primary_key=True, index=True)
    zone_id       = Column(Integer, ForeignKey("zones.id"))
    label         = Column(String(50))
    start_hour    = Column(Integer)
    end_hour      = Column(Integer)
    price_inr_kwh = Column(Float)
    discount_pct  = Column(Float, default=0)
    valid_from    = Column(Date)
    valid_to      = Column(Date)

    zone = relationship("Zone", back_populates="tod_bands")


class SitingRequest(Base):
    __tablename__ = "siting_requests"

    id              = Column(Integer, primary_key=True, index=True)
    requested_by    = Column(Integer)
    lat             = Column(Float)
    lng             = Column(Float)
    recommendations = Column(JSONB)
    status          = Column(String(20), default="PENDING")
    created_at      = Column(TIMESTAMP(timezone=True), server_default=func.now())


class UpgradeRequest(Base):
    __tablename__ = "upgrade_requests"

    id                     = Column(Integer, primary_key=True, index=True)
    transformer_id         = Column(Integer, ForeignKey("transformers.id"))
    operator_id            = Column(Integer)
    reason                 = Column(Text)
    requested_capacity_kva = Column(Float)
    discom_status          = Column(String(20), default="PENDING")
    created_at             = Column(TIMESTAMP(timezone=True), server_default=func.now())

    transformer = relationship("Transformer", back_populates="upgrade_requests")


class StationApproval(Base):
    __tablename__ = "station_approvals"

    id            = Column(Integer, primary_key=True, index=True)
    station_id    = Column(Integer, ForeignKey("charging_stations.id"))
    operator_id   = Column(Integer)
    discom_status = Column(String(20), default="PENDING")
    notes         = Column(Text)
    created_at    = Column(TIMESTAMP(timezone=True), server_default=func.now())

    station = relationship("ChargingStation", back_populates="approvals")


class Operator(Base):
    __tablename__ = "operators"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100))
    email         = Column(String(100), unique=True)
    password_hash = Column(String(200))
    company       = Column(String(100))

    stations = relationship("ChargingStation", back_populates="operator")


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100))
    email         = Column(String(100), unique=True)
    password_hash = Column(String(200))
    vehicle_type  = Column(String(50))

    sessions = relationship("ChargingSession", back_populates="user")


class DiscomAdmin(Base):
    __tablename__ = "discom_admins"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100))
    email         = Column(String(100), unique=True)
    password_hash = Column(String(200))
    zone_id       = Column(Integer, ForeignKey("zones.id"))

    zone = relationship("Zone", back_populates="discom_admins")
