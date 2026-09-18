import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { transformers } from '../data/mockData';
import { addTransformerMarkers } from '../components/StressMarker';
import { getSitingRecommendations } from '../utils/siting';
import { MapPin, Target, Trophy, CheckCircle, X, Award } from 'lucide-react';

const MEDAL_CONFIG = {
  gold:   { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: '🥇', label: '1st' },
  silver: { bg: 'bg-slate-400/10',  border: 'border-slate-400/30',  text: 'text-slate-300',  badge: '🥈', label: '2nd' },
  bronze: { bg: 'bg-amber-700/10',  border: 'border-amber-700/30',  text: 'text-amber-600',  badge: '🥉', label: '3rd' },
};

function ScoreBar({ label, value, color }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="progress-bar-bg h-1.5">
        <div className="progress-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="toast toast-success flex items-center gap-2 animate-slide-in-right">
      <CheckCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2"><X size={14} /></button>
    </div>
  );
}

export default function SitingPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const pinRef = useRef(null);
  const circleRef = useRef(null);

  const [recommendations, setRecommendations] = useState([]);
  const [clickedPoint, setClickedPoint] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [approvedIds, setApprovedIds] = useState([]);

  const addToast = useCallback((msg) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;
    markersRef.current = addTransformerMarkers(map, transformers);

    // Click handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;

      // Remove old pin & circle
      if (pinRef.current) pinRef.current.remove();
      if (circleRef.current) circleRef.current.remove();

      // Add pin
      const pin = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:#06B6D4;border:3px solid white;
            box-shadow:0 0 20px rgba(6,182,212,0.8);
            display:flex;align-items:center;justify-content:center;
          ">
            <div style="width:8px;height:8px;background:white;border-radius:50%"></div>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          className: '',
        }),
      }).addTo(map);

      // Draw 2km radius circle
      const circle = L.circle([lat, lng], {
        radius: 2500,
        color: '#06B6D4',
        fillColor: '#06B6D4',
        fillOpacity: 0.07,
        weight: 1.5,
        dashArray: '6,3',
      }).addTo(map);

      pinRef.current = pin;
      circleRef.current = circle;

      // Get recommendations
      const recs = getSitingRecommendations(lat, lng, transformers, 2.5);
      setClickedPoint({ lat: lat.toFixed(4), lng: lng.toFixed(4) });
      setRecommendations(recs);

      // Highlight recommended transformer markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = addTransformerMarkers(map, transformers);
    });

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  const handleApprove = useCallback((rec) => {
    setApprovedIds(prev => [...prev, rec.transformer.id]);
    addToast(`✅ Location approved: ${rec.area_name} (${rec.transformer.id}) — Permit issued!`);
  }, [addToast]);

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} message={t.msg} onClose={() => removeToast(t.id)} />)}
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapRef} className="w-full h-full" />

        {/* Instructions banner */}
        {!clickedPoint && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-[#0f172a]/95 border border-sky-500/30 rounded-2xl px-6 py-4 backdrop-blur-sm flex items-center gap-3 shadow-xl glow-cyan animate-fade-in">
            <Target className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm">Click anywhere on the map</p>
              <p className="text-slate-400 text-xs">to find optimal EV charging station locations</p>
            </div>
          </div>
        )}

        {/* Map header */}
        <div className="absolute top-4 left-4 z-[500] bg-[#0f172a]/90 border border-[#1E293B] rounded-xl px-3 py-2 backdrop-blur-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-400" />
          <span className="text-xs text-slate-300 font-medium">Siting Tool · Bengaluru</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[500] bg-[#0f172a]/90 border border-[#1E293B] rounded-xl p-3 backdrop-blur-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Transformer Status</div>
          {[
            { label: 'Available', color: '#10B981' },
            { label: 'Caution', color: '#F59E0B' },
            { label: 'Overloaded', color: '#EF4444' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Results Panel — slides in */}
      {recommendations.length > 0 && (
        <div className="w-80 bg-[#020617] border-l border-[#1E293B] overflow-y-auto flex flex-col animate-slide-in-right">
          <div className="p-4 border-b border-[#1E293B] bg-[#0f172a]">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-bold text-white">Top Siting Locations</h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Analysed {transformers.length} transformers near ({clickedPoint?.lat}, {clickedPoint?.lng})
            </p>
          </div>

          <div className="flex-1 p-3 space-y-3">
            {recommendations.map((rec) => {
              const cfg = MEDAL_CONFIG[rec.medal];
              const isApproved = approvedIds.includes(rec.transformer.id);

              return (
                <div
                  key={rec.transformer.id}
                  className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 animate-slide-in-right`}
                  style={{ animationDelay: `${(rec.rank - 1) * 100}ms` }}
                >
                  {/* Rank header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cfg.badge}</span>
                      <div>
                        <div className={`text-xs font-bold ${cfg.text} uppercase tracking-wider`}>
                          {cfg.label} Choice
                        </div>
                        <div className="text-white font-semibold text-sm">{rec.area_name}</div>
                      </div>
                    </div>
                    <div className={`text-2xl font-black ${cfg.text}`}>
                      {rec.scores.total}%
                    </div>
                  </div>

                  {/* Transformer info */}
                  <div className="bg-[#020617]/60 rounded-lg p-2 mb-3 text-[11px]">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-400">Transformer</span>
                      <span className="text-white font-mono font-bold">{rec.transformer.id}</span>
                    </div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-400">Available Capacity</span>
                      <span className="text-green-400 font-bold">{rec.transformer.capacity_kva - Math.round(rec.transformer.current_load_kw / 0.8)} kVA</span>
                    </div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-400">Current Stations</span>
                      <span className="text-slate-300">{rec.transformer.station_count} installed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Distance</span>
                      <span className="text-slate-300">{rec.distance_km} km</span>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="mb-3">
                    <ScoreBar label="Capacity Score" value={rec.scores.capacity} color="#10B981" />
                    <ScoreBar label="Demand Score" value={rec.scores.demand} color="#06B6D4" />
                    <ScoreBar label="Access Score" value={rec.scores.access} color="#A855F7" />
                  </div>

                  {/* Approve button */}
                  {isApproved ? (
                    <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
                      <CheckCircle size={14} /> Location Approved
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApprove(rec)}
                      className="w-full py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 
                        text-sky-400 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Trophy size={12} /> Approve This Location
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-[#1E293B]">
            <p className="text-[10px] text-slate-600 text-center">
              Scores based on grid spare capacity, demand density & accessibility
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
