import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { full_name } = await req.json()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header manquant' }), { status: 401, headers: corsHeaders })
    }

    // Identify the calling user
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Non autorise' }), { status: 401, headers: corsHeaders })
    }

    const orgId = user.user_metadata?.org_id
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'Aucune organisation associee a ce compte.' }), { status: 400, headers: corsHeaders })
    }

    // Use service role to bypass RLS — reliable for all clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: updateErr } = await supabaseAdmin
      .from('org_members')
      .update({
        status: 'active',
        user_id: user.id,
        full_name: full_name || '',
        joined_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('email', user.email)

    if (updateErr) throw updateErr

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('join-org error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
