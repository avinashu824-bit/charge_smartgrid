import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Zap, ChevronUp, ChevronDown, X } from 'lucide-react';
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
  // Start as 'closed' — only a tiny 52px strip shows at the bottom
  const [drawerState, setDrawerState] = useState('closed');
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const drawerRef = useRef(null);

  // Touch drag state
  const dragStartY = useRef(null);
  const dragStartState = useRef(null);

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

  const sorted = [...filtered].sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));

  const cheapestStation = sorted.find(s => s.currentPriceInr === Math.min(...sorted.map(s => s.currentPriceInr)));
  const cheapestSavings = cheapestStation ? cheapestStation.savingsInr : 0;

  const handleStationSelect = (station) => {
    setSelected(station);
    setDrawerState('open');
  };

  const handleNavigate = (station) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const toggleDrawer = () => {
    if (drawerState === 'open') setDrawerState('peek');
    else if (drawerState === 'peek') setDrawerState('open');
    else setDrawerState('peek');
  };

  const closeDrawer = () => {
    setSelected(null);
    setDrawerState('closed');
  };

  // Touch drag handlers
  const onTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartState.current = drawerState;
  };
  const onTouchEnd = (e) => {
    if (dragStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - dragStartY.current;
    if (deltaY > 60) {
      // Dragged down → collapse
      if (drawerState === 'open') setDrawerState('peek');
      else setDrawerState('closed');
    } else if (deltaY < -60) {
      // Dragged up → expand
      if (drawerState === 'closed') setDrawerState('peek');
      else setDrawerState('open');
    }
    dragStartY.current = null;
  };

  const drawerHeight = drawerState === 'closed' ? '52px' : drawerState === 'peek' ? '38vh' : '65vh';

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Header — search + filters always on top of map */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 rounded-2xl px-3 py-2.5 gap-2">
            <Search size={16} className="text-neutral-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stations or zones..."
              className="bg-transparent text-sm text-white placeholder-neutral-500 flex-1 outline-none"
            />
          </div>
          <button className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-700 rounded-2xl p-2.5">
            <SlidersHorizontal size={18} className="text-neutral-300" />
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
                  ? 'bg-violet-500 border-violet-500 text-white font-medium'
                  : 'bg-neutral-900/90 border-neutral-700 text-neutral-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Map — always fills the full screen behind the drawer */}
      <div className="absolute inset-0">
        <StationMap
          stations={filtered}
          onStationSelect={handleStationSelect}
          selectedStation={selected}
        />
      </div>

      {/* Bottom drawer — slides up from bottom */}
      <div
        ref={drawerRef}
        className="absolute bottom-0 left-0 right-0 z-[1000] bg-neutral-900 rounded-t-3xl shadow-2xl"
        style={{
          height: drawerHeight,
          transition: 'height 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          overflow: 'hidden',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle — always visible, clickable to toggle */}
        <div
          className="flex justify-center items-center gap-3 pt-2 pb-2 cursor-pointer select-none"
          onClick={toggleDrawer}
        >
          <div className="w-10 h-1 bg-neutral-600 rounded-full" />
          {drawerState === 'closed' && (
            <span className="text-xs text-neutral-400 font-medium">
              {sorted.filter(s => s.status === 'GREEN').length} stations available · tap to view
            </span>
          )}
        </div>

        {/* Cheapest nearby quick bar — shown only in peek state */}
        {cheapestStation && drawerState === 'peek' && (
          <div className="mx-4 mb-3 bg-neutral-800 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400">Cheapest nearby</p>
              <p className="font-semibold text-sm text-white">{cheapestStation.name}</p>
              <p className="text-xs text-emerald-400">{cheapestStation.distanceKm} km · ₹{cheapestStation.currentPriceInr}/kWh</p>
            </div>
            <button
              onClick={() => handleNavigate(cheapestStation)}
              className="bg-violet-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1"
            >
              <Zap size={12} />
              Save ₹{cheapestSavings}
            </button>
          </div>
        )}

        {/* Full content — only rendered when peek or open */}
        {drawerState !== 'closed' && (
          <div className="overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
            {selected ? (
              /* Selected station detail */
              <div className="px-4 pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-lg text-white">{selected.name}</h2>
                    <p className="text-neutral-400 text-sm">{selected.address}</p>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="text-neutral-500 hover:text-white ml-2 p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Price', value: `₹${selected.currentPriceInr}/kWh`, color: 'text-violet-400' },
                    { label: 'Slots Free', value: `${selected.availableSlots}/${selected.totalSlots}`, color: 'text-blue-400' },
                    { label: 'Wait', value: selected.avgWaitMinutes > 0 ? `~${selected.avgWaitMinutes}m` : 'None', color: 'text-amber-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-neutral-800 rounded-xl p-3 text-center">
                      <p className={`font-bold text-sm ${color}`}>{value}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Connector types */}
                <div className="mb-4">
                  <p className="text-xs text-neutral-400 mb-2">Connectors</p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.connectorTypes.map(c => (
                      <span key={c} className="text-xs bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-neutral-300">{c}</span>
                    ))}
                    <span className="text-xs bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-violet-400">{selected.powerKw} kW</span>
                  </div>
                </div>

                <button
                  onClick={() => handleNavigate(selected)}
                  className="w-full bg-violet-500 hover:bg-violet-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 mb-2 transition-all shadow-lg shadow-violet-500/30"
                >
                  🚗 Navigate — Save ₹{selected.savingsInr}
                </button>

                <button
                  onClick={() => navigate(`/station/${selected.id}`, { state: { station: selected } })}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium py-3 rounded-xl transition-all"
                >
                  View Full Details →
                </button>
              </div>
            ) : (
              /* Station list */
              <div className="pb-4">
                {!nudgeDismissed && (
                  <NudgeBanner nudge={TOD_NUDGE} onDismiss={() => setNudgeDismissed(true)} />
                )}

                <div className="px-4 mb-2 flex items-center justify-between">
                  <p className="text-xs text-neutral-400">{sorted.length} stations nearby</p>
                  <button
                    className="text-xs text-violet-400 font-medium flex items-center gap-1"
                    onClick={toggleDrawer}
                  >
                    {drawerState === 'open' ? (
                      <><ChevronDown size={14} /> Collapse</>
                    ) : (
                      <><ChevronUp size={14} /> See all</>
                    )}
                  </button>
                </div>

                <div className="px-4 space-y-2">
                  {sorted.slice(0, 10).map(station => (
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
        )}
      </div>
    </div>
  );
}
