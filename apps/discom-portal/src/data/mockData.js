// ─── ChargeSmart Grid — Mock Data ───────────────────────────────────────────
// 50 transformers across Bengaluru, 5 zones

const ZONES = ['Whitefield', 'Koramangala', 'Electronic City', 'Indiranagar', 'JP Nagar'];

// Zone center coordinates (lat, lng)
const ZONE_CENTERS = {
  'Whitefield':       { lat: 12.9698, lng: 77.7499, color: '#06B6D4' },
  'Koramangala':      { lat: 12.9352, lng: 77.6245, color: '#10B981' },
  'Electronic City':  { lat: 12.8456, lng: 77.6603, color: '#F59E0B' },
  'Indiranagar':      { lat: 12.9784, lng: 77.6408, color: '#A855F7' },
  'JP Nagar':         { lat: 12.9063, lng: 77.5857, color: '#EF4444' },
};

// Helper to generate random value in range
const rnd = (min, max, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Seed for reproducibility — generate fixed data
const seed = () => {
  // Transformer list, 50 total: 30 GREEN, 13 YELLOW, 7 RED
  const transformers = [];
  let id = 1;

  const statusPool = [
    ...Array(30).fill('GREEN'),
    ...Array(13).fill('YELLOW'),
    ...Array(7).fill('RED'),
  ];

  // Shuffle pool deterministically
  const shuffled = [...statusPool].sort((a, b) => {
    const h = (s) => s.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return h(a + id) - h(b + id);
  });

  ZONES.forEach((zone, zi) => {
    const center = ZONE_CENTERS[zone];
    for (let i = 0; i < 10; i++) {
      const status = shuffled[(zi * 10 + i) % 50];
      const capacity_kva = [200, 250, 315, 400, 500, 630, 800][Math.floor((zi * 10 + i) % 7)];
      let loadFactor;
      if (status === 'RED')    loadFactor = rnd(0.82, 0.97);
      else if (status === 'YELLOW') loadFactor = rnd(0.65, 0.81);
      else                      loadFactor = rnd(0.25, 0.64);

      const current_load_kw = parseFloat((capacity_kva * 0.8 * loadFactor).toFixed(1));
      const stress_score = parseFloat(loadFactor.toFixed(3));

      // Scatter around zone center
      const latOffset = (Math.sin(zi * 7 + i * 13) * 0.055);
      const lngOffset = (Math.cos(zi * 5 + i * 11) * 0.065);

      const feeder_no = String(zi * 10 + i + 1).padStart(2, '0');
      const station_count = Math.floor(rnd(2, 18));

      transformers.push({
        id: `T-${String(id).padStart(2, '0')}`,
        feeder_id: `FDR-${zone.slice(0, 2).toUpperCase()}-${feeder_no}`,
        name: `${zone} T-${feeder_no}`,
        zone,
        lat: parseFloat((center.lat + latOffset).toFixed(5)),
        lng: parseFloat((center.lng + lngOffset).toFixed(5)),
        capacity_kva,
        current_load_kw,
        stress_score,
        status,
        station_count,
        last_updated: new Date(Date.now() - Math.floor(rnd(60000, 600000))).toISOString(),
        predicted_breach_hours: status === 'RED' ? rnd(0.5, 3.5) : status === 'YELLOW' ? rnd(4, 24) : null,
        upgrade_requested: [12, 23, 31, 44, 48].includes(id),
      });
      id++;
    }
  });

  return transformers;
};

export const transformers = seed();

// Fix: ensure distribution is exactly 30G/13Y/7R
const fixDistribution = () => {
  const current = { GREEN: 0, YELLOW: 0, RED: 0 };
  transformers.forEach(t => current[t.status]++);
  // Already seeded with correct counts via statusPool
};
fixDistribution();

// ─── Zones summary ───────────────────────────────────────────────────────────
export const zones = ZONES.map((name, i) => {
  const zoneTs = transformers.filter(t => t.zone === name);
  const totalLoad = zoneTs.reduce((s, t) => s + t.current_load_kw, 0);
  const totalCap = zoneTs.reduce((s, t) => s + t.capacity_kva * 0.8, 0);
  return {
    name,
    color: ZONE_CENTERS[name].color,
    center: ZONE_CENTERS[name],
    transformer_count: zoneTs.length,
    station_count: 24,
    total_load_kw: parseFloat(totalLoad.toFixed(1)),
    total_capacity_kw: parseFloat(totalCap.toFixed(1)),
    utilization_pct: parseFloat((totalLoad / totalCap * 100).toFixed(1)),
    red_count: zoneTs.filter(t => t.status === 'RED').length,
    yellow_count: zoneTs.filter(t => t.status === 'YELLOW').length,
    green_count: zoneTs.filter(t => t.status === 'GREEN').length,
  };
});

// ─── City-wide KPIs ───────────────────────────────────────────────────────────
export const cityStats = {
  total_load_mw: parseFloat((transformers.reduce((s, t) => s + t.current_load_kw, 0) / 1000).toFixed(2)),
  total_capacity_mw: parseFloat((transformers.reduce((s, t) => s + t.capacity_kva * 0.8, 0) / 1000).toFixed(2)),
  red_count: transformers.filter(t => t.status === 'RED').length,
  yellow_count: transformers.filter(t => t.status === 'YELLOW').length,
  green_count: transformers.filter(t => t.status === 'GREEN').length,
  stations_online: 120,
  active_sessions: 234,
  ev_penetration_pct: 18.4,
};

// ─── Recent Alerts ────────────────────────────────────────────────────────────
export const recentAlerts = [
  {
    id: 'ALT-001', severity: 'red', time: '2 min ago',
    title: 'T-23 Whitefield: Critical Load Threshold',
    message: 'Predicted RED in 2.3h — 91% load utilization. Immediate action required.',
    transformer_id: 'T-23',
  },
  {
    id: 'ALT-002', severity: 'red', time: '8 min ago',
    title: 'T-47 Electronic City: Approaching Breach',
    message: 'Current load 78% — expected to breach at peak hour 6PM–9PM.',
    transformer_id: 'T-47',
  },
  {
    id: 'ALT-003', severity: 'yellow', time: '14 min ago',
    title: 'T-15 Koramangala: High EV Session Cluster',
    message: '7 simultaneous fast-charging sessions on FDR-KO-05. Load spike +12%.',
    transformer_id: 'T-15',
  },
  {
    id: 'ALT-004', severity: 'yellow', time: '31 min ago',
    title: 'T-08 Indiranagar: Upgrade Request Pending',
    message: 'Transformer approaching 75% sustained load for >4h. Upgrade to 630 kVA recommended.',
    transformer_id: 'T-08',
  },
  {
    id: 'ALT-005', severity: 'cyan', time: '42 min ago',
    title: 'T-36 JP Nagar: Station Approval Awaiting',
    message: 'Charge Point Operator (CPO) applied for 8-slot station. Grid capacity available.',
    transformer_id: 'T-36',
  },
  {
    id: 'ALT-006', severity: 'green', time: '1h ago',
    title: 'T-02 Whitefield: ToD Shift Successful',
    message: 'Off-peak incentive triggered 34% session migration 11PM–6AM. Load reduced by 18%.',
    transformer_id: 'T-02',
  },
];

// ─── Station Approval Requests ────────────────────────────────────────────────
export const stationApprovals = [
  {
    id: 'SAR-001',
    operator: 'Tata Power EV',
    location: 'Forum Mall, Whitefield',
    transformer_id: 'T-05',
    zone: 'Whitefield',
    slots: 12,
    charger_type: '50kW DC Fast',
    requested_date: '2026-09-10',
    status: 'PENDING',
  },
  {
    id: 'SAR-002',
    operator: 'Ather Energy',
    location: 'Koramangala 4th Block',
    transformer_id: 'T-12',
    zone: 'Koramangala',
    slots: 8,
    charger_type: '22kW AC',
    requested_date: '2026-09-08',
    status: 'APPROVED',
  },
  {
    id: 'SAR-003',
    operator: 'ChargeZone',
    location: 'Electronic City Phase 2',
    transformer_id: 'T-27',
    zone: 'Electronic City',
    slots: 16,
    charger_type: '150kW DC Ultra-Fast',
    requested_date: '2026-09-12',
    status: 'UNDER_REVIEW',
  },
  {
    id: 'SAR-004',
    operator: 'BPCL Pulse',
    location: 'Indiranagar 100ft Road',
    transformer_id: 'T-33',
    zone: 'Indiranagar',
    slots: 6,
    charger_type: '22kW AC',
    requested_date: '2026-09-14',
    status: 'REJECTED',
  },
];

// ─── Transformer Upgrade Requests ─────────────────────────────────────────────
export const upgradeRequests = [
  {
    id: 'UPG-001',
    transformer_id: 'T-12',
    zone: 'Koramangala',
    current_capacity_kva: 315,
    requested_capacity_kva: 630,
    reason: 'Sustained 85% load for past 30 days. 3 approved EV stations pending.',
    operator: 'BESCOM Grid Ops',
    status: 'PENDING',
    estimated_cost_lakh: 8.4,
  },
  {
    id: 'UPG-002',
    transformer_id: 'T-23',
    zone: 'Whitefield',
    current_capacity_kva: 400,
    requested_capacity_kva: 800,
    reason: 'IT corridor growth + 6 new EV stations added Q3 2026.',
    operator: 'BESCOM Grid Ops',
    status: 'APPROVED',
    estimated_cost_lakh: 12.2,
  },
  {
    id: 'UPG-003',
    transformer_id: 'T-31',
    zone: 'Electronic City',
    current_capacity_kva: 200,
    requested_capacity_kva: 400,
    reason: 'New residential complex EV charging mandate.',
    operator: 'Sobha Developers',
    status: 'PENDING',
    estimated_cost_lakh: 5.6,
  },
  {
    id: 'UPG-004',
    transformer_id: 'T-44',
    zone: 'JP Nagar',
    current_capacity_kva: 500,
    requested_capacity_kva: 800,
    reason: 'BMTC electric bus depot charging: 40 buses overnight.',
    operator: 'BMTC',
    status: 'UNDER_REVIEW',
    estimated_cost_lakh: 14.8,
  },
  {
    id: 'UPG-005',
    transformer_id: 'T-08',
    zone: 'Indiranagar',
    current_capacity_kva: 315,
    requested_capacity_kva: 500,
    reason: 'Commercial complex expansion. Sustained peak demand 72%.',
    operator: 'Embassy REIT',
    status: 'REJECTED',
    estimated_cost_lakh: 7.1,
  },
];

// ─── ToD Price Bands (default) ────────────────────────────────────────────────
export const defaultTodBands = [
  { id: 1, label: 'Off-Peak',  start: '23:00', end: '07:00', price: 8.0,  discount_pct: 30, color: '#10B981' },
  { id: 2, label: 'Morning Peak', start: '07:00', end: '10:00', price: 18.0, discount_pct: 0,  color: '#EF4444' },
  { id: 3, label: 'Day Normal', start: '10:00', end: '17:00', price: 12.0, discount_pct: 10, color: '#F59E0B' },
  { id: 4, label: 'Evening Peak', start: '17:00', end: '21:00', price: 18.0, discount_pct: 0,  color: '#EF4444' },
  { id: 5, label: 'Night Normal', start: '21:00', end: '23:00', price: 12.0, discount_pct: 10, color: '#F59E0B' },
];

// ─── 30-day Load Trend ────────────────────────────────────────────────────────
export const loadTrend30Days = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2026-08-18');
  date.setDate(date.getDate() + i);
  const base = 42 + Math.sin(i / 3) * 4 + Math.cos(i / 7) * 2;
  return {
    date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    load_mw: parseFloat((base + Math.random() * 3).toFixed(2)),
    ev_load_mw: parseFloat((base * 0.28 + Math.random() * 1.5).toFixed(2)),
    forecast_mw: parseFloat((base + 2 + Math.random() * 2).toFixed(2)),
  };
});

