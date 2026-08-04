import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Truck, Layers, Bell, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOnboarding } from '@/lib/OnboardingContext'

// Lightweight spotlight tour — no external dependency. Anchors to elements
// tagged with data-tour="…"; on mobile (or when a target is missing) it falls
// back to a centered card with a plain dim overlay. Auto-starts once for new
// admins and is replayable from the checklist / sidebar.
const STEPS = [
  { key: 'welcome',    icon: Sparkles, selector: null },
  { key: 'fleet',      icon: Truck,    selector: '[data-tour="fleet"]' },
  { key: 'operations', icon: Layers,   selector: '[data-tour="operations"]' },
  { key: 'alerts',     icon: Bell,     selector: '[data-tour="alerts"]' },
]

const TOOLTIP_W = 340

export default function ProductTour() {
  const { tourOpen, endTour, tourAuto, accountType } = useOnboarding()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState(null)

  // Finishing the first-run tour sends an admin to complete their own profile.
  const finishTour = useCallback(() => {
    const nudgeProfile = tourAuto && accountType === 'admin'
    endTour()
    if (nudgeProfile) navigate('/mon-profil')
  }, [tourAuto, accountType, endTour, navigate])

  const step = STEPS[idx]
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  const measure = useCallback(() => {
    if (!step?.selector || !isDesktop) { setRect(null); return }
    const el = document.querySelector(step.selector)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    // Off-screen (e.g. collapsed/hidden) → treat as no anchor
    if (r.width === 0 || r.left < 0) { setRect(null); return }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right })
  }, [step, isDesktop])

  useEffect(() => {
    if (!tourOpen) return
    setIdx(0)
  }, [tourOpen])

  useEffect(() => {
    if (!tourOpen) return
    measure()
    const onChange = () => measure()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [tourOpen, idx, measure])

  // Keyboard: Esc to skip, arrows to navigate
  useEffect(() => {
    if (!tourOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') endTour()
      else if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, STEPS.length - 1))
      else if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tourOpen, endTour])

  if (!tourOpen) return null

  const isFirst = idx === 0
  const isLast = idx === STEPS.length - 1
  const Icon = step.icon

  // Tooltip placement: to the right of an anchored (sidebar) target, clamped to
  // the viewport; otherwise centered.
  let tipStyle
  if (rect) {
    const preferLeft = rect.left > window.innerWidth / 2
    let left = preferLeft ? rect.left - TOOLTIP_W - 16 : rect.right + 16
    left = Math.max(16, Math.min(left, window.innerWidth - TOOLTIP_W - 16))
    let top = Math.max(16, Math.min(rect.top, window.innerHeight - 260))
    tipStyle = { position: 'fixed', top, left, width: TOOLTIP_W }
  } else {
    tipStyle = {
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)', width: `min(${TOOLTIP_W}px, calc(100vw - 32px))`,
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      {/* Dim + spotlight. With an anchor we use a giant box-shadow to punch a hole. */}
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
        <div className="fixed inset-0 bg-[#0f172a]/55" onClick={endTour} />
      )}

      {/* Tooltip card */}
      <div
        style={tipStyle}
        className="bg-white rounded-2xl shadow-2xl border border-zinc-100 p-5 z-[61]"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-[#0066FF]/[0.08] flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-[#0066FF]" />
          </div>
          <button
            onClick={endTour}
            className="text-zinc-300 hover:text-zinc-600 transition-colors -mr-1 -mt-0.5"
            aria-label={t('tour.skip')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-bold text-zinc-900 mb-1.5">{t(`tour.${step.key}Title`)}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed mb-5">{t(`tour.${step.key}Body`)}</p>

        <div className="flex items-center justify-between">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx ? 'w-5 bg-[#0066FF]' : 'w-1.5 bg-zinc-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {!isFirst && (
              <button
                onClick={() => setIdx(i => i - 1)}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 px-2.5 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> {t('tour.back')}
              </button>
            )}
            {isLast ? (
              <button
                onClick={finishTour}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0066FF] hover:bg-[#0052D6] px-4 py-2 rounded-lg transition-colors"
              >
                {t('tour.finish')}
              </button>
            ) : (
              <button
                onClick={() => setIdx(i => i + 1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#0066FF] hover:bg-[#0052D6] px-4 py-2 rounded-lg transition-colors"
              >
                {t('tour.next')} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {isFirst && (
          <button
            onClick={endTour}
            className="mt-3 w-full text-center text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {t('tour.skipAll')}
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
