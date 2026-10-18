// Génère public/footer-landscape.svg : paysage gravé (collines, plaine, route,
// utilitaire) en traits bleus sur papier crème, pour le bas du footer.
//   node scripts/footer-landscape.mjs
// Déterministe (graine fixe) : relancer donne le même fichier.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const W = 1600, H = 440
const INK = 'var(--ink, #1238A8)', PAPER = 'var(--paper, #F4EBD6)'

let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const r = (a, b) => a + rnd() * (b - a)
const f = n => Math.round(n * 10) / 10

// Bruit 1D lissé (valeurs aléatoires interpolées en cosinus), plusieurs octaves.
function noise(freq, oct = 4) {
  const tables = Array.from({ length: oct }, () => Array.from({ length: 400 }, rnd))
  return x => {
    let v = 0, amp = 1, fr = freq, norm = 0
    for (const t of tables) {
      const p = (x + 1000) * fr, i = Math.floor(p), u = (1 - Math.cos((p - i) * Math.PI)) / 2
      v += amp * (t[i % 400] * (1 - u) + t[(i + 1) % 400] * u); norm += amp; amp *= 0.5; fr *= 2.1
    }
    return v / norm
  }
}

// Une chaîne de collines : remplissage papier, puis lignes de gravure parallèles
// à la crête, plus serrées et plus continues sur le versant à l'ombre.
function ridge({ base, amp, freq, depth, gap, peak }) {
  const n = noise(freq)
  const top = x => base - amp * n(x) - (peak ? peak.h * Math.exp(-(((x - peak.x) / peak.w) ** 2)) : 0)
  const pts = []
  for (let x = -10; x <= W + 10; x += 6) pts.push([x, top(x)])
  const fill = `M${pts.map(p => `${f(p[0])},${f(p[1])}`).join('L')}L${W + 10},${H}L-10,${H}Z`
  const crest = `M${pts.map(p => `${f(p[0])},${f(p[1])}`).join('L')}`
  let d = ''
  for (let k = 1; k * gap < depth; k++) {
    const off = k * gap * (1 + k * 0.04)
    let x = -10
    while (x < W) {
      const len = r(14, 70), x2 = Math.min(W + 10, x + len)
      const slope = (top(x + 4) - top(x - 4)) / 8
      const shade = slope < 0 ? 0.92 : 0.45                 // versant gauche à l'ombre
      if (rnd() < shade * (1 - k * gap / depth * 0.75)) {
        const seg = []
        for (let xx = x; xx <= x2; xx += 5) seg.push([xx, top(xx) + off + Math.sin(xx * 0.05 + k) * 0.8])
        d += `M${seg.map(p => `${f(p[0])},${f(p[1])}`).join('L')}`
      }
      x = x2 + r(4, 18)
    }
  }
  return `<path d="${fill}" fill="${PAPER}"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/><path d="${crest}" fill="none" stroke="${INK}" stroke-width="1.8"/>`
}

// Plaine : traits horizontaux qui s'espacent vers le premier plan, touffes d'herbe.
function plain(y0) {
  let d = ''
  for (let y = y0 + 4, g = 3; y < H; y += g, g *= 1.09) {
    let x = r(-20, 0)
    while (x < W) {
      const len = r(10, 40 + g * 6)
      if (rnd() < 0.55) d += `M${f(x)},${f(y + r(-0.6, 0.6))}h${f(len)}`
      x += len + r(6, 22 + g * 3)
    }
  }
  let g = ''
  for (let i = 0; i < 260; i++) {
    const y = y0 + 20 + (H - y0 - 20) * Math.pow(rnd(), 0.7), s = 0.25 + ((y - y0) / (H - y0)) * 1.4
    const x = r(0, W)
    if (y > 286 && y < 316) continue                         // pas d'herbe sur la route
    for (let b = 0; b < 7; b++) {
      const a = -Math.PI / 2 + r(-0.9, 0.9), l = r(8, 20) * s
      g += `M${f(x + r(-4, 4) * s)},${f(y)}q${f(Math.cos(a) * l * 0.3)},${f(-l * 0.6)},${f(Math.cos(a) * l)},${f(Math.sin(a) * l)}`
    }
  }
  return `<path d="M-10,${y0}H${W + 10}V${H}H-10Z" fill="${PAPER}"/>`
    + `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round" opacity=".85"/>`
    + `<path d="${g}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`
}

