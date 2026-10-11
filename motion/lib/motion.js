// Bibliothèque commune des vidéos FleetDesk. Tout est fonction pure du temps :
// une scène expose seek(t), qui dessine n'importe quel instant sans état.

// ─── Ressorts calculés ────────────────────────────────────────────────────
// Figés à 1 une fois l'enveloppe négligeable : la dernière image d'une boucle
// redevient identique à la première au pixel près.
export const SPRING = {
  snappy:  { period: 0.34, zeta: 0.78 },
  default: { period: 0.55, zeta: 0.86 },
  heavy:   { period: 0.80, zeta: 1.0 },
}
export function spring(t, cfg = SPRING.default) {
  if (t <= 0) return 0
  const w = 2 * Math.PI / cfg.period, z = cfg.zeta
  if (z >= 1) { const e = Math.exp(-w * t) * (1 + w * t); return e < 1e-5 ? 1 : 1 - e }
  if (Math.exp(-z * w * t) < 1e-5) return 1
  const wd = w * Math.sqrt(1 - z * z)
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t))
}
// Valeur qui change de cible plusieurs fois : un ressort par changement.
export function track(t, start, steps, cfg = SPRING.default) {
  let v = start, prev = start
  for (const [at, target, c] of steps) { v += (target - prev) * spring(t - at, c || cfg); prev = target }
  return v
}

export const lerp = (a, b, k) => a + (b - a) * k
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
export const mixc = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')})` }
export const fade = (t, t0, d = 0.25) => clamp((t - t0) / d)
export const $ = id => document.getElementById(id)

// ─── Palette FleetDesk ────────────────────────────────────────────────────
export const OK   = { bg: '#ECFDF5', fg: '#047857', bd: '#A7F3D0', dot: '#10B981' }
export const WARN = { bg: '#FFFBEB', fg: '#B45309', bd: '#FDE68A', dot: '#F59E0B' }
export const NEUTRAL = { bg: '#F4F4F5', fg: '#52525B', bd: '#E4E4E7', dot: '#A1A1AA' }
export const BLUE = '#0066FF', BLUE_SOFT = '#E5EEFF', BLUE_INK = '#0052D6'

// Couleur d'un état entre deux palettes.
export function paint(el, from, to, k, { text = true, border = true } = {}) {
  el.style.background = mixc(from.bg, to.bg, k)
  if (text) el.style.color = mixc(from.fg, to.fg, k)
  if (border) el.style.borderColor = mixc(from.bd, to.bd, k)
  const dot = el.querySelector('.dot')
  if (dot) dot.style.background = mixc(from.dot, to.dot, k)
}

// Texte qui change : l'ancien glisse vers le haut, le nouveau arrive d'en bas.
// steps : [[instant, libellé], …] triés.
export function swapText(el, t, steps, dist = 16) {
  let html = ''
  for (let i = 0; i < steps.length; i++) {
    const [at, label] = steps[i]
    const next = steps[i + 1]
    const kIn = i === 0 ? 1 : spring(t - at, SPRING.snappy)
    const kOut = next ? spring(t - next[0], SPRING.snappy) : 0
    const y = (1 - kIn) * dist - kOut * dist
    const o = clamp(kIn * 1.4 - kOut * 1.4) * (1 - kOut)
    if (o > 0.01) html += `<span class="txt" style="transform:translateY(${y.toFixed(2)}px);opacity:${o.toFixed(3)}">${label}</span>`
  }
  el.innerHTML = html
}

// Nombre qui défile jusqu'à sa valeur, formaté à la française.
export const fr = (n, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, ' ')

// Clic : petite pression gaussienne autour de l'instant du clic.
export const press = (t, at, width = 0.09) => (t > at - 0.2 ? Math.exp(-(((t - at) / width) ** 2)) : 0)

// Curseur : position par ressorts, pression au clic.
export function cursor(el, t, path, clicks = []) {
  const x = track(t, path.from[0], path.steps.map(([at, p]) => [at, p[0]]))
  const y = track(t, path.from[1], path.steps.map(([at, p]) => [at, p[1]]))
  const k = clicks.reduce((m, c) => Math.max(m, press(t, c)), 0)
  el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(1 - 0.12 * k).toFixed(4)})`
}

// ─── Icônes (même jeu que l'application) ──────────────────────────────────
const svg = (d, s = 20, c = 'currentColor', w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
export const ICON = {
  truck: (s, c) => svg('<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>', s, c, 1.8),
  user: (s, c) => svg('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>', s, c),
  gauge: (s, c) => svg('<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>', s, c),
  wrench: (s, c) => svg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>', s, c),
  shield: (s, c) => svg('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>', s, c),
  check: (s, c) => svg('<path d="M20 6 9 17l-5-5"/>', s, c, 2.6),
  file: (s, c) => svg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>', s, c),
  fuel: (s, c) => svg('<line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/>', s, c),
  camera: (s, c) => svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>', s, c),
  drop: (s, c) => svg('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>', s, c),
  trend: (s, c) => svg('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>', s, c),
  calendar: (s, c) => svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', s, c),
  send: (s, c) => svg('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>', s, c),
  brand: (s, c) => svg('<rect x="3" y="7" width="12" height="11" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-4"/>', s, c, 2.5),
}
export const CURSOR_SVG = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 2.5 19.5 12l-7 1.6L9 20.5z" fill="#18181b" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'

// Une scène déclare sa durée et son seek ; le moteur de rendu attend `ready`.
export function scene({ duration, seek }) {
  window.DURATION = duration
  window.seek = t => seek(((t % duration) + duration) % duration)
  window.ready = document.fonts.ready.then(() => { window.seek(0); return true })
}
