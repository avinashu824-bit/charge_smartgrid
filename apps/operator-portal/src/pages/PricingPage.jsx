import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, Edit3, Zap } from 'lucide-react';

const TOD_BANDS_DEFAULT = [
  { label: 'Peak Morning', start: '07:00', end: '10:00', price: 18, discount: 0, color: '#EF4444' },
  { label: 'Normal Day', start: '10:00', end: '17:00', price: 12, discount: 0, color: '#3B82F6' },
  { label: 'Peak Evening', start: '17:00', end: '21:00', price: 18, discount: 0, color: '#EF4444' },
  { label: 'Off-Peak Night', start: '21:00', end: '06:00', price: 8, discount: 30, color: '#10B981' },
];

// Generate 24-hour price curve
function makePriceCurve(bands) {
  return Array.from({ length: 24 }, (_, h) => {
    const label = `${h}:00`;
    const price = h >= 7 && h <= 10 ? 18 : h >= 17 && h <= 21 ? 18 : (h >= 23 || h <= 6) ? 8 : 12;
    return { hour: label, price };
  });
}

const SUGGESTION = {
  period: '5 PM – 9 PM',
  suggested: 20,
  reason: 'Grid stress at 88% — raise price to reduce demand by est. 15%',
  loadReduction: '15%',
  offPeakShift: '23% of sessions',
};

export default function PricingPage() {
  const [bands, setBands] = useState(TOD_BANDS_DEFAULT);
  const [suggestionStatus, setSuggestionStatus] = useState(null); // null | 'approved' | 'rejected'
  const [discount, setDiscount] = useState(20);
  const [couponWindow, setCouponWindow] = useState({ start: '22:00', end: '06:00' });
  const [couponPublished, setCouponPublished] = useState(false);
  const priceCurve = makePriceCurve(bands);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pricing Studio</h1>
        <p className="text-gray-400 text-sm mt-1">Manage time-of-day pricing and off-peak incentives</p>
      </div>

      {/* Platform Suggestion Card */}
      <div className="bg-amber-950/40 border border-amber-700/50 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            <span className="font-semibold text-amber-300">Platform Price Suggestion</span>
          </div>
          {suggestionStatus === 'approved' && (
            <span className="text-xs bg-emerald-900/60 text-emerald-400 border border-emerald-700 px-3 py-1 rounded-full">✓ Approved</span>
          )}
          {suggestionStatus === 'rejected' && (
            <span className="text-xs bg-red-900/60 text-red-400 border border-red-700 px-3 py-1 rounded-full">✗ Rejected</span>
          )}
        </div>
        <p className="text-sm text-gray-300 mb-1">
          Raise price to <span className="text-amber-400 font-bold">₹{SUGGESTION.suggested}/kWh</span> during <strong>{SUGGESTION.period}</strong>
        </p>
        <p className="text-xs text-gray-400 mb-4">{SUGGESTION.reason}</p>
        <div className="flex gap-3 mb-4">
          <div className="bg-gray-800 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-gray-400">Est. Load Reduction</p>
            <p className="text-emerald-400 font-bold">{SUGGESTION.loadReduction}</p>
          </div>
          <div className="bg-gray-800 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-gray-400">Sessions Shifted Off-Peak</p>
            <p className="text-blue-400 font-bold">{SUGGESTION.offPeakShift}</p>
          </div>
        </div>
        {!suggestionStatus && (
          <div className="flex gap-3">
            <button
              onClick={() => setSuggestionStatus('approved')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <CheckCircle size={16} /> Approve
            </button>
            <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
              <Edit3 size={16} /> Edit
            </button>
            <button
              onClick={() => setSuggestionStatus('rejected')}
              className="flex items-center gap-2 bg-red-900/60 hover:bg-red-900 text-red-400 px-4 py-2 rounded-xl text-sm font-medium transition-all border border-red-800"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        )}
      </div>

      {/* ToD Bands Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Current ToD Price Bands</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left pb-3">Time Band</th>
                <th className="text-left pb-3">Hours</th>
                <th className="text-left pb-3">₹/kWh</th>
                <th className="text-left pb-3">Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {bands.map((band, i) => (
                <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                  <td className="py-3">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: band.color }} />
                      {band.label}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">{band.start} – {band.end}</td>
                  <td className="py-3">
                    <span className="font-bold" style={{ color: band.color }}>₹{band.price}</span>
                  </td>
                  <td className="py-3">
                    {band.discount > 0 ? (
                      <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 rounded-full px-2 py-0.5 text-xs">
                        {band.discount}% off
                      </span>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 24h Price Curve */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">24-Hour Price Curve</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={priceCurve} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6B7280' }} interval={2} />
            <YAxis domain={[0, 22]} tick={{ fontSize: 10, fill: '#6B7280' }} />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`₹${v}/kWh`, 'Price']}
            />
            <Area type="stepAfter" dataKey="price" stroke="#F59E0B" strokeWidth={2} fill="url(#priceGrad2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Coupon Generator */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Off-Peak Coupon Generator</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Valid Window</label>
            <div className="flex items-center gap-2">
              <input type="time" value={couponWindow.start}
                onChange={e => setCouponWindow(p => ({...p, start: e.target.value}))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm flex-1" />
              <span className="text-gray-500 text-sm">to</span>
              <input type="time" value={couponWindow.end}
                onChange={e => setCouponWindow(p => ({...p, end: e.target.value}))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm flex-1" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Discount: <span className="text-emerald-400 font-bold">{discount}%</span></label>
            <input type="range" min={5} max={50} step={5} value={discount}
              onChange={e => setDiscount(Number(e.target.value))}
              className="w-full accent-emerald-500 mt-2" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-400">Preview</p>
          <p className="text-sm text-white mt-1">
            <strong className="text-emerald-400">{discount}% off</strong> from {couponWindow.start} to {couponWindow.end}
            {' '}— ₹{Math.round(12 * (1 - discount/100))}/kWh (was ₹12/kWh)
          </p>
          <p className="text-xs text-gray-500 mt-1">Est. load shift: +{Math.round(discount * 0.8)}% sessions move to off-peak window</p>
        </div>

        {couponPublished ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <CheckCircle size={16} /> Coupon published to EV User App!
          </div>
        ) : (
          <button onClick={() => setCouponPublished(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">
            Publish Coupon to App
          </button>
        )}
      </div>
    </div>
  );
}
