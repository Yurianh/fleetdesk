import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, ChevronRight, Building2, Users, CheckCircle2, Check, Zap, Shield } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'

const FLEET_SIZE_KEYS = ['1-5', '6-20', '21-50', '50+']

const GRADIENT = 'linear-gradient(135deg, #bfdbfe 0%, #d1fae5 45%, #fef3c7 100%)'

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i <= current ? 'bg-[#2563EB] w-8' : 'bg-zinc-200 w-4'
          }`}
        />
      ))}
    </div>
  )
}

export default function SetupProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''

  const [step, setStep]           = useState(0)
  const [name, setName]           = useState(googleName)
  const [company, setCompany]     = useState('')
  const [fleetSize, setFleetSize] = useState('')
  const [plan, setPlan]           = useState(() => sessionStorage.getItem('selected_plan') || 'starter')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const plans = [
    {
      id: 'starter',
      icon: Truck,
      price: t('marketing.pricing.plans.starter.price'),
      period: t('marketing.pricing.plans.starter.period'),
      features: t('onboarding.starterFeatures', { returnObjects: true }),
    },
    {
      id: 'pro',
      icon: Zap,
      price: t('marketing.pricing.plans.pro.price'),
      period: t('marketing.pricing.plans.pro.period'),
      features: t('onboarding.proFeatures', { returnObjects: true }),
      recommended: true,
    },
    {
      id: 'enterprise',
      icon: Shield,
      price: t('marketing.pricing.plans.enterprise.price'),
      period: t('marketing.pricing.plans.enterprise.period'),
      features: t('onboarding.enterpriseFeatures', { returnObjects: true }),
    },
  ]

  async function finishOnboarding() {
    setLoading(true)
    setError('')
    try {
      sessionStorage.removeItem('selected_plan')
      const { error: profileErr } = await supabase.auth.updateUser({
        data: {
          full_name: name.trim(),
          company: company.trim(),
          fleet_size: fleetSize,
          plan,
        },
      })
      if (profileErr) throw profileErr

      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan, return_url: `${window.location.origin}/billing/success` },
      })
      if (fnErr) {
        let detail = fnErr.message
        try {
          const body = await fnErr.context?.json?.()
          if (body?.error) detail = body.error
        } catch {}
        throw new Error(detail)
      }
      window.location.href = data.url
    } catch (e) {
      setError(e.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all duration-150"

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: GRADIENT, backgroundAttachment: 'fixed' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6 justify-center select-none pointer-events-none">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-zinc-800 tracking-tight">FleetDesk</span>
        </div>

        <div className={`bg-white rounded-2xl shadow-2xl p-8 ${step === 2 ? 'max-w-lg mx-auto' : ''}`}>

          {/* Step 0: Name */}
          {step === 0 && (
            <>
              <StepIndicator current={0} total={3} />
              <p className="text-xs font-medium text-[#2563EB] mb-1">{t('onboarding.step1of3')}</p>
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-1">{t('onboarding.whatIsYourName')}</h1>
              <p className="text-sm text-zinc-400 mb-6">{t('onboarding.nameVisible')}</p>

              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                placeholder={t('onboarding.namePlaceholder')}
                className={inputCls + ' mb-4'}
              />

              <button
                onClick={() => name.trim() && setStep(1)}
                disabled={!name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
              >
                {t('common.continue')} <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Step 1: Fleet info */}
          {step === 1 && (
            <>
              <StepIndicator current={1} total={3} />
              <p className="text-xs font-medium text-[#2563EB] mb-1">{t('onboarding.step2of3')}</p>
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-1">{t('onboarding.yourFleet')}</h1>
              <p className="text-sm text-zinc-400 mb-6">{t('onboarding.fleetHelp')}</p>

              <div className="mb-4">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-1.5">
                  <Building2 className="w-3.5 h-3.5" /> {t('onboarding.companyName')}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  autoFocus
                  placeholder={t('onboarding.companyPlaceholder')}
                  className={inputCls}
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-2">
                  <Users className="w-3.5 h-3.5" /> {t('onboarding.fleetSize')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FLEET_SIZE_KEYS.map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFleetSize(key)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all duration-150 ${
                        fleetSize === key
                          ? 'border-[#2563EB] bg-[#2563EB]/5 text-zinc-900'
                          : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                      }`}
                    >
                      <p className="font-semibold">{t(`onboarding.fleetSizes.${key}.label`)}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{t(`onboarding.fleetSizes.${key}.desc`)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(googleName ? 1 : 0)}
                  className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!company.trim() || !fleetSize}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
                >
                  {t('common.continue')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Step 2: Plan selection */}
          {step === 2 && (
            <>
              <StepIndicator current={2} total={3} />
              <p className="text-xs font-medium text-[#2563EB] mb-1">{t('onboarding.step3of3')}</p>
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-1">{t('onboarding.choosePlan')}</h1>
              <p className="text-sm text-zinc-400 mb-6">{t('onboarding.choosePlanDesc')}</p>

              <div className="space-y-3 mb-6">
                {plans.map(p => {
                  const Icon = p.icon
                  const selected = plan === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all duration-150 ${
                        selected
                          ? 'border-[#2563EB] bg-[#2563EB]/5'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#2563EB]' : 'bg-zinc-100'}`}>
                            <Icon className={`w-3.5 h-3.5 ${selected ? 'text-white' : 'text-zinc-500'}`} />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-zinc-900">{t(`marketing.pricing.plans.${p.id}.name`)}</span>
                            {p.recommended && (
                              <span className="ml-2 text-[10px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 py-0.5 rounded-full">
                                {t('onboarding.recommended')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-bold text-zinc-900">{p.price}</span>
                          {p.period && <span className="text-[11px] text-zinc-400">{p.period}</span>}
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {Array.isArray(p.features) && p.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className={`w-3 h-3 flex-shrink-0 ${selected ? 'text-[#2563EB]' : 'text-zinc-300'}`} />
                            <span className="text-[11px] text-zinc-500">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={finishOnboarding}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
                >
                  {loading
                    ? t('onboarding.saving')
                    : <><span>{t('common.finish')}</span> <ChevronRight className="w-4 h-4" /></>
                  }
                </button>
              </div>
            </>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-2">{t('onboarding.workspaceReady')}</h1>
              <p className="text-sm text-zinc-400 mb-8">
                {t('onboarding.welcome', { name: name.split(' ')[0] })}
              </p>
              <button
                onClick={() => navigate('/Dashboard', { replace: true })}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
              >
                {t('onboarding.goToDashboard')}
              </button>
            </div>
          )}

        </div>

        <p className="mt-6 text-xs text-zinc-500/70 text-center">© 2025 FleetDesk</p>
      </div>
    </div>
  )
}
