// Bouton de l'email d'activation : mesure le clic, puis redirige.
//
// La redirection part d'abord — l'utilisateur ne doit jamais attendre notre
// statistique. L'enregistrement est relayé à la fonction edge, seule détentrice
// de la clé service_role (le journal est fermé par RLS).
export default async function handler(req, res) {
  const { o: orgId, r: reason } = req.query || {}
  const app = 'https://app.fleetdesk.fr'

  // Destination : la liste des véhicules, filtrée sur ce qui manque.
  const target =
    reason === 'maintenance'
      ? `${app}/Maintenance`
      : `${app}/Vehicles?missing=ct`

  const cronSecret = (process.env.CRON_SECRET || '').trim()
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim()

  if (orgId && cronSecret && supabaseUrl && anonKey) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/activation-digest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': cronSecret,
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ event: 'click', org_id: orgId, reason: reason || 'ct' }),
      })
    } catch (e) {
      // Un clic non mesuré reste un clic : on n'empêche jamais la redirection.
      console.error('[activation-click] enregistrement échoué', String(e?.message || e))
    }
  }

  res.setHeader('Cache-Control', 'no-store')
  return res.redirect(302, target)
}
