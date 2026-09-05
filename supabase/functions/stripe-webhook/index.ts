import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

// Paginate through auth users to find the one whose metadata carries this Stripe
// customer id. Avoids a fixed perPage:1000 cap that silently misses users past
// the first page (lost plan updates / cancellations as the base grows).
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

// ── Dunning emails (Resend) ────────────────────────────────────────
const RESEND_API_KEY = (Deno.env.get('RESEND_API_KEY') || '').trim()
const MAIL_FROM = Deno.env.get('CONTACT_FROM') || 'FleetDesk <contact@fleetdesk.fr>'
const APP_URL = Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr'

function esc(s: unknown) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// A billing-portal link so the customer can fix their card straight from the
// email. Best-effort: falls back to the in-app settings page.
async function portalLink(customerId: string) {
  try {
    const s = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${APP_URL}/Settings` })
    return s.url
  } catch (e) {
    console.error('[webhook] portal link failed:', (e as Error).message)
    return `${APP_URL}/Settings`
  }
}

const BRAND = '#0066FF', INK = '#18181b', MUTE = '#71717a', LINE = '#e4e4e7'

function shell(accent: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <tr><td style="background:${accent};padding:18px 28px"><span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-0.02em">FleetDesk</span></td></tr>
        <tr><td style="padding:28px">${inner}</td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${LINE};background:#fafafa"><p style="margin:0;font-size:12px;color:${MUTE};line-height:1.5">Une question ? Répondez à cet e-mail.<br><a href="https://fleetdesk.fr" style="color:${BRAND};text-decoration:none">fleetdesk.fr</a></p></td></tr>
      </table></td></tr></table></body></html>`
}

function cta(url: string, label: string, color = BRAND) {
  return `<a href="${esc(url)}" style="display:inline-block;margin-top:8px;background:${color};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:10px">${label}</a>`
}

// variant: 'failed' | 'final' | 'recovered' | 'cancelled'
function dunningContent(variant: string, first: string, portalUrl: string, nextDate: string | null) {
  const RED = '#dc2626', GREEN = '#16a34a'
  if (variant === 'recovered') {
    return {
      subject: 'Paiement confirmé — FleetDesk',
      accent: GREEN,
      html: shell(GREEN, `<h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${INK}">Paiement confirmé, ${first}.</h1>
        <p style="margin:0 0 16px;font-size:14px;color:${INK};line-height:1.65">Votre règlement a bien été pris en compte. Votre formule reste active, rien d'autre à faire. Merci !</p>
        ${cta(`${APP_URL}/Dashboard`, 'Ouvrir mon tableau de bord', GREEN)}`),
    }
  }
  if (variant === 'cancelled') {
    return {
      subject: 'Abonnement suspendu — FleetDesk',
      accent: RED,
      html: shell(RED, `<h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${INK}">Votre abonnement a été suspendu.</h1>
        <p style="margin:0 0 16px;font-size:14px;color:${INK};line-height:1.65">Après plusieurs tentatives de paiement infructueuses, votre abonnement a été résilié et votre compte est repassé sur la formule <strong>Starter</strong>. Vos données sont conservées. Réactivez une formule payante quand vous le souhaitez.</p>
        ${cta(`${APP_URL}/Settings`, 'Réactiver une formule', RED)}`),
    }
  }
  if (variant === 'final') {
    return {
      subject: 'Dernière tentative de paiement échouée — action requise',
      accent: RED,
      html: shell(RED, `<h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${INK}">Dernière tentative échouée, ${first}.</h1>
        <p style="margin:0 0 16px;font-size:14px;color:${INK};line-height:1.65">Nous n'avons pas pu prélever votre abonnement malgré plusieurs essais. <strong>Sans mise à jour de votre moyen de paiement, votre abonnement sera résilié</strong> et votre compte repassera sur Starter.</p>
        ${cta(portalUrl, 'Mettre à jour ma carte maintenant', RED)}`),
    }
  }
  // 'failed' — retry pending
  const when = nextDate ? ` Prochaine tentative le <strong>${esc(nextDate)}</strong>.` : ''
  return {
    subject: 'Paiement échoué — mettez à jour votre carte',
    accent: '#d97706',
    html: shell('#d97706', `<h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${INK}">Paiement échoué, ${first}.</h1>
      <p style="margin:0 0 16px;font-size:14px;color:${INK};line-height:1.65">Le prélèvement de votre abonnement FleetDesk n'a pas abouti (carte expirée ou refusée).${when} Votre accès reste actif pour le moment — mettez à jour votre moyen de paiement pour éviter toute interruption.</p>
      ${cta(portalUrl, 'Mettre à jour mon paiement', '#d97706')}`),
  }
}

async function sendDunning(to: string, name: string, variant: string, portalUrl: string, nextDate: string | null) {
  if (!RESEND_API_KEY || !to) return
  const first = esc((name || '').split(' ')[0] || 'bonjour')
  const { subject, html } = dunningContent(variant, first, portalUrl, nextDate)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html }),
  })
  if (!res.ok) console.error('[webhook] dunning email failed:', variant, res.status, await res.text())
}

