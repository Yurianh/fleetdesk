import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Email d'activation — le miroir de `deadline-digest`.
//
//   deadline-digest  : une échéance approche, on prévient.
//   activation-digest: aucune échéance ne peut être détectée, parce que la
//                      donnée qui la porte n'a jamais été saisie.
//
// Le compte concerné a déjà fait le plus dur — il a créé ses véhicules. Il lui
// manque une date pour que le produit se mette à travailler. Le message part de
// là, pas d'une liste de champs vides.
//
// Déclenchée par le cron Vercel (/api/activation-digest), protégée par CRON_SECRET.

const RESEND_API_KEY = (Deno.env.get('RESEND_API_KEY') || '').trim()
const FROM = Deno.env.get('CONTACT_FROM') || 'FleetDesk <contact@fleetdesk.fr>'
const APP_URL = Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr'
const CRON_SECRET = (Deno.env.get('CRON_SECRET') || '').trim()

const COOLDOWN_DAYS = 7    // jamais deux emails d'activation en moins d'une semaine
const REMINDER_DAYS = 21   // si rien n'a bougé, on relance au bout de trois semaines
const MAX_SENDS = 3        // au-delà, insister devient du harcèlement

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type Gaps = {
  total: number
  missingCt: number
  missingMaintenance: number
  missingDocDates: number
  docsStarted: boolean
  reason: 'ct' | 'maintenance' | null
}

async function analyse(admin: any, orgId: string): Promise<Gaps> {
  const [vehicles, inspections, schedules, documents] = await Promise.all([
    admin.from('vehicles').select('id').eq('user_id', orgId),
    admin.from('technical_inspections').select('vehicle_id, expiration_date').eq('user_id', orgId),
    admin.from('maintenance_schedules').select('vehicle_id, interval_months, interval_km').eq('user_id', orgId),
    admin.from('driver_documents').select('id, expiry_date').eq('org_id', orgId),
  ])

  const vehicleIds = (vehicles.data ?? []).map((v: any) => v.id)
  const total = vehicleIds.length

  // Un véhicule est « couvert » dès qu'il porte une échéance de contrôle datée.
  const withCt = new Set(
    (inspections.data ?? []).filter((i: any) => i.expiration_date).map((i: any) => i.vehicle_id),
  )
  // Idem pour l'entretien : un intervalle, en mois ou en kilomètres, suffit.
  const withSchedule = new Set(
    (schedules.data ?? [])
      .filter((s: any) => s.interval_months || s.interval_km)
      .map((s: any) => s.vehicle_id),
  )

  const missingCt = vehicleIds.filter((id: string) => !withCt.has(id)).length
  const missingMaintenance = vehicleIds.filter((id: string) => !withSchedule.has(id)).length

  // Les documents conducteur ne déclenchent jamais l'email à eux seuls : tant que
  // la fonctionnalité n'est pas réellement utilisée, en parler serait vendre un
  // module, pas réparer un manque.
  const docs = documents.data ?? []
  const docsStarted = docs.length > 0
  const missingDocDates = docsStarted ? docs.filter((d: any) => !d.expiry_date).length : 0

  let reason: Gaps['reason'] = null
  if (total > 0) {
    if (missingCt > 0) reason = 'ct'
    else if (missingMaintenance >= Math.ceil(total / 2)) reason = 'maintenance'
  }

  return { total, missingCt, missingMaintenance, missingDocDates, docsStarted, reason }
}

