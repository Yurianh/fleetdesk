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
    const { session_id } = await req.json()
    if (!session_id) {
      return new Response(JSON.stringify({ error: 'session_id requis' }), { status: 400, headers: corsHeaders })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)
    console.log('[confirm-payment] session status:', session.status, 'payment_status:', session.payment_status)

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ error: 'Paiement non confirmé' }), { status: 402, headers: corsHeaders })
    }

    const { user_id, plan } = session.metadata ?? {}
    console.log('[confirm-payment] user_id:', user_id, 'plan:', plan, 'caller:', user.id)

    if (!user_id || !plan) {
      return new Response(JSON.stringify({ error: 'Métadonnées manquantes dans la session Stripe' }), { status: 400, headers: corsHeaders })
    }

    // Security: session must belong to the calling user
    if (user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Session invalide' }), { status: 403, headers: corsHeaders })
    }

    // Update user — merge so we don't wipe full_name, company, etc.
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      user_metadata: { ...user.user_metadata, plan, onboarding_complete: true },
    })
    if (updateErr) throw updateErr

    console.log('[confirm-payment] user activated:', user_id, 'plan:', plan)
    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[confirm-payment] error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
