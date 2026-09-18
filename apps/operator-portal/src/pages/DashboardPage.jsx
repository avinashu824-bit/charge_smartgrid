import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  IndianRupee, Activity, Zap, Plug, TrendingUp,
  AlertTriangle, RefreshCw, ArrowUpRight, Server
} from 'lucide-react'
import KPICard from '../components/KPICard.jsx'
import AlertBanner from '../components/AlertBanner.jsx'
import { getSocket } from '../utils/socket.js'

const revenueData = [
  { day: 'Mon', revenue: 9840, sessions: 41 },
  { day: 'Tue', revenue: 11200, sessions: 48 },
  { day: 'Wed', revenue: 10650, sessions: 45 },
  { day: 'Thu', revenue: 13400, sessions: 57 },
  { day: 'Fri', revenue: 15200, sessions: 65 },
  { day: 'Sat', revenue: 16080, sessions: 71 },
  { day: 'Sun', revenue: 12840, sessions: 54 },
]

const hours = Array.from({ length: 24 }, (_, i) => i)
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const rawHeatmap = [
  [5,5,3,2,1,1,2,3,5,6,7,8,8,7,7,8,9,9,8,7,6,6,5,4],
  [4,3,2,1,1,1,2,4,6,7,8,8,7,7,8,9,9,8,8,7,6,5,4,3],
  [5,4,3,2,1,1,3,5,6,7,8,7,7,8,8,9,9,8,7,6,6,5,4,3],
  [5,4,3,2,1,1,2,4,6,7,7,7,8,8,9,9,8,8,7,6,5,5,4,3],
  [5,4,3,2,1,1,3,5,7,7,8,8,8,8,9,9,9,8,8,7,6,5,4,3],
  [3,2,2,1,1,1,2,4,7,8,8,8,8,9,9,9,9,8,7,7,6,5,4,3],
  [2,2,1,1,1,1,2,3,5,6,7,7,7,8,8,8,8,7,6,5,5,4,3,2],
]

function getHeatColor(val) {
  const colors = [
    '#ecfdf5','#d1fae5','#a7f3d0','#6ee7b7',
    '#34d399','#10b981','#059669','#047857','#065f46','#064e3b'
  ]
  return colors[Math.min(val, 9)]
}

const transformers = [
  { id: 'T-23', zone: 'Whitefield', load: 91, status: 'RED',    stations: 4, eta: '2h 18m' },
  { id: 'T-17', zone: 'Koramangala', load: 73, status: 'YELLOW', stations: 3, eta: null },
  { id: 'T-08', zone: 'Indiranagar', load: 42, status: 'GREEN',  stations: 3, eta: null },
]

