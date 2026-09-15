// Cron Vercel → fonction edge Supabase.
//
// Vercel ne sait déclencher qu'une route de ce déploiement : cette route relaie
// l'appel vers `deadline-digest`, qui tient la logique et la clé service_role.
// Deux secrets, deux rôles : Vercel signe son propre cron (CRON_SECRET côté
// plateforme), et nous signons l'appel sortant (x-cron-secret côté Supabase).
export default async function handler(req, res) {
  const cronSecret = (process.env.CRON_SECRET || '').trim()
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()

  if (!cronSecret || !supabaseUrl) {
    console.error('[deadline-digest] CRON_SECRET ou URL Supabase manquante')
    return res.status(500).json({ ok: false, error: 'Configuration incomplète' })
  }

  // Vercel envoie « Authorization: Bearer <CRON_SECRET> » sur les crons dès que
  // la variable existe. On refuse tout appel qui ne vient pas de là.
  const auth = req.headers.authorization || ''
  if (auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: 'Non autorisé' })
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/deadline-digest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
        // La fonction vérifie elle-même le secret ; l'apikey satisfait la
        // passerelle Supabase qui refuse les requêtes anonymes.
        apikey: (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim(),
      },
    })
    const body = await response.json().catch(() => ({}))
    console.log('[deadline-digest]', response.status, JSON.stringify(body))
    return res.status(response.ok ? 200 : 500).json(body)
  } catch (e) {
    console.error('[deadline-digest] échec', String(e?.message || e))
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
