import React, { useState } from 'react'
import { Zap, X, AlertTriangle, Info } from 'lucide-react'

export default function AlertBanner({ feeder_id, message, severity = 'high', time }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const config = {
    high:   { bg: 'bg-red-500',    border: 'border-red-400',    icon: Zap,           text: 'text-white' },
    medium: { bg: 'bg-amber-500',  border: 'border-amber-400',  icon: AlertTriangle, text: 'text-white' },
    low:    { bg: 'bg-blue-500',   border: 'border-blue-400',   icon: Info,          text: 'text-white' },
  }
  const { bg, border, icon: Icon, text } = config[severity] || config.high

  return (
    <div className={`${bg} border-b ${border} ${text} px-6 py-3 flex items-center gap-3 slide-in`}>
      <div className="flex items-center gap-2 pulse-soft">
        <Icon size={16} className="fill-white" />
        <span className="font-bold text-sm uppercase tracking-wide">
          {severity === 'high' ? 'CRITICAL ALERT' : severity === 'medium' ? 'WARNING' : 'INFO'}
        </span>
      </div>
      <div className="flex-1 text-sm">
        {feeder_id && <span className="font-semibold">[{feeder_id}] </span>}
        <span>{message}</span>
      </div>
      {time && (
        <span className="text-xs opacity-80 bg-white/20 px-2 py-0.5 rounded-full">{time}</span>
      )}
      <button onClick={() => setDismissed(true)} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  )
}
