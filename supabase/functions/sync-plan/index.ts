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
      return new Response(JSON.stringify({ plan: 'enterprise', changed: false, subscription: 'active' }), {
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
    let hasLiveSub = false
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
      const live = subs.data.find(s => LIVE.has(s.status))
      hasLiveSub = !!live
      const priceId = live?.items?.data?.[0]?.price?.id
      plan = (priceId && PLAN_BY_PRICE[priceId]) || 'starter'
      // Only expose the trial end while the sub is actually trialing and it's
      // still in the future (drives the discreet in-app countdown banner).
      if (live?.status === 'trialing' && live.trial_end) trialEnd = live.trial_end
    }

    // A live subscription means the account is set up — don't force it back
    // through onboarding on login.
    const onboarded = hasLiveSub || !!user.user_metadata?.onboarding_complete

    // Sans abonnement vivant, le compte passe en lecture seule. Le plan reste
    // affiché comme repère, mais n'ouvre plus l'écriture : avant, l'absence
    // d'abonnement valait Starter gratuit et illimité dans le temps, et un essai
    // Pro laissé expirer devenait un Starter offert. Un compte marqué « comped »
    // (démo, partenaire) reste ouvert sans abonnement.
    const subscription = (hasLiveSub || user.app_metadata?.comped) ? 'active' : 'inactive'

    // Un compte offert garde le plan qu'on lui a donné : Stripe n'en sait rien,
    // et le réaligner sur Stripe le ramènerait à Starter.
    if (user.app_metadata?.comped && !hasLiveSub && user.app_metadata?.plan) {
      plan = user.app_metadata.plan
    }

    const current = user.app_metadata?.plan ?? null
    const currentTrial = user.app_metadata?.trial_end ?? null
    const changed = current !== plan
      || (user.app_metadata?.subscription ?? null) !== subscription
      || currentTrial !== trialEnd
      || (customerId && user.user_metadata?.stripe_customer_id !== customerId)
      || (hasLiveSub && !user.user_metadata?.onboarding_complete)

    if (changed) {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, plan, trial_end: trialEnd, subscription },
        user_metadata: {
          ...user.user_metadata, plan,
          ...(customerId ? { stripe_customer_id: customerId } : {}),
          ...(hasLiveSub ? { onboarding_complete: true } : {}),
        },
      })
      console.log('[sync-plan] updated', user.id, current, '->', plan, 'trial_end:', trialEnd, 'onboarded:', onboarded)
    }

    return new Response(JSON.stringify({ plan, changed, trial_end: trialEnd, onboarded, subscription }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[sync-plan] error:', err.message)
    return new Response(JSON.stringify({ error: 'sync failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
