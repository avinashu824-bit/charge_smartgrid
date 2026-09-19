import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Zap, LayoutDashboard, MapPin, TrendingUp, ClipboardList, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stations', icon: MapPin, label: 'Stations' },
  { to: '/pricing', icon: TrendingUp, label: 'Pricing Studio' },
  { to: '/requests', icon: ClipboardList, label: 'Requests' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#18181b] flex-col h-screen flex-shrink-0 border-r border-white/5 z-20">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide">ChargeSmart</p>
              <p className="text-amber-400 text-xs font-medium">Grid Operator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
            Main Menu
          </p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/8'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-amber-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.avatar || 'OP'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name || 'Operator'}</p>
              <p className="text-zinc-400 text-xs truncate">{user?.role || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden flex shrink-0 bg-[#18181b] border-t border-white/5 items-center justify-around py-2 px-2 z-50">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span className="text-[9px] font-medium truncate max-w-[60px] text-center">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
