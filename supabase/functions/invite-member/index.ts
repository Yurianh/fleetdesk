import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Find an auth user by email, paginating (no silent perPage:1000 cap).
async function findUserByEmail(admin: any, email: string) {
  const target = email.toLowerCase()
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) return null
    const u = data.users.find((x: any) => x.email?.toLowerCase() === target)
    if (u) return u
    if (data.users.length < 1000) return null
  }
  return null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { email, role = 'member', vehicleId = null } = body
    // A chauffeur can be assigned up to two vehicles. Accept an array, fall back
    // to the single vehicleId, dedupe and cap at two.
    const vehicleIds: string[] = [...new Set(
      (Array.isArray(body.vehicleIds) ? body.vehicleIds : [vehicleId]).filter(Boolean)
    )].slice(0, 2)

    // Only these roles may ever be assigned (never 'owner' or arbitrary strings).
    const ALLOWED_ROLES = ['member', 'driver', 'admin']
    if (!ALLOWED_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: 'Rôle invalide.' }), { status: 400, headers: corsHeaders })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth' }), { status: 401, headers: corsHeaders })

    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Resolve the org + authorise the caller. The owner (no org_id) manages their
    // own org. An admin collaborator may also invite, but NOT another admin
    // (prevents privilege escalation). The caller's role is read from org_members
    // (service-role written), never from user_metadata, which the user can edit.
    const callerOrgId = user.user_metadata?.org_id
    let orgId: string
    if (callerOrgId) {
      const { data: caller } = await supabaseAdmin
        .from('org_members').select('role, status')
        .eq('user_id', user.id).eq('org_id', callerOrgId).maybeSingle()
      if (!caller || caller.status !== 'active' || caller.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Seuls le proprietaire et les admins peuvent inviter des membres.' }), { status: 403, headers: corsHeaders })
      }
      if (role === 'admin') {
        return new Response(JSON.stringify({ error: "Un admin ne peut pas inviter un autre admin. Demandez au proprietaire." }), { status: 403, headers: corsHeaders })
      }
      orgId = callerOrgId
    } else {
      orgId = user.id
    }

    // The org identity (owner) drives the invite email context, whoever invites.
    const { data: ownerData } = await supabaseAdmin.auth.admin.getUserById(orgId)
    const orgOwnerName = ownerData?.user?.user_metadata?.full_name || ownerData?.user?.email || 'votre organisation'

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

    // Insert pending member record first. Store the driver's vehicle here
    // (service-role only) — this is the trusted source for RLS, not the
    // user-editable user_metadata.
    const driverVehicles = role === 'driver' ? vehicleIds : []
    const { error: insertErr } = await supabaseAdmin
      .from('org_members')
      .insert({ org_id: orgId, email, role, status: 'pending',
        ...(driverVehicles.length ? { vehicle_id: driverVehicles[0], vehicle_ids: driverVehicles } : {}) })
    if (insertErr) throw insertErr

    // Every invited collaborator (chauffeur, admin, membre) is also a conducteur:
    // ensure a drivers record exists (reuse by email, else create a pending one)
    // so they show up in the fleet and can complete their own profile on first
    // login. A chauffeur is additionally assigned to their vehicle; admin/membre
    // have no vehicle at invite. Best-effort: never block the invitation if this
    // fails.
    if (role === 'driver' || role === 'admin' || role === 'member') {
      try {
        let driverId: string | null = null
        const { data: existingDriver } = await supabaseAdmin
          .from('drivers').select('id').eq('user_id', orgId).ilike('email', email).maybeSingle()
        if (existingDriver) {
          driverId = existingDriver.id
        } else {
          const { data: newDriver, error: dErr } = await supabaseAdmin
            .from('drivers')
            .insert({ user_id: orgId, email, name: email.split('@')[0], pending: true })
            .select('id').single()
          if (dErr) throw dErr
          driverId = newDriver.id
        }
        // Auto-assign to each vehicle — chauffeur only (admins have no vehicle).
        if (role === 'driver' && driverVehicles.length) {
          const nowTs = new Date().toISOString()
          for (const vId of driverVehicles) {
            await supabaseAdmin.from('assignments').update({ ended_at: nowTs })
              .eq('user_id', orgId).eq('vehicle_id', vId).is('ended_at', null)
            await supabaseAdmin.from('assignments')
              .insert({ user_id: orgId, vehicle_id: vId, driver_id: driverId, assigned_at: nowTs })
          }
        }
      } catch (e) {
        console.error('conductor/assignment setup failed:', (e as Error).message)
      }
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr'
    const orgCompany = ownerData?.user?.user_metadata?.company || ''
    // For a driver ("chauffeur"), stamp the vehicle their account is tied to so
    // the app can pre-select and lock it in the mileage/wash forms.
    const inviteMeta = { org_id: orgId, role, org_owner_name: orgOwnerName, org_company: orgCompany,
      ...(driverVehicles.length ? { vehicle_id: driverVehicles[0], vehicle_ids: driverVehicles } : {}) }

    // Try to send invite email (works for brand new Supabase users)
    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: inviteMeta,
      redirectTo: `${siteUrl}/join`,
    })

    if (inviteErr) {
      // User already has a Supabase account — send them a magic link to /join
      const existingUser = await findUserByEmail(supabaseAdmin, email)

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
    return new Response(JSON.stringify({ error: 'Une erreur est survenue lors de l\'invitation.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
