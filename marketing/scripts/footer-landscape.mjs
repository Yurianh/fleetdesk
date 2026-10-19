// Génère public/footer-landscape.svg : une rue de ville gravée (immeubles,
// arbres, réverbères, trottoir, chaussée, berline), traits bleu FleetDesk
// sur papier blanc, pour le bas du footer.
//   node scripts/footer-landscape.mjs
// Déterministe (graine fixe) : relancer donne le même fichier.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const W = 1600, H = 520
const INK = '#0052D6', PAPER = '#F7F9FF'
const GROUND = 408            // pied des façades
const CURB = 426              // bordure du trottoir
const LANE = 492              // roues de la berline

let seed = 11
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const r = (a, b) => a + rnd() * (b - a)
const ri = (a, b) => Math.floor(r(a, b + 1))
const f = n => Math.round(n * 10) / 10

// Chaque couche accumule ses tracés dans quelques <path> (fichier compact).
function layer() {
  const fills = [], strokes = { 0.6: '', 0.8: '', 1: '', 1.3: '', 1.8: '' }
  return {
    fill: d => fills.push(d),
    line: (w, d) => { strokes[w] += d },
    svg: () => fills.map(d => `<path d="${d}" fill="${PAPER}"/>`).join('')
      + Object.entries(strokes).filter(([, d]) => d).map(([w, d]) =>
        `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`).join(''),
  }
}
const rect = (x, y, w, h) => `M${f(x)},${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`
const hl = (x1, x2, y) => `M${f(x1)},${f(y)}H${f(x2)}`
const vl = (x, y1, y2) => `M${f(x)},${f(y1)}V${f(y2)}`

// Hachures horizontales interrompues, comme une gravure au burin.
function hatchH(L, x, y, w, h, gap, density, wgt = 0.6) {
  for (let yy = y + gap / 2; yy < y + h; yy += gap) {
    let xx = x + r(0, 6)
    while (xx < x + w) {
      const len = r(8, 34), x2 = Math.min(x + w, xx + len)
      if (rnd() < density) L.line(wgt, hl(xx, x2, yy + r(-0.3, 0.3)))
      xx = x2 + r(2, 9)
    }
  }
}
const hatchV = (L, x, y, w, h, gap, wgt = 0.6) => { for (let xx = x + gap / 2; xx < x + w; xx += gap) L.line(wgt, vl(xx, y, y + h)) }

// ── Lointain : toits et coupoles, gravure légère ────────────────────────────
function skyline() {
  const L = layer()
  let x = -20
  while (x < W + 20) {
    const w = r(40, 110), h = r(70, 150), y = GROUND - 40 - h
    L.fill(rect(x, y, w, h + 60)); L.line(0.8, `M${f(x)},${f(y + h + 60)}V${f(y)}H${f(x + w)}V${f(y + h + 60)}`)
    hatchH(L, x + 2, y + 4, w - 4, h + 50, 3.2, 0.42)
    if (rnd() < 0.5) for (let c = 0; c < ri(1, 3); c++) { const cx = x + r(6, w - 14); L.fill(rect(cx, y - 10, 8, 10)); L.line(0.8, `M${f(cx)},${f(y)}V${f(y - 10)}h8V${f(y)}`) }
    x += w - r(0, 6)
  }
  // Une coupole et une flèche au loin, pour situer la ville.
  const dome = (cx, base, rad) => {
    L.fill(`M${cx - rad},${base}A${rad},${rad * 1.1} 0 0 1 ${cx + rad},${base}Z`)
    L.line(1, `M${cx - rad},${base}A${rad},${rad * 1.1} 0 0 1 ${cx + rad},${base}M${cx},${f(base - rad * 1.1)}v-14`)
    for (let k = -3; k <= 3; k++) L.line(0.6, `M${cx + k * rad / 4},${base}Q${cx + k * rad / 7},${f(base - rad * 0.9)} ${cx},${f(base - rad * 1.1)}`)
    L.fill(rect(cx - rad - 6, base, 2 * rad + 12, 40)); L.line(1, rect(cx - rad - 6, base, 2 * rad + 12, 40)); hatchV(L, cx - rad - 4, base + 4, 2 * rad + 8, 30, 6)
  }
  dome(470, 176, 30)
  const sx = 1270
  L.fill(`M${sx - 14},200L${sx},90L${sx + 14},200Z`); L.line(1, `M${sx - 14},200L${sx},90L${sx + 14},200`)
  for (let y = 110; y < 200; y += 7) L.line(0.6, hl(sx - (y - 90) * 0.12, sx + (y - 90) * 0.12, y))
  return L.svg()
}

