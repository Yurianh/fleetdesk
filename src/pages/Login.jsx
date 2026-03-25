import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/Dashboard', { replace: true })
      } else {
        await signUp(email, password)
        setInfo(t('login.emailConfirm'))
      }
    } catch (err) {
      setError(mode === 'login'
        ? t('login.wrongCredentials')
        : t('login.createError'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/Dashboard' },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="w-[17px] h-[17px] text-white" />
          </div>
          <div className="leading-none">
            <p className="text-[15px] font-semibold text-white tracking-tight">FleetDesk</p>
            <p className="text-[11px] text-slate-500 mt-[2px]">{t('login.tagline')}</p>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-8">
          <h1 className="text-lg font-semibold text-white mb-6">
            {mode === 'login' ? t('login.signIn') : t('login.createAccount')}
          </h1>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-800 text-sm font-medium rounded-lg py-2.5 transition-colors mb-5"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('login.continueWithGoogle')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-slate-600">{t('login.or')}</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900/60 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB]/50 transition"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-900/60 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB]/50 transition"
                placeholder={t('login.passwordPlaceholder')}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}
            {info && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{info}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 transition-colors mt-2"
            >
              {loading
                ? (mode === 'login' ? t('login.signingIn') : t('login.creating'))
                : (mode === 'login' ? t('login.signInBtn') : t('login.createBtn'))}
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6">
            {mode === 'login' ? t('login.noAccount') : t('login.hasAccount')}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}
              className="text-[#2563EB] hover:underline font-medium"
            >
              {mode === 'login' ? t('login.signUp') : t('login.signInBtn')}
            </button>
          </p>
        </div>

      </div>
    </div>
  )
}
