// Retours depuis l'application (Réglages › Nous écrire) : bug, nouvelle
// fonctionnalité ou amélioration. Réservé aux utilisateurs connectés : le
// compte est lu depuis le jeton, jamais depuis le corps de la requête. Le
// message part par Resend vers CONTACT_INBOX, avec reply_to sur l'auteur, et
// un accusé de réception lui est envoyé (sans bloquer en cas d'échec).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = (Deno.env.get('RESEND_API_KEY') || '').trim()
const FROM = Deno.env.get('CONTACT_FROM') || 'FleetDesk <contact@fleetdesk.fr>'
const INBOX = Deno.env.get('CONTACT_INBOX') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TYPES: Record<string, string> = {
  bug: 'Bug',
  feature: 'Nouvelle fonctionnalité',
  improvement: 'Amélioration',
}

const INK = '#0B1B3F'
const BLUE = '#0052D6'
const MUTE = '#4A5A80'
const RULE = '#B9C7E4'

function esc(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function shell(inner: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F7F9FF">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F9FF;padding:32px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid ${BLUE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
      <tr><td style="padding:18px 28px;border-bottom:1px solid ${BLUE}">
        <span style="color:${BLUE};font-size:19px;letter-spacing:-0.04em"><b>Fleet</b><span style="font-weight:300">Desk</span></span>
      </td></tr>
      <tr><td style="padding:28px">${inner}</td></tr>
    </table>
  </td></tr></table></body></html>`
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

async function sendMail(payload: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) console.error('[app-feedback] resend error:', res.status, await res.text())
  return res.ok
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)

  try {
    if (!RESEND_API_KEY || !INBOX) {
      console.error('[app-feedback] missing RESEND_API_KEY or CONTACT_INBOX')
      return json({ error: 'Service indisponible' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Non autorisé' }, 401)
    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user?.email) return json({ error: 'Non autorisé' }, 401)

    const body = await req.json().catch(() => ({}))
    const type = TYPES[String(body.type)] ? String(body.type) : null
    const message = String(body.message ?? '').trim().slice(0, 4000)
    if (!type || message.length < 10) return json({ error: 'Champs invalides' }, 400)

    const ctx = body.context && typeof body.context === 'object' ? body.context : {}
    const meta = user.user_metadata || {}
    const rows: [string, string][] = [
      ['Compte', `${meta.full_name || '—'} · ${user.email}`],
      ['Entreprise', meta.org_company || meta.company || '—'],
      ['Formule', String(user.app_metadata?.plan || meta.plan || '—')],
      ['Rôle', meta.org_id ? String(meta.role || 'collaborateur') : 'propriétaire'],
      ['Écran', String(ctx.page || '—').slice(0, 200)],
      ['Design', String(ctx.design || '—').slice(0, 20)],
      ['Écran (px)', String(ctx.screen || '—').slice(0, 20)],
      ['Navigateur', String(ctx.userAgent || '—').slice(0, 300)],
    ]

    const ok = await sendMail({
      from: FROM,
      to: [INBOX],
      reply_to: user.email,
      subject: `[App · ${TYPES[type]}] ${message.split('\n')[0].slice(0, 70)}`,
      html: shell(`
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${BLUE}">Depuis l'application · ${esc(TYPES[type])}</p>
        <h1 style="margin:0 0 18px;font-size:20px;color:${INK}">Nouveau retour utilisateur</h1>
        <div style="font-size:14px;color:${INK};line-height:1.6;white-space:pre-wrap;padding:14px 16px;border:1px solid ${RULE}">${esc(message)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:18px">
          ${rows.map(([k, v]) => `<tr><td style="padding:5px 0;font-size:12px;color:${MUTE};width:96px;vertical-align:top">${k}</td><td style="padding:5px 0;font-size:13px;color:${INK}">${esc(v)}</td></tr>`).join('')}
        </table>`),
    })
    if (!ok) return json({ error: 'Envoi impossible' }, 502)

    await sendMail({
      from: FROM,
      to: [user.email],
      reply_to: INBOX,
      subject: 'Merci pour votre retour — FleetDesk',
      html: shell(`
        <h1 style="margin:0 0 14px;font-size:20px;color:${INK}">Merci, c'est bien reçu.</h1>
        <p style="margin:0 0 16px;font-size:14px;color:${INK};line-height:1.65">L'équipe lit chaque message. Si nous avons besoin de précisions, nous vous répondons à cette adresse.</p>
        <div style="font-size:14px;color:${INK};line-height:1.6;white-space:pre-wrap;padding:14px 16px;border:1px solid ${RULE}">${esc(message)}</div>
        <p style="margin:20px 0 0;font-size:14px;color:${INK}">À très vite,<br><b>L'équipe FleetDesk</b></p>`),
    }).catch((err) => console.error('[app-feedback] ack failed:', err?.message))

    return json({ success: true })
  } catch (err: any) {
    console.error('[app-feedback] error:', err?.message)
    return json({ error: 'Une erreur est survenue' }, 500)
  }
})
