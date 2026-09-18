import React, { useState } from 'react'
import {
  Search, Filter, MapPin, Edit2, Tag, Check, X,
  ChevronDown, Wifi, WifiOff, AlertCircle, Plug
} from 'lucide-react'

const initialStations = [
  { id: 1, name: 'Whitefield EV Hub', zone: 'Whitefield', feeder: 'T-23', status: 'active', load: 47.2, slots: 2, totalSlots: 4, price: 15, type: 'DC Fast' },
  { id: 2, name: 'Koramangala Charge Point', zone: 'Koramangala', feeder: 'T-17', status: 'active', load: 38.5, slots: 1, totalSlots: 3, price: 14, type: 'AC Level 2' },
  { id: 3, name: 'Indiranagar E-Fill', zone: 'Indiranagar', feeder: 'T-08', status: 'active', load: 22.1, slots: 3, totalSlots: 3, price: 13, type: 'DC Fast' },
  { id: 4, name: 'HSR Layout SuperCharge', zone: 'HSR Layout', feeder: 'T-08', status: 'active', load: 55.8, slots: 0, totalSlots: 2, price: 16, type: 'DC Ultra' },
  { id: 5, name: 'Electronic City ChargeHub', zone: 'Electronic City', feeder: 'T-31', status: 'active', load: 31.4, slots: 2, totalSlots: 4, price: 13, type: 'AC Level 2' },
  { id: 6, name: 'Marathahalli EV Point', zone: 'Marathahalli', feeder: 'T-23', status: 'offline', load: 0, slots: 0, totalSlots: 2, price: 14, type: 'DC Fast' },
  { id: 7, name: 'Bellandur Green Station', zone: 'Bellandur', feeder: 'T-19', status: 'active', load: 18.9, slots: 2, totalSlots: 3, price: 12, type: 'AC Level 2' },
  { id: 8, name: 'Sarjapur EV Lounge', zone: 'Sarjapur', feeder: 'T-31', status: 'maintenance', load: 5.1, slots: 0, totalSlots: 2, price: 14, type: 'DC Fast' },
]

function StatusBadge({ status }) {
  const map = {
    active:      { cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Active', pulse: true },
    offline:     { cls: 'bg-zinc-100 text-zinc-500 border-zinc-200',          dot: 'bg-zinc-400',    label: 'Offline', pulse: false },
    maintenance: { cls: 'bg-orange-100 text-orange-700 border-orange-200',       dot: 'bg-orange-500',   label: 'Maintenance', pulse: false },
  }
  const s = map[status] || map.offline
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  )
}

