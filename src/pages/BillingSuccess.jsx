import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Truck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const GRADIENT = 'linear-gradient(135deg, #bfdbfe 0%, #d1fae5 45%, #fef3c7 100%)'

const PLAN_LABELS = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }

export default function BillingSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const cancelled = searchParams.get('cancelled') === 'true'
  const sessionId  = searchParams.get('session_id')

  const [status, setStatus]     = useState(cancelled ? 'cancelled' : 'loading')
  const [userName, setUserName] = useState('')
  const [planName, setPlanName] = useState('')
  const [errMsg, setErrMsg]     = useState('')

  useEffect(() => {
    if (cancelled) return

    async function confirm() {
      try {
        if (sessionId) {
          // Direct verification via plain fetch — no auth needed, session_id is the secret
          const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
          const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
          const resp = await fetch(`${supabaseUrl}/functions/v1/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
            body: JSON.stringify({ session_id: sessionId }),
          })
          const data = await resp.json()
          if (!resp.ok) throw new Error(data.error || `Erreur ${resp.status}`)

          // Refresh session so JWT picks up onboarding_complete: true — this triggers
          // AuthContext to update, allowing App.jsx to route to Dashboard correctly
          await supabase.auth.refreshSession()
          const { data: { user } } = await supabase.auth.getUser()
          const first = (user?.user_metadata?.full_name || user?.email || '').split(' ')[0]
          setUserName(first)
          setPlanName(PLAN_LABELS[data.plan] || data.plan || 'Pro')
          setStatus('success')
        } else {
          // Fallback: poll for webhook update (no session_id in URL)
          let attempts = 0
          const poll = setInterval(async () => {
            attempts++
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.onboarding_complete) {
              clearInterval(poll)
              const first = (user.user_metadata.full_name || user.email || '').split(' ')[0]
              setUserName(first)
              setPlanName(PLAN_LABELS[user.user_metadata.plan] || user.user_metadata.plan || 'Pro')
              setStatus('success')
            } else if (attempts >= 20) {
              clearInterval(poll)
              setStatus('delayed')
            }
          }, 2000)
          return () => clearInterval(poll)
        }
      } catch (e) {
        setErrMsg(e.message || 'Erreur inconnue.')
        setStatus('delayed')
      }
    }

    confirm()
  }, [cancelled, sessionId])

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

          {/* Loading */}
          {status === 'loading' && (
            <>
              <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin mx-auto mb-4" />
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-2">Activation de votre plan...</h1>
              <p className="text-sm text-zinc-400">Veuillez patienter pendant que nous confirmons votre paiement.</p>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-emerald-50 rounded-full" />
                <div className="absolute inset-2 bg-emerald-100 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[#2563EB]/8 text-[#2563EB] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <Sparkles className="w-3 h-3" />
                Formule {planName} activée
              </div>
              <h1 className="text-[20px] font-semibold text-zinc-900 mb-2 leading-snug">
                {userName ? `Bienvenue, ${userName} !` : 'Bienvenue !'}
              </h1>
              <p className="text-sm text-zinc-400 mb-8">
                Votre compte est actif. Toute votre flotte vous attend dans le tableau de bord.
              </p>
              <div className="bg-zinc-50 rounded-xl p-4 mb-8 text-left space-y-2.5">
                {['Compte créé', 'Abonnement activé', 'Accès complet débloqué'].map(item => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-zinc-600">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/Dashboard', { replace: true })}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
              >
                Accéder au tableau de bord <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Delayed / Error */}
          {status === 'delayed' && (
            <>
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-amber-500" />
              </div>
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-2">Vérification en cours</h1>
              <p className="text-sm text-zinc-400 mb-2">
                Votre paiement a peut-être été reçu. Réessayez dans quelques instants.
              </p>
              {errMsg && <p className="text-xs text-red-400 mb-4">{errMsg}</p>}
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm mb-3"
              >
                Vérifier à nouveau
              </button>
              <a href="mailto:support@fleetdesk.app" className="block w-full text-center text-sm text-zinc-400 hover:text-zinc-600 transition-colors py-1">
                Contacter le support
              </a>
            </>
          )}

          {/* Cancelled */}
          {status === 'cancelled' && (
            <>
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <h1 className="text-[17px] font-semibold text-zinc-900 mb-2">Paiement annulé</h1>
              <p className="text-sm text-zinc-400 mb-6">Aucun montant n'a été débité. Vous pouvez choisir un plan et réessayer.</p>
              <button
                onClick={() => navigate('/setup-profile', { replace: true })}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white text-sm font-semibold rounded-xl py-2.5 transition-all duration-150 shadow-sm"
              >
                Retour aux plans
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-zinc-500/70 text-center">© 2025 FleetDesk</p>
      </div>
    </div>
  )
}
