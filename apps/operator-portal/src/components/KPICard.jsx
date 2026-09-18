import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ title, value, subtitle, trend, trendValue, color = 'emerald', icon: Icon }) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', ring: 'ring-emerald-100' },
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-500',   ring: 'ring-amber-100' },
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-500',    ring: 'ring-blue-100' },
    violet:  { bg: 'bg-violet-50',  icon: 'text-violet-500',  ring: 'ring-violet-100' },
    red:     { bg: 'bg-red-50',     icon: 'text-red-500',     ring: 'ring-red-100' },
  }
  const c = colorMap[color] || colorMap.emerald

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          {Icon && <Icon size={22} className={c.icon} />}
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor} bg-gray-50 px-2 py-1 rounded-full`}>
            <TrendIcon size={12} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
