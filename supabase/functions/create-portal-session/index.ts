import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe((Deno.env.get('STRIPE_SECRET_KEY') || '').trim())

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    const body = await req.json().catch(() => ({}))
    const siteUrl = Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr'
    const returnUrl = body.return_url || `${siteUrl}/Settings`

    // Get customer ID from metadata, fallback to Stripe lookup by email
    let customerId: string | null = user.user_metadata?.stripe_customer_id || null
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 })
      if (customers.data.length === 0) {
        return new Response(JSON.stringify({ error: 'Aucun abonnement Stripe trouvé pour ce compte.' }), { status: 404, headers: corsHeaders })
      }
      customerId = customers.data[0].id
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('create-portal-session error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
