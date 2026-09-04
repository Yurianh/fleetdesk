import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

/**
 * Global banner shown when the org's last renewal payment failed (past_due).
 * Only the owner (who holds the subscription) sees it; collaborators don't
 * manage billing. Access stays intact during Stripe's retry window — this is a
 * warning + a shortcut to fix the card, not a block.
 */
export default function BillingBanner() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const isOwner = !user?.user_metadata?.org_id
  const pastDue = user?.app_metadata?.billing_status === 'past_due'
  if (!isOwner || !pastDue) return null

  async function openPortal() {
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

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2.5">
      <div className="flex items-center gap-3 flex-wrap">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-900 flex-1 min-w-0">
          <span className="font-semibold">Paiement échoué.</span>{' '}
          Votre dernier règlement n'a pas abouti. Mettez à jour votre moyen de paiement pour éviter la suspension de votre formule.
        </p>
        <button
          onClick={openPortal}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Mettre à jour le paiement
        </button>
      </div>
    </div>
  )
}
