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
// Même mélange, rendu en hexadécimal pour pouvoir le mélanger à nouveau.
export const mixh = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))).toString(16).padStart(2, '0')).join('') }
export const fade = (t, t0, d = 0.25) => clamp((t - t0) / d)
export const $ = id => document.getElementById(id)

// ─── Palette FleetDesk ────────────────────────────────────────────────────
export const OK   = { bg: '#ECFDF5', fg: '#047857', bd: '#A7F3D0', dot: '#10B981' }
export const WARN = { bg: '#FFFDF7', fg: '#B45309', bd: '#F2C77A', dot: '#F59E0B' }
export const NEUTRAL = { bg: '#F7F9FF', fg: '#34446A', bd: '#DDE5F5', dot: '#8A98B8' }
export const BLUE = '#0052D6', BLUE_SOFT = '#E5EEFF', BLUE_INK = '#0052D6'

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

// ─── Icônes (même jeu que le site et l'application : Phosphor, style plein) ──
// Grille de 256, remplissage seul ; la coche est en style gras, comme sur le site.
const svg = (d, s = 20, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 256 256" fill="${c}" aria-hidden="true">${d}</svg>`
export const ICON = {
  truck: (s, c) => svg('<path d="M255.43,117l-14-35A15.93,15.93,0,0,0,226.58,72H192V64a8,8,0,0,0-8-8H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A8.13,8.13,0,0,0,255.43,117ZM80,208a16,16,0,1,1,16-16A16,16,0,0,1,80,208ZM32,136V72H176v64Zm160,72a16,16,0,1,1,16-16A16,16,0,0,1,192,208Zm0-96V88h34.58l9.6,24Z"/>', s, c),
  user: (s, c) => svg('<path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z"/>', s, c),
  gauge: (s, c) => svg('<path d="M240,152v24a16,16,0,0,1-16,16H115.93a4,4,0,0,1-3.24-6.35L174.27,101a8.21,8.21,0,0,0-1.37-11.3,8,8,0,0,0-11.37,1.61l-72,99.06A4,4,0,0,1,86.25,192H32a16,16,0,0,1-16-16V153.13c0-1.79,0-3.57.13-5.33a4,4,0,0,1,4-3.8H48a8,8,0,0,0,8-8.53A8.17,8.17,0,0,0,47.73,128H23.92a4,4,0,0,1-3.87-5c12-43.84,49.66-77.13,95.52-82.28a4,4,0,0,1,4.43,4V72a8,8,0,0,0,8.53,8A8.17,8.17,0,0,0,136,71.73V44.67a4,4,0,0,1,4.43-4A112.18,112.18,0,0,1,236.23,123a4,4,0,0,1-3.88,5H208.27a8.17,8.17,0,0,0-8.25,7.47,8,8,0,0,0,8,8.53h27.92a4,4,0,0,1,4,3.86C240,149.23,240,150.61,240,152Z"/>', s, c),
  wrench: (s, c) => svg('<path d="M232,96a72,72,0,0,1-100.94,66L79,222.22c-.12.14-.26.29-.39.42a32,32,0,0,1-45.26-45.26c.14-.13.28-.27.43-.39L94,124.94a72.07,72.07,0,0,1,83.54-98.78,8,8,0,0,1,3.93,13.19L144,80l5.66,26.35L176,112l40.65-37.52a8,8,0,0,1,13.19,3.93A72.6,72.6,0,0,1,232,96Z"/>', s, c),
  shield: (s, c) => svg('<path d="M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm-34.32,69.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"/>', s, c),
  check: (s, c) => svg('<path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"/>', s, c),
  file: (s, c) => svg('<path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,176H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Zm0-32H96a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Zm-8-56V44l44,44Z"/>', s, c),
  fuel: (s, c) => svg('<path d="M241,69.66,221.66,50.34a8,8,0,0,0-11.32,11.32L229.66,81A8,8,0,0,1,232,86.63V168a8,8,0,0,1-16,0V128a24,24,0,0,0-24-24H176V56a24,24,0,0,0-24-24H72A24,24,0,0,0,48,56V208H32a8,8,0,0,0,0,16H192a8,8,0,0,0,0-16H176V120h16a8,8,0,0,1,8,8v40a24,24,0,0,0,48,0V86.63A23.85,23.85,0,0,0,241,69.66ZM144,120H80a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Z"/>', s, c),
  camera: (s, c) => svg('<path d="M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm-44,76a36,36,0,1,1-36-36A36,36,0,0,1,164,132Z"/>', s, c),
  drop: (s, c) => svg('<path d="M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75Zm9.85,105.59a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z"/>', s, c),
  trend: (s, c) => svg('<path d="M240,56v64a8,8,0,0,1-13.66,5.66L200,99.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31,29.66,189.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0L136,140.69,188.69,88,162.34,61.66A8,8,0,0,1,168,48h64A8,8,0,0,1,240,56Z"/>', s, c),
  mail: (s, c) => svg('<path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z"/>', s, c),
  calendar: (s, c) => svg('<path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,48H48V48H72v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24Z"/>', s, c),
  send: (s, c) => svg('<path d="M240,127.89a16,16,0,0,1-8.18,14L63.9,237.9A16.15,16.15,0,0,1,56,240a16,16,0,0,1-15-21.33l27-79.95A4,4,0,0,1,71.72,136H144a8,8,0,0,0,8-8.53,8.19,8.19,0,0,0-8.26-7.47h-72a4,4,0,0,1-3.79-2.72l-27-79.94A16,16,0,0,1,63.84,18.07l168,95.89A16,16,0,0,1,240,127.89Z"/>', s, c),
  // Symbole FleetDesk : deux traits, un épais et un fin (sans le carré, posé par la tuile).
  brand: (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="${c}" aria-hidden="true"><rect x="7.7" y="11" width="16.6" height="5.4" rx="1.6"/><rect x="7.7" y="19" width="12" height="1.9" rx="0.95"/></svg>`,
}
export const CURSOR_SVG = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 2.5 19.5 12l-7 1.6L9 20.5z" fill="#0B1B3F" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'

// Une scène déclare sa durée et son seek ; le moteur de rendu attend `ready`.
export function scene({ duration, seek }) {
  window.DURATION = duration
  window.seek = t => seek(((t % duration) + duration) % duration)
  window.ready = document.fonts.ready.then(() => { window.seek(0); return true })
}
