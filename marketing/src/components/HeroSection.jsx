import { useEffect, useRef } from 'react'
import { ICONS, ICON_VIEWBOX } from '../lib/icons.js'

const APP_URL = 'https://app.fleetdesk.fr'

// Icône du jeu du site (Phosphor plein).
function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox={ICON_VIEWBOX} fill="currentColor"
      className={className} aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}

// Décalage de la révélation, en millisecondes.
const delay = ms => ({ animationDelay: `${ms}ms` })

// Parallaxe au survol : l'écran s'incline légèrement vers le curseur. La
// transformation vit sur un calque dédié (.reveal-tilt) pour ne pas entrer en
// conflit avec l'animation d'arrivée, qui occupe déjà `transform` sur le cadre.
function useParallax() {
  const stage = useRef(null)

  useEffect(() => {
    const el = stage.current
    if (!el) return
    // Ni sur écran tactile, ni si l'utilisateur veut moins d'animations.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let target = { x: 0, y: 0 }
    let current = { x: 0, y: 0 }

    const tick = () => {
      // Lissage : le mouvement suit le curseur avec un peu d'inertie.
      current.x += (target.x - current.x) * 0.12
      current.y += (target.y - current.y) * 0.12
      el.style.setProperty('--tilt-x', current.x.toFixed(3))
      el.style.setProperty('--tilt-y', current.y.toFixed(3))
      if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
        frame = requestAnimationFrame(tick)
      } else {
        frame = 0
      }
    }
    const run = () => { if (!frame) frame = requestAnimationFrame(tick) }

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      target = {
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      }
      el.classList.add('is-tilting')
      run()
    }
    const onLeave = () => {
      target = { x: 0, y: 0 }
      el.classList.remove('is-tilting')
      run()
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return stage

}

// Vidéo du hero, rendue depuis du code (motion/hero) : les trois promesses du
// titre, une échéance à la fois. Boucle muette, démarrée une fois l'écran posé.
function HeroVideo() {
  const frame = useRef(null)
  const video = useRef(null)

  useEffect(() => {
    const v = video.current, f = frame.current
    if (!v || !f) return
    // React ne pose pas toujours `muted` à l'hydratation : sans lui, la lecture
    // automatique est refusée sur mobile.
    v.muted = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.pause(); return }

    // La vidéo démarre une fois le cadre posé : l'histoire se lit depuis le début.
    let started = false
    const start = () => { if (started) return; started = true; v.currentTime = 0; v.play().catch(() => {}) }
    const onEnd = e => { if (e.target === f) start() }
    f.addEventListener('animationend', onEnd)
    const fallback = setTimeout(start, 3400)
    return () => { f.removeEventListener('animationend', onEnd); clearTimeout(fallback) }
  }, [])

  return (
    <div
      ref={frame}
      className="reveal-frame relative rounded-2xl border border-zinc-200 bg-zinc-100 overflow-hidden aspect-[4/5] sm:aspect-video bg-cover bg-center bg-[url('/hero/fleetdesk-hero-portrait-poster.jpg')] sm:bg-[url('/hero/fleetdesk-hero-poster.jpg')]"
    >
      <video
        ref={video}
        className="block w-full h-full object-cover"
        muted loop playsInline preload="auto"
        aria-label="Démonstration FleetDesk : une échéance de contrôle technique, puis une visite médicale, puis une vidange arrivent, chacune réglée en un geste ; le tableau de bord repasse à « Tout est à jour » : zéro contrôle raté, zéro document expiré, zéro panne surprise."
      >
        {/* Mobile : version portrait recomposée, pas un recadrage du 16:9. */}
        <source media="(max-width: 639px)" src="/hero/fleetdesk-hero-portrait.mp4" type="video/mp4" />
        <source src="/hero/fleetdesk-hero.mp4" type="video/mp4" />
      </video>
    </div>
  )
}

export default function HeroSection() {
  const stageRef = useParallax()

  return (
    <section data-own-motion className="bg-white overflow-hidden border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-16 lg:pb-20">

        {/* Copy */}
        <div className="max-w-2xl mb-12 lg:mb-14">
          <div style={delay(80)} className="enter inline-flex items-center gap-2 bg-[#E5EEFF] text-[#0052D6] text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">
            <Icon name="truck" size={13} />
            Pour les flottes de 2 à 50 véhicules
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-zinc-900 tracking-tight leading-[1.05] mb-6">
            <span style={delay(180)} className="enter block">Zéro contrôle raté.</span>
            <span style={delay(300)} className="enter block">Zéro document expiré.</span>
            <span style={delay(420)} className="enter block text-[#0066FF]">Zéro panne surprise.</span>
          </h1>

          <p style={delay(560)} className="enter text-lg text-zinc-600 leading-relaxed mb-8">
            FleetDesk surveille chaque véhicule et chaque conducteur, et vous alerte avant l'échéance. Vos chauffeurs
            saisissent kilométrage et pleins depuis le terrain. Vous pilotez, d'un seul tableau de bord.
          </p>

          <div style={delay(700)} className="enter flex flex-col sm:flex-row gap-3 mb-6">
            <a href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0052D6] text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#0066FF]/25">
              Essayer gratuitement
              <Icon name="arrowRight" size={16} />
            </a>
            <a href="#how"
              className="inline-flex items-center justify-center gap-2 border border-zinc-300 hover:border-zinc-400 text-zinc-700 hover:text-zinc-900 font-medium text-sm px-8 py-3.5 rounded-xl transition-all">
              Comment ça marche
            </a>
          </div>

          <div style={delay(840)} className="enter flex items-center gap-x-5 gap-y-2 text-sm text-zinc-600 flex-wrap">
            {["7 jours d'essai gratuit", 'Sans carte bancaire', 'Sans engagement'].map((item, i) => (
              <div key={item} className="flex items-center gap-2">
                {i > 0 && <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-300 -ml-2.5" />}
                <Icon name="check" size={15} className="text-[#0066FF] flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <a href="/diagnostic" style={delay(940)} className="enter mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#0066FF] hover:underline">
            Votre flotte est-elle exposée ? Faites le diagnostic en 2 minutes
            <Icon name="arrowRight" size={14} />
          </a>
        </div>

        {/* Produit : reproduction de l'écran Tableau de bord */}
        {/* L'écran arrive incliné puis se pose ; au survol, il suit le curseur. */}
        <div ref={stageRef} className="reveal-stage relative">
          <div className="reveal-tilt">
            <HeroVideo />
          </div>
        </div>
      </div>
    </section>
  )
}
