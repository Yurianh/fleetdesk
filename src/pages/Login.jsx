import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Eye, EyeOff, Check, X } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'

function getPasswordStrength(p) {
  if (p.length === 0) return 0
  if (p.length < 6) return 1
  let score = 1
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return Math.min(score, 4)
}

const STRENGTH_LABEL = ['', 'Trop court', 'Faible', 'Moyen', 'Fort']
const STRENGTH_COLOR = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500']

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false })

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const emailValid = isValidEmail(email)
  const confirmMatch = confirm === password && confirm.length > 0

  function switchMode(m) {
    setMode(m)
    setError('')
    setInfo('')
    setPassword('')
    setConfirm('')
    setTouched({ email: false, password: false, confirm: false })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (mode === 'signup' && password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
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
      if (mode === 'login') {
        setError(t('login.wrongCredentials'))
      } else {
        const msg = err?.message?.toLowerCase() || ''
        if (msg.includes('already registered') || msg.includes('user already') || msg.includes('already exists')) {
          setError('Cet email est déjà associé à un compte. Connectez-vous plutôt.')
        } else if (msg.includes('password should be') || msg.includes('password must')) {
          setError('Le mot de passe doit contenir au moins 6 caractères.')
        } else if (msg.includes('signup') && msg.includes('disabled')) {
          setError('Les inscriptions sont temporairement désactivées. Réessayez plus tard.')
        } else if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
          setError('Adresse email invalide.')
        } else {
          setError(err?.message || t('login.createError'))
        }
      }
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
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-6 select-none pointer-events-none">
        <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold text-zinc-800 tracking-tight">FleetDesk</span>
      </div>

      {/* Card */}
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

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">{t('login.email')}</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                required
                className={`w-full bg-zinc-50 border rounded-xl px-3 py-2.5 pr-9 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all duration-150 ${
                  touched.email && !emailValid
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : touched.email && emailValid
                    ? 'border-emerald-300 focus:ring-emerald-100 focus:border-emerald-400'
                    : 'border-zinc-200 focus:ring-[#2563EB]/20 focus:border-[#2563EB]'
                }`}
                placeholder={t('login.emailPlaceholder')}
              />
              {touched.email && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailValid
                    ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                    : <X className="w-3.5 h-3.5 text-red-400" />}
                </span>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                required
                minLength={6}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 pr-9 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all duration-150"
                placeholder={t('login.passwordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Strength bar — signup only */}
            {mode === 'signup' && password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-200 ${i <= strength ? STRENGTH_COLOR[strength] : 'bg-zinc-100'}`}
                    />
                  ))}
                </div>
                <p className={`text-[11px] ${strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-orange-400' : strength === 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                  {STRENGTH_LABEL[strength]}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password — signup only */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, confirm: true }))}
                  required
                  className={`w-full bg-zinc-50 border rounded-xl px-3 py-2.5 pr-9 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 transition-all duration-150 ${
                    touched.confirm && confirm.length > 0 && !confirmMatch
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : touched.confirm && confirmMatch
                      ? 'border-emerald-300 focus:ring-emerald-100 focus:border-emerald-400'
                      : 'border-zinc-200 focus:ring-[#2563EB]/20 focus:border-[#2563EB]'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {touched.confirm && confirm.length > 0 && !confirmMatch && (
                <p className="text-[11px] text-red-400 mt-1">Les mots de passe ne correspondent pas.</p>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}
          {info && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'signup' && password !== confirm && confirm.length > 0)}
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
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[#2563EB] hover:underline font-semibold"
          >
            {mode === 'login' ? t('login.signUp') : t('login.signInBtn')}
          </button>
        </p>
      </div>

      <p className="mt-6 text-xs text-zinc-500/70">© 2025 FleetDesk</p>
    </div>
  )
}
