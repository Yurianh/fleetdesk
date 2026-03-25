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

    // Retrieve and verify session directly from Stripe — the session_id is the security token
    const session = await stripe.checkout.sessions.retrieve(session_id)
    console.log('[confirm-payment] status:', session.status, 'payment_status:', session.payment_status, 'metadata:', session.metadata)

    if (session.status !== 'complete') {
      return new Response(JSON.stringify({ error: `Paiement non finalisé (status: ${session.status})` }), { status: 402, headers: corsHeaders })
    }

    const { user_id, plan } = session.metadata ?? {}
    if (!user_id || !plan) {
      return new Response(JSON.stringify({ error: 'Métadonnées manquantes dans la session Stripe' }), { status: 400, headers: corsHeaders })
    }

    // Update user — merge so we don't wipe full_name, company, etc.
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: { user: existing }, error: fetchErr } = await supabaseAdmin.auth.admin.getUserById(user_id)
    if (fetchErr || !existing) {
      console.error('[confirm-payment] user not found:', user_id, fetchErr?.message)
      return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), { status: 404, headers: corsHeaders })
    }

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      user_metadata: { ...existing.user_metadata, plan, onboarding_complete: true },
    })
    if (updateErr) throw updateErr

    console.log('[confirm-payment] activated user:', user_id, 'plan:', plan)
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
