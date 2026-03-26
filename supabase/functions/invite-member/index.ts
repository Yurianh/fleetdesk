import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, role = 'member' } = await req.json()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: corsHeaders })

    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    if (user.user_metadata?.org_id) {
      return new Response(JSON.stringify({ error: 'Seuls les propriétaires peuvent inviter des membres.' }), { status: 403, headers: corsHeaders })
    }

    const orgId = user.id
    const orgOwnerName = user.user_metadata?.full_name || user.email || 'votre organisation'
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Check for existing invite
    const { data: existing } = await supabaseAdmin
      .from('org_members')
      .select('id, status')
      .eq('org_id', orgId)
      .eq('email', email)
      .maybeSingle()
    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Cet email est déjà membre de votre organisation.' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Insert pending member record first
    const { error: insertErr } = await supabaseAdmin
      .from('org_members')
      .insert({ org_id: orgId, email, role, status: 'pending' })
    if (insertErr) throw insertErr

    const siteUrl = Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr'
    const orgCompany = user.user_metadata?.company || ''
    const inviteMeta = { org_id: orgId, role, org_owner_name: orgOwnerName, org_company: orgCompany }

    // Try to send invite email
    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: inviteMeta,
      redirectTo: `${siteUrl}/join`,
    })

    if (inviteErr) {
      // User already has an account — look them up and activate directly (no email sent)
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const existingUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

      if (existingUser) {
        await supabaseAdmin
          .from('org_members')
          .update({ user_id: existingUser.id, status: 'active', joined_at: new Date().toISOString() })
          .eq('org_id', orgId)
          .eq('email', email)

        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: { ...existingUser.user_metadata, ...inviteMeta },
        })
      } else {
        // Unexpected error — roll back the org_members insert and throw
        await supabaseAdmin.from('org_members').delete().eq('org_id', orgId).eq('email', email)
        throw inviteErr
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('invite-member error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