// ─── 7-day Zone Forecast ──────────────────────────────────────────────────────
export const zoneForecast7Days = Array.from({ length: 7 }, (_, i) => {
  const date = new Date('2026-09-17');
  date.setDate(date.getDate() + i + 1);
  const label = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  return {
    date: label,
    Whitefield: parseFloat((14.2 + Math.sin(i) * 1.8 + Math.random()).toFixed(2)),
    Koramangala: parseFloat((11.5 + Math.cos(i * 0.8) * 1.3 + Math.random()).toFixed(2)),
    'Electronic City': parseFloat((9.8 + Math.sin(i * 1.2) * 1.1 + Math.random()).toFixed(2)),
    Indiranagar: parseFloat((8.3 + Math.cos(i * 0.6) * 0.9 + Math.random()).toFixed(2)),
    'JP Nagar': parseFloat((7.1 + Math.sin(i * 0.9) * 1.0 + Math.random()).toFixed(2)),
  };
});

// ─── Zone Utilization (for bar chart) ────────────────────────────────────────
export const zoneUtilization = zones.map(z => ({
  zone: z.name.split(' ')[0],
  utilization: z.utilization_pct,
  capacity: parseFloat((z.total_capacity_kw / 1000).toFixed(2)),
  load: parseFloat((z.total_load_kw / 1000).toFixed(2)),
}));

// ─── Red Transformer History (per day) ───────────────────────────────────────
export const redHistory = Array.from({ length: 14 }, (_, i) => {
  const date = new Date('2026-09-03');
  date.setDate(date.getDate() + i);
  return {
    date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    red_count: Math.round(3 + Math.sin(i * 0.7) * 2 + Math.random() * 2),
    yellow_count: Math.round(10 + Math.cos(i * 0.5) * 2 + Math.random() * 3),
  };
});

// ─── Aliases for component compatibility ─────────────────────────────────────
export const MOCK_TRANSFORMERS = transformers;
export const MOCK_ZONES = zones;
