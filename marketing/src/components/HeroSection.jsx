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

// La maquette reproduit l'écran réel « Tableau de bord » de l'application :
// même navigation, mêmes blocs (actions rapides, bandeau de chiffres,
// utilisation des véhicules, carte flotte, centre d'alertes).
const NAV_MAIN = [{ label: 'Tableau de bord', icon: 'dashboard', active: true }]
const NAV_FLEET = [
  { label: 'Véhicules', icon: 'truck' },
  { label: 'Conducteurs', icon: 'users' },
  { label: 'Affectations', icon: 'assignments' },
]
const NAV_OPS = [
  { label: 'Kilométrage', icon: 'gauge' },
  { label: 'Maintenance', icon: 'wrench' },
  { label: 'Contrôles', icon: 'inspection' },
  { label: 'Lavages', icon: 'droplets' },
  { label: 'Rapports', icon: 'report' },
]

const QUICK_ACTIONS = [
  { label: 'Ajouter un véhicule', icon: 'truck' },
  { label: 'Ajouter un conducteur', icon: 'users' },
  { label: 'Saisir un kilométrage', icon: 'gauge' },
]

const STATS = [
  { label: 'Véhicules', value: '14', sub: 'dans le parc' },
  { label: 'Conducteurs', value: '9', sub: 'actifs' },
  { label: 'Affectations', value: '12', sub: 'en cours' },
  { label: 'Échéances', value: '3', sub: 'sous 30 jours' },
]

const USAGE = [
  { plate: 'AB-123-CD', model: 'Renault Master', km: '4 120', pct: 100 },
  { plate: 'EF-456-GH', model: 'Peugeot Boxer', km: '3 480', pct: 84 },
  { plate: 'IJ-789-KL', model: 'Citroën Jumpy', km: '2 650', pct: 64 },
  { plate: 'MN-012-OP', model: 'Ford Transit', km: '2 200', pct: 53 },
]

// Décalage de la révélation, en millisecondes.
const delay = ms => ({ animationDelay: `${ms}ms` })

function NavItem({ item, at = 0 }) {
  return (
    <div
      style={delay(at)}
      className={`reveal-item relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[11.5px] font-medium ${
        item.active ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600'
      }`}
    >
      {item.active && <span className="absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-r-full bg-[#0066FF]" />}
      <Icon name={item.icon} size={14} className={item.active ? 'text-[#0066FF]' : 'text-zinc-400'} />
      {item.label}
    </div>
  )
}

// Parallaxe au survol : l'écran s'incline légèrement vers le curseur, le halo
// glisse en sens inverse. Les transformations vivent sur des calques dédiés
// (.reveal-tilt, .reveal-depth) pour ne pas entrer en conflit avec les
// animations d'arrivée, qui occupent déjà `transform` sur le cadre et le halo.
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

