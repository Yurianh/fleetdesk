import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Email d'échéances — le chaînon manquant du produit.
//
// Le centre d'alertes ne vit que dans le tableau de bord : un gestionnaire qui
// ne se connecte pas ne voit jamais qu'un contrôle technique arrive à terme,
// alors que c'est la promesse du produit. Cette fonction envoie ce que le
// tableau de bord affiche déjà, par email, une fois par semaine — et plus tôt
// si une échéance devient urgente.
//
// Déclenchée par le cron Vercel (/api/deadline-digest), protégée par CRON_SECRET.

const RESEND_API_KEY = (Deno.env.get('RESEND_API_KEY') || '').trim()
const FROM = Deno.env.get('CONTACT_FROM') || 'FleetDesk <contact@fleetdesk.fr>'
const APP_URL = Deno.env.get('SITE_URL') || 'https://app.fleetdesk.fr'
const CRON_SECRET = (Deno.env.get('CRON_SECRET') || '').trim()

const HORIZON_DAYS = 30   // au-delà, ce n'est pas encore une échéance
const URGENT_DAYS = 7     // en deçà, on n'attend pas le résumé hebdomadaire
const QUIET_DAYS = 7      // cadence de croisière : un email par semaine au plus
const WARN_KM = 5000      // seuil d'alerte entretien, aligné sur l'app

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

type Item = {
  kind: 'inspection' | 'document' | 'maintenance'
  label: string      // « Contrôle technique »
  subject: string    // « Renault Master · AB-123-CD »
  days: number | null
  km: number | null
  key: string        // identité stable, pour l'empreinte
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const daysUntil = (iso: string) => {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''))
  return Math.floor((d.getTime() - Date.now()) / 86_400_000)
}

const addMonths = (iso: string, months: number) => {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''))
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

// Libellés des documents conducteur — mêmes intitulés que dans l'application.
const DOC_LABELS: Record<string, string> = {
  permis: 'Permis de conduire',
  medical: 'Visite médicale',
  casier: 'Casier judiciaire',
  sst: 'Formation SST / PSC1',
  tpmr: 'Formation TPMR',
  eco: 'Éco-conduite',
  fimo: 'FIMO / FCO',
}

