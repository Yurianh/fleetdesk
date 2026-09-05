import { useState } from 'react'
import { Clock, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Discreet Pro-trial reminder. Deliberately restrained: it only appears in the
// final stretch of the trial (≤ WINDOW days left), is dismissible for the
// session, and uses a calm tone — a nudge, not a nag. The card-free trial won't
// auto-charge, so converting requires the user to add a payment method.
const WINDOW_DAYS = 3

export default function TrialBanner() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem('trial_banner_dismissed') === '1'
  )

  const isOwner = !user?.user_metadata?.org_id
  const trialEnd = user?.app_metadata?.trial_end // unix seconds, only set while trialing
  if (!isOwner || !trialEnd || dismissed) return null

  const msLeft = trialEnd * 1000 - Date.now()
  if (msLeft <= 0) return null
  const daysLeft = Math.ceil(msLeft / 86_400_000)
  if (daysLeft > WINDOW_DAYS) return null

  function dismiss() {
    sessionStorage.setItem('trial_banner_dismissed', '1')
    setDismissed(true)
  }

  async function activate() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { return_url: window.location.origin + '/Settings' },
      })
      if (error) throw error
      window.location.href = data.url
    } catch (e) {
      toast.error(e.message || 'Impossible d\'ouvrir le portail de facturation.')
      setLoading(false)
    }
  }

  const when = daysLeft <= 1 ? 'aujourd\'hui' : `dans ${daysLeft} jours`

  return (
    <div className="bg-[#0066FF]/[0.06] border-b border-[#0066FF]/15 px-4 sm:px-8 py-2.5">
      <div className="flex items-center gap-3 flex-wrap">
        <Clock className="w-4 h-4 text-[#0066FF] flex-shrink-0" />
        <p className="text-sm text-zinc-700 flex-1 min-w-0">
          Votre essai Pro se termine <span className="font-semibold">{when}</span>. Ajoutez un moyen de paiement pour conserver vos fonctionnalités Pro.
        </p>
        <button
          onClick={activate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-[#0066FF] hover:bg-[#0052D6] disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Activer mon abonnement
        </button>
        <button onClick={dismiss} aria-label="Masquer" className="flex-shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
