# ⚡ ChargeSmart Grid
### EV Charging Load Forecasting & Grid-Stress Advisory Platform
**Problem ID: SW-73** | Theme: Transportation & Logistics

A full-stack three-portal platform that helps Indian cities scale EV infrastructure without destabilizing the power grid.

---

## 🚀 Quick Start (Frontend Only — No Docker Needed)

Open **3 terminal windows** and run one command in each:

```bash
# Terminal 1 — EV User App (http://localhost:5173)
cd apps/user-app && npm run dev

# Terminal 2 — Operator Portal (http://localhost:5174)
cd apps/operator-portal && npm run dev

# Terminal 3 — Discom Admin Portal (http://localhost:5175)
cd apps/discom-portal && npm run dev
```

All portals work **fully offline with mock data** — no backend required for the demo.

---

## 🔑 Demo Credentials

| Portal | URL | Email | Password |
|--------|-----|-------|----------|
| EV User App | http://localhost:5173 | any email | any password |
| Operator Portal | http://localhost:5174 | ops@chargezone.in | chargesmart123 |
| Discom Admin | http://localhost:5175 | admin@bescom.gov.in | chargesmart123 |

---

## 🏗 Architecture

```
chargesmart-grid/
├── apps/
│   ├── user-app/          ← React PWA (EV User) — port 5173
│   ├── operator-portal/   ← React + Vite (Operator) — port 5174
│   └── discom-portal/     ← React + Vite (Discom Admin) — port 5175
├── services/
│   ├── core-api/          ← Python FastAPI — port 8000
│   ├── api-gateway/       ← Node.js + Socket.io — port 3000
│   └── ml-engine/         ← Python ML service — port 8001
├── infra/
│   ├── docker-compose.yml ← Full stack orchestration
│   └── db/init.sql        ← PostgreSQL + PostGIS schema
└── scripts/seed-data/     ← Bengaluru synthetic data seeder
```

---

## 🐳 Full Stack with Docker

### Prerequisites
- Docker Desktop
- Node.js 20+

### Run
```bash
# Start all backend services
cd infra
docker-compose up --build -d

# Wait ~30s for DB to initialize, then seed
docker-compose exec core-api python /app/../../../scripts/seed-data/seed.py

# Start frontends
cd ../apps/user-app && npm run dev          # http://localhost:5173
cd ../apps/operator-portal && npm run dev  # http://localhost:5174
cd ../apps/discom-portal && npm run dev    # http://localhost:5175
```

### Backend URLs
| Service | URL | Description |
|---------|-----|-------------|
| API Gateway | http://localhost:3000 | WebSocket + REST proxy |
| Core API | http://localhost:8000/docs | FastAPI Swagger UI |
| ML Engine | http://localhost:8001/docs | Forecasting service |

---

## 📱 Portal 1 — EV User App

**What it does:**
- 🗺 Full-screen Leaflet map with 40 Bengaluru EV stations
- 🟢🟡🔴 Color-coded markers by grid stress (GREEN/YELLOW/RED)
- ⚡ Live price ticker (₹/kWh) via WebSocket
- 🧭 Smart CTA: "Navigate to cheapest station 1.2 km away — Save ₹40"
- 🌙 Time-shift nudge banner: "Charge after 11 PM for 30% off — Save ₹32"
- 📊 Station detail: 24h price chart, connector types, wait time
- 🌿 Sessions page: CO₂ saved, charging history

---

## 📊 Portal 2 — Operator Portal

**What it does:**
- 💰 Revenue dashboard: today / weekly KPI tiles + trend chart
- 🔥 Hourly utilization heatmap (7 days × 24 hours)
- 🚨 Alert banner: "Feeder T-23 predicted RED in 2.3h — 91% load"
- ✅ Platform price suggestion → 1-click Approve / Edit / Reject
- 🎫 Off-peak coupon generator with load-shift preview
- 📋 Requests tracker: upgrade requests + station approvals

---

## 🏙 Portal 3 — Discom Admin (Command Center)

**What it does:**
- 🗺 City-wide Leaflet map with 50 transformer markers (real Bengaluru coordinates)
- 📡 KPI ribbon: 47.3 MW load, 7 RED, 13 YELLOW, 30 GREEN, 120 stations
- ⚡ Alert feed: top 5 transformers at risk with predicted hours-to-RED
- 🧪 **Simulation Lab**: sliders for EV growth % + months ahead → animated heatmap showing projected RED zones
- 📍 **Siting Recommender**: click anywhere on map → Top 3 location cards with scored breakdown (capacity 40% + demand 30% + access 30%)
- ✅ Approvals queue: approve new stations + transformer upgrades
- 💸 ToD Policy Editor: edit price bands → live 24h curve preview → cascade to all zones
- 📥 Reports: 30-day trend, zone comparison, downloadable CSV

---

## 🤖 ML Engine

| Model | Purpose |
|-------|---------|
| **Synthetic Load Profile** | Indian EV twin-peak pattern (8–10 AM commute, 7–9 PM home-charge) |
| **Stress Scorer** | `load / (capacity × 0.8)` → GREEN < 0.6, YELLOW 0.6–0.85, RED > 0.85 |
| **Siting Scorer** | Weighted: spare capacity (40%) + demand density (30%) + accessibility (30%) |
| **EV Growth Simulator** | Compound growth: `projected_load = current + (current × 0.3 × (growth_factor - 1))` |

---

## 🗄 Data

- **50 transformers** across 5 Bengaluru zones (Whitefield, Koramangala, Electronic City, Indiranagar, JP Nagar)
- **120 charging stations** linked to real transformer feeders
- **500 charging sessions** (last 30 days, realistic ToD distribution)
- **Stress distribution**: 30 GREEN / 13 YELLOW / 7 RED (realistic grid scenario)

---

## 🎯 Evaluation Criteria Coverage

| Criterion | Implementation |
|-----------|---------------|
| **Forecast accuracy** | Prophet-calibrated 24h load profile, MAPE-style stress deviation shown |
| **Practicality of siting** | PostGIS radius + 3-factor weighted scoring with explainable reasons |
| **Grid-stress visualization** | Choropleth map + simulation diff overlay + alert feed |
| **Pricing advisory feasibility** | ToD rule engine → operator approval → user nudge banner end-to-end |