async function collectItems(admin: any, orgId: string): Promise<Item[]> {
  const [vehicles, drivers, inspections, documents, schedules, records, mileage] = await Promise.all([
    admin.from('vehicles').select('id, plate_number, model').eq('user_id', orgId),
    admin.from('drivers').select('id, name').eq('user_id', orgId),
    admin.from('technical_inspections').select('vehicle_id, expiration_date').eq('user_id', orgId),
    admin.from('driver_documents').select('driver_id, type, expiry_date').eq('org_id', orgId),
    admin.from('maintenance_schedules').select('id, vehicle_id, name, interval_months, interval_km').eq('user_id', orgId),
    admin.from('maintenance_records').select('vehicle_id, date, mileage').eq('user_id', orgId),
    admin.from('mileage_entries').select('vehicle_id, mileage, created_at').eq('user_id', orgId),
  ])

  const vehicleById = new Map((vehicles.data ?? []).map((v: any) => [v.id, v]))
  const driverById = new Map((drivers.data ?? []).map((d: any) => [d.id, d]))
  const vehicleLabel = (id: string) => {
    const v = vehicleById.get(id)
    if (!v) return 'Véhicule'
    return [v.model, v.plate_number].filter(Boolean).join(' · ')
  }

  const items: Item[] = []

  // ── Contrôles techniques : seule la plus lointaine échéance d'un véhicule compte,
  // les contrôles passés restent en base.
  const latestByVehicle = new Map<string, string>()
  for (const ins of inspections.data ?? []) {
    if (!ins.expiration_date) continue
    const current = latestByVehicle.get(ins.vehicle_id)
    if (!current || ins.expiration_date > current) latestByVehicle.set(ins.vehicle_id, ins.expiration_date)
  }
  for (const [vehicleId, date] of latestByVehicle) {
    const d = daysUntil(date)
    if (d <= HORIZON_DAYS) {
      items.push({ kind: 'inspection', label: 'Contrôle technique', subject: vehicleLabel(vehicleId), days: d, km: null, key: `ct:${vehicleId}:${date}` })
    }
  }

  // ── Documents conducteur
  for (const doc of documents.data ?? []) {
    if (!doc.expiry_date) continue
    const d = daysUntil(doc.expiry_date)
    if (d <= HORIZON_DAYS) {
      const driver = driverById.get(doc.driver_id)
      items.push({
        kind: 'document',
        label: DOC_LABELS[doc.type] ?? doc.type ?? 'Document conducteur',
        subject: driver?.name ?? 'Conducteur',
        days: d, km: null,
        key: `doc:${doc.driver_id}:${doc.type}:${doc.expiry_date}`,
      })
    }
  }

  // ── Entretiens prévus : même calcul que src/lib/maintenanceForecast.js
  const lastRecordByVehicle = new Map<string, any>()
  for (const r of records.data ?? []) {
    const current = lastRecordByVehicle.get(r.vehicle_id)
    if (!current || r.date > current.date) lastRecordByVehicle.set(r.vehicle_id, r)
  }
  const currentKmByVehicle = new Map<string, number>()
  for (const e of mileage.data ?? []) {
    const current = currentKmByVehicle.get(e.vehicle_id)
    if (current === undefined || e.mileage > current) currentKmByVehicle.set(e.vehicle_id, e.mileage)
  }

  for (const sch of schedules.data ?? []) {
    const last = lastRecordByVehicle.get(sch.vehicle_id)
    if (!last) continue // jamais entretenu : rien à prévoir, l'app le signale déjà
    let days: number | null = null
    let km: number | null = null
    if (sch.interval_months) days = daysUntil(addMonths(last.date, sch.interval_months))
    if (sch.interval_km && last.mileage != null) {
      const currentKm = currentKmByVehicle.get(sch.vehicle_id)
      if (currentKm != null) km = last.mileage + sch.interval_km - currentKm
    }
    const dueByDate = days !== null && days <= HORIZON_DAYS
    const dueByKm = km !== null && km <= WARN_KM
    if (dueByDate || dueByKm) {
      items.push({
        kind: 'maintenance',
        label: sch.name || 'Entretien prévu',
        subject: vehicleLabel(sch.vehicle_id),
        days: dueByDate ? days : null,
        km: dueByKm ? km : null,
        key: `mnt:${sch.id}`,
      })
    }
  }

  // Le plus urgent d'abord : ce qui est dépassé, puis ce qui approche.
  return items.sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
}

