import { useAuth } from './AuthContext'

// Plan ordering — a plan unlocks everything at or below its rank.
const RANK = { starter: 0, pro: 1, enterprise: 2 }

// Minimum plan required per capability. Aligned with the pricing grid.
export const CAPS = {
  washings:          'pro',        // wash tracking + justificatifs
  advancedAnalytics: 'pro',        // dashboard ranked-bar analytics
  team:              'enterprise', // invite / manage admins & members
  driverAccounts:    'enterprise', // invite chauffeurs, assign vehicles, field entry
}

// Resolve the effective plan for the signed-in user.
// - Collaborators (org_id set) can only exist inside an Enterprise org, so they
//   inherit enterprise.
// - Owners read the TRUSTED plan from app_metadata (service-role written, not
//   user-editable). Missing = starter (safest default).
export function resolvePlan(user) {
  if (!user) return 'starter'
  if (user.user_metadata?.org_id) return 'enterprise'
  return user.app_metadata?.plan ?? 'starter'
}

export function planAllows(plan, cap) {
  const need = CAPS[cap]
  if (!need) return true // unknown capability = not gated
  return (RANK[plan] ?? 0) >= (RANK[need] ?? 0)
}

// Hook: current plan string.
export function usePlan() {
  const { user } = useAuth()
  return resolvePlan(user)
}

// Hook: can the current user use `cap`? Also returns the plan it requires,
// for upsell messaging.
export function useCan(cap) {
  const plan = usePlan()
  return { allowed: planAllows(plan, cap), plan, requiredPlan: CAPS[cap] ?? null }
}

// ── Accès en écriture ───────────────────────────────────────────────
// Un compte sans abonnement — essai terminé sans carte, résiliation — garde
// ses données mais ne peut plus les modifier tant qu'il ne choisit pas une
// formule. Avant, il retombait sur Starter gratuitement et pour toujours : le
// Starter se vendant 9 €, l'essai Pro devenait une façon de ne jamais payer.
//
// L'état vient du serveur (`app_metadata.subscription`, écrit par sync-plan et
// le webhook Stripe, non modifiable par l'utilisateur). En son absence, l'accès
// reste ouvert : mieux vaut laisser écrire un compte pas encore synchronisé que
// verrouiller par erreur un client qui paie.
export function resolveAccess(user) {
  if (!user) return 'active'
  if (user.user_metadata?.org_id) return 'active'   // collaborateur : dépend de l'organisation
  if (user.app_metadata?.comped) return 'active'     // compte offert (démo, partenaires)
  return user.app_metadata?.subscription === 'inactive' ? 'readonly' : 'active'
}

export function useAccess() {
  const { user } = useAuth()
  const access = resolveAccess(user)
  return { access, readOnly: access === 'readonly' }
}