function CouponModal({ station, onClose, onApply }) {
  const [discount, setDiscount] = useState(10)
  const [hours, setHours] = useState('22:00')
  const [endHours, setEndHours] = useState('06:00')
  const code = `EVOFF${discount}`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900">Set Coupon Code</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{station.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Discount Percentage</label>
            <div className="flex items-center gap-4">
              <input
                type="range" min="5" max="40" step="5"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <span className="w-14 text-center font-bold text-amber-600 text-lg">{discount}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Valid From</label>
              <input type="time" value={hours} onChange={(e) => setHours(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Valid Until</label>
              <input type="time" value={endHours} onChange={(e) => setEndHours(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-xs text-amber-600 font-medium mb-1">Preview Coupon</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-800 text-lg font-mono tracking-wider">{code}</p>
                <p className="text-xs text-amber-600 mt-0.5">{discount}% off · {hours}–{endHours}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-amber-700">
                  {'\u20b9'}{(station.price * (1 - discount / 100)).toFixed(1)}/kWh
                </p>
                <p className="text-xs text-zinc-400 line-through">{'\u20b9'}{station.price}/kWh</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Projected:</span> Est. +{Math.round(discount * 1.5)}% sessions in off-peak hours
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2.5 rounded-xl transition-colors text-sm">
            Cancel
          </button>
          <button onClick={() => onApply(code)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            Publish Coupon
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StationsPage() {
  const [stations, setStations] = useState(initialStations)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingPrice, setEditingPrice] = useState(null)
  const [tempPrice, setTempPrice] = useState('')
  const [couponStation, setCouponStation] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = stations.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.zone.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const startEditPrice = (s) => {
    setEditingPrice(s.id)
    setTempPrice(String(s.price))
  }

  const savePrice = (id) => {
    const p = parseFloat(tempPrice)
    if (!isNaN(p) && p > 0) {
      setStations((prev) => prev.map((s) => s.id === id ? { ...s, price: p } : s))
      showToast(`Price updated to \u20b9${p}/kWh`)
    }
    setEditingPrice(null)
  }

  const handleCouponApply = (code) => {
    setCouponStation(null)
    showToast(`Coupon ${code} published successfully!`)
  }

  return (
    <div className="p-8 min-h-screen bg-zinc-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold flex items-center gap-2 slide-in ${
          toast.type === 'success' ? 'bg-amber-600' : 'bg-red-600'
        }`}>
          <Check size={16} />
          {toast.msg}
        </div>
      )}

      {couponStation && (
        <CouponModal
          station={couponStation}
          onClose={() => setCouponStation(null)}
          onApply={handleCouponApply}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Station Manager</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage all EV charging stations across Bengaluru zones</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Stations', value: stations.length, color: 'text-zinc-900' },
          { label: 'Active', value: stations.filter(s => s.status === 'active').length, color: 'text-amber-600' },
          { label: 'Offline', value: stations.filter(s => s.status === 'offline').length, color: 'text-zinc-500' },
          { label: 'Maintenance', value: stations.filter(s => s.status === 'maintenance').length, color: 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-zinc-100 shadow-sm text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -tranzinc-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search stations, zones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'offline', 'maintenance'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === f
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:border-amber-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="text-left text-xs font-semibold text-zinc-500 px-5 py-3.5 uppercase tracking-wide">Station</th>
                <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3.5 uppercase tracking-wide">Zone / Feeder</th>
                <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3.5 uppercase tracking-wide">Status</th>
                <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3.5 uppercase tracking-wide">kW Load</th>
                <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3.5 uppercase tracking-wide">Slots Free</th>
                <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3.5 uppercase tracking-wide">Price/kWh</th>
                <th className="text-left text-xs font-semibold text-zinc-500 px-4 py-3.5 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map((station) => (
                <tr key={station.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        station.status === 'active' ? 'bg-amber-100' :
                        station.status === 'offline' ? 'bg-zinc-100' : 'bg-orange-100'
                      }`}>
                        <Plug size={14} className={
                          station.status === 'active' ? 'text-amber-500' :
                          station.status === 'offline' ? 'text-zinc-400' : 'text-orange-500'
                        } />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{station.name}</p>
                        <p className="text-xs text-zinc-400">{station.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-700 font-medium">{station.zone}</p>
                        <p className="text-xs text-zinc-400">Feeder {station.feeder}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={station.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <span className="text-sm font-semibold text-zinc-900">{station.load} kW</span>
                      <div className="w-24 bg-zinc-100 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full ${station.load > 50 ? 'bg-red-400' : station.load > 30 ? 'bg-orange-400' : 'bg-amber-400'}`}
                          style={{ width: `${Math.min((station.load / 75) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-sm font-semibold ${station.slots === 0 ? 'text-red-500' : 'text-amber-600'}`}>
                      {station.slots}/{station.totalSlots}
                    </span>
                    <p className="text-xs text-zinc-400">{station.slots === 0 ? 'Full' : 'Available'}</p>
                  </td>
                  <td className="px-4 py-4">
                    {editingPrice === station.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400 text-sm">{'\u20b9'}</span>
                        <input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          className="w-16 border border-amber-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') savePrice(station.id); if (e.key === 'Escape') setEditingPrice(null) }}
                        />
                        <button onClick={() => savePrice(station.id)} className="text-amber-500 hover:text-amber-700">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingPrice(null)} className="text-zinc-400 hover:text-zinc-600">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900">{'\u20b9'}{station.price}/kWh</span>
                        <button
                          onClick={() => startEditPrice(station)}
                          className="text-zinc-300 hover:text-amber-500 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => setCouponStation(station)}
                      className="flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Tag size={12} />
                      Coupon
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-zinc-400">
              <Plug size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No stations found</p>
              <p className="text-xs mt-1">Try adjusting your search or filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
