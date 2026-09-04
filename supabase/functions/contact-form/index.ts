// Contact form relay — receives the marketing site's contact submission and
// sends it via Resend from a real @fleetdesk.fr address to the internal inbox.
// The visitor's address goes into reply_to, so replying answers them directly.

const RESEND_API_KEY = (Deno.env.get('RESEND_API_KEY') || '').trim()
// Verified sender on the fleetdesk.fr domain in Resend.
const FROM = Deno.env.get('CONTACT_FROM') || 'FleetDesk <contact@fleetdesk.fr>'
// Where submissions land (personal / internal inbox).
const INBOX = Deno.env.get('CONTACT_INBOX') || ''

// Only accept the marketing origins.
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

// Escape user input before dropping it into the HTML body.
function esc(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
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

    // Validate + bound the inputs.
    const n = String(name ?? '').trim().slice(0, 120)
    const e = String(email ?? '').trim().slice(0, 200)
    const c = String(company ?? '').trim().slice(0, 160)
    const m = String(message ?? '').trim().slice(0, 5000)

    if (!n || !m || !isEmail(e)) {
      return new Response(JSON.stringify({ error: 'Champs invalides' }), { status: 400, headers })
    }

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;color:#18181b;line-height:1.6">
        <h2 style="margin:0 0 16px;font-size:16px">Nouveau message — formulaire de contact</h2>
        <p style="margin:0 0 4px"><strong>Nom :</strong> ${esc(n)}</p>
        <p style="margin:0 0 4px"><strong>Email :</strong> ${esc(e)}</p>
        ${c ? `<p style="margin:0 0 4px"><strong>Entreprise :</strong> ${esc(c)}</p>` : ''}
        <p style="margin:16px 0 4px"><strong>Message :</strong></p>
        <p style="margin:0;white-space:pre-wrap;padding:12px;background:#f4f4f5;border-radius:8px">${esc(m)}</p>
      </div>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [INBOX],
        reply_to: e,
        subject: `Nouveau message FleetDesk de ${n}`,
        html,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('[contact-form] resend error:', res.status, detail)
      return new Response(JSON.stringify({ error: 'Envoi impossible' }), { status: 502, headers })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[contact-form] error:', err?.message)
    return new Response(JSON.stringify({ error: 'Une erreur est survenue' }), { status: 500, headers })
  }
})
