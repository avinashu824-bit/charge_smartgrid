import React from 'react';
import { Moon, Zap, X } from 'lucide-react';

export default function NudgeBanner({ nudge, onDismiss }) {
  if (!nudge) return null;
  return (
    <div className="nudge-gradient mx-4 mb-3 rounded-2xl p-4 relative overflow-hidden shadow-lg">
      {/* Background decoration */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-10">
        <Moon size={64} />
      </div>

      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-white/60 hover:text-white"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className="bg-white/20 rounded-full p-2 flex-shrink-0">
          <Zap size={18} className="text-yellow-300" />
        </div>
        <div>
          <p className="font-bold text-sm text-white">{nudge.message}</p>
          <p className="text-xs text-emerald-100 mt-0.5">{nudge.detailMessage}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-semibold text-white">
              Save ₹{nudge.savingsInr} per charge
            </span>
            <span className="text-xs text-emerald-100">
              {nudge.validFrom} – {nudge.validTo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
