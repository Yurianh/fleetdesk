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

    // Only org owners can invite (collaborators have org_id in metadata)
    if (user.user_metadata?.org_id) {
      return new Response(JSON.stringify({ error: 'Seuls les propriétaires peuvent inviter des membres.' }), { status: 403, headers: corsHeaders })
    }

    const orgId = user.id
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Check for existing invite
    const { data: existing } = await supabaseAdmin.from('org_members').select('id, status').eq('org_id', orgId).eq('email', email).maybeSingle()
    if (existing) return new Response(JSON.stringify({ error: 'Cet email est déjà membre de votre organisation.' }), { status: 400, headers: corsHeaders })

    // Insert pending member
    const { error: insertErr } = await supabaseAdmin.from('org_members').insert({ org_id: orgId, email, role, status: 'pending' })
    if (insertErr) throw insertErr

    // Try to invite — if user already exists, activate directly
    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { org_id: orgId, role },
      redirectTo: `${Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr'}/Dashboard`,
    })

    if (inviteErr) {
      if (inviteErr.message?.toLowerCase().includes('already registered')) {
        // Find existing user and activate immediately
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const existingUser = users.find((u: any) => u.email === email)
        if (existingUser) {
          await supabaseAdmin.from('org_members').update({ user_id: existingUser.id, status: 'active', joined_at: new Date().toISOString() }).eq('org_id', orgId).eq('email', email)
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            user_metadata: { ...existingUser.user_metadata, org_id: orgId, role },
          })
        }
      } else {
        throw inviteErr
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('invite-member error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
