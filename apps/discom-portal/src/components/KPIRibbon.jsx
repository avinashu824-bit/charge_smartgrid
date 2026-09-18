import React from 'react';
import { cityStats } from '../data/mockData';
import { Zap, AlertTriangle, CheckCircle, Circle, PlugZap, Activity } from 'lucide-react';

const KPI_ITEMS = [
  {
    label: 'Total MW Load',
    value: `${cityStats.total_load_mw} MW`,
    sub: `of ${cityStats.total_capacity_mw} MW capacity`,
    icon: Zap,
    color: 'cyan',
    iconBg: 'bg-sky-500/10 border-sky-500/30',
    iconColor: 'text-sky-400',
    textColor: 'text-sky-300',
  },
  {
    label: 'Critical (RED)',
    value: cityStats.red_count,
    sub: 'Transformers at risk',
    icon: AlertTriangle,
    color: 'red',
    iconBg: 'bg-red-500/10 border-red-500/30',
    iconColor: 'text-red-400',
    textColor: 'text-red-300',
    pulse: true,
  },
  {
    label: 'Warning (YELLOW)',
    value: cityStats.yellow_count,
    sub: 'Approaching threshold',
    icon: Circle,
    color: 'amber',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    iconColor: 'text-amber-400',
    textColor: 'text-amber-300',
  },
  {
    label: 'Healthy (GREEN)',
    value: cityStats.green_count,
    sub: 'Normal operation',
    icon: CheckCircle,
    color: 'green',
    iconBg: 'bg-green-500/10 border-green-500/30',
    iconColor: 'text-green-400',
    textColor: 'text-green-300',
  },
  {
    label: 'Stations Online',
    value: cityStats.stations_online,
    sub: 'Across 5 zones',
    icon: PlugZap,
    color: 'cyan',
    iconBg: 'bg-sky-500/10 border-sky-500/30',
    iconColor: 'text-sky-400',
    textColor: 'text-sky-300',
  },
  {
    label: 'Active Sessions',
    value: cityStats.active_sessions,
    sub: `${cityStats.ev_penetration_pct}% EV penetration`,
    icon: Activity,
    color: 'green',
    iconBg: 'bg-green-500/10 border-green-500/30',
    iconColor: 'text-green-400',
    textColor: 'text-green-300',
  },
];

export default function KPIRibbon({ vertical = false }) {
  if (vertical) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {KPI_ITEMS.map((item) => (
          <KPICard key={item.label} item={item} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
      {KPI_ITEMS.map((item) => (
        <KPICard key={item.label} item={item} />
      ))}
    </div>
  );
}

function KPICard({ item, compact = false }) {
  const Icon = item.icon;
  return (
    <div className={`kpi-card rounded-xl flex-shrink-0 ${compact ? 'p-3' : 'p-4 min-w-[160px]'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex items-center justify-center rounded-lg border ${item.iconBg} ${compact ? 'w-8 h-8' : 'w-9 h-9'} shrink-0`}>
          <Icon className={`${item.iconColor} ${compact ? 'w-4 h-4' : 'w-4.5 h-4.5'}`} size={compact ? 16 : 18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold leading-tight ${item.textColor} ${compact ? 'text-lg' : 'text-2xl'} ${item.pulse ? 'animate-pulse-slow' : ''}`}>
            {item.value}
          </div>
          <div className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">{item.label}</div>
          {!compact && <div className="text-[10px] text-slate-600 mt-1 truncate">{item.sub}</div>}
        </div>
      </div>
    </div>
  );
}