// ── Rang d'immeubles haussmanniens ───────────────────────────────────────────
function building(L, x, w) {
  const floors = ri(5, 6), fh = r(25, 29), shop = 38
  const top = GROUND - shop - floors * fh
  const roofH = r(26, 34), inset = 9
  const cols = Math.max(2, Math.round((w - 16) / 26)), cw = (w - 16) / cols
  const dark = rnd() < 0.45

  L.fill(rect(x, top, w, GROUND - top))
  L.line(1.3, `M${f(x)},${GROUND}V${f(top)}H${f(x + w)}V${GROUND}`)
  // Toit mansardé, lucarnes, souches de cheminée.
  L.fill(`M${f(x - 2)},${f(top)}L${f(x + inset)},${f(top - roofH)}H${f(x + w - inset)}L${f(x + w + 2)},${f(top)}Z`)
  L.line(1.3, `M${f(x - 2)},${f(top)}L${f(x + inset)},${f(top - roofH)}H${f(x + w - inset)}L${f(x + w + 2)},${f(top)}`)
  for (let yy = top - roofH + 3; yy < top; yy += 2.6) {
    const t = (yy - (top - roofH)) / roofH
    L.line(0.6, hl(x + inset - t * (inset + 2) + 1, x + w - inset + t * (inset + 2) - 1, yy))
  }
  for (let c = 0; c < cols; c += 2) {
    const dx = x + 8 + c * cw + cw / 2 - 6, dy = top - roofH * 0.72
    L.fill(`M${f(dx)},${f(top - 2)}V${f(dy)}l6,-7l6,7V${f(top - 2)}Z`)
    L.line(1, `M${f(dx)},${f(top - 2)}V${f(dy)}l6,-7l6,7V${f(top - 2)}`)
    hatchV(L, dx + 2, dy + 2, 8, top - dy - 5, 2.2)
  }
  for (let c = 0; c < ri(1, 3); c++) {
    const cx = x + r(inset + 4, w - inset - 22), ch = r(12, 22)
    L.fill(rect(cx, top - roofH - ch, 18, ch + 2)); L.line(1, `M${f(cx)},${f(top - roofH)}V${f(top - roofH - ch)}h18V${f(top - roofH)}`)
    for (let p = 0; p < 3; p++) L.line(1, vl(cx + 3 + p * 6, top - roofH - ch, top - roofH - ch - 5))
    hatchV(L, cx + 1, top - roofH - ch + 2, 16, ch - 2, 3)
  }
  // Corniche et bandeaux d'étage.
  L.line(1.3, hl(x - 3, x + w + 3, top + 3))
  for (let fl = 1; fl <= floors; fl++) L.line(0.8, hl(x, x + w, top + fl * fh))
  // Ombre de façade : gravure plus dense sur un immeuble sur deux.
  hatchH(L, x + 1, top + 5, w - 2, floors * fh - 5, dark ? 2.2 : 3.6, dark ? 0.8 : 0.45)
  // Fenêtres : encadrement, vitrage hachuré, croisillon ; balcons filants.
  for (let fl = 0; fl < floors; fl++) {
    const fy = top + fl * fh + 5, wh = fh - 9
    for (let c = 0; c < cols; c++) {
      const wx = x + 8 + c * cw + cw / 2 - 5.5
      L.fill(rect(wx - 1.5, fy - 1.5, 14, wh + 3))
      L.line(0.8, rect(wx, fy, 11, wh))
      hatchV(L, wx, fy + 1, 11, wh - 2, 1.9, 0.6)
      L.line(0.8, vl(wx + 5.5, fy, fy + wh))
      if (rnd() < 0.3) L.line(1, `M${f(wx - 1)},${f(fy - 3)}h13`)
    }
    if (fl === 1 || fl === floors - 1) {
      const by = fy + wh - 2
      L.line(1.3, hl(x + 3, x + w - 3, by)); L.line(1, hl(x + 3, x + w - 3, by - 6))
      for (let bx = x + 5; bx < x + w - 4; bx += 2.6) L.line(0.6, vl(bx, by - 6, by))
    }
  }
  // Rez-de-chaussée : vitrines, store rayé, porte cochère.
  const sy = GROUND - shop
  L.line(1.3, hl(x, x + w, sy))
  const door = x + w / 2 - 9
  L.fill(`M${f(door)},${GROUND}V${f(sy + 12)}a9,9 0 0 1 18,0V${GROUND}Z`)
  L.line(1, `M${f(door)},${GROUND}V${f(sy + 12)}a9,9 0 0 1 18,0V${GROUND}`)
  hatchV(L, door + 1, sy + 8, 16, shop - 8, 2)
  for (const [a, b] of [[x + 6, door - 6], [door + 24, x + w - 6]]) {
    if (b - a < 16) continue
    L.line(1, rect(a, sy + 12, b - a, shop - 16))
    hatchH(L, a + 1, sy + 13, b - a - 2, shop - 18, 2, 0.8)
    if (rnd() < 0.7) {
      const aw = sy + 4
      L.fill(`M${f(a - 3)},${f(aw)}H${f(b + 3)}l5,12H${f(a - 8)}Z`)
      L.line(1, `M${f(a - 3)},${f(aw)}H${f(b + 3)}l5,12H${f(a - 8)}Z`)
      for (let s = a - 3; s < b + 3; s += 6) L.line(0.8, `M${f(s)},${f(aw)}l${f(-2)},12`)
      let sc = ''
      for (let s = a - 8; s < b + 8; s += 6) sc += `M${f(s)},${f(aw + 12)}q3,4 6,0`
      L.line(1, sc)
    }
  }
}
function street() {
  const L = layer()
  let x = -30
  while (x < W + 30) { const w = r(130, 210); building(L, x, w); x += w + r(0, 3) }
  return L.svg()
}

