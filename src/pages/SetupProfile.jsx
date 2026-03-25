import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, ChevronRight, Building2, Users, CheckCircle2, Check, Zap, Shield } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'

const FLEET_SIZE_KEYS = ['1-5', '6-20', '21-50', '50+']

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i <= current ? 'bg-[#2563EB] w-8' : 'bg-white/10 w-4'
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

  const [step, setStep]           = useState(googleName ? 1 : 0)
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
      // Save profile data first (without onboarding_complete — webhook sets that)
      const { error: profileErr } = await supabase.auth.updateUser({
        data: {
          full_name: name.trim(),
          company: company.trim(),
          fleet_size: fleetSize,
          plan,
        },
      })
      if (profileErr) throw profileErr

      // All plans go through Stripe Checkout
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

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="w-[17px] h-[17px] text-white" />
          </div>
          <div className="leading-none">
            <p className="text-[15px] font-semibold text-white tracking-tight">FleetDesk</p>
            <p className="text-[11px] text-slate-500 mt-[2px]">{t('login.tagline')}</p>
          </div>
        </div>

        <div className={`bg-slate-800/60 border border-white/[0.08] rounded-2xl p-8 ${step === 2 ? 'max-w-lg mx-auto' : ''}`}>

          {/* Step 0: Name */}
          {step === 0 && (
            <>
              <StepIndicator current={0} total={3} />
              <p className="text-xs font-medium text-[#2563EB] mb-1">{t('onboarding.step1of3')}</p>
              <h1 className="text-lg font-semibold text-white mb-1">{t('onboarding.whatIsYourName')}</h1>
              <p className="text-sm text-slate-400 mb-6">{t('onboarding.nameVisible')}</p>

              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                placeholder={t('onboarding.namePlaceholder')}
                className="w-full bg-slate-900/60 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 transition mb-4"
              />

              <button
                onClick={() => name.trim() && setStep(1)}
                disabled={!name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
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
              <h1 className="text-lg font-semibold text-white mb-1">{t('onboarding.yourFleet')}</h1>
              <p className="text-sm text-slate-400 mb-6">{t('onboarding.fleetHelp')}</p>

              <div className="mb-4">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
                  <Building2 className="w-3.5 h-3.5" /> {t('onboarding.companyName')}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  autoFocus
                  placeholder={t('onboarding.companyPlaceholder')}
                  className="w-full bg-slate-900/60 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 transition"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2">
                  <Users className="w-3.5 h-3.5" /> {t('onboarding.fleetSize')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FLEET_SIZE_KEYS.map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFleetSize(key)}
                      className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                        fleetSize === key
                          ? 'border-[#2563EB] bg-[#2563EB]/10 text-white'
                          : 'border-white/[0.08] bg-slate-900/40 text-slate-400 hover:border-white/20 hover:text-slate-200'
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
                  className="px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!company.trim() || !fleetSize}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
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
              <h1 className="text-lg font-semibold text-white mb-1">{t('onboarding.choosePlan')}</h1>
              <p className="text-sm text-slate-400 mb-6">{t('onboarding.choosePlanDesc')}</p>

              <div className="space-y-3 mb-6">
                {plans.map(p => {
                  const Icon = p.icon
                  const selected = plan === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlan(p.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        selected
                          ? 'border-[#2563EB] bg-[#2563EB]/10'
                          : 'border-white/[0.08] bg-slate-900/40 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#2563EB]' : 'bg-white/[0.06]'}`}>
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-white">{t(`marketing.pricing.plans.${p.id}.name`)}</span>
                            {p.recommended && (
                              <span className="ml-2 text-[10px] font-bold text-[#2563EB] bg-[#2563EB]/15 px-1.5 py-0.5 rounded-full">
                                {t('onboarding.recommended')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-bold text-white">{p.price}</span>
                          {p.period && <span className="text-[11px] text-slate-400">{p.period}</span>}
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {Array.isArray(p.features) && p.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className={`w-3 h-3 flex-shrink-0 ${selected ? 'text-[#2563EB]' : 'text-slate-600'}`} />
                            <span className="text-[11px] text-slate-400">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={finishOnboarding}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
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
              <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-lg font-semibold text-white mb-2">{t('onboarding.workspaceReady')}</h1>
              <p className="text-sm text-slate-400 mb-8">
                {t('onboarding.welcome', { name: name.split(' ')[0] })}
              </p>
              <button
                onClick={() => navigate('/Dashboard', { replace: true })}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
              >
                {t('onboarding.goToDashboard')}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
