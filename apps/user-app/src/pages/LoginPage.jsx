import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('user@gmail.com')
  const [password, setPassword] = useState('chargesmart123')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800)) // simulate API call
    login(email, password)
    navigate('/')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #312e81 50%, #4f46e5 100%)' }}
      >
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(79,70,229,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(79,70,229,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Zap size={24} className="text-white fill-white" />
            </div>
            <div>
              <p className="text-white text-xl font-bold">ChargeSmart</p>
              <p className="text-indigo-400 text-sm">Driver App</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Smart Charging<br />
              <span className="text-indigo-400">For Your EV</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Find fast chargers, get dynamic Time-of-Day discounts, and charge your vehicle sustainably.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '124', label: 'Nearby Chargers' },
              { value: '₹4.5', label: 'Off-peak rate' },
              { value: '100%', label: 'Green Energy' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
                <p className="text-2xl font-bold text-indigo-400">{stat.value}</p>
                <p className="text-slate-300 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <p className="text-indigo-300 text-sm">
              <span className="font-semibold">Live Network</span> — 845 Chargers Online
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-500 text-xs">
            Powered by ChargeSmart AI · Secure Platform
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <p className="text-gray-900 text-lg font-bold">ChargeSmart</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm">Sign in to your driver account</p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter any password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-indigo-500" />
                  Remember me
                </label>
                <button type="button" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In to App'
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-indigo-700 font-medium mb-1">Demo Credentials</p>
              <p className="text-xs text-indigo-600">
                Email: <span className="font-mono font-bold">user@gmail.com</span>
              </p>
              <p className="text-xs text-indigo-600">Password: <span className="font-bold">any value</span></p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2025 ChargeSmart Grid · Secure EV Charging
          </p>
        </div>
      </div>
    </div>
  )
}
