import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Truck, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'

export default function BillingSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const cancelled = searchParams.get('cancelled') === 'true'
  const [status, setStatus] = useState(cancelled ? 'cancelled' : 'loading')

  useEffect(() => {
    if (cancelled) return

    let attempts = 0
    const MAX = 10

    const poll = setInterval(async () => {
      attempts++
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.user_metadata?.onboarding_complete) {
        clearInterval(poll)
        setStatus('success')
        setTimeout(() => navigate('/Dashboard', { replace: true }), 1500)
        return
      }

      if (attempts >= MAX) {
        clearInterval(poll)
        setStatus('delayed')
      }
    }, 1500)

    return () => clearInterval(poll)
  }, [cancelled, navigate])

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg">
            <Truck className="w-[17px] h-[17px] text-white" />
          </div>
          <p className="text-[15px] font-semibold text-white tracking-tight">FleetDesk</p>
        </div>

        <div className="bg-slate-800/60 border border-white/[0.08] rounded-2xl p-10">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
              <h1 className="text-lg font-semibold text-white mb-2">
                {t('billing.activating')}
              </h1>
              <p className="text-sm text-slate-400">{t('billing.activatingDesc')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-lg font-semibold text-white mb-2">
                {t('billing.success')}
              </h1>
              <p className="text-sm text-slate-400">{t('billing.successDesc')}</p>
            </>
          )}

          {status === 'delayed' && (
            <>
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-lg font-semibold text-white mb-2">
                {t('billing.delayed')}
              </h1>
              <p className="text-sm text-slate-400 mb-6">{t('billing.delayedDesc')}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg py-2.5 transition-colors mb-2"
              >
                {t('billing.retry')}
              </button>
              <a href="mailto:support@fleetdesk.app"
                className="block w-full text-center text-sm text-slate-400 hover:text-white transition-colors py-1">
                {t('billing.contactSupport')}
              </a>
            </>
          )}

          {status === 'cancelled' && (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-lg font-semibold text-white mb-2">
                {t('billing.cancelled')}
              </h1>
              <p className="text-sm text-slate-400 mb-6">{t('billing.cancelledDesc')}</p>
              <button
                onClick={() => navigate('/setup-profile', { replace: true })}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
              >
                {t('billing.backToPlans')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
