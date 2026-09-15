// Un seul cron pour les deux emails.
//
// Le plan Hobby de Vercel plafonne à deux tâches planifiées, et le keep-alive
// Supabase en occupe déjà une. Cette route déclenche donc les deux mécanismes à
// la suite — ils restent deux fonctions edge distinctes, avec leurs cadences et
// leurs journaux propres. Les routes individuelles restent disponibles pour un
// déclenchement manuel.
const FUNCTIONS = ['deadline-digest', 'activation-digest']

export default async function handler(req, res) {
  const cronSecret = (process.env.CRON_SECRET || '').trim()
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim()

  if (!cronSecret || !supabaseUrl || !anonKey) {
    console.error('[daily-digests] configuration incomplète')
    return res.status(500).json({ ok: false, error: 'Configuration incomplète' })
  }

  const auth = req.headers.authorization || ''
  if (auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ ok: false, error: 'Non autorisé' })
  }

  const results = {}
  for (const name of FUNCTIONS) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': cronSecret,
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
      })
      results[name] = await response.json().catch(() => ({ status: response.status }))
      console.log(`[daily-digests] ${name}`, response.status, JSON.stringify(results[name]))
    } catch (e) {
      // Un échec ne doit pas empêcher l'autre mécanisme de tourner.
      results[name] = { ok: false, error: String(e?.message || e) }
      console.error(`[daily-digests] ${name} a échoué`, String(e?.message || e))
    }
  }

  return res.status(200).json({ ok: true, ...results })
}
