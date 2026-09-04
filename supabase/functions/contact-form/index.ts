// Contact form relay. On submit it sends TWO emails through Resend from the
// verified fleetdesk.fr domain:
//   1. internal notification -> CONTACT_INBOX (reply_to = visitor)
//   2. acknowledgement -> the visitor, so they know it went through
// CORS is restricted to the marketing origins, inputs are validated/bounded,
// and all user content is HTML-escaped before templating.

const RESEND_API_KEY = (Deno.env.get('RESEND_API_KEY') || '').trim()
const FROM = Deno.env.get('CONTACT_FROM') || 'FleetDesk <contact@fleetdesk.fr>'
const INBOX = Deno.env.get('CONTACT_INBOX') || ''
const SITE = 'https://fleetdesk.fr'

const ALLOWED = new Set([
  'https://fleetdesk.fr',
  'https://www.fleetdesk.fr',
])

function cors(origin: string | null) {
  const allow = origin && ALLOWED.has(origin) ? origin : 'https://fleetdesk.fr'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function esc(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

const BRAND = '#0066FF'
const INK = '#18181b'
const MUTE = '#71717a'
const LINE = '#e4e4e7'
const SOFT = '#f4f4f5'

// Shell shared by both emails: centered card, brand wordmark header, footer.
function shell(inner: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
        <tr><td style="background:${BRAND};padding:18px 28px">
          <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.02em">FleetDesk</span>
        </td></tr>
        <tr><td style="padding:28px">${inner}</td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${LINE};background:#fafafa">
          <p style="margin:0;font-size:12px;color:${MUTE};line-height:1.5">
            FleetDesk — gestion de flotte simplifiée.<br>
            <a href="${SITE}" style="color:${BRAND};text-decoration:none">fleetdesk.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`
}

// Internal notification — what lands in the team inbox.
function internalEmail(n: string, e: string, c: string, m: string) {
  const row = (label: string, val: string) =>
    `<tr>
       <td style="padding:6px 0;font-size:13px;color:${MUTE};width:96px;vertical-align:top">${label}</td>
       <td style="padding:6px 0;font-size:14px;color:${INK}">${val}</td>
     </tr>`
  return shell(`
    <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:${BRAND}">Formulaire de contact</p>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:${INK};letter-spacing:-0.02em">Nouveau message reçu</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${row('Nom', esc(n))}
      ${row('Email', `<a href="mailto:${esc(e)}" style="color:${BRAND};text-decoration:none">${esc(e)}</a>`)}
      ${c ? row('Entreprise', esc(c)) : ''}
    </table>
    <p style="margin:20px 0 8px;font-size:13px;color:${MUTE}">Message</p>
    <div style="font-size:14px;color:${INK};line-height:1.6;white-space:pre-wrap;padding:14px 16px;background:${SOFT};border-radius:10px">${esc(m)}</div>
  `)
}

// Acknowledgement — what the visitor receives.
function ackEmail(n: string, m: string) {
  const first = esc(n.split(' ')[0] || n)
  return shell(`
    <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:${INK};letter-spacing:-0.02em">Merci ${first}, message bien reçu.</h1>
    <p style="margin:0 0 16px;font-size:14px;color:${INK};line-height:1.65">
      Nous avons bien reçu votre demande. Notre équipe revient vers vous sous <strong>24h ouvrées</strong>.
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:${MUTE}">Votre message</p>
    <div style="font-size:14px;color:${INK};line-height:1.6;white-space:pre-wrap;padding:14px 16px;background:${SOFT};border-radius:10px">${esc(m)}</div>
    <p style="margin:20px 0 0;font-size:14px;color:${INK};line-height:1.65">
      À très vite,<br><strong>L'équipe FleetDesk</strong>
    </p>
  `)
}

async function sendMail(payload: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const detail = await res.text()
    console.error('[contact-form] resend error:', res.status, detail)
    return false
  }
  return true
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('Origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405, headers })
  }

  try {
    if (!RESEND_API_KEY || !INBOX) {
      console.error('[contact-form] missing RESEND_API_KEY or CONTACT_INBOX')
      return new Response(JSON.stringify({ error: 'Service indisponible' }), { status: 500, headers })
    }

    const { name, email, company, message } = await req.json()
    const n = String(name ?? '').trim().slice(0, 120)
    const e = String(email ?? '').trim().slice(0, 200)
    const c = String(company ?? '').trim().slice(0, 160)
    const m = String(message ?? '').trim().slice(0, 5000)

    if (!n || !m || !isEmail(e)) {
      return new Response(JSON.stringify({ error: 'Champs invalides' }), { status: 400, headers })
    }

    // The internal notification must succeed — that's the actual delivery.
    const okInternal = await sendMail({
      from: FROM,
      to: [INBOX],
      reply_to: e,
      subject: `Nouveau message FleetDesk de ${n}`,
      html: internalEmail(n, e, c, m),
    })
    if (!okInternal) {
      return new Response(JSON.stringify({ error: 'Envoi impossible' }), { status: 502, headers })
    }

    // Acknowledgement is best-effort — never fail the request if it bounces.
    await sendMail({
      from: FROM,
      to: [e],
      reply_to: INBOX,
      subject: 'Nous avons bien reçu votre message — FleetDesk',
      html: ackEmail(n, m),
    }).catch((err) => console.error('[contact-form] ack failed:', err?.message))

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[contact-form] error:', err?.message)
    return new Response(JSON.stringify({ error: 'Une erreur est survenue' }), { status: 500, headers })
  }
})
