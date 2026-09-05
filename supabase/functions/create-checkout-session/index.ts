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
    const { plan, return_url } = body

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

    // Guard: if already on an active paid subscription, send to the portal.
    // Decide from Stripe state, not from user_metadata.
    if (existingCustomerId) {
      const activeSubs = await stripe.subscriptions.list({ customer: existingCustomerId, status: 'active', limit: 1 })
      if (activeSubs.data.length > 0) {
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
