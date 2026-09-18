import React from 'react';
import { Zap, Clock, Navigation } from 'lucide-react';

const STATUS_STYLES = {
  GREEN: 'border-emerald-500 bg-emerald-500/10',
  YELLOW: 'border-amber-500 bg-amber-500/10',
  RED: 'border-red-500 bg-red-500/10',
};

const STATUS_DOT = {
  GREEN: 'bg-emerald-400',
  YELLOW: 'bg-amber-400',
  RED: 'bg-red-400 animate-pulse',
};

const STATUS_LABEL = {
  GREEN: 'Available',
  YELLOW: 'Busy',
  RED: 'Full',
};

export default function StationCard({ station, onClick }) {
  return (
    <div
      onClick={() => onClick && onClick(station)}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-transform ${STATUS_STYLES[station.status]}`}
    >
      {/* Status dot */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div className={`w-3 h-3 rounded-full ${STATUS_DOT[station.status]}`} />
        <span className="text-xs text-neutral-400">{station.distanceKm}km</span>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{station.name}</p>
        <p className="text-xs text-neutral-400 truncate">{station.zone}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-violet-400">
            <Zap size={10} />
            ₹{station.currentPriceInr}/kWh
          </span>
          {station.avgWaitMinutes > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Clock size={10} />
              ~{station.avgWaitMinutes}m wait
            </span>
          )}
          <span className="text-xs text-neutral-500">
            {station.availableSlots}/{station.totalSlots} slots
          </span>
        </div>
      </div>

      {/* Savings badge */}
      {station.status === 'GREEN' && (
        <div className="flex-shrink-0 text-right">
          <div className="text-xs text-violet-400 font-bold">Save</div>
          <div className="text-sm font-bold text-violet-400">₹{station.savingsInr}</div>
        </div>
      )}
    </div>
  );
}