// ── Arbres d'alignement et réverbères ───────────────────────────────────────
function tree(L, cx) {
  const base = CURB - 6, crown = base - r(150, 168), rad = r(58, 70)
  L.fill(`M${cx - 5},${base}L${cx - 3},${f(crown + rad * 0.6)}h6L${cx + 5},${base}Z`)
  L.line(1.3, `M${cx - 5},${base}L${cx - 3},${f(crown + rad * 0.6)}M${cx + 5},${base}L${cx + 3},${f(crown + rad * 0.6)}`)
  for (let i = 0; i < 6; i++) L.line(0.6, hl(cx - 4, cx + 4, base - 10 - i * 12))
  L.line(1, rect(cx - 14, base - 2, 28, 4))
  // Feuillage : grappes de petites boucles, plus denses en bas (ombre).
  const blobs = Array.from({ length: 11 }, () => [cx + r(-rad, rad) * 0.85, crown + r(-rad, rad) * 0.5, r(20, 30)])
  for (const [bx, by, br] of blobs) L.fill(`M${f(bx - br)},${f(by)}a${f(br)},${f(br * 0.85)} 0 1 0 ${f(2 * br)},0a${f(br)},${f(br * 0.85)} 0 1 0 ${f(-2 * br)},0Z`)
  let leaves = ''
  for (let i = 0; i < 700; i++) {
    const [bx, by, br] = blobs[i % blobs.length]
    const a = r(0, Math.PI * 2), d = Math.sqrt(rnd()) * br
    const lx = bx + Math.cos(a) * d, ly = by + Math.sin(a) * d * 0.85
    if (ly < by - br * 0.2 && rnd() < 0.6) continue
    leaves += `M${f(lx)},${f(ly)}q${f(r(1, 3))},${f(r(-3, -1))} ${f(r(4, 6))},${f(r(-1, 1))}`
  }
  L.line(0.8, leaves)
  let rim = ''
  for (const [bx, by, br] of blobs) for (let k = 0; k < 9; k++) {
    const a = -Math.PI + (k / 8) * Math.PI * 1.1 + r(-0.1, 0.1)
    rim += `M${f(bx + Math.cos(a) * br)},${f(by + Math.sin(a) * br * 0.85)}q2,-3 5,-1`
  }
  L.line(1, rim)
}
function lamp(L, cx) {
  const base = CURB - 4, top = base - 112
  L.line(1.8, vl(cx, base, top + 10))
  L.line(1, `M${cx - 4},${base}h8M${cx - 3},${base - 18}h6M${cx},${top + 10}q0,-8 -8,-10`)
  L.fill(`M${cx - 15},${top}l4,-10h8l4,10Z`)
  L.line(1, `M${cx - 15},${top}l4,-10h8l4,10ZM${cx - 11},${top - 10}l4,-4l4,4M${cx - 7},${top}v-10`)
  L.line(0.6, `M${cx - 13},${top - 3}h12M${cx - 12},${top - 6}h10`)
}
function furniture() {
  const L = layer()
  for (const x of [90, 610, 1110, 1520]) tree(L, x)
  for (const x of [350, 860, 1340]) lamp(L, x)
  return L.svg()
}