export default function HeroSection() {
  const stageRef = useParallax()

  return (
    <section className="bg-white overflow-hidden border-b border-zinc-100">
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
        <div ref={stageRef} className="reveal-stage relative">
          <div className="reveal-depth pointer-events-none absolute -inset-x-16 -top-10 bottom-0 -z-10" aria-hidden="true">
            <div
              className="reveal-glow absolute inset-0"
              style={{ background: 'radial-gradient(55% 60% at 50% 10%, rgba(0,102,255,0.16) 0%, rgba(0,102,255,0.04) 45%, transparent 72%)' }}
            />
          </div>
        <div className="reveal-tilt">
        <div className="reveal-frame relative rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-2xl shadow-zinc-300/50">
          <div className="reveal-sheen" aria-hidden="true" />

          {/* Chrome navigateur */}
          <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2.5 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white border border-zinc-200 rounded px-4 py-1 text-[11px] text-zinc-500 flex items-center gap-2">
                <Icon name="lock" size={10} strokeWidth={2} />
                app.fleetdesk.fr/tableau-de-bord
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Navigation — identique à celle de l'application */}
            <aside className="hidden md:flex w-48 flex-shrink-0 flex-col border-r border-zinc-200 bg-white p-3">
              <div className="flex items-center gap-2 px-1.5 mb-5">
                <div className="w-6 h-6 bg-[#0066FF] rounded-md flex items-center justify-center flex-shrink-0">
                  <Icon name="brandMark" size={12} strokeWidth={2.5} className="text-white" />
                </div>
                <span className="text-[12.5px] font-semibold text-zinc-900 tracking-tight">FleetDesk</span>
              </div>

              <div className="space-y-0.5">
                {NAV_MAIN.map(n => <NavItem key={n.label} item={n} at={1775} />)}
              </div>

              <p style={delay(1812)} className="reveal-item px-2.5 pt-4 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Flotte</p>
              <div className="space-y-0.5">
                {NAV_FLEET.map((n, i) => <NavItem key={n.label} item={n} at={1825 + i * 56} />)}
              </div>

              <p style={delay(1981)} className="reveal-item px-2.5 pt-4 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Opérations</p>
              <div className="space-y-0.5">
                {NAV_OPS.map((n, i) => <NavItem key={n.label} item={n} at={1995 + i * 56} />)}
              </div>

              <div className="mt-auto pt-5">
                <div style={delay(2275)} className="reveal-item flex items-center gap-2.5 border-t border-zinc-100 pt-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[9.5px] font-semibold text-zinc-600 flex-shrink-0">TL</div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-800 leading-tight truncate">Thomas Lemaire</p>
                    <p className="text-[9.5px] text-zinc-500 truncate">Formule Pro</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Contenu */}
            <div className="flex-1 bg-zinc-50 p-4 sm:p-5 min-w-0">

              {/* En-tête */}
              <div style={delay(1850)} className="reveal-item flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] font-medium text-zinc-500 mb-0.5">Mercredi 20 mai 2026</p>
                  <h3 className="font-display text-lg font-semibold text-zinc-900 tracking-tight">Bonjour, Thomas</h3>
                  <p className="text-[11.5px] text-zinc-500 mt-0.5">Votre flotte en un coup d'œil.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#E5EEFF] text-[#0052D6] rounded-full px-3 py-1.5 text-[11px] font-semibold flex-shrink-0">
                  <Icon name="bell" size={13} strokeWidth={2} />
                  3 échéances
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_ACTIONS.map((a, i) => (
                  <div key={a.label} style={delay(1988 + i * 75)} className="reveal-item flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-[11.5px] font-medium text-zinc-700">
                    <Icon name={a.icon} size={13} className="text-zinc-500" />
                    {a.label}
                  </div>
                ))}
              </div>

              {/* Bandeau de chiffres */}
              <div className="flex flex-col sm:flex-row bg-white border border-zinc-200 rounded-xl overflow-hidden mb-4">
                {STATS.map((s, i) => (
                  <div key={s.label} style={delay(2150 + i * 100)} className={`reveal-item flex-1 px-4 py-3.5 min-w-0 ${i < STATS.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-zinc-200' : ''}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500 mb-2">{s.label}</p>
                    <p className="text-[22px] font-bold text-zinc-900 leading-none tracking-tight">{s.value}</p>
                    <p className="text-[10.5px] text-zinc-500 mt-1.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-[1fr_260px] gap-4 items-start">

                <div className="min-w-0">
                {/* Utilisation des véhicules */}
                <div style={delay(2475)} className="reveal-item bg-white border border-zinc-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <Icon name="chart" size={15} className="text-zinc-500" />
                      <p className="text-[12.5px] font-semibold text-zinc-900">Utilisation des véhicules</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      {['3 mois', '6 mois', '1 an'].map((r, i) => (
                        <span key={r} className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${i === 0 ? 'bg-[#E5EEFF] text-[#0052D6]' : 'text-zinc-500'}`}>{r}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {USAGE.map((u, i) => (
                      <div key={u.plate} style={delay(2575 + i * 112)} className="reveal-item flex items-center gap-3">
                        <div className="w-[92px] flex-shrink-0">
                          <p className="text-[11.5px] font-medium text-zinc-800 leading-tight">{u.plate}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{u.model}</p>
                        </div>
                        <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
                          <div
                            className="reveal-bar h-full rounded-full"
                            style={{ width: `${u.pct}%`, backgroundColor: `rgba(0,102,255,${0.95 - i * 0.16})`, animationDelay: `${2675 + i * 138}ms` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-zinc-700 w-[52px] text-right tabular-nums">{u.km} km</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-600">
                    <Icon name="trendingUp" size={13} className="text-[#0066FF]" strokeWidth={2} />
                    12 450 km ce mois, soit 8 % de plus qu'en avril.
                  </div>
                </div>

                  <div style={delay(2925)} className="reveal-item bg-white border border-zinc-200 rounded-xl p-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[12.5px] font-semibold text-zinc-900">Activité récente</p>
                      <span className="text-[10.5px] text-zinc-500">Tout voir</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { icon: 'gauge', t: 'Kilométrage saisi', s: 'AB-123-CD · 45 200 km', w: 'il y a 2 h', by: 'Karim T.' },
                        { icon: 'inspection', t: 'Contrôle technique enregistré', s: 'IJ-789-KL · valide jusqu\'au 12/04/2028', w: 'hier', by: 'Thomas L.' },
                        { icon: 'assignments', t: 'Véhicule affecté', s: 'MN-012-OP → Sophie Renard', w: 'lundi', by: 'Thomas L.' },
                      ].map(a => (
                        <div key={a.t} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                            <Icon name={a.icon} size={13} className="text-zinc-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11.5px] font-medium text-zinc-800 leading-tight truncate">{a.t}</p>
                            <p className="text-[10.5px] text-zinc-500 truncate">{a.s}</p>
                          </div>
                          <span className="text-[10px] text-zinc-500 flex-shrink-0">{a.w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colonne de droite : flotte + centre d'alertes */}
                <div className="space-y-4">

                  <div style={delay(2575)} className="reveal-item bg-white border border-zinc-200 rounded-xl p-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-7 h-7 bg-[#E5EEFF] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name="truck" size={14} className="text-[#0066FF]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-zinc-500">Flotte</p>
                        <p className="text-[12px] font-semibold text-zinc-900 leading-tight truncate">Transports Lemaire</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                      <div>
                        <p className="text-[10px] font-medium text-zinc-500 mb-0.5">Total</p>
                        <p className="text-base font-bold text-zinc-900">14 <span className="text-[11px] font-medium text-zinc-500">véhicules</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-zinc-500 mb-0.5">Affectés</p>
                        <p className="text-base font-bold text-zinc-900">12 <span className="text-[11px] font-medium text-zinc-500">/ 14</span></p>
                      </div>
                    </div>
                  </div>

                  <div style={delay(2725)} className="reveal-item bg-white border border-zinc-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon name="bell" size={14} className="text-zinc-500" />
                        <p className="text-[12.5px] font-semibold text-zinc-900">Centre d'alertes</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#0052D6] bg-[#E5EEFF] px-2 py-0.5 rounded-full">3</span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon name="truck" size={11} className="text-zinc-400" />
                      <span className="text-[9.5px] font-semibold text-zinc-500 uppercase tracking-[0.06em]">Véhicules</span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {[
                        { t: 'Contrôle technique', s: 'Renault Master', d: '3 j' },
                        { t: 'Vidange programmée', s: 'Peugeot Boxer', d: '12 j' },
                      ].map((a, i) => (
                        <div key={a.t} style={delay(3000 + i * 150)} className="reveal-item flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-zinc-800 leading-tight truncate">{a.t}</p>
                            <p className="text-[10px] text-zinc-600 truncate">{a.s}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-amber-800 flex-shrink-0">{a.d}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon name="users" size={11} className="text-zinc-400" />
                      <span className="text-[9.5px] font-semibold text-zinc-500 uppercase tracking-[0.06em]">Conducteurs</span>
                    </div>
                    <div style={delay(3300)} className="reveal-item flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-zinc-800 leading-tight truncate">Visite médicale</p>
                        <p className="text-[10px] text-zinc-600 truncate">Sophie Renard</p>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-800 flex-shrink-0">15 j</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100 text-[10.5px] text-zinc-600">
                      <Icon name="check" size={12} strokeWidth={2.5} className="text-[#0066FF] flex-shrink-0" />
                      Détecté 30 jours avant l'échéance.
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>
    </section>
  )
}
