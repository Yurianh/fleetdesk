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

const RESEND_API_KEY = (Deno.env.get('RESEND_API_KEY') || '').trim()
const INVITE_FROM = Deno.env.get('CONTACT_FROM') || 'FleetDesk <contact@fleetdesk.fr>'

function esc(v: unknown) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Re-invitation d'un compte qui existe déjà chez Supabase.
// `generateLink` ne fait que FABRIQUER le lien : il n'envoie aucun e-mail. Sans
// cet envoi, l'invité ne reçoit jamais rien alors que l'app annonce un succès.
async function sendJoinEmail(to: string, link: string, orgName: string, role: string) {
  if (!RESEND_API_KEY || !to || !link) return false
  const BRAND = '#0066FF', INK = '#18181b', MUTE = '#71717a', LINE = '#e4e4e7'
  const roleLabel = role === 'driver' ? 'chauffeur' : role === 'admin' ? 'administrateur' : 'membre'
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <tr><td style="background:${BRAND};padding:18px 28px"><span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-0.02em">FleetDesk</span></td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${INK};letter-spacing:-0.02em">Vous êtes invité${role === 'driver' ? '' : '(e)'} à rejoindre ${esc(orgName)}</h1>
          <p style="margin:0 0 20px;font-size:14px;color:${INK};line-height:1.65">Votre compte FleetDesk existe déjà. Ce lien vous connecte et vous rattache à l'organisation en tant que <strong>${roleLabel}</strong>.</p>
          <a href="${esc(link)}" style="display:inline-block;background:${BRAND};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:10px">Rejoindre l'organisation</a>
          <p style="margin:20px 0 0;font-size:12px;color:${MUTE};line-height:1.6">Lien valable 24 heures. Si le bouton ne fonctionne pas, copiez cette adresse :<br><span style="word-break:break-all;color:${MUTE}">${esc(link)}</span></p>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${LINE};background:#fafafa">
          <p style="margin:0;font-size:12px;color:${MUTE};line-height:1.5">Vous ne vous attendiez pas à cette invitation ? Ignorez cet e-mail.<br><a href="https://fleetdesk.fr" style="color:${BRAND};text-decoration:none">fleetdesk.fr</a></p>
        </td></tr>
      </table>
    </td></tr></table></body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: INVITE_FROM, to: [to], subject: `Rejoignez ${orgName} sur FleetDesk`, html }),
  })
  if (!res.ok) {
    console.error('[invite-member] join email failed:', res.status, await res.text())
    return false
  }
  return true
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

    // Plan gate — inviting team members and chauffeurs is Enterprise-only. Read
    // the plan from app_metadata (service-role written, not user-editable), never
    // from user_metadata which the owner could spoof to unlock invites for free.
    const ownerPlan = ownerData?.user?.app_metadata?.plan ?? 'starter'
    if (ownerPlan !== 'enterprise') {
      return new Response(JSON.stringify({
        error: "Les invitations d'équipe et de chauffeurs sont réservées à la formule Enterprise.",
        code: 'plan_required',
        required_plan: 'enterprise',
      }), { status: 403, headers: corsHeaders })
    }

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
        // Garde-fou : réinviter écrase org_id/role dans les métadonnées du compte.
        // Sur un compte qui possède déjà sa propre flotte, ou qui appartient à une
        // autre organisation, cela le basculerait silencieusement ici et lui ferait
        // perdre l'accès à ses données. On refuse plutôt que de convertir.
        const existingOrgId = existingUser.user_metadata?.org_id
        if (existingOrgId && existingOrgId !== orgId) {
          await supabaseAdmin.from('org_members').delete().eq('org_id', orgId).eq('email', email)
          return new Response(JSON.stringify({
            error: "Cette adresse appartient déjà à une autre organisation FleetDesk. La personne doit d'abord la quitter.",
          }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        if (!existingOrgId) {
          const { count } = await supabaseAdmin
            .from('vehicles').select('id', { count: 'exact', head: true }).eq('user_id', existingUser.id)
          const ownsFleet = (count ?? 0) > 0 || !!existingUser.app_metadata?.plan
          if (ownsFleet) {
            await supabaseAdmin.from('org_members').delete().eq('org_id', orgId).eq('email', email)
            return new Response(JSON.stringify({
              error: "Cette adresse est déjà un compte FleetDesk avec sa propre flotte. Utilisez une autre adresse pour ce collaborateur.",
            }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }
        }

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

        // generateLink ne notifie personne : c'est nous qui envoyons le lien.
        const joinLink = linkData?.properties?.action_link ?? null
        const emailSent = joinLink ? await sendJoinEmail(email, joinLink, orgCompany || orgOwnerName, role) : false

        return new Response(JSON.stringify({
          success: true,
          existing_user: true,
          email_sent: emailSent,
          // Filet de sécurité : si l'e-mail n'est pas parti, l'admin peut
          // transmettre le lien lui-même plutôt que de croire l'invitation faite.
          join_link: joinLink,
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
