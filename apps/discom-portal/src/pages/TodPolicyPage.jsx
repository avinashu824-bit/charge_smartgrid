import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Save } from 'lucide-react';
import { MOCK_ZONES } from '../data/mockData.js';

const DEFAULT_BANDS = [
  { label: 'Peak Morning',    start_hour: 7,  end_hour: 10, price: 18, discount: 0,  color: '#EF4444' },
  { label: 'Normal Day',      start_hour: 10, end_hour: 17, price: 12, discount: 0,  color: '#3B82F6' },
  { label: 'Peak Evening',    start_hour: 17, end_hour: 21, price: 18, discount: 0,  color: '#EF4444' },
  { label: 'Normal Evening',  start_hour: 21, end_hour: 23, price: 12, discount: 0,  color: '#3B82F6' },
  { label: 'Off-Peak Night',  start_hour: 23, end_hour: 24, price: 8,  discount: 30, color: '#10B981' },
  { label: 'Off-Peak Early',  start_hour: 0,  end_hour: 7,  price: 8,  discount: 30, color: '#10B981' },
];

function makePriceCurve(bands) {
  return Array.from({ length: 24 }, (_, h) => {
    const band = bands.find(b => h >= b.start_hour && h < b.end_hour) || bands[1];
    return { hour: `${h}:00`, price: band.price };
  });
}

export default function TodPolicyPage() {
  const [selectedZone, setSelectedZone] = useState(MOCK_ZONES[0]);
  const [bands, setBands] = useState(DEFAULT_BANDS);
  const [saved, setSaved] = useState(false);
  const [cascadeModal, setCascadeModal] = useState(false);

  const updateBand = (i, field, value) => {
    setBands(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: Number(value) } : b));
    setSaved(false);
  };

  const priceCurve = makePriceCurve(bands);
  const peakLoad = 47.3;
  const estPeakReduction = Math.round((bands.find(b=>b.label==='Peak Evening')?.price - 12) / 12 * 100 * 0.8);
  const offPeakShift = Math.round(bands.find(b=>b.label==='Off-Peak Night')?.discount * 0.7);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ToD Policy Editor</h1>
          <p className="text-gray-400 text-sm mt-1">Configure time-of-day pricing rules for your zones</p>
        </div>
        <select
          value={selectedZone.name}
          onChange={e => setSelectedZone(MOCK_ZONES.find(z => z.name === e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm"
        >
          {MOCK_ZONES.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
        </select>
      </div>

      {/* Preview card */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Peak Load', value: `${peakLoad} MW`, sub: 'Current city peak', color: 'text-red-400' },
          { label: 'Est. Peak Reduction', value: `${estPeakReduction}%`, sub: 'With current pricing', color: 'text-emerald-400' },
          { label: 'Off-Peak Shift', value: `${offPeakShift}%`, sub: 'Sessions → off-peak', color: 'text-cyan-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-white font-medium mt-1">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Price Bands Editor */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Price Bands — {selectedZone.name}</h2>
        <div className="space-y-3">
          {bands.map((band, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-xl">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: band.color }} />
              <div className="w-36 text-sm text-gray-200 font-medium">{band.label}</div>
              <div className="text-xs text-gray-400 w-20">{band.start_hour}:00 – {band.end_hour}:00</div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-400">₹/kWh</span>
                <input
                  type="number" min={1} max={30} step={1} value={band.price}
                  onChange={e => updateBand(i, 'price', e.target.value)}
                  className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm text-center"
                />
                <span className="text-xs text-gray-400 ml-2">Disc %</span>
                <input
                  type="number" min={0} max={50} step={5} value={band.discount}
                  onChange={e => updateBand(i, 'discount', e.target.value)}
                  className="w-14 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm text-center"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setSaved(true)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <Save size={15} />
            {saved ? '✓ Saved to Zone' : `Apply to ${selectedZone.name}`}
          </button>
          <button
            onClick={() => setCascadeModal(true)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium px-5 py-2.5 rounded-xl text-sm transition-all border border-gray-600"
          >
            Cascade to All Zones
          </button>
        </div>
      </div>

      {/* Live price curve */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">24-Hour Price Curve (Live Preview)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={priceCurve} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="todGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#6B7280' }} interval={2} />
            <YAxis domain={[0, 22]} tick={{ fontSize: 9, fill: '#6B7280' }} tickFormatter={v => `₹${v}`} />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              formatter={v => [`₹${v}/kWh`, 'Price']}
            />
            <Area type="stepAfter" dataKey="price" stroke="#06B6D4" strokeWidth={2} fill="url(#todGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cascade modal */}
      {cascadeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setCascadeModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg mb-2">Cascade to All Zones?</h3>
            <p className="text-gray-400 text-sm mb-4">
              This will apply the <strong className="text-white">{selectedZone.name}</strong> pricing to all 5 zones:
              Whitefield, Koramangala, Electronic City, Indiranagar, JP Nagar.
            </p>
            <p className="text-amber-400 text-xs mb-5">⚠️ This will override any zone-specific pricing currently active.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setCascadeModal(false); setSaved(true); }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                <CheckCircle size={14} className="inline mr-1" /> Confirm Cascade
              </button>
              <button onClick={() => setCascadeModal(false)}
                className="flex-1 bg-gray-800 text-gray-300 font-medium py-2.5 rounded-xl text-sm border border-gray-700">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
