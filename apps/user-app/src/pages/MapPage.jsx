import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Zap, Filter } from 'lucide-react';
import StationMap from '../components/StationMap.jsx';
import StationCard from '../components/StationCard.jsx';
import NudgeBanner from '../components/NudgeBanner.jsx';
import { MOCK_STATIONS, TOD_NUDGE } from '../data/mockData.js';
import getSocket from '../utils/socket.js';

const FILTER_OPTS = ['All', 'Available', 'Cheap (<₹10)', 'Fast DC (>22kW)'];

export default function MapPage() {
  const navigate = useNavigate();
  const [stations, setStations] = useState(MOCK_STATIONS);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [livePrice, setLivePrice] = useState(null);
  const drawerRef = useRef(null);

  // Connect socket for live updates
  useEffect(() => {
    const socket = getSocket();
    socket.on('station_update', (updates) => {
      setStations(prev => prev.map(s => {
        const u = updates.find(u => u.id === s.id);
        return u ? { ...s, ...u } : s;
      }));
    });
    return () => socket.off('station_update');
  }, []);

  // Filter stations
  const filtered = stations.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.zone.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' ? true :
      activeFilter === 'Available' ? s.availableSlots > 0 :
      activeFilter === 'Cheap (<₹10)' ? s.currentPriceInr < 10 :
      activeFilter === 'Fast DC (>22kW)' ? s.powerKw > 22 : true;
    return matchesSearch && matchesFilter;
  });

  // Sort by distance
  const sorted = [...filtered].sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));

  const handleStationSelect = (station) => {
    setSelected(station);
    setDrawerOpen(true);
  };

  const handleNavigate = (station) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const cheapestStation = sorted.find(s => s.currentPriceInr === Math.min(...sorted.map(s => s.currentPriceInr)));
  const cheapestSavings = cheapestStation ? cheapestStation.savingsInr : 0;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-2xl px-3 py-2.5 gap-2">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stations or zones..."
              className="bg-transparent text-sm text-white placeholder-gray-500 flex-1 outline-none"
            />
          </div>
          <button className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-2xl p-2.5">
            <SlidersHorizontal size={18} className="text-gray-300" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_OPTS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
                activeFilter === f
                  ? 'bg-emerald-500 border-emerald-500 text-white font-medium'
                  : 'bg-gray-900/90 border-gray-700 text-gray-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <StationMap
          stations={filtered}
          onStationSelect={handleStationSelect}
          selectedStation={selected}
        />
      </div>

      {/* Bottom drawer */}
      <div className={`absolute bottom-0 left-0 right-0 z-[1000] bg-gray-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ${
        drawerOpen ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ maxHeight: '65vh' }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Smart navigation CTA */}
        {cheapestStation && !drawerOpen && (
          <div className="mx-4 mb-3 bg-gray-800 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Cheapest nearby</p>
              <p className="font-semibold text-sm">{cheapestStation.name}</p>
              <p className="text-xs text-emerald-400">{cheapestStation.distanceKm} km • ₹{cheapestStation.currentPriceInr}/kWh</p>
            </div>
            <button
              onClick={() => handleNavigate(cheapestStation)}
              className="bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1"
            >
              <Zap size={12} />
              Save ₹{cheapestSavings}
            </button>
          </div>
        )}

        {selected ? (
          /* Selected station detail */
          <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(65vh - 60px)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">{selected.name}</h2>
                <p className="text-gray-400 text-sm">{selected.address}</p>
              </div>
              <button
                onClick={() => { setDrawerOpen(false); setSelected(null); }}
                className="text-gray-500 hover:text-white text-xl leading-none ml-2"
              >×</button>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Price', value: `₹${selected.currentPriceInr}/kWh`, color: 'text-emerald-400' },
                { label: 'Slots Free', value: `${selected.availableSlots}/${selected.totalSlots}`, color: 'text-blue-400' },
                { label: 'Wait', value: selected.avgWaitMinutes > 0 ? `~${selected.avgWaitMinutes}m` : 'None', color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
                  <p className={`font-bold text-sm ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Connector types */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Connectors</p>
              <div className="flex gap-2">
                {selected.connectorTypes.map(c => (
                  <span key={c} className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-gray-300">{c}</span>
                ))}
                <span className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-emerald-400">{selected.powerKw} kW</span>
              </div>
            </div>

            {/* Navigate CTA */}
            <button
              onClick={() => handleNavigate(selected)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mb-2 transition-all shadow-lg shadow-emerald-500/30"
            >
              🧭 Navigate to {selected.name.split(' ').slice(0, 2).join(' ')} — Save ₹{selected.savingsInr}
            </button>

            <button
              onClick={() => navigate(`/station/${selected.id}`, { state: { station: selected } })}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium py-3 rounded-xl transition-all"
            >
              View Full Details →
            </button>
          </div>
        ) : (
          /* Station list */
          <div className="overflow-y-auto pb-4" style={{ maxHeight: 'calc(65vh - 60px)' }}>
            {/* Nudge banner */}
            {!nudgeDismissed && (
              <NudgeBanner nudge={TOD_NUDGE} onDismiss={() => setNudgeDismissed(true)} />
            )}

            <div className="px-4 mb-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">{sorted.length} stations nearby</p>
              <button
                className="text-xs text-emerald-400 font-medium"
                onClick={() => setDrawerOpen(true)}
              >
                See all
              </button>
            </div>

            <div className="px-4 space-y-2">
              {sorted.slice(0, 8).map(station => (
                <StationCard
                  key={station.id}
                  station={station}
                  onClick={handleStationSelect}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating open drawer button when closed */}
      {!drawerOpen && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999] bg-gray-900 border border-gray-700 rounded-2xl px-6 py-3 text-sm font-medium text-white shadow-xl flex items-center gap-2"
        >
          <Zap size={14} className="text-emerald-400" />
          {sorted.filter(s => s.status === 'GREEN').length} stations available
        </button>
      )}
    </div>
  );
}