function StatusBadge({ status }) {
  const map = {
    RED:    'bg-red-100 text-red-700 border-red-200',
    YELLOW: 'bg-amber-100 text-amber-700 border-amber-200',
    GREEN:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  const dot = {
    RED: 'bg-red-500', YELLOW: 'bg-amber-500', GREEN: 'bg-emerald-500'
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]} ${status === 'RED' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name === 'revenue' ? `\u20b9${p.value.toLocaleString('en-IN')}` : `${p.value} sessions`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [liveStations, setLiveStations] = useState(8)
  const [socketStatus, setSocketStatus] = useState('connecting')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let sock
    try {
      sock = getSocket()
      setSocketStatus('connecting')
      sock.on('connect', () => setSocketStatus('connected'))
      sock.on('disconnect', () => setSocketStatus('disconnected'))
      sock.on('connect_error', () => setSocketStatus('offline'))
      sock.on('station:update', (data) => {
        if (data?.active_count) setLiveStations(data.active_count)
        setLastUpdated(new Date())
      })
    } catch (e) {
      setSocketStatus('offline')
    }
    return () => {
      if (sock) {
        sock.off('connect')
        sock.off('disconnect')
        sock.off('connect_error')
        sock.off('station:update')
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alert Banner */}
      <AlertBanner
        feeder_id="Feeder T-23"
        message="Whitefield Zone predicted to go RED at 7:30 PM — 2.3 hrs away. Consider price surge."
        severity="high"
        time="5:12 PM"
      />

      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Bengaluru South Zone · DISCOM Licensed</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
              socketStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : socketStatus === 'offline'
                ? 'bg-gray-100 text-gray-500 border border-gray-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                socketStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                socketStatus === 'offline' ? 'bg-gray-400' : 'bg-amber-500 animate-pulse'
              }`} />
              {socketStatus === 'connected' ? 'Live' : socketStatus === 'offline' ? 'Demo Mode' : 'Connecting...'}
            </div>
            <button
              onClick={() => {
                setIsRefreshing(true)
                const sock = getSocket()
                if (sock && sock.disconnected) sock.connect()
                setLastUpdated(new Date())
                setTimeout(() => setIsRefreshing(false), 800)
              }}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors active:scale-95"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-emerald-500' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
          <KPICard
            title="Today's Revenue"
            value={`\u20b912,840`}
            subtitle="Wednesday, 17 Sep"
            trend="up"
            trendValue="+12.3%"
            color="emerald"
            icon={IndianRupee}
          />
          <KPICard
            title="Weekly Revenue"
            value={`\u20b978,320`}
            subtitle="Mon–Sun this week"
            trend="up"
            trendValue="+8.1%"
            color="blue"
            icon={TrendingUp}
          />
          <KPICard
            title="Avg Utilization"
            value="67%"
            subtitle="Across all stations"
            trend="up"
            trendValue="+3.5%"
            color="violet"
            icon={Activity}
          />
          <KPICard
            title="Active Stations"
            value={`${liveStations}/12`}
            subtitle={`${12 - liveStations} offline`}
            trend={liveStations >= 10 ? 'up' : 'down'}
            trendValue={`${liveStations} online`}
            color={liveStations >= 10 ? 'emerald' : 'amber'}
            icon={Plug}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Revenue Chart */}
          <div className="xl:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Revenue Trend</h3>
                <p className="text-xs text-gray-400 mt-0.5">Last 7 days · Daily earnings</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Revenue
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />Sessions
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20b9${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="sessions" stroke="#60a5fa" strokeWidth={2} dot={false} yAxisId={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900">Peak Load Today</h3>
              </div>
              <div className="space-y-3">
                {[
                  { time: '6:00 PM', load: '187 kW', pct: 91, color: 'bg-red-400' },
                  { time: '5:00 PM', load: '163 kW', pct: 79, color: 'bg-amber-400' },
                  { time: '9:00 AM', load: '141 kW', pct: 68, color: 'bg-emerald-400' },
                ].map((item) => (
                  <div key={item.time}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 font-medium">{item.time}</span>
                      <span className="text-gray-700 font-semibold">{item.load}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight size={16} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-gray-900">Today's Top Station</h3>
              </div>
              <p className="text-base font-bold text-gray-900">Whitefield EV Hub</p>
              <p className="text-xs text-gray-400 mb-3">Feeder T-23 · 4 slots</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-emerald-700">₹3,240</p>
                  <p className="text-xs text-emerald-600">Revenue</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-blue-700">84%</p>
                  <p className="text-xs text-blue-600">Utilization</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Hourly Utilization Heatmap</h3>
              <p className="text-xs text-gray-400 mt-0.5">Station utilization % by hour · Last 7 days</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Low</span>
              <div className="flex gap-0.5">
                {['#d1fae5','#6ee7b7','#34d399','#10b981','#059669','#065f46'].map((c) => (
                  <div key={c} className="w-5 h-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-xs text-gray-400">High</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Hour labels */}
              <div className="flex items-center mb-1">
                <div className="w-10 flex-shrink-0" />
                <div className="flex-1 grid gap-0.5" style={{ gridTemplateColumns: `repeat(24, 1fr)` }}>
                  {hours.map((h) => (
                    <div key={h} className="text-center text-xs text-gray-400 font-medium">
                      {h % 4 === 0 ? `${h}h` : ''}
                    </div>
                  ))}
                </div>
              </div>
              {/* Grid */}
              {rawHeatmap.map((row, di) => (
                <div key={days[di]} className="flex items-center mb-0.5 gap-0.5">
                  <div className="w-10 flex-shrink-0 text-xs text-gray-500 font-medium">{days[di]}</div>
                  <div className="flex-1 grid gap-0.5" style={{ gridTemplateColumns: `repeat(24, 1fr)` }}>
                    {row.map((val, hi) => (
                      <div
                        key={hi}
                        className="h-7 rounded-sm transition-all cursor-default group relative"
                        style={{ backgroundColor: getHeatColor(val) }}
                        title={`${days[di]} ${hi}:00 — ${val * 10}% utilization`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transformer Health */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Server size={18} className="text-gray-500" />
              <div>
                <h3 className="text-base font-bold text-gray-900">Transformer Health</h3>
                <p className="text-xs text-gray-400 mt-0.5">DISCOM grid infrastructure · Real-time stress monitoring</p>
              </div>
            </div>
            <div className="text-xs text-gray-400">Last sync: {lastUpdated.toLocaleTimeString('en-IN')}</div>
          </div>

          <div className="space-y-4">
            {transformers.map((t) => (
              <div key={t.id} className={`rounded-xl p-4 border ${
                t.status === 'RED' ? 'bg-red-50 border-red-200' :
                t.status === 'YELLOW' ? 'bg-amber-50 border-amber-200' :
                'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      t.status === 'RED' ? 'bg-red-100' :
                      t.status === 'YELLOW' ? 'bg-amber-100' : 'bg-emerald-100'
                    }`}>
                      <Zap size={18} className={
                        t.status === 'RED' ? 'text-red-500' :
                        t.status === 'YELLOW' ? 'text-amber-500' : 'text-emerald-500'
                      } />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{t.id}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{t.zone} · {t.stations} stations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {t.eta && (
                      <div className="text-right">
                        <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                          <AlertTriangle size={11} /> Critical in {t.eta}
                        </p>
                      </div>
                    )}
                    {t.status === 'RED' && (
                      <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        Request Upgrade
                      </button>
                    )}
                    {t.status === 'YELLOW' && (
                      <button className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        Monitor
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Load Stress</span>
                    <span className={`font-bold ${
                      t.status === 'RED' ? 'text-red-600' :
                      t.status === 'YELLOW' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{t.load}%</span>
                  </div>
                  <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        t.status === 'RED' ? 'bg-red-500' :
                        t.status === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${t.load}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
