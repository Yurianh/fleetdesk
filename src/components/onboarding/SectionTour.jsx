import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'
import { useOnboarding } from '@/lib/OnboardingContext'

// On-page coach-mark tour, launched from Settings → Tutoriels. It navigates to
// the real section page and spotlights actual elements (no popup replica, no
// interaction with the page → nothing is written). Anchors:
//   [data-tour="tut-header"] — the PageHeader (title + primary action), on every page
//   [data-tour="alerts"]     — the dashboard alert center
const HEADER = '[data-tour="tut-header"]'
const TOOLTIP_W = 340

const twoStep = (title, intro, actionBody) => [
  { selector: null, title, body: intro },
  { selector: HEADER, title: 'Barre d’action', body: actionBody },
]

export const SECTION_TOURS = {
  dashboard: {
    route: '/Dashboard',
    steps: [
      { selector: null, title: 'Tableau de bord', body: 'Votre vue d’ensemble : indicateurs clés et alertes à traiter en priorité.' },
      { selector: '[data-tour="alerts"]', title: 'Alertes', body: 'Documents, contrôles techniques et entretiens à échéance remontent ici en premier.' },
    ],
  },
  vehicles:    { route: '/Vehicles',    steps: twoStep('Véhicules', 'Ajoutez et suivez chaque véhicule de votre flotte.', 'Le bouton en haut à droite ouvre le formulaire d’ajout d’un véhicule.') },
  drivers:     { route: '/Drivers',     steps: twoStep('Conducteurs', 'Gérez les fiches conducteurs et leurs documents réglementaires.', 'Ce bouton crée une fiche conducteur.') },
  assignments: { route: '/Assignments', steps: twoStep('Affectations', 'Affectez un conducteur à un véhicule ; l’historique se construit tout seul.', 'Ce bouton crée une nouvelle affectation.') },
  mileage:     { route: '/Mileage',     steps: twoStep('Kilométrage', 'Relevez le kilométrage, avec le conducteur et sa carte DKV.', 'Ce bouton enregistre un relevé (km, libellé, facture).') },
  maintenance: { route: '/Maintenance', steps: twoStep('Maintenance', 'Consignez entretiens et réparations, suivez les échéances.', 'Ajoutez un entretien depuis cette barre d’action.') },
  inspections: { route: '/Inspections', steps: twoStep('Contrôles techniques', 'Suivez les contrôles techniques et soyez alerté avant l’échéance.', 'Ce bouton enregistre un contrôle technique.') },
  washings:    { route: '/Washings',    steps: twoStep('Lavages', 'Enregistrez les lavages de vos véhicules.', 'Ce bouton ajoute un lavage.') },
}

export default function SectionTour() {
  const { sectionTour, endSectionTour } = useOnboarding()
  const navigate = useNavigate()
  const location = useLocation()
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState(null)

  const config = sectionTour ? SECTION_TOURS[sectionTour] : null

  // Starting a tour: reset to step 0 and navigate to the section page.
  useEffect(() => {
    if (!sectionTour) return
    setIdx(0)
    const target = SECTION_TOURS[sectionTour]?.route
    if (target && location.pathname !== target) navigate(target)
  }, [sectionTour])

  const step = config?.steps[idx]
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  const measure = useCallback(() => {
    if (!step || !step.selector || !isDesktop) { setRect(null); return }
    const el = document.querySelector(step.selector)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.bottom < 0) { setRect(null); return }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height, right: r.right, bottom: r.bottom })
  }, [step, isDesktop])

  // Re-measure — with retries, since the target may mount just after navigation.
  useEffect(() => {
    if (!config) return
    measure()
    const timers = [80, 200, 400, 700].map(d => setTimeout(measure, d))
    const onChange = () => measure()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [config, idx, measure])

  useEffect(() => {
    if (!config) return
    const onKey = (e) => {
      if (e.key === 'Escape') endSectionTour()
      else if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, config.steps.length - 1))
      else if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [config, endSectionTour])

  if (!config || !step) return null

  const isFirst = idx === 0
  const isLast = idx === config.steps.length - 1

  let tipStyle
  if (rect) {
    const below = rect.bottom + 16 + 220 < window.innerHeight
    const left = Math.max(16, Math.min(rect.left, window.innerWidth - TOOLTIP_W - 16))
    const top = below ? rect.bottom + 14 : Math.max(16, rect.top - 240)
    tipStyle = { position: 'fixed', top, left, width: TOOLTIP_W }
  } else {
    tipStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: `min(${TOOLTIP_W}px, calc(100vw - 32px))` }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      {rect ? (
        <div
          className="fixed rounded-xl pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: rect.top - 6, left: rect.left - 6,
            width: rect.width + 12, height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(15,23,42,0.55)',
            outline: '2px solid rgba(0,102,255,0.9)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[#0f172a]/55" onClick={endSectionTour} />
      )}

      <div style={tipStyle} className="bg-white rounded-2xl shadow-2xl border border-zinc-100 p-5 z-[61]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#0066FF]/[0.08] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#0066FF]" />
          </div>
          <button onClick={endSectionTour} className="text-zinc-300 hover:text-zinc-600 transition-colors -mr-1 -mt-0.5" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-bold text-zinc-900 mb-1.5">{step.title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed mb-5">{step.body}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {config.steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-5 bg-[#0066FF]' : 'w-1.5 bg-zinc-200'}`} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {!isFirst && (
              <button onClick={() => setIdx(i => i - 1)} className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 px-2.5 py-2 rounded-lg hover:bg-zinc-50 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Précédent
              </button>
            )}
            {isLast ? (
              <button onClick={endSectionTour} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0066FF] hover:bg-[#0052D6] px-4 py-2 rounded-lg transition-colors">
                Terminer
              </button>
            ) : (
              <button onClick={() => setIdx(i => i + 1)} className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#0066FF] hover:bg-[#0052D6] px-4 py-2 rounded-lg transition-colors">
                Suivant <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
