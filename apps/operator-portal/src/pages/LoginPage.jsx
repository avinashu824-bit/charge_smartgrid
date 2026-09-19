import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const [email, setEmail] = useState('operator@discom.gov.in')
  const [password, setPassword] = useState('operator123')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      navigate(from, { replace: true })
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #78350f 100%)' }}
      >
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
              <Zap size={24} className="text-white fill-white" />
            </div>
            <div>
              <p className="text-white text-xl font-bold">ChargeSmart Grid</p>
              <p className="text-amber-400 text-sm">Operator Portal</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Intelligent EV<br />
              <span className="text-amber-400">Grid Management</span>
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed">
              Monitor transformer health, optimize pricing with AI, and manage your charging network across Bengaluru.
            </p>
          </div>



          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-amber-300 text-sm">
              <span className="font-semibold">DISCOM Zone B</span> — All systems operational
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-zinc-500 text-xs">
            Powered by ChargeSmart AI · DISCOM Licensed · v2.4.1
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <p className="text-zinc-900 text-lg font-bold">ChargeSmart Grid</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-zinc-900 mb-1">Welcome back</h2>
              <p className="text-zinc-500 text-sm">Sign in to your operator account</p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@discom.gov.in"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter any password"
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 pr-12 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-zinc-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-zinc-300 text-amber-500" />
                  Remember me
                </label>
                <button type="button" className="text-amber-600 hover:text-amber-700 font-medium">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In to Portal'
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700 font-medium mb-1">Demo Credentials</p>
              <p className="text-xs text-amber-600">
                Email: <span className="font-mono font-bold">operator@discom.gov.in</span>
              </p>
              <p className="text-xs text-amber-600">Password: <span className="font-bold">operator123</span></p>
            </div>
          </div>

          <p className="text-center text-xs text-zinc-400 mt-6">
            © 2025 ChargeSmart Grid · Licensed under DISCOM EV Framework
          </p>
        </div>
      </div>
    </div>
  )
}
