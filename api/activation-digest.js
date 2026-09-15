// Cron Vercel → fonction edge Supabase.
//
// Vercel ne sait déclencher qu'une route de ce déploiement : cette route relaie
// l'appel vers `activation-digest`, qui tient la logique et la clé service_role.
// Deux secrets, deux rôles : Vercel signe son propre cron (CRON_SECRET côté
// plateforme), et nous signons l'appel sortant (x-cron-secret côté Supabase).
export default async function handler(req, res) {
  const cronSecret = (process.env.CRON_SECRET || '').trim()
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()

  if (!cronSecret || !supabaseUrl) {
    console.error('[activation-digest] CRON_SECRET ou URL Supabase manquante')
    return res.status(500).json({ ok: false, error: 'Configuration incomplète' })
  }

  // Vercel envoie « Authorization: Bearer <CRON_SECRET> » sur les crons dès que
  // la variable existe. On refuse tout appel qui ne vient pas de là.
  const auth = req.headers.authorization || ''
  if (auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: 'Non autorisé' })
  }

  // La passerelle Supabase exige un en-tête Authorization sur /functions/v1 —
  // `apikey` seul ne suffit pas, elle répond UNAUTHORIZED_NO_AUTH_HEADER. La clé
  // anonyme suffit ici : c'est `x-cron-secret` qui autorise vraiment l'appel,
  // vérifié dans la fonction elle-même.
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim()
  if (!anonKey) {
    console.error('[activation-digest] clé anonyme Supabase manquante')
    return res.status(500).json({ ok: false, error: 'Configuration incomplète' })
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/activation-digest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
    })
    const body = await response.json().catch(() => ({}))
    console.log('[activation-digest] réponse amont', response.status, JSON.stringify(body))
    return res.status(response.ok ? 200 : 500).json(body)
  } catch (e) {
    console.error('[activation-digest] échec', String(e?.message || e))
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