Deno.serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err) {
    console.error('[webhook] signature error:', err.message)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── checkout.session.completed ─────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { user_id, plan } = session.metadata ?? {}
    const paidOk = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
    console.log('[webhook] checkout.session.completed — user_id:', user_id, 'plan:', plan, 'payment_status:', session.payment_status)

    // Only activate on an actually-paid session (or a trial with nothing due).
    if (user_id && plan && paidOk) {
      const { data: { user }, error: fetchErr } = await supabase.auth.admin.getUserById(user_id)
      if (fetchErr) {
        console.error('[webhook] failed to fetch user:', fetchErr.message)
      } else {
        const { error } = await supabase.auth.admin.updateUserById(user_id, {
          user_metadata: {
            ...user?.user_metadata,
            plan,
            onboarding_complete: true,
            stripe_customer_id: session.customer as string,
          },
          // Trusted plan for feature gates (service-role only, not spoofable).
          app_metadata: { ...user?.app_metadata, plan },
        })
        if (error) console.error('[webhook] failed to update user:', error.message)
        else console.log('[webhook] user activated:', user_id, 'plan:', plan)
      }
    }
  }

  // ── customer.subscription.updated (plan change) ────────────────
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    const priceId = sub.items.data[0]?.price?.id

    const PLAN_BY_PRICE: Record<string, string> = {
      'price_1TEiw8B6Ej53MTDrp4sDJxQS': 'starter',
      'price_1TEiw7B6Ej53MTDrTW3RbjfW': 'pro',
      'price_1TEiw1B6Ej53MTDrzE2nmyDR': 'enterprise',
    }
    const newPlan = PLAN_BY_PRICE[priceId] ?? null
    if (!newPlan) return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })

    const user = await findUserByCustomer(supabase, customerId)
    if (user) {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, plan: newPlan },
        app_metadata: { ...user.app_metadata, plan: newPlan },
      })
      console.log('[webhook] plan updated:', user.id, '->', newPlan)
    }
  }

  // ── customer.subscription.deleted (cancellation) ───────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    console.log('[webhook] subscription cancelled, customer:', customerId)

    const user = await findUserByCustomer(supabase, customerId)
    if (user) {
      const wasPastDue = user.app_metadata?.billing_status === 'past_due'
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, plan: 'starter', stripe_customer_id: null },
        app_metadata: { ...user.app_metadata, plan: 'starter', billing_status: 'active' },
      })
      console.log('[webhook] user downgraded to starter:', user.id)
      // If the cancellation followed a dunning failure, tell them access dropped
      // to Starter (voluntary cancellations get the Stripe-side confirmation).
      if (wasPastDue) {
        try {
          await sendDunning(user.email ?? '', user.user_metadata?.full_name ?? '', 'cancelled', '', null)
        } catch (e) {
          console.error('[webhook] cancelled email error:', (e as Error).message)
        }
      }
    }
  }

  // ── invoice.payment_failed (card declined on renewal) ──────────
  // Stripe keeps retrying (dunning) before it eventually cancels. Flag the org
  // so the app can warn without cutting access during the retry window.
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    const user = await findUserByCustomer(supabase, customerId)
    if (user) {
      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, billing_status: 'past_due' },
      })
      console.log('[webhook] payment failed, marked past_due:', user.id)

      // Escalating dunning email. If Stripe scheduled no further retry, this is
      // the final notice before the subscription is cancelled.
      try {
        const isFinal = !invoice.next_payment_attempt
        const nextDate = invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
          : null
        const link = await portalLink(customerId)
        await sendDunning(user.email ?? '', user.user_metadata?.full_name ?? '', isFinal ? 'final' : 'failed', link, nextDate)
      } catch (e) {
        console.error('[webhook] dunning send error:', (e as Error).message)
      }
    }
  }

  // ── invoice.payment_succeeded (recovered / normal renewal) ─────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    const user = await findUserByCustomer(supabase, customerId)
    if (user && user.app_metadata?.billing_status === 'past_due') {
      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, billing_status: 'active' },
      })
      console.log('[webhook] payment recovered, cleared past_due:', user.id)
      // Only reassure the customer if they were actually in dunning.
      try {
        await sendDunning(user.email ?? '', user.user_metadata?.full_name ?? '', 'recovered', '', null)
      } catch (e) {
        console.error('[webhook] recovered email error:', (e as Error).message)
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