// Route de campagne qui traverse la plaine, légèrement ondulée.
const roadY = x => 300 + Math.sin(x / 260) * 5 + Math.sin(x / 97) * 1.5
function road() {
  const edge = o => { let s = ''; for (let x = -10; x <= W + 10; x += 8) s += `${s ? 'L' : 'M'}${x},${f(roadY(x) + o)}`; return s }
  const top = [], bot = []
  for (let x = -10; x <= W + 10; x += 8) { top.push(`${x},${f(roadY(x) - 9)}`); bot.unshift(`${x},${f(roadY(x) + 11)}`) }
  let dash = ''
  for (let x = 0; x < W; x += 34) dash += `M${x},${f(roadY(x) + 1)}h16`
  let gravel = ''
  for (let i = 0; i < 500; i++) { const x = r(0, W); gravel += `M${f(x)},${f(roadY(x) + r(-8, 10))}h${f(r(2, 7))}` }
  return `<path d="M${top.join('L')}L${bot.join('L')}Z" fill="${PAPER}"/>`
    + `<path d="${edge(-9)}${edge(11)}" fill="none" stroke="${INK}" stroke-width="1.4"/>`
    + `<path d="${gravel}" fill="none" stroke="${INK}" stroke-width=".8" opacity=".5"/>`
    + `<path d="${dash}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`
}

// Utilitaire vu de profil, roulant vers la droite, avec hachures de volume.
function van(cx) {
  const y = roadY(cx) + 4, x = cx - 62
  const body = `M${x},${y - 8}V${y - 46}q0,-6 6,-6H${x + 86}q6,0 9,5l15,22q3,4 8,5l5,1q5,1 5,6V${y - 8}q0,3 -3,3H${x + 3}q-3,0 -3,-3Z`
  let hatch = ''
  for (let i = 0; i < 9; i++) hatch += `M${x + 4},${y - 12 - i * 3.6}H${x + 66}`
  const wheel = wx => `<circle cx="${wx}" cy="${y - 5}" r="10" fill="${INK}"/><circle cx="${wx}" cy="${y - 5}" r="4" fill="${PAPER}"/>`
  return `<g>`
    + `<path d="M${x - 40},${y + 2}h190" stroke="${INK}" stroke-width="1" opacity=".6"/>`
    + `<path d="${body}" fill="${PAPER}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="${hatch}" stroke="${INK}" stroke-width="1" opacity=".75"/>`
    + `<path d="M${x + 88},${y - 46}h5l12,18h-17Z" fill="${INK}"/>`
    + `<path d="M${x + 70},${y - 52}V${y - 8}M${x + 74},${y - 30}h7" stroke="${INK}" stroke-width="1.6"/>`
    + `<path d="M${x + 128},${y - 18}h6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
    + wheel(x + 24) + wheel(x + 104)
    + `<path d="M${x - 8},${y - 20}h-14M${x - 10},${y - 30}h-22M${x - 6},${y - 12}h-10" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`
    + `</g>`
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">`
  + ridge({ base: 175, amp: 95, freq: 0.0045, depth: 110, gap: 3.4, peak: { x: 1180, w: 150, h: 85 } })
  + ridge({ base: 222, amp: 50, freq: 0.007, depth: 60, gap: 3.2, peak: { x: 330, w: 120, h: 30 } })
  + plain(232)
  + road()
  + van(980)
  + `</svg>`

const out = fileURLToPath(new URL('../public/footer-landscape.svg', import.meta.url))
writeFileSync(out, svg)
console.log(out, (svg.length / 1024).toFixed(0) + ' Ko')
