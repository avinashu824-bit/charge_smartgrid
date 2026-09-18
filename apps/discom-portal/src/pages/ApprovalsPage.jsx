import React, { useState, useCallback } from 'react';
import { stationApprovals as initialApprovals, upgradeRequests as initialUpgrades } from '../data/mockData';
import { CheckCircle2, XCircle, Clock, AlertTriangle, CheckSquare, X, Check } from 'lucide-react';

const STATUS_CONFIG = {
  PENDING:      { cls: 'badge-yellow', icon: Clock, label: 'Pending' },
  APPROVED:     { cls: 'badge-green', icon: CheckCircle2, label: 'Approved' },
  REJECTED:     { cls: 'badge-red', icon: XCircle, label: 'Rejected' },
  UNDER_REVIEW: { cls: 'badge-cyan', icon: AlertTriangle, label: 'Under Review' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

function Toast({ message, type = 'success', onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'} flex items-center gap-2`}>
      {type === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2"><X size={12} /></button>
    </div>
  );
}

export default function ApprovalsPage() {
  const [tab, setTab] = useState('stations');
  const [stationReqs, setStationReqs] = useState(initialApprovals);
  const [upgradeReqs, setUpgradeReqs] = useState(initialUpgrades);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
  }, []);

  const handleStationAction = useCallback((id, action) => {
    setStationReqs(prev => prev.map(r =>
      r.id === id ? { ...r, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : r
    ));
    const req = stationReqs.find(r => r.id === id);
    if (action === 'approve') {
      addToast(`✅ Station request ${id} approved for ${req?.location}`);
    } else {
      addToast(`❌ Station request ${id} rejected`, 'error');
    }
  }, [stationReqs, addToast]);

  const handleUpgradeAction = useCallback((id, action) => {
    setUpgradeReqs(prev => prev.map(r =>
      r.id === id ? { ...r, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : r
    ));
    const req = upgradeReqs.find(r => r.id === id);
    if (action === 'approve') {
      addToast(`✅ Upgrade request ${id} approved — ${req?.transformer_id} upgrade sanctioned`);
    } else {
      addToast(`❌ Upgrade request ${id} rejected`, 'error');
    }
  }, [upgradeReqs, addToast]);

  const pendingCount = stationReqs.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length
    + upgradeReqs.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toast */}
      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} message={t.msg} type={t.type} onClose={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1E293B] bg-[#0f172a] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-sky-400" />
            <div>
              <h1 className="text-base font-bold text-white">Approvals Queue</h1>
              <p className="text-[11px] text-slate-500">Station requests & transformer upgrade sanctions</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">{pendingCount} pending actions</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          <button
            onClick={() => setTab('stations')}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${
              tab === 'stations'
                ? 'bg-[#020617] text-white border-t border-l border-r border-[#1E293B]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            New Station Requests
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
              {stationReqs.filter(r => r.status === 'PENDING').length}
            </span>
          </button>
          <button
            onClick={() => setTab('upgrades')}
            className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${
              tab === 'upgrades'
                ? 'bg-[#020617] text-white border-t border-l border-r border-[#1E293B]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Transformer Upgrades
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
              {upgradeReqs.filter(r => r.status === 'PENDING').length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'stations' ? (
          <div className="bg-[#0f172a] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full dark-table">
                <thead>
                  <tr>
                    <th className="text-left">Request ID</th>
                    <th className="text-left">Operator</th>
                    <th className="text-left">Location</th>
                    <th className="text-left">Transformer</th>
                    <th className="text-left">Charger Type</th>
                    <th className="text-right">Slots</th>
                    <th className="text-left">Requested</th>
                    <th className="text-left">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stationReqs.map((req) => (
                    <tr key={req.id} className="animate-fade-in">
                      <td className="font-mono text-sky-400 text-xs">{req.id}</td>
                      <td className="font-medium text-white text-sm">{req.operator}</td>
                      <td className="text-slate-300 text-sm max-w-[140px] truncate">{req.location}</td>
                      <td className="font-mono text-xs text-slate-400">{req.transformer_id}</td>
                      <td className="text-xs text-slate-400">{req.charger_type}</td>
                      <td className="text-right font-bold text-white">{req.slots}</td>
                      <td className="text-xs text-slate-500">{req.requested_date}</td>
                      <td><StatusBadge status={req.status} /></td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          {(req.status === 'PENDING' || req.status === 'UNDER_REVIEW') && (
                            <>
                              <button
                                onClick={() => handleStationAction(req.id, 'approve')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs font-semibold border border-green-500/20 transition-all"
                              >
                                <Check size={11} /> Approve
                              </button>
                              <button
                                onClick={() => handleStationAction(req.id, 'reject')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold border border-red-500/20 transition-all"
                              >
                                <X size={11} /> Reject
                              </button>
                            </>
                          )}
                          {req.status === 'APPROVED' && (
                            <span className="text-xs text-green-400 font-medium">✓ Approved</span>
                          )}
                          {req.status === 'REJECTED' && (
                            <span className="text-xs text-red-400 font-medium">✗ Rejected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-[#0f172a] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full dark-table">
                <thead>
                  <tr>
                    <th className="text-left">ID</th>
                    <th className="text-left">Transformer</th>
                    <th className="text-left">Zone</th>
                    <th className="text-right">Current (kVA)</th>
                    <th className="text-right">Requested (kVA)</th>
                    <th className="text-left">Reason</th>
                    <th className="text-left">Operator</th>
                    <th className="text-right">Cost (₹L)</th>
                    <th className="text-left">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upgradeReqs.map((req) => (
                    <tr key={req.id} className="animate-fade-in">
                      <td className="font-mono text-sky-400 text-xs">{req.id}</td>
                      <td className="font-mono font-bold text-white text-sm">{req.transformer_id}</td>
                      <td className="text-xs text-slate-400">{req.zone}</td>
                      <td className="text-right text-slate-300 text-sm">{req.current_capacity_kva}</td>
                      <td className="text-right font-bold text-sky-400 text-sm">{req.requested_capacity_kva}</td>
                      <td className="text-xs text-slate-400 max-w-[200px]">
                        <span className="truncate block" title={req.reason}>{req.reason.slice(0, 50)}…</span>
                      </td>
                      <td className="text-xs text-slate-400">{req.operator}</td>
                      <td className="text-right font-semibold text-amber-400 text-sm">₹{req.estimated_cost_lakh}L</td>
                      <td><StatusBadge status={req.status} /></td>
                      <td>
                        <div className="flex items-center justify-center gap-2">
                          {(req.status === 'PENDING' || req.status === 'UNDER_REVIEW') && (
                            <>
                              <button
                                onClick={() => handleUpgradeAction(req.id, 'approve')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs font-semibold border border-green-500/20 transition-all"
                              >
                                <Check size={11} /> Sanction
                              </button>
                              <button
                                onClick={() => handleUpgradeAction(req.id, 'reject')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold border border-red-500/20 transition-all"
                              >
                                <X size={11} /> Reject
                              </button>
                            </>
                          )}
                          {req.status === 'APPROVED' && (
                            <span className="text-xs text-green-400">✓ Sanctioned</span>
                          )}
                          {req.status === 'REJECTED' && (
                            <span className="text-xs text-red-400">✗ Rejected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
