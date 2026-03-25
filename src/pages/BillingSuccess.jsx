import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Truck, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'

const GRADIENT = 'linear-gradient(135deg, #bfdbfe 0%, #d1fae5 45%, #fef3c7 100%)'

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

        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin mx-auto mb-4" />
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-2">
                {t('billing.activating')}
              </h1>
              <p className="text-sm text-zinc-400">{t('billing.activatingDesc')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-2">
                {t('billing.success')}
              </h1>
              <p className="text-sm text-zinc-400">{t('billing.successDesc')}</p>
            </>
          )}

          {status === 'delayed' && (
            <>
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-amber-500" />
              </div>
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-2">
                {t('billing.delayed')}
              </h1>
              <p className="text-sm text-zinc-400 mb-6">{t('billing.delayedDesc')}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm mb-3"
              >
                {t('billing.retry')}
              </button>
              <a
                href="mailto:support@fleetdesk.app"
                className="block w-full text-center text-sm text-zinc-400 hover:text-zinc-600 transition-colors py-1"
              >
                {t('billing.contactSupport')}
              </a>
            </>
          )}

          {status === 'cancelled' && (
            <>
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-2">
                {t('billing.cancelled')}
              </h1>
              <p className="text-sm text-zinc-400 mb-6">{t('billing.cancelledDesc')}</p>
              <button
                onClick={() => navigate('/setup-profile', { replace: true })}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
              >
                {t('billing.backToPlans')}
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-zinc-500/70 text-center">© 2025 FleetDesk</p>
      </div>
    </div>
  )
}
