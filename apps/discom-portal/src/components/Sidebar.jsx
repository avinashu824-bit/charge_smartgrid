import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, MapPin, CheckCircle2,
  Clock, FileBarChart2, ChevronLeft, ChevronRight,
  Zap, LogOut, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/command-center', icon: LayoutDashboard, label: 'Command Center', badge: null },
  { to: '/simulation', icon: FlaskConical, label: 'Simulation Lab', badge: 'NEW' },
  { to: '/siting', icon: MapPin, label: 'Siting Tool', badge: null },
  { to: '/approvals', icon: CheckCircle2, label: 'Approvals', badge: '4' },
  { to: '/tod-policy', icon: Clock, label: 'ToD Policy', badge: null },
  { to: '/reports', icon: FileBarChart2, label: 'Reports', badge: null },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`flex flex-col h-full transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-60'
      } bg-[#0f172a] border-r border-[#1E293B] relative shrink-0`}
    >
      {/* ── Logo / Brand ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1E293B]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 shrink-0">
          <Zap className="w-5 h-5 text-sky-400" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <div className="text-white font-bold text-sm leading-tight">ChargeSmart</div>
            <div className="text-[10px] text-sky-400 font-medium tracking-widest uppercase">DISCOM Grid</div>
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <div className="px-4 mb-3">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Navigation</span>
          </div>
        )}
        {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group
              ${isActive
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
              }`
            }
          >
            <Icon className="w-4.5 h-4.5 shrink-0" size={18} />
            {!collapsed && (
              <span className="text-sm font-medium flex-1 truncate">{label}</span>
            )}
            {!collapsed && badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                badge === 'NEW' ? 'bg-sky-500/20 text-sky-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User Profile ─────────────────────────────── */}
      <div className="border-t border-[#1E293B] p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[#1E293B]/50 mb-2 animate-fade-in">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 shrink-0">
              <Shield className="w-4 h-4 text-sky-400" />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user.name}</div>
              <div className="text-slate-500 text-[10px] truncate">{user.designation}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-slate-400 
            hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ── Collapse Toggle ───────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full 
          bg-[#1E293B] border border-[#334155] flex items-center justify-center 
          text-slate-400 hover:text-sky-400 hover:border-sky-500/40 transition-all z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
