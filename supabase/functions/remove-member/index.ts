import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { memberId } = await req.json()
    if (!memberId) return new Response(JSON.stringify({ error: 'memberId requis' }), { status: 400, headers: corsHeaders })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Authorization header manquant' }), { status: 401, headers: corsHeaders })

    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Non autorise' }), { status: 401, headers: corsHeaders })
    if (user.user_metadata?.org_id) {
      return new Response(JSON.stringify({ error: 'Seul le proprietaire peut retirer des membres.' }), { status: 403, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Fetch member record
    const { data: member, error: fetchErr } = await supabaseAdmin
      .from('org_members')
      .select('id, user_id, org_id, email')
      .eq('id', memberId)
      .maybeSingle()

    if (fetchErr) throw fetchErr
    if (!member) return new Response(JSON.stringify({ error: 'Membre introuvable.' }), { status: 404, headers: corsHeaders })
    if (member.org_id !== user.id) return new Response(JSON.stringify({ error: 'Acces refuse.' }), { status: 403, headers: corsHeaders })

    // Delete from org_members
    const { error: deleteErr } = await supabaseAdmin
      .from('org_members')
      .delete()
      .eq('id', memberId)
    if (deleteErr) throw deleteErr

    // Delete the user account entirely from Supabase auth
    if (member.user_id) {
      const { error: deleteUserErr } = await supabaseAdmin.auth.admin.deleteUser(member.user_id)
      if (deleteUserErr) console.error('deleteUser error (non-fatal):', deleteUserErr.message)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('remove-member error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
