import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Navigation, Zap, Star, MapPin, Clock } from 'lucide-react';
import { MOCK_STATIONS } from '../data/mockData.js';

const STATUS_LABEL = { GREEN: 'Available', YELLOW: 'Busy', RED: 'Full' };
const STATUS_CLS = {
  GREEN: 'status-green',
  YELLOW: 'status-yellow',
  RED: 'status-red',
};

export default function StationDetailPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const station = state?.station || MOCK_STATIONS.find(s => s.id === parseInt(id));
  if (!station) return <div className="p-8 text-neutral-400">Station not found.</div>;

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-2 text-xs">
        <p className="text-neutral-400">{label}</p>
        <p className="text-violet-400 font-bold">₹{payload[0].value}/kWh</p>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-sm px-4 py-3 border-b border-neutral-800 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{station.name}</p>
          <p className="text-xs text-neutral-400 truncate">{station.zone}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CLS[station.status]}`}>
          {STATUS_LABEL[station.status]}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '⚡', label: 'Current Price', value: `₹${station.currentPriceInr}/kWh`, sub: `Off-peak: ₹${station.offPeakPriceInr}/kWh` },
            { icon: '🔌', label: 'Available Slots', value: `${station.availableSlots} / ${station.totalSlots}`, sub: `${station.totalSlots - station.availableSlots} in use` },
            { icon: '⚡', label: 'Max Power', value: `${station.powerKw} kW`, sub: station.powerKw > 22 ? 'DC Fast Charge' : 'AC Charging' },
            { icon: '⭐', label: 'Rating', value: `${station.rating}/5`, sub: `${Math.floor(Math.random() * 200 + 50)} reviews` },
          ].map(({ icon, label, value, sub }) => (
            <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3">
              <p className="text-lg mb-1">{icon}</p>
              <p className="font-bold text-sm">{value}</p>
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="text-xs text-neutral-600 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Address */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-start gap-3">
          <MapPin size={16} className="text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-neutral-200">{station.address}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{station.distanceKm} km from your location</p>
          </div>
        </div>

        {/* 24h Price Chart */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <p className="font-semibold text-sm mb-1">Today's Price Schedule</p>
          <p className="text-xs text-neutral-400 mb-3">₹/kWh by hour</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={station.priceHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6B7280' }} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} domain={[6, 20]} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#priceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              Peak ₹18 (7-10AM, 5-9PM)
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              Off-peak ₹8 (11PM-6AM)
            </div>
          </div>
        </div>

        {/* Connectors */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <p className="font-semibold text-sm mb-3">Connector Types</p>
          <div className="flex flex-wrap gap-2">
            {station.connectorTypes.map(c => (
              <span key={c} className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-neutral-300">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Navigate CTA */}
        <button
          onClick={handleNavigate}
          className="w-full bg-violet-500 hover:bg-violet-400 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-violet-500/30 text-base"
        >
          <Navigation size={20} />
          Navigate Here — Save ₹{station.savingsInr}
        </button>

        <p className="text-center text-xs text-neutral-500">
          {station.distanceKm} km away • {station.powerKw > 22 ? '~20min' : '~1hr'} to 80% charge
        </p>
      </div>
    </div>
  );
}
