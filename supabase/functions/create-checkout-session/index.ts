import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripeKey = (Deno.env.get('STRIPE_SECRET_KEY') || '').trim()
const stripe = new Stripe(stripeKey)

const PRICE_IDS: Record<string, string> = {
  starter:    'price_1TEiw8B6Ej53MTDrp4sDJxQS',
  pro:        'price_1TEiw7B6Ej53MTDrTW3RbjfW',
  enterprise: 'price_1TEiw1B6Ej53MTDrzE2nmyDR',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    // `onboarding` marks the sign-up flow (SetupProfile). In that flow, an email
    // that already maps to a live Stripe subscription must NOT be dropped into
    // the billing portal — we provision the new account from the existing sub
    // instead of charging again or trapping the user on billing/success.
    const { plan, return_url, onboarding = false } = body

    console.log('[checkout] plan:', plan, 'key_prefix:', stripeKey.substring(0, 12))

    if (!PRICE_IDS[plan]) {
      return new Response(JSON.stringify({ error: 'Invalid plan: ' + plan }), { status: 400, headers: corsHeaders })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[checkout] auth error:', authError?.message)
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), { status: 401, headers: corsHeaders })
    }

    console.log('[checkout] user:', user.id, 'email:', user.email)

    // Resolve the Stripe customer strictly by the authenticated email, never
    // from user_metadata (user-editable → IDOR/portal takeover).
    const existingCustomer = (await stripe.customers.list({ email: user.email!, limit: 1 })).data[0] || null
    const existingCustomerId = existingCustomer?.id || null

    // Guard: the email already maps to a live Stripe subscription.
    if (existingCustomerId) {
      const PLAN_BY_PRICE: Record<string, string> = {
        [PRICE_IDS.starter]: 'starter', [PRICE_IDS.pro]: 'pro', [PRICE_IDS.enterprise]: 'enterprise',
      }
      const allSubs = await stripe.subscriptions.list({ customer: existingCustomerId, status: 'all', limit: 10 })
      const live = allSubs.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status))

      if (live && onboarding) {
        // Sign-up with an already-subscribed email → provision this account from
        // the existing subscription instead of charging again. Never send them to
        // the portal here (that caused a dead-end on billing/success).
        const livePlan = PLAN_BY_PRICE[live.items.data[0]?.price?.id ?? ''] || plan
        const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
        const { data: { user: existing } } = await admin.auth.admin.getUserById(user.id)
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: { ...existing?.user_metadata, plan: livePlan, onboarding_complete: true, stripe_customer_id: existingCustomerId },
          app_metadata: { ...existing?.app_metadata, plan: livePlan },
        })
        console.log('[checkout] onboarding with existing sub → provisioned:', user.id, livePlan)
        return new Response(JSON.stringify({ already_subscribed: true, plan: livePlan }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Outside onboarding (e.g. Settings), an active subscription → portal.
      if (live && live.status === 'active') {
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: existingCustomerId,
          return_url: return_url || Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr',
        })
        return new Response(JSON.stringify({ url: portalSession.url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const sessionParams: any = {
      mode: 'subscription',
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${return_url}?cancelled=true`,
      metadata: { user_id: user.id, plan },
      allow_promotion_codes: true,
      locale: 'fr',
    }

    // 14-day free trial for Pro, without a card (matches the marketing promise).
    // payment_method_collection:'if_required' → Stripe collects no card while
    // nothing is due; at trial end, with no payment method, the subscription is
    // cancelled (webhook downgrades to starter). The portal guard above already
    // blocks existing paid customers.
    if (plan === 'pro') {
      sessionParams.subscription_data = {
        trial_period_days: 14,
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      }
      sessionParams.payment_method_collection = 'if_required'
      console.log('[checkout] card-free 14-day trial applied for pro')
    }

    // Reuse existing customer or create by email
    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId
    } else {
      sessionParams.customer_email = user.email
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    console.log('[checkout] session created:', session.id)
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const stripeErr = err as any
    console.error('[checkout] error:', stripeErr.message, 'type:', stripeErr.type, 'code:', stripeErr.code)
    return new Response(JSON.stringify({ error: 'Une erreur est survenue lors de la création du paiement.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
