-- ChargeSmart Grid - Database Initialization
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

CREATE TABLE zones (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100),
  city VARCHAR(100) DEFAULT 'Bengaluru',
  boundary GEOMETRY(Polygon, 4326)
);

CREATE TABLE transformers (
  id               SERIAL PRIMARY KEY,
  feeder_id        VARCHAR(20) UNIQUE,
  zone_id          INTEGER REFERENCES zones(id),
  name             VARCHAR(100),
  location         GEOMETRY(Point, 4326),
  capacity_kva     FLOAT,
  current_load_kw  FLOAT DEFAULT 0,
  stress_score     FLOAT DEFAULT 0,
  status           VARCHAR(10) DEFAULT 'GREEN',
  last_updated     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transformers_zone   ON transformers(zone_id);
CREATE INDEX idx_transformers_status ON transformers(status);
CREATE INDEX idx_transformers_geom   ON transformers USING GIST(location);

CREATE TABLE charging_stations (
  id                  SERIAL PRIMARY KEY,
  operator_id         INTEGER,
  transformer_id      INTEGER REFERENCES transformers(id),
  name                VARCHAR(100),
  address             TEXT,
  location            GEOMETRY(Point, 4326),
  total_slots         INTEGER DEFAULT 4,
  available_slots     INTEGER DEFAULT 4,
  current_price_inr   FLOAT DEFAULT 12.0,
  connector_types     TEXT[] DEFAULT ARRAY['CCS2','AC'],
  status              VARCHAR(10) DEFAULT 'GREEN',
  avg_wait_minutes    INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stations_transformer ON charging_stations(transformer_id);
CREATE INDEX idx_stations_operator    ON charging_stations(operator_id);
CREATE INDEX idx_stations_geom        ON charging_stations USING GIST(location);

CREATE TABLE charging_sessions (
  id             SERIAL PRIMARY KEY,
  station_id     INTEGER REFERENCES charging_stations(id),
  user_id        INTEGER,
  start_time     TIMESTAMPTZ,
  end_time       TIMESTAMPTZ,
  energy_kwh     FLOAT,
  cost_inr       FLOAT,
  connector_type VARCHAR(20)
);

CREATE INDEX idx_sessions_station ON charging_sessions(station_id);
CREATE INDEX idx_sessions_user    ON charging_sessions(user_id);
CREATE INDEX idx_sessions_time    ON charging_sessions(start_time);

CREATE TABLE forecast_runs (
  id                SERIAL PRIMARY KEY,
  transformer_id    INTEGER REFERENCES transformers(id),
  horizon_hours     INTEGER DEFAULT 24,
  predicted_load_kw FLOAT[],
  timestamps        TIMESTAMPTZ[],
  scenario_label    VARCHAR(50) DEFAULT 'baseline',
  run_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tod_bands (
  id            SERIAL PRIMARY KEY,
  zone_id       INTEGER REFERENCES zones(id),
  label         VARCHAR(50),
  start_hour    INTEGER,
  end_hour      INTEGER,
  price_inr_kwh FLOAT,
  discount_pct  FLOAT DEFAULT 0,
  valid_from    DATE,
  valid_to      DATE
);

CREATE TABLE siting_requests (
  id              SERIAL PRIMARY KEY,
  requested_by    INTEGER,
  lat             FLOAT,
  lng             FLOAT,
  recommendations JSONB,
  status          VARCHAR(20) DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE upgrade_requests (
  id                     SERIAL PRIMARY KEY,
  transformer_id         INTEGER REFERENCES transformers(id),
  operator_id            INTEGER,
  reason                 TEXT,
  requested_capacity_kva FLOAT,
  discom_status          VARCHAR(20) DEFAULT 'PENDING',
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE station_approvals (
  id            SERIAL PRIMARY KEY,
  station_id    INTEGER REFERENCES charging_stations(id),
  operator_id   INTEGER,
  discom_status VARCHAR(20) DEFAULT 'PENDING',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE operators (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100),
  email         VARCHAR(100) UNIQUE,
  password_hash VARCHAR(200),
  company       VARCHAR(100)
);

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100),
  email         VARCHAR(100) UNIQUE,
  password_hash VARCHAR(200),
  vehicle_type  VARCHAR(50)
);

CREATE TABLE discom_admins (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100),
  email         VARCHAR(100) UNIQUE,
  password_hash VARCHAR(200),
  zone_id       INTEGER REFERENCES zones(id)
);
