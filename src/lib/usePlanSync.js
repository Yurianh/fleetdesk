import { useEffect } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'

// Reconciles the trusted plan (app_metadata) with the live Stripe subscription,
// once per session. Fixes accounts whose subscription predates app_metadata or
// was changed directly in Stripe — no manual SQL. When the plan changed we
// refresh the session so the new app_metadata lands in the JWT immediately.
export function usePlanSync() {
  const { user, applyPlan, applySubscription } = useAuth()
  const userId = user?.id
  const isCollaborator = !!user?.user_metadata?.org_id

  useEffect(() => {
    if (!userId || isCollaborator) return
    const key = `plan_synced_${userId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const { data, error } = await supabase.functions.invoke('sync-plan', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        })
        // L'état d'abonnement s'applique toujours, même quand rien n'a changé
        // côté serveur : le webhook a pu le modifier entre-temps, et le jeton de
        // la session en cours peut encore porter l'ancienne valeur.
        if (!error && data?.subscription) applySubscription(data.subscription)
        if (!error && data?.changed && data?.plan) {
          // Reflect the corrected plan in the UI immediately (gates re-read the
          // local user), then refresh the JWT in the background so it catches up.
          applyPlan(data.plan)
          supabase.auth.refreshSession().catch(() => {})
        }
      } catch {
        // Best-effort — never block the app on a billing sync.
        sessionStorage.removeItem(key)
      }
    })()
  }, [userId, isCollaborator, applyPlan, applySubscription])
}