function renderEmail(items: Item[], firstName: string) {
  const BRAND = '#0066FF', INK = '#18181b', MUTE = '#71717a', LINE = '#e4e4e7'
  const overdue = items.filter(i => i.days !== null && i.days < 0)
  const urgent = items.filter(i => i.days !== null && i.days >= 0 && i.days <= URGENT_DAYS)
  const later = items.filter(i => !overdue.includes(i) && !urgent.includes(i))

  const delay = (i: Item) => {
    if (i.days !== null && i.days < 0) return `en retard de ${Math.abs(i.days)} j`
    if (i.days !== null) return i.days === 0 ? "aujourd'hui" : `dans ${i.days} j`
    if (i.km !== null) return i.km <= 0 ? 'seuil dépassé' : `dans ${i.km.toLocaleString('fr-FR')} km`
    return ''
  }

  const row = (i: Item, accent: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${LINE}">
        <strong style="font-size:14px;color:${INK}">${esc(i.label)}</strong><br>
        <span style="font-size:13px;color:${MUTE}">${esc(i.subject)}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${LINE};text-align:right;white-space:nowrap">
        <span style="font-size:13px;font-weight:600;color:${accent}">${esc(delay(i))}</span>
      </td>
    </tr>`

  const section = (title: string, list: Item[], accent: string) =>
    list.length
      ? `<p style="margin:24px 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${MUTE}">${title}</p>
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${list.map(i => row(i, accent)).join('')}</table>`
      : ''

  const title = overdue.length
    ? `${overdue.length} échéance${overdue.length > 1 ? 's' : ''} dépassée${overdue.length > 1 ? 's' : ''}`
    : `${items.length} échéance${items.length > 1 ? 's' : ''} à venir`

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <tr><td style="background:${BRAND};padding:18px 28px"><span style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-0.02em">FleetDesk</span></td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 6px;font-size:19px;font-weight:700;color:${INK};letter-spacing:-0.02em">Bonjour ${esc(firstName)}, ${esc(title)}</h1>
          <p style="margin:0 0 4px;font-size:14px;color:${MUTE};line-height:1.6">Voici ce que votre flotte demande dans les ${HORIZON_DAYS} prochains jours.</p>
          ${section('Dépassé', overdue, '#b45309')}
          ${section(`Sous ${URGENT_DAYS} jours`, urgent, '#b45309')}
          ${section(`Sous ${HORIZON_DAYS} jours`, later, MUTE)}
          <a href="${APP_URL}/Dashboard" style="display:inline-block;margin-top:24px;background:${BRAND};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:11px 20px;border-radius:10px">Ouvrir le tableau de bord</a>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${LINE};background:#fafafa">
          <p style="margin:0;font-size:12px;color:${MUTE};line-height:1.5">
            Vous recevez cet email parce que des échéances approchent sur votre flotte.
            Pour ne plus le recevoir : <a href="${APP_URL}/Settings?section=notifications" style="color:${BRAND};text-decoration:none">Réglages › Notifications</a>.
          </p>
        </td></tr>
      </table>
    </td></tr></table></body></html>`
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error('[deadline-digest] RESEND_API_KEY manquante')
    return false
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
  if (!res.ok) {
    console.error('[deadline-digest] envoi échoué', res.status, await res.text())
    return false
  }
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Seul le cron entre ici.
  const secret = req.headers.get('x-cron-secret') || ''
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const report = { scanned: 0, sent: 0, skipped_quiet: 0, skipped_empty: 0, failed: 0 }

  try {
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (error || !data?.users?.length) break

      for (const user of data.users) {
        // Les collaborateurs reçoivent via le propriétaire : une seule adresse par flotte.
        if (user.user_metadata?.org_id) continue
        if (user.user_metadata?.digest_opt_out === true) continue
        if (!user.email) continue

        report.scanned++
        const items = await collectItems(admin, user.id)
        if (!items.length) { report.skipped_empty++; continue }

        const signature = items.map(i => i.key).sort().join('|')
        const urgent = items.some(i => i.days !== null && i.days <= URGENT_DAYS)

        const { data: last } = await admin
          .from('digest_log').select('sent_at, signature')
          .eq('org_id', user.id).order('sent_at', { ascending: false }).limit(1).maybeSingle()

        if (last) {
          const hoursSince = (Date.now() - new Date(last.sent_at).getTime()) / 3_600_000
          const unchanged = last.signature === signature
          // Cadence de croisière : une fois par semaine. On ne devance ce rythme
          // que si la liste a changé ET qu'une échéance est devenue urgente —
          // et jamais deux fois dans la même journée.
          const quiet = unchanged ? hoursSince < QUIET_DAYS * 24 : !(urgent && hoursSince >= 24)
          if (quiet) { report.skipped_quiet++; continue }
        }

        const firstName = (user.user_metadata?.full_name || user.email.split('@')[0] || '').split(' ')[0]
        const subject = items.some(i => i.days !== null && i.days < 0)
          ? 'Échéance dépassée sur votre flotte'
          : `${items.length} échéance${items.length > 1 ? 's' : ''} à venir sur votre flotte`

        const ok = await sendEmail(user.email, subject, renderEmail(items, firstName))
        if (!ok) { report.failed++; continue }

        await admin.from('digest_log').insert({ org_id: user.id, signature, item_count: items.length, urgent })
        report.sent++
      }

      if (data.users.length < 200) break
    }

    console.log('[deadline-digest]', JSON.stringify(report))
    return new Response(JSON.stringify({ ok: true, ...report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[deadline-digest] erreur', err?.message)
    return new Response(JSON.stringify({ ok: false, error: 'Une erreur est survenue.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
