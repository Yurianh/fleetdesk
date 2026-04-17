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

    // If user already has a Stripe customer, reuse it to prevent duplicate customers
    const existingCustomerId = user.user_metadata?.stripe_customer_id || null

    // Guard: if already subscribed to a paid plan, redirect to portal instead
    if (existingCustomerId && user.user_metadata?.onboarding_complete && user.user_metadata?.plan !== 'starter') {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: existingCustomerId,
        return_url: return_url || Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr',
      })
      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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

    // 14-day free trial for Pro (portal guard above already blocks existing paid customers)
    if (plan === 'pro') {
      sessionParams.subscription_data = { trial_period_days: 14 }
      console.log('[checkout] trial applied: 14 days for pro')
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
    return new Response(JSON.stringify({
      error: stripeErr.message,
      type: stripeErr.type,
      code: stripeErr.code,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
