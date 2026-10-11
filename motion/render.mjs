// Rendu générique des vidéos FleetDesk.
//
//   node render.mjs <scene> --stills 0,2,4     images fixes dans <scene>/review
//   node render.mjs <scene> --check-loop       t=0 et t=fin identiques ?
//   node render.mjs <scene>                    MP4 + image fixe
//   … --format portrait                        autre format déclaré par la scène
//
// Par défaut : toile 5:4 (640 × 512 CSS → 1280 × 1024), sortie dans
// marketing/public/videos/<scene>. Une scène peut déclarer ses propres formats
// et sorties dans <scene>/scene.json (c'est le cas du hero : 16:9 et 4:5).
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
const argv = process.argv.slice(2)
const fi = argv.indexOf('--format')
const formatName = fi >= 0 ? argv[fi + 1] : null
const [name, ...rest] = fi >= 0 ? argv.filter((_, i) => i !== fi && i !== fi + 1) : argv
if (!name || !existsSync(join(here, name, 'index.html'))) {
  console.error('usage : node render.mjs <scene> [--stills a,b,c | --check-loop]')
  process.exit(1)
}
const cfgPath = join(here, name, 'scene.json')
const formats = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, 'utf8')).formats
  : { default: { width: 640, height: 512, scale: 2, query: '', out: `../marketing/public/videos/${name}` } }
const fmtKey = formatName || Object.keys(formats)[0]
const FMT = formats[fmtKey]
if (!FMT) { console.error(`format inconnu : ${fmtKey}`); process.exit(1) }
const VIEW = FMT
const OUT_FILE = resolve(here, FMT.out)            // sans extension
const OUT_PUBLIC = dirname(OUT_FILE)
const TAG = Object.keys(formats).length > 1 ? `-${fmtKey}` : ''
const OUT_REVIEW = join(here, name, 'review')
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
await page.goto(`http://127.0.0.1:${port}/${name}/index.html${FMT.query || ''}`)
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
  for (const s of rest[1].split(',')) writeFileSync(join(OUT_REVIEW, `still${TAG}-${Number(s).toFixed(2)}.png`), await frameAt(Number(s)))
  console.log('stills →', OUT_REVIEW)
} else if (rest[0] === '--check-loop') {
  const a = await frameAt(0), b = await frameAt(DURATION - 1e-6)
  console.log(name + TAG, a.equals(b) ? ': boucle OK' : ': boucle KO, la première et la dernière image diffèrent')
} else {
  mkdirSync(OUT_PUBLIC, { recursive: true }); mkdirSync(OUT_REVIEW, { recursive: true })
  const frames = Math.round(DURATION * FPS)
  const enc = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-preset', 'slow', '-crf', '20', '-tune', 'animation', '-movflags', '+faststart', OUT_FILE + '.mp4'])
  for (let i = 0; i < frames; i++) {
    const png = await frameAt(i / FPS)
    if (i === 0) writeFileSync(join(OUT_REVIEW, `frame${TAG}-0.png`), png)
    if (!enc.stdin.write(png)) await new Promise(r => enc.stdin.once('drain', r))
  }
  enc.stdin.end(); await enc.done
  await ffmpeg(['-i', join(OUT_REVIEW, `frame${TAG}-0.png`), '-q:v', '3', OUT_FILE + '-poster.jpg']).done
  console.log(name + TAG, '→', OUT_FILE + '.mp4')
}
await browser.close()
server.close()
