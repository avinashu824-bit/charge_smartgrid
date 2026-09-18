require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const Redis = require('ioredis');

const PORT = process.env.PORT || 3000;
const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:8000';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const app = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chargesmart-api-gateway', version: '1.0.0' });
});

// ── Proxy all /api/* → core-api ───────────────────────────────────
app.use('/api', createProxyMiddleware({
  target: CORE_API_URL,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error('[Proxy Error]', err.message);
      res.status(502).json({ error: 'Core API unavailable', detail: err.message });
    }
  }
}));

// ── Socket.io ─────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

// Redis for pub/sub (optional — graceful fallback)
let redis = null;
try {
  redis = new Redis(REDIS_URL);
  redis.on('error', (e) => {
    console.warn('[Redis] Connection error — running without pub/sub:', e.message);
    redis = null;
  });
  console.log('[Redis] Connected');
} catch (e) {
  console.warn('[Redis] Unavailable, skipping');
}

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('subscribe_station', (stationId) => {
    socket.join(`station_${stationId}`);
    console.log(`[Socket] ${socket.id} subscribed to station ${stationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Live station push (every 5 seconds) ───────────────────────────
async function pushStationUpdates() {
  try {
    const res = await axios.get(`${CORE_API_URL}/api/stations`, { timeout: 3000 });
    const stations = res.data;

    // Simulate small real-time fluctuations for demo
    const updates = stations.map(s => ({
      id: s.id,
      status: s.status,
      current_price_inr: s.current_price_inr,
      available_slots: s.available_slots,
      avg_wait_minutes: s.avg_wait_minutes,
    }));

    io.emit('station_update', updates);

    if (redis) {
      await redis.set('latest_station_update', JSON.stringify(updates), 'EX', 30);
    }
  } catch (err) {
    // Core API might still be starting up
  }
}

// ── Live transformer push (every 30 seconds) ──────────────────────
async function pushTransformerUpdates() {
  try {
    const res = await axios.get(`${CORE_API_URL}/api/transformers`, { timeout: 3000 });
    io.emit('transformer_update', res.data);
  } catch (err) {}
}

// ── Alerts push (every 60 seconds) ───────────────────────────────
async function pushAlerts() {
  try {
    const res = await axios.get(`${CORE_API_URL}/api/transformers/alerts`, { timeout: 3000 });
    if (res.data.length > 0) {
      io.emit('transformer_alerts', res.data);
    }
  } catch (err) {}
}

// ── ToD nudge push (every 5 minutes) ─────────────────────────────
function pushTodNudge() {
  const hour = new Date().getHours();
  const isOffPeak = hour >= 23 || hour <= 6;
  const isPeak = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21);
  const currentPrice = isPeak ? 18 : isOffPeak ? 8 : 12;
  const offPeakPrice = 8;

  if (!isOffPeak) {
    io.emit('tod_nudge', {
      message: `Charge after 11 PM for ${Math.round((1 - offPeakPrice/currentPrice)*100)}% off`,
      current_price: currentPrice,
      off_peak_price: offPeakPrice,
      savings_inr: Math.round((currentPrice - offPeakPrice) * 15),
      valid_from: '23:00',
      valid_to: '06:00'
    });
  }
}

// Start real-time loops after short delay (let core-api boot)
setTimeout(() => {
  pushStationUpdates();
  pushTransformerUpdates();
  pushAlerts();
  pushTodNudge();

  setInterval(pushStationUpdates, 5000);
  setInterval(pushTransformerUpdates, 30000);
  setInterval(pushAlerts, 60000);
  setInterval(pushTodNudge, 300000);
}, 8000);

// ── Start server ──────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n⚡ ChargeSmart API Gateway running on http://localhost:${PORT}`);
  console.log(`   Proxying /api/* → ${CORE_API_URL}`);
  console.log(`   WebSocket live updates: station (5s), transformer (30s), alerts (60s)\n`);
});
