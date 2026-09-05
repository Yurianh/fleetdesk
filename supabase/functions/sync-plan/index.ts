import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Self-healing plan sync. The app calls this (once per session) so the trusted
// plan in app_metadata always reflects the live Stripe subscription — no manual
// SQL when a subscription predates app_metadata, or is changed directly in the
// Stripe dashboard. Idempotent: only writes when the plan actually differs.

const stripe = new Stripe((Deno.env.get('STRIPE_SECRET_KEY') || '').trim())

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLAN_BY_PRICE: Record<string, string> = {
  'price_1TEiw8B6Ej53MTDrp4sDJxQS': 'starter',
  'price_1TEiw7B6Ej53MTDrTW3RbjfW': 'pro',
  'price_1TEiw1B6Ej53MTDrzE2nmyDR': 'enterprise',
}

// Active-ish subscription states that should grant the paid plan.
const LIVE = new Set(['active', 'trialing', 'past_due'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })

    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })

    // Collaborators don't own a subscription — their plan derives from the org.
    if (user.user_metadata?.org_id) {
      return new Response(JSON.stringify({ plan: 'enterprise', changed: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Resolve the Stripe customer: stored id first, else look up by email.
    let customerId: string | null = user.user_metadata?.stripe_customer_id ?? null
    if (!customerId && user.email) {
      const found = await stripe.customers.list({ email: user.email, limit: 10 })
      // Prefer a customer that actually has a live subscription.
      for (const c of found.data) {
        const subs = await stripe.subscriptions.list({ customer: c.id, status: 'all', limit: 10 })
        if (subs.data.some(s => LIVE.has(s.status))) { customerId = c.id; break }
      }
      if (!customerId && found.data.length) customerId = found.data[0].id
    }

    // Determine the plan + trial end from the live subscription (default starter).
    let plan = 'starter'
    let trialEnd: number | null = null
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
      const live = subs.data.find(s => LIVE.has(s.status))
      const priceId = live?.items?.data?.[0]?.price?.id
      plan = (priceId && PLAN_BY_PRICE[priceId]) || 'starter'
      // Only expose the trial end while the sub is actually trialing and it's
      // still in the future (drives the discreet in-app countdown banner).
      if (live?.status === 'trialing' && live.trial_end) trialEnd = live.trial_end
    }

    const current = user.app_metadata?.plan ?? null
    const currentTrial = user.app_metadata?.trial_end ?? null
    const changed = current !== plan
      || currentTrial !== trialEnd
      || (customerId && user.user_metadata?.stripe_customer_id !== customerId)

    if (changed) {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, plan, trial_end: trialEnd },
        user_metadata: { ...user.user_metadata, plan, ...(customerId ? { stripe_customer_id: customerId } : {}) },
      })
      console.log('[sync-plan] updated', user.id, current, '->', plan, 'trial_end:', trialEnd)
    }

    return new Response(JSON.stringify({ plan, changed, trial_end: trialEnd }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[sync-plan] error:', err.message)
    return new Response(JSON.stringify({ error: 'sync failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
