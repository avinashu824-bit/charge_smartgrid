import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { transformers } from '../data/mockData';
import { addTransformerMarkers } from '../components/StressMarker';
import { runSimulation, getSimulationSummary, getTopStressedForChart } from '../utils/simulation';
import { FlaskConical, Play, TrendingUp, AlertTriangle, Zap, ArrowRight } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a] border border-[#1E293B] rounded-xl p-3 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-medium">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

export default function SimulationPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentMarkersRef = useRef([]);
  const projectedMarkersRef = useRef([]);

  const [evGrowth, setEvGrowth] = useState(20);
  const [monthsAhead, setMonthsAhead] = useState(6);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [viewMode, setViewMode] = useState('current'); // 'current' | 'projected' | 'both'

  // Init map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 11,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;
    // Draw current markers
    currentMarkersRef.current = addTransformerMarkers(map, transformers);
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Update markers based on view mode
  useEffect(() => {
    if (!mapInstanceRef.current || !simResult) return;

    currentMarkersRef.current.forEach(m => m.remove());
    projectedMarkersRef.current.forEach(m => m.remove());

    if (viewMode === 'current') {
      currentMarkersRef.current = addTransformerMarkers(mapInstanceRef.current, transformers);
      projectedMarkersRef.current = [];
    } else if (viewMode === 'projected') {
      currentMarkersRef.current = [];
      projectedMarkersRef.current = addTransformerMarkers(
        mapInstanceRef.current,
        transformers.map((t, i) => ({
          ...t,
          status: simResult.projected_transformers[i].projected_status,
          stress_score: simResult.projected_transformers[i].projected_stress,
          current_load_kw: simResult.projected_transformers[i].projected_load_kw,
        }))
      );
    } else { // both - show projected on top of current with opacity
      currentMarkersRef.current = addTransformerMarkers(mapInstanceRef.current, transformers);
      projectedMarkersRef.current = addTransformerMarkers(
        mapInstanceRef.current,
        transformers.map((t, i) => ({
          ...t,
          status: simResult.projected_transformers[i].projected_status,
          stress_score: simResult.projected_transformers[i].projected_stress,
          current_load_kw: simResult.projected_transformers[i].projected_load_kw,
        })),
        { opacity: 0.5 }
      );
    }
  }, [viewMode, simResult]);

  const handleRunSimulation = useCallback(async () => {
    setIsRunning(true);
    await new Promise(r => setTimeout(r, 1200)); // dramatic pause

    const projected = runSimulation(transformers, evGrowth, monthsAhead);
    const summary = getSimulationSummary(transformers, projected, evGrowth, monthsAhead);
    const chart = getTopStressedForChart(transformers, projected);

    setSimResult({ ...summary, projected_transformers: projected });
    setChartData(chart);
    setHasRun(true);
    setViewMode('projected');
    setIsRunning(false);
  }, [evGrowth, monthsAhead]);

  const barColor = (entry) => {
    if (entry.projectedStatus === 'RED') return '#EF4444';
    if (entry.projectedStatus === 'YELLOW') return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1E293B] bg-[#0f172a] shrink-0">
        <FlaskConical className="w-5 h-5 text-purple-400" />
        <div>
          <h1 className="text-base font-bold text-white">EV Growth Simulation Lab</h1>
          <p className="text-[11px] text-slate-500">Model EV adoption impact on transformer grid stress</p>
        </div>
      </div>

      {/* ── Control Bar ─────────────────────────────── */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 px-4 md:px-6 py-3 md:py-4 border-b border-[#1E293B] bg-[#0f172a] shrink-0">
        <div className="flex-1 min-w-[120px] max-w-xs">
          <label className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">EV Adoption Growth</span>
            <span className="text-xs md:text-sm font-bold text-sky-400">{evGrowth}%</span>
          </label>
          <input type="range" min={0} max={100} step={5} value={evGrowth}
            onChange={e => setEvGrowth(+e.target.value)} className="w-full" />
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        <div className="flex-1 min-w-[120px] max-w-xs">
          <label className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">Months Ahead</span>
            <span className="text-xs md:text-sm font-bold text-sky-400">{monthsAhead} mo</span>
          </label>
          <input type="range" min={1} max={24} step={1} value={monthsAhead}
            onChange={e => setMonthsAhead(+e.target.value)} className="w-full" />
          <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
            <span>1m</span><span>12m</span><span>24m</span>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isRunning}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl bg-purple-500 hover:bg-purple-400 
            disabled:opacity-60 text-white font-bold text-sm transition-all shrink-0"
        >
          {isRunning ? (
            <><div className="spinner" /><span>Running...</span></>
          ) : (
            <><Play size={16} /><span>Run Simulation</span></>
          )}
        </button>

        {hasRun && (
          <div className="w-full md:w-auto flex items-center justify-center gap-1 border border-[#1E293B] rounded-xl overflow-hidden shrink-0 mt-2 md:mt-0">
            {['current', 'projected', 'both'].map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`flex-1 md:flex-none px-3 py-2 text-xs font-medium transition-all capitalize ${
                  viewMode === m ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
                }`}>
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Map */}
        <div className="relative flex-1 md:flex-none md:w-[55%] w-full h-full">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Mobile Panel Toggle */}
          <button 
            className="md:hidden absolute top-4 right-4 z-[500] bg-[#0f172a]/90 border border-purple-500/50 text-purple-400 p-2 rounded-xl backdrop-blur-sm shadow-lg flex items-center gap-2"
            onClick={() => document.getElementById('mobile-sim-panel').classList.toggle('translate-y-full')}
          >
            <TrendingUp size={16} /> <span className="text-xs font-semibold">Results</span>
          </button>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[500] bg-[#0f172a]/90 border border-[#1E293B] rounded-xl p-3 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Legend</div>
            {[
              { label: 'Critical RED', color: '#EF4444' },
              { label: 'Warning YELLOW', color: '#F59E0B' },
              { label: 'Normal GREEN', color: '#10B981' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
            {hasRun && (
              <div className="mt-2 pt-2 border-t border-[#1E293B]">
                <div className="text-[10px] text-purple-400 font-medium">Showing: {viewMode.toUpperCase()}</div>
              </div>
            )}
          </div>

          {!hasRun && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/50 z-[400]">
              <div className="text-center p-8 bg-[#0f172a]/90 rounded-2xl border border-[#1E293B] backdrop-blur-sm">
                <FlaskConical className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg mb-1">Simulation Ready</h3>
                <p className="text-slate-400 text-sm">Set parameters above and click Run Simulation</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div 
          id="mobile-sim-panel"
          className="absolute inset-x-0 bottom-0 top-16 md:top-0 md:relative md:flex-1 flex flex-col overflow-y-auto p-4 space-y-4 bg-[#0f172a] md:bg-transparent 
                     transform translate-y-full md:translate-y-0 transition-transform duration-300 ease-in-out z-[600] md:z-auto"
        >
          {/* Close button on mobile */}
          <button 
            className="md:hidden sticky top-0 left-0 bg-purple-500/10 text-purple-400 p-2 rounded-xl border border-purple-500/20 mb-2 font-medium text-xs flex justify-center w-full z-10 backdrop-blur-md"
            onClick={() => document.getElementById('mobile-sim-panel').classList.add('translate-y-full')}
          >
            Close Results
          </button>
          {/* Summary Banner */}
          {hasRun && simResult && (
            <div className="animate-fade-in">
              <div className="bg-gradient-to-r from-purple-900/30 to-[#0f172a] border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold text-sm leading-relaxed">
                      With <span className="text-purple-400">+{evGrowth}% EV growth</span> in <span className="text-sky-400">{monthsAhead} months</span>,{' '}
                      <span className="text-red-400 font-bold">{simResult.new_red_count} additional transformers</span> will reach CRITICAL status,
                      requiring <span className="text-amber-400">{simResult.upgrade_capacity_kva} kVA</span> of additional grid capacity.
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      Growth factor: {simResult.growthFactor}× · Additional load: +{simResult.additional_mw} MW
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Before/After Comparison */}
          {hasRun && simResult ? (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              {/* Current */}
              <div className="bg-[#0f172a] rounded-xl border border-[#1E293B] p-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400" />
                  CURRENT STATE
                </div>
                <div className="space-y-2">
                  <CountRow label="🔴 Critical" value={simResult.original.red} color="text-red-400" />
                  <CountRow label="🟡 Warning" value={simResult.original.yellow} color="text-amber-400" />
                  <CountRow label="🟢 Normal" value={simResult.original.green} color="text-green-400" />
                </div>
              </div>
              {/* Projected */}
              <div className="bg-[#0f172a] rounded-xl border border-purple-500/20 p-4">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  PROJECTED ({monthsAhead}m)
                </div>
                <div className="space-y-2">
                  <CountRowDiff
                    label="🔴 Critical"
                    orig={simResult.original.red}
                    proj={simResult.projected.red}
                    color="text-red-400"
                    worsens
                  />
                  <CountRowDiff
                    label="🟡 Warning"
                    orig={simResult.original.yellow}
                    proj={simResult.projected.yellow}
                    color="text-amber-400"
                    worsens
                  />
                  <CountRowDiff
                    label="🟢 Normal"
                    orig={simResult.original.green}
                    proj={simResult.projected.green}
                    color="text-green-400"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Set EV Growth %', icon: '📈', desc: 'Expected EV adoption rate' },
                { label: 'Set Months Ahead', icon: '📅', desc: 'Projection time horizon' },
                { label: 'Run Simulation', icon: '⚡', desc: 'View stress projections' },
              ].map(s => (
                <div key={s.label} className="bg-[#0f172a] rounded-xl border border-[#1E293B] p-4 text-center">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-sm font-semibold text-white mb-1">{s.label}</div>
                  <div className="text-xs text-slate-500">{s.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Bar Chart */}
          {hasRun && chartData.length > 0 && (
            <div className="bg-[#0f172a] rounded-xl border border-[#1E293B] p-4 animate-slide-in-up">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Top 10 Stressed Transformers — Before vs. After</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#64748B' }}
                  />
                  <Bar dataKey="current" name="Current %" fill="#334155" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="projected" name="Projected %" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={barColor(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Upgrade Recommendations */}
          {hasRun && simResult && simResult.new_red_count > 0 && (
            <div className="bg-[#0f172a] rounded-xl border border-red-500/20 p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-white">Upgrade Recommendations</span>
              </div>
              <div className="space-y-2">
                {simResult.projected_transformers
                  .filter(t => t.projected_status === 'RED' && t.status !== 'RED')
                  .slice(0, 4)
                  .map(t => (
                    <div key={t.id} className="flex items-center gap-3 py-2 px-3 bg-red-500/5 rounded-lg border border-red-500/10">
                      <ArrowRight className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="text-xs font-mono text-white">{t.id}</span>
                      <span className="text-xs text-slate-400">{t.zone}</span>
                      <span className="ml-auto text-xs text-red-300 font-medium">
                        Upgrade to {Math.ceil(t.capacity_kva * 1.6 / 100) * 100} kVA
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CountRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}

function CountRowDiff({ label, orig, proj, color, worsens }) {
  const diff = proj - orig;
  const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = worsens ? (diff > 0 ? 'text-red-400' : 'text-green-400') : (diff < 0 ? 'text-red-400' : 'text-green-400');

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold ${color}`}>{proj}</span>
        {diff !== 0 && (
          <span className={`text-[10px] font-bold ${diffColor}`}>({diffStr})</span>
        )}
      </div>
    </div>
  );
}
