// Rendu déterministe de index.html : on appelle seek(t) image par image,
// on capture, et ffmpeg assemble. Aucun minuteur : deux rendus sont identiques.
//
//   node render.mjs --stills 0,1.5,3,4,5.6,7.4,9,10.9   images fixes pour la relecture
//   node render.mjs                                     vidéo complète (MP4 H.264 + poster)
//   node render.mjs --check-loop                        vérifie que t=0 et t=fin sont identiques
//   ajouter --portrait à chaque commande pour le format mobile 4:5
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const OUT_PUBLIC = resolve(here, '../../marketing/public/hero')
const OUT_REVIEW = resolve(here, 'review')
const FPS = 60
const argv = process.argv.slice(2)
const PORTRAIT = argv.includes('--portrait')
// Paysage : 1536×864 CSS → 1920×1080. Portrait : 540×675 CSS → 1080×1350.
const VIEW = PORTRAIT ? { width: 540, height: 675, scale: 2 } : { width: 1536, height: 864, scale: 1.25 }
const SUFFIX = PORTRAIT ? '-portrait' : ''

const CHROME = process.env.CHROME_PATH || join(os.homedir(),
  'Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell')

const args = argv.filter(a => a !== '--portrait')
const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: VIEW.width, height: VIEW.height }, deviceScaleFactor: VIEW.scale })
await page.goto('file://' + join(here, 'index.html') + (PORTRAIT ? '?format=portrait' : ''))
await page.evaluate(() => window.ready)
const DURATION = await page.evaluate(() => window.DURATION)

async function frameAt(t) {
  await page.evaluate(tt => window.seek(tt), t)
  return page.screenshot({ type: 'png' })
}

function ffmpeg(argv) {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...argv], { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = new Promise((ok, ko) => p.on('close', c => (c === 0 ? ok() : ko(new Error('ffmpeg ' + c)))))
  return { stdin: p.stdin, done }
}

if (args[0] === '--stills') {
  mkdirSync(OUT_REVIEW, { recursive: true })
  for (const s of args[1].split(',')) {
    const t = Number(s)
    writeFileSync(join(OUT_REVIEW, `still${SUFFIX}-${t.toFixed(2)}.png`), await frameAt(t))
  }
  console.log('stills →', OUT_REVIEW)
} else if (args[0] === '--check-loop') {
  const a = await frameAt(0)
  const b = await frameAt(DURATION - 1e-6)
  console.log(a.equals(b) ? 'boucle OK : première et dernière image identiques' : 'boucle KO : les images diffèrent')
} else {
  mkdirSync(OUT_PUBLIC, { recursive: true })
  const frames = Math.round(DURATION * FPS)
  const enc = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '20', '-tune', 'animation',
    '-movflags', '+faststart', join(OUT_PUBLIC, `fleetdesk-hero${SUFFIX}.mp4`)])
  for (let i = 0; i < frames; i++) {
    const png = await frameAt(i / FPS)
    if (i === 0) writeFileSync(join(OUT_REVIEW_SAFE(), `frame${SUFFIX}-0.png`), png)
    if (!enc.stdin.write(png)) await new Promise(r => enc.stdin.once('drain', r))
    if (i % 60 === 0) process.stdout.write(`\r${i}/${frames}`)
  }
  enc.stdin.end()
  await enc.done
  console.log('\nMP4 OK')
  await ffmpeg(['-i', join(OUT_REVIEW, `frame${SUFFIX}-0.png`), '-q:v', '3', join(OUT_PUBLIC, `fleetdesk-hero${SUFFIX}-poster.jpg`)]).done
  console.log('poster OK →', OUT_PUBLIC)
}

function OUT_REVIEW_SAFE() { mkdirSync(OUT_REVIEW, { recursive: true }); return OUT_REVIEW }
await browser.close()
