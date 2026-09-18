// Realistic synthetic mock data: 40 EV charging stations in Bengaluru

const CONNECTOR_TYPES = ['CCS2', 'CHAdeMO', 'AC Type 2', 'Bharat AC-001'];
const ZONES = ['Whitefield', 'Koramangala', 'Electronic City', 'Indiranagar', 'JP Nagar', 'Marathahalli', 'HSR Layout', 'Bellandur'];

const STATION_NAMES = [
  'Whitefield EV Hub', 'ITPL Charge Point', 'Prestige Tech Park EV', 'Varthur EV Station',
  'Koramangala Fast Charge', 'Forum Mall EV Zone', 'HSR EV Corner', 'Sarjapur EV Hub',
  'Ecity Phase 1 Charger', 'Ecity Tech Zone EV', 'Infosys Campus EV', 'TCS EV Dock',
  'Indiranagar EV Bay', 'Defence Colony Charger', 'CMH Road EV Hub', '80 Feet Road Charge',
  'JP Nagar EV Point', 'Banashankari Charger', 'Kanakapura EV Hub', 'Gottigere Fast DC',
  'Marathahalli Bridge EV', 'Outer Ring Road Hub', 'Kadubeesanahalli EV', 'Brookfield EV',
  'Bellandur Lake EV', 'Sarjapur Road Charge', 'Eco Space EV Hub', 'RMZ Infinity EV',
  'MG Road Fast Charge', 'Brigade Road EV', 'Lavelle Road EV', 'UB City Charger',
  'Hebbal Flyover EV', 'Yeshwanthpur EV Hub', 'Rajajinagar Charge', 'Malleshwaram EV',
  'Vijayanagar EV Hub', 'Basaveshwara Nagar', 'Peenya Industrial EV', 'Tumkur Road EV'
];

const STATUS_COLORS = { GREEN: '#10B981', YELLOW: '#F59E0B', RED: '#EF4444' };

function randBetween(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Fixed seed-like generation for consistent data
const BASE_LAT = 12.9716;
const BASE_LNG = 77.5946;

const LAT_LNG_SPREAD = [
  [12.9698, 77.7500], [12.9629, 77.7400], [12.9850, 77.7300], [12.9551, 77.7350],
  [12.9352, 77.6245], [12.9274, 77.6114], [12.9100, 77.6482], [12.8721, 77.6965],
  [12.8470, 77.6600], [12.8512, 77.6700], [12.8680, 77.6400], [12.8590, 77.6580],
  [12.9784, 77.6408], [12.9820, 77.6350], [12.9700, 77.6450], [12.9750, 77.6380],
  [12.9082, 77.5917], [12.9150, 77.5850], [12.9030, 77.5780], [12.8950, 77.5900],
  [12.9541, 77.7011], [12.9600, 77.7100], [12.9480, 77.7150], [12.9650, 77.7200],
  [12.9138, 77.6851], [12.8900, 77.6900], [12.9200, 77.6950], [12.9300, 77.6800],
  [12.9716, 77.5946], [12.9760, 77.6050], [12.9680, 77.6000], [12.9740, 77.6100],
  [13.0358, 77.5970], [13.0100, 77.5600], [12.9950, 77.5550], [13.0200, 77.5500],
  [12.9699, 77.5369], [12.9750, 77.5300], [13.0200, 77.5100], [12.9900, 77.5400]
];

const statuses = [
  'GREEN','GREEN','GREEN','GREEN','GREEN','GREEN','GREEN','GREEN',
  'GREEN','GREEN','GREEN','GREEN','GREEN','GREEN','GREEN','GREEN',
  'GREEN','GREEN','GREEN','GREEN','GREEN','GREEN','GREEN','GREEN',
  'YELLOW','YELLOW','YELLOW','YELLOW','YELLOW','YELLOW','YELLOW','YELLOW',
  'YELLOW','YELLOW','YELLOW','YELLOW','YELLOW','RED','RED','RED'
];

export const MOCK_STATIONS = STATION_NAMES.map((name, i) => {
  const status = statuses[i] || 'GREEN';
  const totalSlots = [2, 4, 6, 8][Math.floor(i % 4)];
  const utilization = status === 'RED' ? 0.9 + Math.random() * 0.1
    : status === 'YELLOW' ? 0.6 + Math.random() * 0.3
    : 0.1 + Math.random() * 0.5;
  const availableSlots = Math.max(0, Math.floor(totalSlots * (1 - utilization)));
  const basePrice = 12;
  const currentPrice = status === 'RED' ? 18 : status === 'YELLOW' ? 15 : 12;
  const cheapestNearby = 8; // off-peak
  const savings = Math.round((currentPrice - cheapestNearby) * 8); // assume 8 kWh session

  return {
    id: i + 1,
    name,
    zone: ZONES[i % ZONES.length],
    lat: LAT_LNG_SPREAD[i][0],
    lng: LAT_LNG_SPREAD[i][1],
    status,
    statusColor: STATUS_COLORS[status],
    totalSlots,
    availableSlots,
    currentPriceInr: currentPrice,
    offPeakPriceInr: 8,
    connectorTypes: [CONNECTOR_TYPES[i % 4], CONNECTOR_TYPES[(i + 1) % 4]],
    avgWaitMinutes: availableSlots === 0 ? Math.floor(10 + Math.random() * 20) : 0,
    transformerId: Math.floor(i / 4) + 1,
    feederId: `T-${String(Math.floor(i / 4) + 1).padStart(2, '0')}`,
    distanceKm: (0.3 + Math.random() * 3).toFixed(1),
    savingsInr: savings,
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    address: `${name}, ${ZONES[i % ZONES.length]}, Bengaluru`,
    powerKw: [7.4, 22, 50, 150][i % 4],
    // 24h price history
    priceHistory: Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${h}:00`,
      price: h >= 7 && h <= 10 ? 18 : h >= 17 && h <= 21 ? 18 : h >= 23 || h <= 6 ? 8 : 12
    }))
  };
});

export const TOD_NUDGE = {
  message: 'Charge after 11 PM for 30% off',
  detailMessage: 'Off-peak rate ₹8/kWh vs current ₹12/kWh',
  savingsInr: 32,
  validFrom: '11:00 PM',
  validTo: '6:00 AM'
};

export const USER_SESSIONS = [
  { id: 1, station: 'Koramangala Fast Charge', date: '2024-01-15', energyKwh: 18.4, costInr: 221, duration: '42 min', connector: 'CCS2' },
  { id: 2, station: 'ITPL Charge Point', date: '2024-01-12', energyKwh: 12.0, costInr: 144, duration: '28 min', connector: 'CCS2' },
  { id: 3, station: 'Indiranagar EV Bay', date: '2024-01-10', energyKwh: 22.5, costInr: 180, duration: '1h 8min', connector: 'AC Type 2' },
  { id: 4, station: 'Ecity Tech Zone EV', date: '2024-01-08', energyKwh: 9.8, costInr: 78, duration: '18 min', connector: 'CHAdeMO' },
  { id: 5, station: 'Whitefield EV Hub', date: '2024-01-05', energyKwh: 31.2, costInr: 250, duration: '1h 32min', connector: 'CCS2' },
];
