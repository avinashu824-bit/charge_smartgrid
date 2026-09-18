"""
ChargeSmart Grid — Seed Script
Populates the database with realistic synthetic data for Bengaluru.
Run: python -m scripts.seed  (from services/core-api directory)
Or:  python seed.py          (from scripts/seed-data directory)
"""

import os, sys, random, math
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import execute_values

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://chargesmart:chargesmart123@localhost:5432/chargesmart"
).replace("postgresql+asyncpg://", "postgresql://")

# ─── Zones ────────────────────────────────────────────────────────
ZONES = [
    {"name": "Whitefield",      "city": "Bengaluru", "center": (12.9698, 77.7499)},
    {"name": "Koramangala",     "city": "Bengaluru", "center": (12.9352, 77.6245)},
    {"name": "Electronic City", "city": "Bengaluru", "center": (12.8406, 77.6601)},
    {"name": "Indiranagar",     "city": "Bengaluru", "center": (12.9784, 77.6408)},
    {"name": "JP Nagar",        "city": "Bengaluru", "center": (12.9082, 77.5917)},
]

# ─── Transformer templates per zone ───────────────────────────────
# 10 transformers per zone = 50 total
TRANSFORMERS_PER_ZONE = 10

STATION_NAMES = [
    "EV Hub", "Fast Charge", "Charge Point", "Green Dock",
    "EV Bay", "Smart Charger", "Quick Charge", "EcoCharge",
    "Power Bay", "Charge Zone", "EV Station", "Urban Charge",
]

OPERATORS = [
    {"name": "Tata Power EV",    "email": "ops@tatapowerev.in",  "company": "Tata Power",    "password": "chargesmart123"},
    {"name": "Charge Zone India","email": "ops@chargezone.in",   "company": "Charge Zone",   "password": "chargesmart123"},
    {"name": "Magenta Mobility", "email": "ops@magenta.in",      "company": "Magenta Power", "password": "chargesmart123"},
]

USERS = [
    {"name": "Priya Sharma",    "email": "user@gmail.com",   "vehicle": "Tata Nexon EV"},
    {"name": "Rahul Verma",     "email": "rahul@gmail.com",  "vehicle": "MG ZS EV"},
    {"name": "Ananya Iyer",     "email": "ananya@gmail.com", "vehicle": "Ola S1 Pro"},
]

DISCOM_ADMINS = [
    {"name": "BESCOM Admin",    "email": "admin@bescom.gov.in", "password": "chargesmart123", "zone_id": 1},
]


def rand_around(center_lat, center_lng, spread_deg=0.03):
    """Random point within ~3km of center."""
    return (
        center_lat + random.uniform(-spread_deg, spread_deg),
        center_lng + random.uniform(-spread_deg, spread_deg),
    )


def stress_to_status(stress):
    if stress > 0.85: return "RED"
    if stress > 0.60: return "YELLOW"
    return "GREEN"


def hash_password(pw):
    try:
        import bcrypt
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
    except ImportError:
        return f"$demo${pw}"  # fallback for demo


