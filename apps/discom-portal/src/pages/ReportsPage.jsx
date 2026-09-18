import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { Download, FileText } from 'lucide-react';
import { MOCK_TRANSFORMERS, MOCK_ZONES } from '../data/mockData.js';

// Last 30 days city load trend
const CITY_TREND = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
  load_mw: 38 + Math.sin(i * 0.4) * 6 + Math.random() * 3,
  capacity_mw: 72,
}));

// Zone utilization
const ZONE_UTIL = MOCK_ZONES.map(z => ({
  zone: z.name.replace(' ', '\n'),
  avg_utilization: Math.round(55 + Math.random() * 30),
  peak_utilization: Math.round(75 + Math.random() * 20),
}));

// Red transformer history
const RED_HISTORY = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  red_count: Math.floor(4 + Math.random() * 5),
}));

// 7-day zone forecast
const ZONES_FORECAST = MOCK_ZONES.map((z, zi) => ({
  zone: z.name,
  data: Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
    load: Math.round((8 + zi * 3 + Math.sin(i * 0.8 + zi) * 2) * 10) / 10
  }))
}));

function downloadCSV() {
  const headers = ['Feeder ID', 'Name', 'Zone', 'Capacity (kVA)', 'Load (kW)', 'Stress (%)', 'Status'];
  const rows = MOCK_TRANSFORMERS.map(t => [
    t.feeder_id, t.name, t.zone_name, t.capacity_kva,
    t.current_load_kw, Math.round(t.stress_score * 100), t.status
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chargesmart_stress_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const COLORS = ['#10B981','#06B6D4','#8B5CF6','#F59E0B','#EF4444'];

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const filteredT = MOCK_TRANSFORMERS.filter(t =>
    (statusFilter === 'ALL' || t.status === statusFilter) &&
    (zoneFilter === 'ALL' || t.zone_name === zoneFilter)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Grid Stress Reports</h1>
          <p className="text-slate-400 text-sm mt-1">City-wide transformer analytics and forecasts</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition-all">
            <FileText size={15} /> Download PDF
          </button>
          <button onClick={downloadCSV}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
            <Download size={15} /> Download CSV
          </button>
        </div>
      </div>

      {/* City load trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">City-Wide Load — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={CITY_TREND} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6B7280' }} interval={4} />
            <YAxis domain={[30, 80]} tick={{ fontSize: 9, fill: '#6B7280' }} unit=" MW" />
            <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="load_mw" stroke="#06B6D4" strokeWidth={2} fill="url(#loadGrad)" name="Load (MW)" />
            <Area type="monotone" dataKey="capacity_mw" stroke="#334155" strokeWidth={1} fill="none" strokeDasharray="4 4" name="Capacity (MW)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Zone utilization */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Zone Utilization (%)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ZONE_UTIL} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <XAxis dataKey="zone" tick={{ fontSize: 9, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="avg_utilization" fill="#06B6D4" name="Avg %" radius={[4,4,0,0]} />
              <Bar dataKey="peak_utilization" fill="#F59E0B" name="Peak %" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RED history */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">RED Transformers — Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={RED_HISTORY} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6B7280' }} interval={1} />
              <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="red_count" fill="#EF4444" name="RED Transformers" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-day zone forecast */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">7-Day Zone Load Forecast (MW)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
            <XAxis dataKey="day" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} unit=" MW" />
            <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {ZONES_FORECAST.map((z, i) => (
              <Line key={z.zone} data={z.data} dataKey="load" name={z.zone}
                stroke={COLORS[i]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Transformer table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">All Transformers ({filteredT.length})</h2>
          <div className="flex gap-2">
            <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-lg px-3 py-1.5">
              <option value="ALL">All Zones</option>
              {MOCK_ZONES.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
            </select>
            {['ALL','GREEN','YELLOW','RED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  statusFilter === s
                    ? s === 'RED' ? 'bg-red-900/60 border-red-700 text-red-400'
                      : s === 'YELLOW' ? 'bg-amber-900/60 border-amber-700 text-amber-400'
                      : s === 'GREEN' ? 'bg-emerald-900/60 border-emerald-700 text-emerald-400'
                      : 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 text-xs">
                <th className="text-left pb-3">Feeder</th>
                <th className="text-left pb-3">Name</th>
                <th className="text-left pb-3">Zone</th>
                <th className="text-right pb-3">Cap (kVA)</th>
                <th className="text-right pb-3">Load (kW)</th>
                <th className="text-left pb-3 pl-4">Stress</th>
                <th className="text-left pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredT.slice(0, 20).map(t => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 font-mono text-xs text-slate-400">{t.feeder_id}</td>
                  <td className="py-2.5 text-slate-200 text-xs">{t.name}</td>
                  <td className="py-2.5 text-slate-400 text-xs">{t.zone_name}</td>
                  <td className="py-2.5 text-right text-slate-300">{t.capacity_kva}</td>
                  <td className="py-2.5 text-right text-slate-300">{t.current_load_kw}</td>
                  <td className="py-2.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5 w-24">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, t.stress_score * 100)}%`,
                            background: t.status === 'RED' ? '#EF4444' : t.status === 'YELLOW' ? '#F59E0B' : '#10B981'
                          }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8">{Math.round(t.stress_score * 100)}%</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.status === 'RED' ? 'bg-red-900/40 text-red-400' :
                      t.status === 'YELLOW' ? 'bg-amber-900/40 text-amber-400' :
                      'bg-emerald-900/40 text-emerald-400'
                    }`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredT.length > 20 && (
            <p className="text-xs text-slate-500 text-center mt-3">Showing 20 of {filteredT.length}. Download CSV for full list.</p>
          )}
        </div>
      </div>
    </div>
  );
}