// ── Trottoir et chaussée ────────────────────────────────────────────────────
function ground() {
  const L = layer()
  L.fill(rect(-10, GROUND, W + 20, H - GROUND))
  L.line(1.3, hl(-10, W + 10, GROUND))
  for (let x = r(0, 30); x < W; x += r(34, 44)) L.line(0.6, `M${f(x)},${GROUND + 2}l-6,${CURB - GROUND - 4}`)
  hatchH(L, -10, GROUND + 2, W + 20, CURB - GROUND - 4, 3, 0.25)
  L.line(1.8, hl(-10, W + 10, CURB)); L.line(1, hl(-10, W + 10, CURB + 4))
  // Chaussée : grain d'asphalte, plus serré au premier plan, marquage au sol.
  for (let y = CURB + 9, g = 6; y < H; y += g, g *= 0.97) hatchH(L, -10, y, W + 20, 1, 1, 0.38, 0.6)
  for (let x = 20; x < W; x += 96) L.line(1.8, hl(x, x + 48, LANE + 20))
  return L.svg()
}

// ── Berline de flotte, de profil vers la droite ─────────────────────────────
function car(x, moving = true) {
  const L = layer(), y = LANE
  const body = `M${x},${y - 16}V${y - 44}q0,-6 8,-8L${x + 40},${y - 54}L${x + 62},${y - 57}`
    + `C${x + 80},${y - 90} ${x + 92},${y - 93} ${x + 110},${y - 93}H${x + 148}C${x + 164},${y - 93} ${x + 174},${y - 80} ${x + 186},${y - 62}`
    + `L${x + 214},${y - 56}q18,3 20,12V${y - 16}q0,4 -4,4H${x + 4}q-4,0 -4,-4Z`
  // Ombre portée hachurée.
  for (let k = 0; k < 5; k++) L.line(0.8, hl(x - 4 + k * 3, x + 240 - k * 4, y + 2 + k * 2))
  L.fill(body)
  // Volume : hachures du bas de caisse, plus serrées vers le sol.
  for (let yy = y - 38, g = 4.5, i = 0; yy < y - 17; yy += g, g *= 0.86, i++) L.line(0.6, hl(x + 3, x + 230, yy))
  L.line(1.8, body)
  // Vitrages hachurés, montant central.
  const glass = `M${x + 72},${y - 59}C${x + 86},${y - 85} ${x + 96},${y - 88} ${x + 110},${y - 88}H${x + 147}C${x + 160},${y - 88} ${x + 168},${y - 77} ${x + 178},${y - 61}Z`
  L.fill(glass); L.line(1.3, glass)
  for (let xx = x + 76; xx < x + 177; xx += 2.2) {
    const top = xx < x + 110 ? y - 59 - (xx - x - 72) / 38 * 29 : xx > x + 147 ? y - 88 + (xx - x - 147) / 31 * 27 : y - 88
    L.line(0.6, vl(xx, top + 2, y - 60))
  }
  L.fill(rect(x + 126, y - 89, 6, 30)); L.line(1.3, rect(x + 126, y - 89, 6, 30))
  // Ligne de caisse, portes, poignées, rétroviseur, optiques.
  L.line(1, hl(x + 6, x + 228, y - 42))
  L.line(1.3, `M${x + 76},${y - 58}V${y - 18}M${x + 129},${y - 58}V${y - 18}M${x + 186},${y - 60}V${y - 22}`)
  L.line(1.8, `M${x + 92},${y - 47}h10M${x + 145},${y - 47}h10`)
  L.fill(`M${x + 176},${y - 64}l10,-2v7h-8Z`); L.line(1.3, `M${x + 176},${y - 64}l10,-2v7h-8Z`)
  L.fill(rect(x + 222, y - 50, 11, 6)); L.line(1, rect(x + 222, y - 50, 11, 6))
  L.fill(rect(x + 1, y - 46, 7, 7)); L.line(1, rect(x + 1, y - 46, 7, 7))
  L.line(1.8, `M${x + 214},${y - 22}h20M${x + 2},${y - 22}h16`)
  // Marque FleetDesk discrète sur la porte arrière.
  L.fill(rect(x + 96, y - 36, 12, 12)); L.line(1, rect(x + 96, y - 36, 12, 12))
  L.line(1, `M${x + 99},${y - 28}v-5h5M${x + 101},${y - 31}h5v5h-5Z`)
  // Roues : passages de roue, pneu, jante à rayons.
  for (const wx of [x + 52, x + 186]) {
    L.fill(`M${wx - 24},${y - 16}a24,24 0 0 1 48,0Z`); L.line(1.3, `M${wx - 24},${y - 16}a24,24 0 0 1 48,0`)
    L.fill(`M${wx - 19},${y - 5}a19,19 0 1 0 38,0a19,19 0 1 0 -38,0Z`)
    for (let rr = 19; rr > 11; rr -= 1.6) L.line(0.8, `M${f(wx - rr)},${y - 5}a${f(rr)},${f(rr)} 0 1 0 ${f(2 * rr)},0a${f(rr)},${f(rr)} 0 1 0 ${f(-2 * rr)},0`)
    L.line(1.8, `M${wx - 19},${y - 5}a19,19 0 1 0 38,0a19,19 0 1 0 -38,0`)
    for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; L.line(1, `M${wx},${y - 5}l${f(Math.cos(a) * 9)},${f(Math.sin(a) * 9)}`) }
    L.line(1.3, `M${wx - 3},${y - 5}a3,3 0 1 0 6,0a3,3 0 1 0 -6,0`)
  }
  // Traits de vitesse.
  if (moving) L.line(1, `M${x - 12},${y - 60}h-40M${x - 10},${y - 42}h-64M${x - 14},${y - 26}h-30`)
  return L.svg()
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">`
  + skyline() + street() + ground() + furniture() + car(930) + `</svg>`

const out = fileURLToPath(new URL('../public/footer-landscape.svg', import.meta.url))
writeFileSync(out, svg)
console.log(out, (svg.length / 1024).toFixed(0) + ' Ko')