function renderEmail(gaps: Gaps, firstName: string, ctaUrl: string) {
  const BRAND = '#0066FF', INK = '#18181b', MUTE = '#71717a', LINE = '#e4e4e7', SOFT = '#f4f4f5'
  const { total, missingCt, missingMaintenance, missingDocDates, reason } = gaps

  const done = total - (reason === 'ct' ? missingCt : missingMaintenance)
  const plural = (n: number) => (n > 1 ? 's' : '')

  // Le bénéfice d'abord, la donnée manquante ensuite.
  const headline =
    reason === 'ct'
      ? `FleetDesk surveille ${done} de vos ${total} véhicule${plural(total)}`
      : `FleetDesk suit vos contrôles, pas encore vos entretiens`

  const body =
    reason === 'ct'
      ? `Vous avez ajouté <strong>${total} véhicule${plural(total)}</strong> à FleetDesk. Il en reste
         <strong>${missingCt}</strong> sans date de contrôle technique — et sans cette date, nous ne pouvons pas
         vous prévenir avant l'échéance. C'est la seule chose qui manque pour que la surveillance soit complète.`
      : `Vos contrôles techniques sont renseignés. En revanche, <strong>${missingMaintenance} véhicule${plural(missingMaintenance)}</strong>
         sur ${total} n'ont pas d'intervalle d'entretien : FleetDesk ne peut donc pas anticiper les vidanges et
         révisions, ni vous alerter avant la panne évitable.`

  const extra =
    missingDocDates > 0
      ? `<p style="margin:16px 0 0;font-size:13px;color:${MUTE};line-height:1.6">
           Au passage : ${missingDocDates} document${plural(missingDocDates)} conducteur${plural(missingDocDates)}
           n'${missingDocDates > 1 ? 'ont' : 'a'} pas de date d'expiration. Même principe — sans date, pas d'alerte.
         </p>`
      : ''

  const minutes = Math.max(1, Math.round((reason === 'ct' ? missingCt : missingMaintenance) * 0.5))

  return `<!doctype html><html><body style="margin:0;padding:0;background:${SOFT}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT};padding:32px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <tr><td style="background:${BRAND};padding:18px 28px"><span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-0.02em">FleetDesk</span></td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${INK};letter-spacing:-0.02em">Bonjour ${esc(firstName)},</h1>
          <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:${INK};line-height:1.5">${headline}</p>
          <p style="margin:0;font-size:14px;color:${MUTE};line-height:1.65">${body}</p>
          ${extra}
          <a href="${esc(ctaUrl)}" style="display:inline-block;margin-top:22px;background:${BRAND};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:10px">
            ${reason === 'ct' ? 'Compléter mes véhicules' : 'Définir mes entretiens'}
          </a>
          <p style="margin:14px 0 0;font-size:12px;color:${MUTE}">Environ ${minutes} minute${plural(minutes)}, et la surveillance tourne toute seule ensuite.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${LINE};background:#fafafa">
          <p style="margin:0;font-size:12px;color:${MUTE};line-height:1.5">
            Vous recevez cet email parce que votre flotte n'est pas encore entièrement surveillée.
            Pour ne plus le recevoir : <a href="${APP_URL}/Settings?section=notifications" style="color:${BRAND};text-decoration:none">Réglages › Notifications</a>.
          </p>
        </td></tr>
      </table>
    </td></tr></table></body></html>`
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error('[activation-digest] RESEND_API_KEY manquante')
    return false
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) {
    // Échec fournisseur : on ne journalise pas d'envoi, donc le compte reste
    // éligible et sera retenté au prochain passage.
    console.error('[activation-digest] envoi échoué', res.status, await res.text())
    return false
  }
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const secret = req.headers.get('x-cron-secret') || ''
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const payload = await req.json().catch(() => ({}))

  // Enregistrement d'un clic sur le bouton de l'email (relayé par /api/activation-click).
  if (payload?.event === 'click' && payload?.org_id) {
    await admin.from('digest_log').insert({
      org_id: payload.org_id,
      kind: 'activation_click',
      signature: String(payload.reason || 'ct'),
      item_count: 0,
      details: { reason: payload.reason || null },
    })
    return new Response(JSON.stringify({ ok: true, recorded: 'click' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const report = {
    scanned: 0, eligible: 0, sent: 0,
    skipped_empty_account: 0, skipped_complete: 0,
    skipped_cooldown: 0, skipped_exhausted: 0,
    skipped_no_email: 0, failed: 0,
  }

  try {
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (error || !data?.users?.length) break

      for (const user of data.users) {
        if (user.user_metadata?.org_id) continue          // collaborateur : le propriétaire reçoit
        if (user.user_metadata?.digest_opt_out === true) continue
        report.scanned++

        if (!user.email) {
          report.skipped_no_email++
          console.warn('[activation-digest] compte sans email', user.id)
          continue
        }

        const gaps = await analyse(admin, user.id)

        // Un compte sans véhicule relève de l'accueil, pas de l'activation.
        if (gaps.total === 0) { report.skipped_empty_account++; continue }
        if (!gaps.reason) { report.skipped_complete++; continue }

        report.eligible++

        const signature = `${gaps.reason}:${gaps.missingCt}/${gaps.total}:${gaps.missingMaintenance}:${gaps.missingDocDates}`

        const { data: history } = await admin
          .from('digest_log').select('sent_at, signature')
          .eq('org_id', user.id).eq('kind', 'activation')
          .order('sent_at', { ascending: false }).limit(MAX_SENDS)

        const last = history?.[0]
        if (last) {
          const days = (Date.now() - new Date(last.sent_at).getTime()) / 86_400_000
          const unchanged = last.signature === signature

          if (days < COOLDOWN_DAYS) { report.skipped_cooldown++; continue }
          // Rien n'a bougé depuis la dernière relance : on espace, puis on cesse.
          if (unchanged && days < REMINDER_DAYS) { report.skipped_cooldown++; continue }
          if (unchanged && (history?.length ?? 0) >= MAX_SENDS) { report.skipped_exhausted++; continue }
        }

        const firstName = (user.user_metadata?.full_name || user.email.split('@')[0] || '').split(' ')[0]
        const subject =
          gaps.reason === 'ct'
            ? `FleetDesk ne peut pas encore vous prévenir pour ${gaps.missingCt} véhicule${gaps.missingCt > 1 ? 's' : ''}`
            : `${gaps.missingMaintenance} véhicule${gaps.missingMaintenance > 1 ? 's' : ''} sans suivi d'entretien`

        // Le lien passe par /api/activation-click : redirection immédiate vers la
        // bonne page, et un clic mesurable au passage.
        const ctaUrl = `${APP_URL}/api/activation-click?o=${user.id}&r=${gaps.reason}`

        const ok = await sendEmail(user.email, subject, renderEmail(gaps, firstName, ctaUrl))
        if (!ok) { report.failed++; continue }

        await admin.from('digest_log').insert({
          org_id: user.id,
          kind: 'activation',
          signature,
          item_count: gaps.reason === 'ct' ? gaps.missingCt : gaps.missingMaintenance,
          urgent: false,
          details: {
            reason: gaps.reason,
            total_vehicles: gaps.total,
            missing_ct: gaps.missingCt,
            missing_maintenance: gaps.missingMaintenance,
            missing_doc_dates: gaps.missingDocDates,
          },
        })
        report.sent++
      }

      if (data.users.length < 200) break
    }

    console.log('[activation-digest]', JSON.stringify(report))
    return new Response(JSON.stringify({ ok: true, ...report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[activation-digest] erreur', err?.message)
    return new Response(JSON.stringify({ ok: false, error: 'Une erreur est survenue.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
