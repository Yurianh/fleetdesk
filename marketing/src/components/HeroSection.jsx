import { useEffect, useRef } from 'react'
import { ICONS } from '../lib/icons.js'

const APP_URL = 'https://app.fleetdesk.fr'

// Icône du jeu partagé (même set que l'application).
function Icon({ name, size = 20, className = '', strokeWidth = 1.75 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}

// Décalage de la révélation, en millisecondes.
const delay = ms => ({ animationDelay: `${ms}ms` })

// Vidéo du hero, rendue depuis du code (motion/hero) : les trois promesses du
// titre en un plan. Trois échéances arrivent et se règlent. Boucle muette.
// Si l'utilisateur préfère moins d'animations, on reste sur l'image fixe.
function HeroVideo() {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    // React ne pose pas toujours `muted` à l'hydratation : sans lui, la lecture
    // automatique est refusée sur mobile.
    v.muted = true
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => { if (reduce.matches) { v.pause(); v.currentTime = 0 } else { v.play().catch(() => {}) } }
    apply()
    reduce.addEventListener('change', apply)
    return () => reduce.removeEventListener('change', apply)
  }, [])
  return (
    <video
      ref={ref}
      className="block w-full h-full object-cover"
      muted loop playsInline preload="auto"
      aria-label="Démonstration FleetDesk : trois échéances arrivent, un contrôle technique, une visite médicale et une vidange. Chacune est réglée en un geste et le tableau de bord repasse à « Tout est à jour » : zéro contrôle raté, zéro document expiré, zéro panne surprise."
    >
      {/* Mobile : version portrait recomposée, pas un recadrage du 16:9. */}
      <source media="(max-width: 639px)" src="/hero/fleetdesk-hero-portrait.mp4" type="video/mp4" />
      <source src="/hero/fleetdesk-hero.mp4" type="video/mp4" />
    </video>
  )
}

export default function HeroSection() {
  return (
    <section data-own-motion className="bg-white overflow-hidden border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-16 lg:pb-20">

        {/* Copy */}
        <div className="max-w-2xl mb-12 lg:mb-14">
          <div style={delay(80)} className="enter inline-flex items-center gap-2 bg-[#E5EEFF] text-[#0052D6] text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">
            <Icon name="truck" size={13} strokeWidth={2} />
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
            <a href="/souscrire/pro"
              className="inline-flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0052D6] text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#0066FF]/25">
              Essayer gratuitement
              <Icon name="arrowRight" size={16} strokeWidth={2} />
            </a>
            <a href="#how"
              className="inline-flex items-center justify-center gap-2 border border-zinc-300 hover:border-zinc-400 text-zinc-700 hover:text-zinc-900 font-medium text-sm px-8 py-3.5 rounded-xl transition-all">
              Comment ça marche
            </a>
          </div>

          <div style={delay(840)} className="enter flex items-center gap-x-5 gap-y-2 text-sm text-zinc-600 flex-wrap">
            {["14 jours d'essai", 'Sans carte bancaire', 'Hébergé en Europe'].map((item, i) => (
              <div key={item} className="flex items-center gap-2">
                {i > 0 && <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-300 -ml-2.5" />}
                <Icon name="check" size={15} strokeWidth={2.5} className="text-[#0066FF] flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Produit : reproduction de l'écran Tableau de bord */}
        <div
          style={delay(900)}
          className="enter rounded-2xl border border-zinc-200 bg-zinc-100 overflow-hidden aspect-[4/5] sm:aspect-video bg-cover bg-center bg-[url('/hero/fleetdesk-hero-portrait-poster.jpg')] sm:bg-[url('/hero/fleetdesk-hero-poster.jpg')]"
        >
          <HeroVideo />
        </div>
      </div>
    </section>
  )
}
