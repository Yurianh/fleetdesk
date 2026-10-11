// Rendu générique des vidéos de section (toile 5:4, 640 × 512 CSS).
//
//   node render.mjs <scene> --stills 0,2,4     images fixes dans <scene>/review
//   node render.mjs <scene> --check-loop       t=0 et t=fin identiques ?
//   node render.mjs <scene>                    MP4 + image fixe dans marketing/public/videos
//
// Les scènes sont des modules ES : on les sert en HTTP local, file:// les bloque.
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, extname, join, resolve, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const [name, ...rest] = process.argv.slice(2)
if (!name || !existsSync(join(here, name, 'index.html'))) {
  console.error('usage : node render.mjs <scene> [--stills a,b,c | --check-loop]')
  process.exit(1)
}
const OUT_PUBLIC = resolve(here, '../marketing/public/videos')
const OUT_REVIEW = join(here, name, 'review')
const VIEW = { width: 640, height: 512, scale: 2 }
const FPS = 60
const CHROME = process.env.CHROME_PATH || join(os.homedir(),
  'Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell')

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' }
const server = createServer((req, res) => {
  const path = normalize(join(here, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
  if (!path.startsWith(here) || !existsSync(path)) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' })
  res.end(readFileSync(path))
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const port = server.address().port

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: VIEW.width, height: VIEW.height }, deviceScaleFactor: VIEW.scale })
page.on('pageerror', e => console.error('Erreur dans la scène :', e.message))
await page.goto(`http://127.0.0.1:${port}/${name}/index.html`)
await page.waitForFunction(() => window.ready)
await page.evaluate(() => window.ready)
const DURATION = await page.evaluate(() => window.DURATION)

const frameAt = async t => { await page.evaluate(tt => window.seek(tt), t); return page.screenshot({ type: 'png' }) }
function ffmpeg(argv) {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...argv], { stdio: ['pipe', 'inherit', 'inherit'] })
  return { stdin: p.stdin, done: new Promise((ok, ko) => p.on('close', c => (c === 0 ? ok() : ko(new Error('ffmpeg ' + c))))) }
}

if (rest[0] === '--stills') {
  mkdirSync(OUT_REVIEW, { recursive: true })
  for (const s of rest[1].split(',')) writeFileSync(join(OUT_REVIEW, `still-${Number(s).toFixed(2)}.png`), await frameAt(Number(s)))
  console.log('stills →', OUT_REVIEW)
} else if (rest[0] === '--check-loop') {
  const a = await frameAt(0), b = await frameAt(DURATION - 1e-6)
  console.log(name, a.equals(b) ? ': boucle OK' : ': boucle KO, la première et la dernière image diffèrent')
} else {
  mkdirSync(OUT_PUBLIC, { recursive: true }); mkdirSync(OUT_REVIEW, { recursive: true })
  const frames = Math.round(DURATION * FPS)
  const enc = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-preset', 'slow', '-crf', '20', '-tune', 'animation', '-movflags', '+faststart', join(OUT_PUBLIC, `${name}.mp4`)])
  for (let i = 0; i < frames; i++) {
    const png = await frameAt(i / FPS)
    if (i === 0) writeFileSync(join(OUT_REVIEW, 'frame-0.png'), png)
    if (!enc.stdin.write(png)) await new Promise(r => enc.stdin.once('drain', r))
  }
  enc.stdin.end(); await enc.done
  await ffmpeg(['-i', join(OUT_REVIEW, 'frame-0.png'), '-q:v', '3', join(OUT_PUBLIC, `${name}-poster.jpg`)]).done
  console.log(name, '→', join(OUT_PUBLIC, `${name}.mp4`))
}
await browser.close()
server.close()
