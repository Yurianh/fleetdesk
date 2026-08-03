import { createClient } from '@supabase/supabase-js'

// Vercel Cron keep-alive: pings Supabase so the free-tier project
// does not pause after 7 days of inactivity. Scheduled in vercel.json.
export default async function handler(req, res) {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim()

  if (!url || !key) {
    return res.status(500).json({ ok: false, error: 'Missing Supabase env vars' })
  }

  try {
    const supabase = createClient(url, key)
    // HEAD count query — lightweight, still hits Postgres (resets inactivity timer).
    const { error, count } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })

    // An RLS/permission error still reached the DB → project stays active.
    return res.status(200).json({ ok: true, pinged: true, count: count ?? null, dbError: error?.message ?? null })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
