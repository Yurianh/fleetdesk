import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    } catch {
      setError(mode === 'login' ? t('login.wrongCredentials') : t('login.createError'))
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #bfdbfe 0%, #d1fae5 45%, #fef3c7 100%)', backgroundAttachment: 'fixed' }}
    >
      {/* Logo above card */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-zinc-800 tracking-tight">FleetDesk</span>
      </div>

      {/* Floating card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-[17px] font-semibold text-zinc-900 mb-1">
          {mode === 'login' ? t('login.signIn') : t('login.createAccount')}
        </h1>
        <p className="text-sm text-zinc-400 mb-6">
          {mode === 'login' ? 'Content de vous revoir.' : 'Commencez gratuitement, sans carte bancaire.'}
        </p>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-50 active:scale-[0.98] border border-zinc-200 hover:border-zinc-300 text-zinc-700 text-sm font-medium rounded-xl py-2.5 transition-all duration-150 mb-5 shadow-sm"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('login.continueWithGoogle')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-zinc-100" />
          <span className="text-xs text-zinc-400">{t('login.or')}</span>
          <div className="flex-1 h-px bg-zinc-100" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] transition-all duration-150"
              placeholder={t('login.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] transition-all duration-150"
              placeholder={t('login.passwordPlaceholder')}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}
          {info && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
          >
            {loading
              ? (mode === 'login' ? t('login.signingIn') : t('login.creating'))
              : (mode === 'login' ? t('login.signInBtn') : t('login.createBtn'))}
          </button>
        </form>

        <p className="text-xs text-zinc-400 text-center mt-5">
          {mode === 'login' ? t('login.noAccount') : t('login.hasAccount')}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}
            className="text-[#2563EB] hover:underline font-semibold"
          >
            {mode === 'login' ? t('login.signUp') : t('login.signInBtn')}
          </button>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-zinc-500/70">© 2025 FleetDesk</p>
    </div>
  )
}
