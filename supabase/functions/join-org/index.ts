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

    // Use service role to bypass RLS — reliable for all clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Derive the org from the caller's PENDING invite (trusted, service-role
    // written), NOT from user_metadata (user-editable → could claim any org).
    const { data: invite } = await supabaseAdmin
      .from('org_members')
      .select('org_id, role, vehicle_id, vehicle_ids')
      .eq('email', user.email)
      .eq('status', 'pending')
      .maybeSingle()

    if (!invite) {
      return new Response(JSON.stringify({ error: 'Aucune invitation en attente pour ce compte.' }), { status: 400, headers: corsHeaders })
    }
    const orgId = invite.org_id

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

    // Stamp org_id + the invite's trusted role/vehicle in user metadata so the
    // client fast-path is consistent. RLS still relies on org_members, not this.
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        org_id: orgId,
        role: invite.role,
        ...(invite.vehicle_id ? { vehicle_id: invite.vehicle_id } : {}),
        ...(invite.vehicle_ids ? { vehicle_ids: invite.vehicle_ids } : {}),
      },
    })

    // Link a chauffeur's account to their conducteur (drivers) record by email,
    // so RLS lets them complete their own profile. Best-effort.
    try {
      if (user.email) {
        await supabaseAdmin.from('drivers')
          .update({ member_user_id: user.id })
          .eq('user_id', orgId).ilike('email', user.email).is('member_user_id', null)
      }
    } catch (e) {
      console.error('driver link failed:', (e as Error).message)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('join-org error:', err.message)
    return new Response(JSON.stringify({ error: 'Une erreur est survenue.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
