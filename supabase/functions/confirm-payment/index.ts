import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe((Deno.env.get('STRIPE_SECRET_KEY') || '').trim())

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = (Deno.env.get('RESEND_API_KEY') || '').trim()
const WELCOME_FROM = Deno.env.get('CONTACT_FROM') || 'FleetDesk <contact@fleetdesk.fr>'
const APP_URL = Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr'
const PLAN_LABEL: Record<string, string> = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }

function esc(s: unknown) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Post-payment welcome email — sent once on first activation. Best-effort:
// failures never block the activation response.
async function sendWelcomeEmail(to: string, fullName: string, plan: string) {
  if (!RESEND_API_KEY || !to) return
  const first = esc((fullName || '').split(' ')[0] || 'et bienvenue')
  const label = PLAN_LABEL[plan] ?? 'Pro'
  const BRAND = '#0066FF', INK = '#18181b', MUTE = '#71717a', LINE = '#e4e4e7', SOFT = '#f4f4f5'
  const step = (n: string, title: string, text: string) =>
    `<tr>
       <td style="padding:0 12px 14px 0;vertical-align:top"><span style="display:inline-flex;width:26px;height:26px;border-radius:8px;background:${SOFT};color:${BRAND};font-weight:700;font-size:13px;align-items:center;justify-content:center;text-align:center;line-height:26px">${n}</span></td>
       <td style="padding:0 0 14px;vertical-align:top"><strong style="font-size:14px;color:${INK}">${title}</strong><br><span style="font-size:13px;color:${MUTE}">${text}</span></td>
     </tr>`
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <tr><td style="background:${BRAND};padding:18px 28px"><span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-0.02em">FleetDesk</span></td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${INK};letter-spacing:-0.02em">Bonjour ${first},</h1>
          <p style="margin:0 0 20px;font-size:14px;color:${INK};line-height:1.65">Votre formule <strong>${label}</strong> est active. Voici comment mettre votre flotte en route en trois étapes :</p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${step('1', 'Ajoutez votre premier véhicule', 'Marque, plaque, kilométrage — la fiche se crée en une minute.')}
            ${step('2', 'Créez un conducteur', 'Coordonnées et documents réglementaires, suivis automatiquement.')}
            ${step('3', 'Affectez le véhicule', 'Reliez conducteur et véhicule pour commencer le suivi.')}
          </table>
          <a href="${APP_URL}/Dashboard" style="display:inline-block;margin-top:8px;background:${BRAND};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:10px">Ouvrir mon tableau de bord</a>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${LINE};background:#fafafa">
          <p style="margin:0;font-size:12px;color:${MUTE};line-height:1.5">Une question ? Répondez simplement à cet e-mail.<br><a href="https://fleetdesk.fr" style="color:${BRAND};text-decoration:none">fleetdesk.fr</a></p>
        </td></tr>
      </table>
    </td></tr></table></body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: WELCOME_FROM, to: [to], subject: 'Bienvenue sur FleetDesk', html }),
  })
  if (!res.ok) console.error('[confirm-payment] welcome email failed:', res.status, await res.text())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { session_id } = await req.json()
    if (!session_id) {
      return new Response(JSON.stringify({ error: 'session_id requis' }), { status: 400, headers: corsHeaders })
    }

    // Authenticate the caller — the session_id must not be enough on its own
    // (it leaks via success_url / referrers / logs).
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })
    }
    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })
    }

    // Retrieve and verify the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)
    console.log('[confirm-payment] status:', session.status, 'payment_status:', session.payment_status, 'metadata:', session.metadata)

    if (session.status !== 'complete') {
      return new Response(JSON.stringify({ error: `Paiement non finalisé (status: ${session.status})` }), { status: 402, headers: corsHeaders })
    }
    // A completed checkout can still be unpaid (card declined after redirect).
    // Only activate when the invoice is actually paid, or when no payment is due
    // yet (Pro free trial).
    if (!(session.payment_status === 'paid' || session.payment_status === 'no_payment_required')) {
      return new Response(JSON.stringify({ error: 'Le paiement n\'a pas abouti. Réessayez ou changez de moyen de paiement.' }), { status: 402, headers: corsHeaders })
    }

    const { user_id, plan } = session.metadata ?? {}
    if (!user_id || !plan) {
      return new Response(JSON.stringify({ error: 'Métadonnées manquantes dans la session Stripe' }), { status: 400, headers: corsHeaders })
    }

    // The caller may only confirm their OWN checkout session.
    if (caller.id !== user_id) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: corsHeaders })
    }

    // Update user — merge so we don't wipe full_name, company, etc.
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: { user: existing }, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(user_id)
    if (fetchErr || !existing) {
      console.error('[confirm-payment] user not found:', user_id, fetchErr?.message)
      return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), { status: 404, headers: corsHeaders })
    }

    // Send the welcome email only on the first activation (dedupe on retries).
    const firstActivation = !existing.user_metadata?.onboarding_complete

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      user_metadata: { ...existing.user_metadata, plan, onboarding_complete: true, stripe_customer_id: session.customer as string },
      // Trusted copy of the plan — app_metadata is service-role only, so feature
      // gates can rely on it (user_metadata is user-editable and spoofable).
      app_metadata: { ...existing.app_metadata, plan },
    })
    if (updateErr) throw updateErr

    console.log('[confirm-payment] activated user:', user_id, 'plan:', plan)

    if (firstActivation) {
      await sendWelcomeEmail(existing.email ?? '', existing.user_metadata?.full_name ?? '', plan)
        .catch((e) => console.error('[confirm-payment] welcome email error:', e?.message))
    }
    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[confirm-payment] error:', err.message)
    return new Response(JSON.stringify({ error: 'Une erreur est survenue lors de la confirmation.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
