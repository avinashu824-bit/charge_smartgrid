import React, { useState } from 'react';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

const UPGRADE_REQUESTS = [
  { id: 1, feeder: 'T-03', transformer: 'Whitefield Feeder 3', zone: 'Whitefield', current_kva: 400, requested_kva: 630, reason: 'EV load exceeds capacity during peak hours (91% stress)', operator: 'Tata Power EV', status: 'PENDING', date: '2024-01-14' },
  { id: 2, feeder: 'T-18', transformer: 'Koramangala Feeder 8', zone: 'Koramangala', current_kva: 315, requested_kva: 500, reason: 'Cluster of new residential EV users overloading feeder', operator: 'Charge Zone India', status: 'APPROVED', date: '2024-01-10' },
  { id: 3, feeder: 'T-22', transformer: 'Electronic City Feeder 2', zone: 'Electronic City', current_kva: 630, requested_kva: 800, reason: 'Tech park EV fleet charging causing 87% peak load', operator: 'Magenta Mobility', status: 'PENDING', date: '2024-01-16' },
  { id: 4, feeder: 'T-07', transformer: 'Indiranagar Feeder 7', zone: 'Indiranagar', current_kva: 200, requested_kva: 400, reason: 'Multiple high-power DC chargers requested by mall operator', operator: 'Tata Power EV', status: 'UNDER_REVIEW', date: '2024-01-12' },
  { id: 5, feeder: 'T-41', transformer: 'JP Nagar Feeder 1', zone: 'JP Nagar', current_kva: 500, requested_kva: 630, reason: 'EV taxi fleet depot causing sustained high load', operator: 'Charge Zone India', status: 'REJECTED', date: '2024-01-08' },
];

const STATION_APPROVALS = [
  { id: 1, name: 'Whitefield Metro EV Hub', operator: 'Tata Power EV', transformer: 'T-04', slots: 8, zone: 'Whitefield', status: 'PENDING', date: '2024-01-16' },
  { id: 2, name: 'Koramangala Forum Charger', operator: 'Charge Zone India', transformer: 'T-15', slots: 4, zone: 'Koramangala', status: 'APPROVED', date: '2024-01-11' },
  { id: 3, name: 'EC Phase 2 Charge Bay', operator: 'Magenta Mobility', transformer: 'T-21', slots: 6, zone: 'Electronic City', status: 'REJECTED', date: '2024-01-09' },
  { id: 4, name: 'HSR EV Corridor', operator: 'Tata Power EV', transformer: 'T-38', slots: 4, zone: 'Koramangala', status: 'UNDER_REVIEW', date: '2024-01-15' },
];

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', cls: 'bg-orange-900/40 text-orange-400 border-orange-800/50', Icon: Clock },
  APPROVED: { label: 'Approved', cls: 'bg-amber-900/40 text-amber-400 border-amber-800/50', Icon: CheckCircle },
  REJECTED: { label: 'Rejected', cls: 'bg-red-900/40 text-red-400 border-red-800/50', Icon: XCircle },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-blue-900/40 text-blue-400 border-blue-800/50', Icon: AlertTriangle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

export default function RequestsPage() {
  const [tab, setTab] = useState('upgrade');
  const [upgrades, setUpgrades] = useState(UPGRADE_REQUESTS);
  const [approvals, setApprovals] = useState(STATION_APPROVALS);

  const submitUpgrade = () => {
    alert('Upgrade request submitted to DISCOM Discom Admin. You will be notified within 48 hours.');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Requests & Approvals</h1>
        <p className="text-zinc-400 text-sm mt-1">Track upgrade requests and station approval status</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-0">
        {[
          { key: 'upgrade', label: 'Transformer Upgrades', count: upgrades.filter(r=>r.status==='PENDING').length },
          { key: 'station', label: 'Station Approvals', count: approvals.filter(r=>r.status==='PENDING').length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px flex items-center gap-2 ${
              tab === t.key ? 'border-amber-500 text-amber-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="bg-orange-500 text-black text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[18px] text-center">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'upgrade' && (
        <div className="space-y-3">
          <div className="flex justify-end mb-2">
            <button
              onClick={submitUpgrade}
              className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              + Submit New Upgrade Request
            </button>
          </div>

          {upgrades.map(req => (
            <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{req.transformer}
                    <span className="ml-2 text-xs text-zinc-500">{req.feeder}</span>
                  </p>
                  <p className="text-xs text-zinc-400">{req.zone} • Requested by {req.operator}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
              <p className="text-sm text-zinc-300 mb-3">{req.reason}</p>
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-zinc-500">Current Capacity</span>
                  <span className="ml-2 font-semibold text-white">{req.current_kva} kVA</span>
                </div>
                <div className="text-zinc-600">→</div>
                <div>
                  <span className="text-zinc-500">Requested</span>
                  <span className="ml-2 font-semibold text-amber-400">{req.requested_kva} kVA</span>
                </div>
                <div className="ml-auto text-zinc-500">{req.date}</div>
              </div>
              {req.status === 'PENDING' && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-orange-400">⏳ Awaiting Discom review — typical response: 3-5 business days</p>
                </div>
              )}
              {req.status === 'APPROVED' && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-amber-400">✓ DISCOM approved. Upgrade scheduled Q2 2024.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'station' && (
        <div className="space-y-3">
          {approvals.map(ap => (
            <div key={ap.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-white">{ap.name}</p>
                  <p className="text-xs text-zinc-400">{ap.zone} • Transformer {ap.transformer} • {ap.slots} slots • {ap.operator}</p>
                </div>
                <StatusBadge status={ap.status} />
              </div>
              <p className="text-xs text-zinc-500">{ap.date}</p>
              {ap.status === 'APPROVED' && (
                <p className="text-xs text-amber-400 mt-2">✓ Station is live on the ChargeSmart User App</p>
              )}
              {ap.status === 'PENDING' && (
                <p className="text-xs text-orange-400 mt-2">⏳ Discom verifying transformer capacity before approval</p>
              )}
              {ap.status === 'REJECTED' && (
                <p className="text-xs text-red-400 mt-2">✗ Rejected — transformer T-{ap.transformer} at capacity. Request upgrade first.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
