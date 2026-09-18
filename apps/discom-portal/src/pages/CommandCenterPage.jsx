import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { transformers, recentAlerts, cityStats } from '../data/mockData';
import { addTransformerMarkers } from '../components/StressMarker';
import KPIRibbon from '../components/KPIRibbon';
import {
  AlertTriangle, CheckSquare, Clock, Download,
  Layers, Radio, RefreshCw, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ALERT_SEVERITY_CONFIG = {
  red:    { dot: 'bg-red-500', border: 'border-l-red-500', bg: 'bg-red-500/5', label: 'CRITICAL' },
  yellow: { dot: 'bg-amber-400', border: 'border-l-amber-400', bg: 'bg-amber-400/5', label: 'WARNING' },
  cyan:   { dot: 'bg-sky-400', border: 'border-l-sky-400', bg: 'bg-sky-400/5', label: 'INFO' },
  green:  { dot: 'bg-green-400', border: 'border-l-green-400', bg: 'bg-green-400/5', label: 'RESOLVED' },
};

const TOP_STRESSED = [...transformers]
  .sort((a, b) => b.stress_score - a.stress_score)
  .slice(0, 6);

export default function CommandCenterPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const stationLayerRef = useRef(null);

  const [showStations, setShowStations] = useState(true);
  const [showZones, setShowZones] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers
    markersRef.current = addTransformerMarkers(map, transformers);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Filter markers by status
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(m => m.remove());
    const filtered = selectedStatus === 'ALL' ? transformers : transformers.filter(t => t.status === selectedStatus);
    markersRef.current = addTransformerMarkers(mapInstanceRef.current, filtered);
  }, [selectedStatus]);

  // Zone circles overlay
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (stationLayerRef.current) {
      stationLayerRef.current.clearLayers();
    }

    if (showZones) {
      const zoneData = [
        { name: 'Whitefield', lat: 12.9698, lng: 77.7499, color: '#06B6D4' },
        { name: 'Koramangala', lat: 12.9352, lng: 77.6245, color: '#10B981' },
        { name: 'Electronic City', lat: 12.8456, lng: 77.6603, color: '#F59E0B' },
        { name: 'Indiranagar', lat: 12.9784, lng: 77.6408, color: '#A855F7' },
        { name: 'JP Nagar', lat: 12.9063, lng: 77.5857, color: '#EF4444' },
      ];

      const layer = L.layerGroup();
      zoneData.forEach(z => {
        L.circle([z.lat, z.lng], {
          radius: 2500,
          color: z.color,
          fillColor: z.color,
          fillOpacity: 0.05,
          weight: 1.5,
          dashArray: '6,4',
          opacity: 0.6,
        })
          .bindTooltip(`<span style="font-family:'Inter',sans-serif;font-size:12px;color:#E2E8F0;font-weight:600">${z.name}</span>`)
          .addTo(layer);
      });
      layer.addTo(mapInstanceRef.current);
      stationLayerRef.current = layer;
    }
  }, [showZones]);

  const handleRefresh = useCallback(() => {
    setLastUpdated(new Date());
  }, []);

  return (
    <div className="flex flex-col h-full gap-0 overflow-hidden">
      {/* ── Top toolbar ─────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E293B] bg-[#0f172a] shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
          <span className="text-white font-semibold text-sm">Live Grid Command Center</span>
          <span className="text-[10px] text-slate-500 ml-2">Updated {lastUpdated.toLocaleTimeString('en-IN')}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          {['ALL', 'GREEN', 'YELLOW', 'RED'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === s
                  ? s === 'GREEN' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : s === 'YELLOW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : s === 'RED' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="w-px h-4 bg-[#334155] mx-1" />
          {/* Layer toggles */}
          <button
            onClick={() => setShowZones(!showZones)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              showZones ? 'border-sky-500/40 text-sky-400 bg-sky-500/10' : 'border-[#334155] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={12} /> Zones
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-[#334155] text-slate-400 hover:text-slate-200 transition-all"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Main content: Map + Right Panel ─────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map — 60% */}
        <div className="relative flex-none" style={{ width: '60%' }}>
          <div ref={mapRef} className="w-full h-full" />
          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 z-[500] bg-[#0f172a]/90 border border-[#1E293B] rounded-xl p-3 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Grid Status</div>
            {[
              { label: 'Critical (>85%)', color: '#EF4444' },
              { label: 'Warning (65–85%)', color: '#F59E0B' },
              { label: 'Normal (<65%)', color: '#10B981' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-[#1E293B] text-[10px] text-slate-600">
              Circle size = transformer kVA
            </div>
          </div>

          {/* Transformer count overlay */}
          <div className="absolute top-4 left-4 z-[500] flex items-center gap-2 bg-[#0f172a]/90 border border-[#1E293B] rounded-xl px-3 py-2 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">
              {selectedStatus === 'ALL' ? 50 : transformers.filter(t => t.status === selectedStatus).length} transformers · Bengaluru
            </span>
          </div>
        </div>

        {/* Right Panel — 40% */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-4 bg-[#020617]">
          {/* KPI Ribbon */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Live KPIs</div>
            <KPIRibbon vertical />
          </div>

          {/* Alert Feed */}
          <div className="bg-[#0f172a] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Alert Feed</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                {recentAlerts.filter(a => a.severity === 'red').length} CRITICAL
              </span>
            </div>
            <div className="divide-y divide-[#1E293B] max-h-52 overflow-y-auto">
              {recentAlerts.map(alert => {
                const cfg = ALERT_SEVERITY_CONFIG[alert.severity];
                return (
                  <div key={alert.id} className={`px-4 py-3 border-l-2 ${cfg.border} ${cfg.bg} transition-colors`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot} ${alert.severity === 'red' ? 'animate-pulse' : ''}`} />
                        <span className="text-xs font-semibold text-white truncate">{alert.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">{alert.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 ml-4 leading-relaxed">{alert.message}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Stressed Transformers */}
          <div className="bg-[#0f172a] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1E293B]">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-semibold text-white">Top Stressed Transformers</span>
            </div>
            <div className="p-3 space-y-2">
              {TOP_STRESSED.map((t, i) => {
                const pct = Math.round(t.stress_score * 100);
                const barColor = t.status === 'RED' ? 'bg-red-500' : t.status === 'YELLOW' ? 'bg-amber-400' : 'bg-green-400';
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 w-4 shrink-0 text-right">{i + 1}</span>
                    <span className="text-xs text-slate-300 w-16 shrink-0 truncate font-mono">{t.id}</span>
                    <div className="flex-1 progress-bar-bg h-2">
                      <div
                        className={`progress-bar-fill ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold w-9 text-right shrink-0 ${
                      t.status === 'RED' ? 'text-red-400' : t.status === 'YELLOW' ? 'text-amber-400' : 'text-green-400'
                    }`}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#0f172a] rounded-xl border border-[#1E293B] p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/approvals')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] hover:border-sky-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all"
              >
                <CheckSquare size={14} className="text-sky-400" />
                Approve Stations
              </button>
              <button
                onClick={() => navigate('/tod-policy')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all"
              >
                <Clock size={14} className="text-amber-400" />
                Set ToD Policy
              </button>
              <button
                onClick={() => navigate('/simulation')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] hover:border-purple-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all"
              >
                <TrendingUp size={14} className="text-purple-400" />
                Run Simulation
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] hover:border-green-500/40 text-slate-300 hover:text-white text-xs font-medium transition-all"
              >
                <Download size={14} className="text-green-400" />
                Download Report
              </button>
            </div>
          </div>

          {/* Transformer zone summary */}
          <div className="bg-[#0f172a] rounded-xl border border-[#1E293B] p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Zone Summary</div>
            <div className="space-y-2">
              {[
                { name: 'Whitefield', color: '#06B6D4', load: 14.2, cap: 18.0 },
                { name: 'Koramangala', color: '#10B981', load: 11.5, cap: 16.5 },
                { name: 'Electronic City', color: '#F59E0B', load: 9.8, cap: 14.0 },
                { name: 'Indiranagar', color: '#A855F7', load: 8.3, cap: 12.0 },
                { name: 'JP Nagar', color: '#EF4444', load: 7.1, cap: 10.5 },
              ].map(z => (
                <div key={z.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: z.color }} />
                  <span className="text-xs text-slate-400 w-28 shrink-0 truncate">{z.name}</span>
                  <div className="flex-1 progress-bar-bg h-1.5">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(z.load / z.cap * 100).toFixed(0)}%`, background: z.color }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 w-10 text-right">
                    {(z.load / z.cap * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
