import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { member_user_id, driver_id, vehicle_ids } = await req.json()
    if (!member_user_id) {
      return new Response(JSON.stringify({ error: 'member_user_id requis' }), { status: 400, headers: corsHeaders })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })
    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Authorise: owner (no org_id) or an active admin. Role from org_members.
    const callerOrgId = user.user_metadata?.org_id
    let orgId = user.id
    if (callerOrgId) {
      const { data: caller } = await supabaseAdmin.from('org_members')
        .select('role, status').eq('user_id', user.id).eq('org_id', callerOrgId).maybeSingle()
      if (!caller || caller.status !== 'active' || caller.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Seuls le proprietaire et les admins peuvent modifier les véhicules.' }), { status: 403, headers: corsHeaders })
      }
      orgId = callerOrgId
    }

    // Plan gate — chauffeur accounts are Enterprise-only. Read the plan from the
    // owner's app_metadata (service-role written, not spoofable).
    const { data: ownerData } = await supabaseAdmin.auth.admin.getUserById(orgId)
    const ownerPlan = ownerData?.user?.app_metadata?.plan ?? 'starter'
    if (ownerPlan !== 'enterprise') {
      return new Response(JSON.stringify({
        error: 'La gestion des chauffeurs est réservée à la formule Enterprise.',
        code: 'plan_required',
        required_plan: 'enterprise',
      }), { status: 403, headers: corsHeaders })
    }

    // Target must be a chauffeur of this org.
    const { data: member } = await supabaseAdmin.from('org_members')
      .select('id, vehicle_ids, role, org_id').eq('user_id', member_user_id).eq('org_id', orgId).maybeSingle()
    if (!member) return new Response(JSON.stringify({ error: 'Chauffeur introuvable.' }), { status: 404, headers: corsHeaders })
    if (member.role !== 'driver') return new Response(JSON.stringify({ error: 'Ce membre n\'est pas un chauffeur.' }), { status: 400, headers: corsHeaders })

    // Validate the vehicles belong to the org, dedupe, cap at two.
    const requested: string[] = [...new Set((Array.isArray(vehicle_ids) ? vehicle_ids : []).filter(Boolean))].slice(0, 2)
    let newIds: string[] = []
    if (requested.length) {
      const { data: orgVehicles } = await supabaseAdmin.from('vehicles').select('id').eq('user_id', orgId).in('id', requested)
      const valid = new Set((orgVehicles || []).map((v: any) => v.id))
      newIds = requested.filter(id => valid.has(id))
    }
    if (newIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Sélectionnez au moins un véhicule valide.' }), { status: 400, headers: corsHeaders })
    }

    const oldIds: string[] = member.vehicle_ids || []

    // Update the trusted source + the chauffeur's metadata.
    const { error: upErr } = await supabaseAdmin.from('org_members')
      .update({ vehicle_id: newIds[0], vehicle_ids: newIds }).eq('id', member.id)
    if (upErr) throw upErr

    const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(member_user_id)
    if (targetUser) {
      await supabaseAdmin.auth.admin.updateUserById(member_user_id, {
        user_metadata: { ...targetUser.user_metadata, vehicle_id: newIds[0], vehicle_ids: newIds },
      })
    }

    // Sync assignments for the conducteur record (best-effort).
    if (driver_id) {
      try {
        const nowTs = new Date().toISOString()
        // Newly added vehicles: assign the conducteur (close any other active first).
        for (const vId of newIds.filter(id => !oldIds.includes(id))) {
          await supabaseAdmin.from('assignments').update({ ended_at: nowTs })
            .eq('user_id', orgId).eq('vehicle_id', vId).is('ended_at', null)
          await supabaseAdmin.from('assignments')
            .insert({ user_id: orgId, vehicle_id: vId, driver_id, assigned_at: nowTs })
        }
        // Removed vehicles: close this conducteur's active assignment.
        for (const vId of oldIds.filter(id => !newIds.includes(id))) {
          await supabaseAdmin.from('assignments').update({ ended_at: nowTs })
            .eq('user_id', orgId).eq('vehicle_id', vId).eq('driver_id', driver_id).is('ended_at', null)
        }
      } catch (e) {
        console.error('assignment sync failed:', (e as Error).message)
      }
    }

    return new Response(JSON.stringify({ success: true, vehicle_ids: newIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('set-driver-vehicles error:', err.message)
    return new Response(JSON.stringify({ error: 'Une erreur est survenue.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
