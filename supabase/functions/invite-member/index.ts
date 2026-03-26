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
      return new Response(JSON.stringify({ error: 'Seuls les proprietaires peuvent inviter des membres.' }), { status: 403, headers: corsHeaders })
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
        JSON.stringify({ error: "Cet email est deja membre de votre organisation." }),
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

    // Try to send invite email (works for brand new Supabase users)
    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: inviteMeta,
      redirectTo: `${siteUrl}/join`,
    })

    if (inviteErr) {
      // User already has a Supabase account — send them a magic link to /join
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const existingUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

      if (existingUser) {
        // Update metadata so /join page recognises the re-invite
        const reInviteMeta = { ...inviteMeta, onboarding_complete: false, re_invited: true }
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: { ...existingUser.user_metadata, ...reInviteMeta },
        })

        // Keep as pending until they complete /join
        await supabaseAdmin
          .from('org_members')
          .update({ user_id: existingUser.id, status: 'pending' })
          .eq('org_id', orgId)
          .eq('email', email)

        // Send a magic link redirecting to /join
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: { data: reInviteMeta, redirectTo: `${siteUrl}/join` },
        })
        if (linkErr) console.error('generateLink error:', linkErr.message)

        return new Response(JSON.stringify({
          success: true,
          existing_user: true,
          join_link: linkData?.properties?.action_link ?? `${siteUrl}/join`,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } else {
        // Unexpected error — roll back and throw
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
