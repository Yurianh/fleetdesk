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

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Authorise the caller: the owner (no org_id) or an active admin of the org.
    // The caller's role comes from org_members (trusted), never user_metadata.
    const callerOrgId = user.user_metadata?.org_id
    let orgId = user.id
    let callerIsAdmin = false
    if (callerOrgId) {
      const { data: caller } = await supabaseAdmin
        .from('org_members').select('role, status')
        .eq('user_id', user.id).eq('org_id', callerOrgId).maybeSingle()
      if (!caller || caller.status !== 'active' || caller.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Seuls le proprietaire et les admins peuvent retirer des membres.' }), { status: 403, headers: corsHeaders })
      }
      callerIsAdmin = true
      orgId = callerOrgId
    }

    const { data: member, error: fetchErr } = await supabaseAdmin
      .from('org_members')
      .select('id, user_id, org_id, email, role')
      .eq('id', memberId)
      .maybeSingle()

    if (fetchErr) throw fetchErr
    if (!member) return new Response(JSON.stringify({ error: 'Membre introuvable.' }), { status: 404, headers: corsHeaders })
    if (member.org_id !== orgId) return new Response(JSON.stringify({ error: 'Acces refuse.' }), { status: 403, headers: corsHeaders })

    // Admin guardrails: an admin cannot remove another admin, nor themselves.
    if (callerIsAdmin) {
      if (member.user_id === user.id) {
        return new Response(JSON.stringify({ error: 'Vous ne pouvez pas vous retirer vous-meme.' }), { status: 403, headers: corsHeaders })
      }
      if (member.role === 'admin') {
        return new Response(JSON.stringify({ error: 'Un admin ne peut pas retirer un autre admin.' }), { status: 403, headers: corsHeaders })
      }
    }

    // Delete from org_members first
    const { error: deleteErr } = await supabaseAdmin
      .from('org_members')
      .delete()
      .eq('id', memberId)
    if (deleteErr) throw deleteErr

    // Delete the Supabase auth account
    // If user_id is set, delete directly. If null (never joined), find by email.
    try {
      let authUserId = member.user_id
      if (!authUserId) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const found = users.find((u: any) => u.email?.toLowerCase() === member.email?.toLowerCase())
        if (found) authUserId = found.id
      }
      if (authUserId) {
        const { error: deleteUserErr } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
        if (deleteUserErr) console.error('deleteUser error:', deleteUserErr.message)
      }
    } catch (e: any) {
      console.error('auth cleanup error (non-fatal):', e.message)
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