def main():
    print("🔌 ChargeSmart Grid — Seeding database...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    random.seed(42)

    # ── Truncate in reverse FK order ──────────────────────────────
    cur.execute("""
        TRUNCATE station_approvals, upgrade_requests, siting_requests,
                 forecast_runs, tod_bands, charging_sessions,
                 charging_stations, transformers, zones,
                 discom_admins, operators, users
        RESTART IDENTITY CASCADE
    """)

    # ── Zones ─────────────────────────────────────────────────────
    zone_ids = []
    for z in ZONES:
        # Simple bounding box polygon for zone boundary
        c = z["center"]
        d = 0.03
        poly = f"POLYGON(({c[1]-d} {c[0]-d},{c[1]+d} {c[0]-d},{c[1]+d} {c[0]+d},{c[1]-d} {c[0]+d},{c[1]-d} {c[0]-d}))"
        cur.execute(
            "INSERT INTO zones (name, city, boundary) VALUES (%s, %s, ST_GeomFromText(%s, 4326)) RETURNING id",
            (z["name"], z["city"], poly)
        )
        zone_ids.append(cur.fetchone()[0])
    print(f"  ✓ {len(zone_ids)} zones")

    # ── Operators ─────────────────────────────────────────────────
    operator_ids = []
    for op in OPERATORS:
        cur.execute(
            "INSERT INTO operators (name, email, password_hash, company) VALUES (%s,%s,%s,%s) RETURNING id",
            (op["name"], op["email"], hash_password(op["password"]), op["company"])
        )
        operator_ids.append(cur.fetchone()[0])
    print(f"  ✓ {len(operator_ids)} operators")

    # ── Users ─────────────────────────────────────────────────────
    user_ids = []
    for u in USERS:
        cur.execute(
            "INSERT INTO users (name, email, password_hash, vehicle_type) VALUES (%s,%s,%s,%s) RETURNING id",
            (u["name"], u["email"], hash_password("chargesmart123"), u["vehicle"])
        )
        user_ids.append(cur.fetchone()[0])
    print(f"  ✓ {len(user_ids)} users")

    # ── Discom admins ─────────────────────────────────────────────
    for da in DISCOM_ADMINS:
        cur.execute(
            "INSERT INTO discom_admins (name, email, password_hash, zone_id) VALUES (%s,%s,%s,%s)",
            (da["name"], da["email"], hash_password(da["password"]), zone_ids[0])
        )
    print(f"  ✓ {len(DISCOM_ADMINS)} discom admins")

    # ── Transformers (50 total, 10 per zone) ──────────────────────
    transformer_ids = []
    # Pre-determine stress distribution: 30 GREEN, 13 YELLOW, 7 RED
    stress_pool = (
        [random.uniform(0.15, 0.58)] * 30 +
        [random.uniform(0.61, 0.84)] * 13 +
        [random.uniform(0.86, 0.97)] * 7
    )
    random.shuffle(stress_pool)
    t_idx = 0

    for zi, (zone_id, zone) in enumerate(zip(zone_ids, ZONES)):
        for j in range(TRANSFORMERS_PER_ZONE):
            lat, lng = rand_around(*zone["center"])
            feeder_id = f"T-{t_idx+1:02d}"
            capacity = random.choice([200, 315, 400, 500, 630, 800])
            stress = stress_pool[t_idx]
            load = round(capacity * 0.8 * stress, 1)
            status = stress_to_status(stress)

            cur.execute("""
                INSERT INTO transformers
                  (feeder_id, zone_id, name, location, capacity_kva, current_load_kw, stress_score, status)
                VALUES (%s,%s,%s, ST_SetSRID(ST_MakePoint(%s,%s),4326), %s,%s,%s,%s)
                RETURNING id
            """, (feeder_id, zone_id, f"{zone['name']} Feeder {j+1}",
                  lng, lat, capacity, load, round(stress, 3), status))
            transformer_ids.append(cur.fetchone()[0])
            t_idx += 1

    print(f"  ✓ {len(transformer_ids)} transformers")

    # ── Charging Stations (120 total, ~2-3 per transformer) ───────
    station_ids = []
    st_idx = 0
    for ti, t_id in enumerate(transformer_ids):
        zone_idx = ti // TRANSFORMERS_PER_ZONE
        zone = ZONES[zone_idx]
        # 2-3 stations per transformer
        n_stations = random.choice([2, 2, 3])
        for k in range(n_stations):
            lat, lng = rand_around(*zone["center"], 0.015)
            operator_id = operator_ids[ti % len(operator_ids)]
            name_base = STATION_NAMES[st_idx % len(STATION_NAMES)]
            name = f"{zone['name']} {name_base}"
            total_slots = random.choice([2, 4, 6])
            # Availability somewhat correlated with transformer stress
            t_stress = stress_pool[ti]
            occ_rate = min(0.95, t_stress + random.uniform(-0.1, 0.2))
            avail = max(0, round(total_slots * (1 - occ_rate)))
            price = 18.0 if t_stress > 0.8 else (15.0 if t_stress > 0.6 else 12.0)
            wait = max(0, round((total_slots - avail) * random.uniform(5, 15)))
            connectors = random.sample(["CCS2", "CHAdeMO", "AC Type 2", "Bharat AC-001"], 2)
            t_status = stress_pool[ti]

            cur.execute("""
                INSERT INTO charging_stations
                  (operator_id, transformer_id, name, address, location,
                   total_slots, available_slots, current_price_inr,
                   connector_types, status, avg_wait_minutes)
                VALUES (%s,%s,%s,%s, ST_SetSRID(ST_MakePoint(%s,%s),4326),
                        %s,%s,%s, %s,%s,%s)
                RETURNING id
            """, (operator_id, t_id, name,
                  f"{name}, {zone['name']}, Bengaluru",
                  lng, lat, total_slots, avail, price,
                  connectors,
                  stress_to_status(t_stress), wait))
            station_ids.append(cur.fetchone()[0])
            st_idx += 1

    print(f"  ✓ {len(station_ids)} charging stations")

    # ── Charging Sessions (500, last 30 days) ─────────────────────
    session_data = []
    for _ in range(500):
        station_id = random.choice(station_ids)
        user_id = random.choice(user_ids)
        days_ago = random.randint(0, 30)
        hour = random.choices(
            range(24),
            weights=[2,1,1,1,1,2,4,8,10,9,7,6,6,6,7,8,9,11,13,12,10,8,6,4]
        )[0]
        start = datetime.utcnow() - timedelta(days=days_ago, hours=hour,
                                               minutes=random.randint(0,59))
        duration_min = random.randint(15, 90)
        end = start + timedelta(minutes=duration_min)
        energy = round(duration_min / 60 * random.uniform(7, 22), 2)
        price_kwh = 12.0 if hour >= 23 or hour <= 6 else (18.0 if hour in range(7,11)+list(range(17,22)) else 12.0)
        cost = round(energy * price_kwh, 2)
        connector = random.choice(["CCS2", "CHAdeMO", "AC Type 2"])
        session_data.append((station_id, user_id, start, end, energy, cost, connector))

    execute_values(cur, """
        INSERT INTO charging_sessions
          (station_id, user_id, start_time, end_time, energy_kwh, cost_inr, connector_type)
        VALUES %s
    """, session_data)
    print(f"  ✓ {len(session_data)} charging sessions")

    # ── ToD Bands (for each zone) ─────────────────────────────────
    tod_data = []
    for zone_id in zone_ids:
        tod_data += [
            (zone_id, "Peak Morning",    7,  10, 18.0, 0.0),
            (zone_id, "Normal Day",      10, 17, 12.0, 0.0),
            (zone_id, "Peak Evening",    17, 21, 18.0, 0.0),
            (zone_id, "Normal Evening",  21, 23, 12.0, 0.0),
            (zone_id, "Off-Peak Night",  23, 23, 8.0,  30.0),  # 23-6 via wrap
            (zone_id, "Off-Peak Early",  0,  6,  8.0,  30.0),
        ]
    execute_values(cur, """
        INSERT INTO tod_bands (zone_id, label, start_hour, end_hour, price_inr_kwh, discount_pct)
        VALUES %s
    """, tod_data)
    print(f"  ✓ ToD pricing bands for {len(zone_ids)} zones")

    # ── Upgrade Requests (5 samples) ──────────────────────────────
    red_transformers = [transformer_ids[i] for i, s in enumerate(stress_pool) if s > 0.85][:5]
    for i, t_id in enumerate(red_transformers):
        cur.execute("""
            INSERT INTO upgrade_requests
              (transformer_id, operator_id, reason, requested_capacity_kva, discom_status)
            VALUES (%s,%s,%s,%s,%s)
        """, (t_id, operator_ids[i % len(operator_ids)],
              "EV charging load exceeds transformer capacity during peak hours",
              630, random.choice(["PENDING", "PENDING", "APPROVED"])))
    print(f"  ✓ {len(red_transformers)} upgrade requests")

    # ── Station Approvals (4 pending) ─────────────────────────────
    for i in range(4):
        status = random.choice(["PENDING", "PENDING", "APPROVED", "REJECTED"])
        cur.execute("""
            INSERT INTO station_approvals (station_id, operator_id, discom_status, notes)
            VALUES (%s,%s,%s,%s)
        """, (station_ids[i], operator_ids[i % len(operator_ids)], status,
              "Awaiting capacity verification" if status == "PENDING" else "Approved"))
    print(f"  ✓ Station approvals seeded")

    conn.commit()
    cur.close()
    conn.close()
    print("\n✅ Database seeded successfully!")
    print("   Credentials:")
    print("   Admin:    admin@bescom.gov.in   / chargesmart123")
    print("   Operator: ops@chargezone.in     / chargesmart123")
    print("   User:     user@gmail.com        / chargesmart123")


if __name__ == "__main__":
    main()
