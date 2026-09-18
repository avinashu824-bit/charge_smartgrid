import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowLeft, Zap, Leaf } from 'lucide-react';
import { USER_SESSIONS } from '../data/mockData.js';

const TOTAL_KWH = USER_SESSIONS.reduce((a, s) => a + s.energyKwh, 0);
const TOTAL_COST = USER_SESSIONS.reduce((a, s) => a + s.costInr, 0);
const CO2_SAVED = (TOTAL_KWH * 0.82).toFixed(1); // ICE equivalent: 0.82 kg CO2/km saved

export default function SessionsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-base">My Sessions</p>
            <p className="text-xs text-gray-400">{user?.name || 'Driver'} • {user?.vehicle}</p>
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '⚡', label: 'Total kWh', value: TOTAL_KWH.toFixed(1), color: 'text-blue-400' },
            { icon: '₹', label: 'Total Spent', value: `₹${Math.round(TOTAL_COST)}`, color: 'text-emerald-400' },
            { icon: '🌿', label: 'CO₂ Saved', value: `${CO2_SAVED} kg`, color: 'text-green-400' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
              <p className="text-xl mb-1">{icon}</p>
              <p className={`font-bold text-sm ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Green credentials */}
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-emerald-800/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="bg-emerald-500/20 rounded-xl p-2">
            <Leaf size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-emerald-300">Great work, eco driver!</p>
            <p className="text-xs text-gray-400 mt-0.5">
              You've saved {CO2_SAVED} kg of CO₂ — equivalent to planting {Math.round(parseFloat(CO2_SAVED) / 21)} trees 🌳
            </p>
          </div>
        </div>

        {/* Session history */}
        <div>
          <p className="text-sm font-semibold text-gray-300 mb-3">Charging History</p>
          <div className="space-y-2">
            {USER_SESSIONS.map(session => (
              <div key={session.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{session.station}</p>
                    <p className="text-xs text-gray-500">{session.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-emerald-400">₹{session.costInr}</p>
                    <p className="text-xs text-gray-500">{session.energyKwh} kWh</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-gray-800 rounded-lg px-2 py-1 text-gray-400">
                    ⏱ {session.duration}
                  </span>
                  <span className="text-xs bg-gray-800 rounded-lg px-2 py-1 text-gray-400">
                    🔌 {session.connector}
                  </span>
                  <span className="text-xs bg-emerald-900/40 border border-emerald-800/50 rounded-lg px-2 py-1 text-emerald-400">
                    ₹{(session.costInr / session.energyKwh).toFixed(1)}/kWh avg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
