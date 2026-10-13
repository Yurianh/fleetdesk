import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Rappel de fin d'essai, 48 h avant.
//
// La promesse affichée sur le site : « On vous prévient 48 h avant la fin de
// l'essai ». L'événement Stripe `trial_will_end` part toujours 3 jours avant,
// ce qui tombe au 4ᵉ jour d'un essai de 7 jours : on ne s'en sert plus, on
// envoie nous-mêmes le rappel.
//
// Déclenchée une fois par jour (07:00 UTC) par le cron Vercel /api/daily-digests,
// protégée par CRON_SECRET. Fenêtre : essais qui se terminent dans 36 à 60 h,
// pour qu'un passage quotidien prévienne chaque client autour de 48 h avant la
// fin. Un client n'est prévenu qu'une fois : l'envoi est noté dans les
// métadonnées de l'abonnement Stripe (trial_reminder_sent).

const stripe = new Stripe((Deno.env.get('STRIPE_SECRET_KEY') || '').trim(), {
  httpClient: Stripe.createFetchHttpClient(),
})
const CRON_SECRET = (Deno.env.get('CRON_SECRET') || '').trim()
const RESEND_API_KEY = (Deno.env.get('RESEND_API_KEY') || '').trim()
const MAIL_FROM = Deno.env.get('CONTACT_FROM') || 'FleetDesk <contact@fleetdesk.fr>'
const APP_URL = Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr'

const WINDOW_FROM_H = 36
const WINDOW_TO_H = 60

const BRAND = '#0066FF', INK = '#18181b', MUTE = '#71717a', LINE = '#e4e4e7'
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function findUserByCustomer(admin: any, customerId: string) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) return null
    const u = data.users.find((x: any) => x.user_metadata?.stripe_customer_id === customerId)
    if (u) return u
    if (data.users.length < 1000) return null
  }
  return null
}

async function portalLink(customerId: string) {
  try {
    const s = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${APP_URL}/Settings?section=plan` })
    return s.url
  } catch (e) {
    console.error('[trial-reminder] portal link failed:', (e as Error).message)
    return `${APP_URL}/Settings?section=plan`
  }
}

function email(first: string, endDate: string, link: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <tr><td style="background:${BRAND};padding:18px 28px"><span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-0.02em">FleetDesk</span></td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${INK}">Votre essai se termine dans 48 h, ${first}.</h1>
          <p style="margin:0 0 14px;font-size:14px;color:${INK};line-height:1.65">Comme promis, on vous prévient : votre essai gratuit de FleetDesk se termine le <strong>${esc(endDate)}</strong>. <strong>Rien n'a été prélevé</strong>, et rien ne le sera sans votre accord.</p>
          <p style="margin:0 0 8px;font-size:14px;color:${INK};line-height:1.65"><strong>Vous continuez ?</strong> Ajoutez un moyen de paiement en un clic : votre suivi continue sans interruption. Le mensuel est sans engagement.</p>
          <p style="margin:0 0 20px;font-size:14px;color:${INK};line-height:1.65"><strong>Vous arrêtez ?</strong> Vous n'avez rien à faire et rien à payer. Votre compte passera en lecture seule : vos données restent consultables, et vous pourrez reprendre quand vous voulez.</p>
          <a href="${esc(link)}" style="display:inline-block;margin-top:4px;background:${BRAND};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:10px">Continuer avec FleetDesk</a>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${LINE};background:#fafafa"><p style="margin:0;font-size:12px;color:${MUTE};line-height:1.5">Une question ? Répondez à cet e-mail.<br><a href="https://fleetdesk.fr" style="color:${BRAND};text-decoration:none">fleetdesk.fr</a></p></td></tr>
      </table></td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  if ((req.headers.get('x-cron-secret') || '') !== CRON_SECRET || !CRON_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Non autorisé' }), { status: 401 })
  }
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const now = Date.now() / 1000
  const from = now + WINDOW_FROM_H * 3600, to = now + WINDOW_TO_H * 3600
  let sent = 0, skipped = 0

  // Tous les abonnements en essai (Stripe pagine par 100).
  for await (const sub of stripe.subscriptions.list({ status: 'trialing', limit: 100 })) {
    if (!sub.trial_end || sub.trial_end < from || sub.trial_end > to) continue
    if (sub.metadata?.trial_reminder_sent === '1') { skipped++; continue }
    const customerId = sub.customer as string
    const user = await findUserByCustomer(admin, customerId)
    if (!user?.email || !RESEND_API_KEY) { skipped++; continue }
    try {
      const endDate = new Date(sub.trial_end * 1000).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })
      const first = esc(((user.user_metadata?.full_name as string) || '').split(' ')[0] || 'bonjour')
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: MAIL_FROM, to: [user.email], subject: 'Votre essai se termine dans 48 h — FleetDesk', html: email(first, endDate, await portalLink(customerId)) }),
      })
      if (!res.ok) { console.error('[trial-reminder] envoi refusé', res.status, await res.text()); continue }
      await stripe.subscriptions.update(sub.id, { metadata: { ...sub.metadata, trial_reminder_sent: '1' } })
      sent++
      console.log('[trial-reminder] rappel envoyé', user.id)
    } catch (e) {
      console.error('[trial-reminder] erreur', (e as Error).message)
    }
  }
  return new Response(JSON.stringify({ ok: true, sent, skipped }), { headers: { 'Content-Type': 'application/json' } })
})
