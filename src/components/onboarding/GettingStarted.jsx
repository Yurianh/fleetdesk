import React from 'react'
import { Truck, Users, ArrowLeftRight, ClipboardCheck, Check, X, Sparkles, ArrowRight, PlayCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOnboarding } from '@/lib/OnboardingContext'

// First-run guided checklist. Steps auto-complete from real fleet data, so the
// card reflects genuine progress — no fake tutorial state. Shown on the Dashboard
// while visible in OnboardingContext; dismissable and replayable from the sidebar.
export default function GettingStarted({
  vehiclesCount, driversCount, assignedCount, inspectionsCount,
  onAddVehicle, onAddDriver, onAssign, onAddInspection,
}) {
  const { t } = useTranslation()
  const { dismissChecklist, startTour } = useOnboarding()

  const steps = [
    {
      done: vehiclesCount > 0,
      icon: Truck,
      title: t('gettingStarted.step1Title'),
      desc: t('gettingStarted.step1Desc'),
      cta: t('gettingStarted.step1Cta'),
      action: onAddVehicle,
    },
    {
      done: driversCount > 0,
      icon: Users,
      title: t('gettingStarted.step2Title'),
      desc: t('gettingStarted.step2Desc'),
      cta: t('gettingStarted.step2Cta'),
      action: onAddDriver,
    },
    {
      done: assignedCount > 0,
      icon: ArrowLeftRight,
      title: t('gettingStarted.step3Title'),
      desc: t('gettingStarted.step3Desc'),
      cta: t('gettingStarted.step3Cta'),
      action: onAssign,
      // Can't assign before there is a vehicle and a driver
      locked: vehiclesCount === 0 || driversCount === 0,
    },
    {
      done: inspectionsCount > 0,
      icon: ClipboardCheck,
      title: t('gettingStarted.step4Title'),
      desc: t('gettingStarted.step4Desc'),
      cta: t('gettingStarted.step4Cta'),
      action: onAddInspection,
      locked: vehiclesCount === 0,
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const total = steps.length
  const allDone = doneCount === total
  const pct = Math.round((doneCount / total) * 100)
  // The first not-yet-done, unlocked step gets the primary CTA styling.
  const nextIdx = steps.findIndex(s => !s.done && !s.locked)

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-zinc-100">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#0066FF]/[0.08] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-zinc-900 leading-tight">
              {allDone ? t('gettingStarted.doneTitle') : t('gettingStarted.title')}
            </h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {allDone ? t('gettingStarted.doneSubtitle') : t('gettingStarted.subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={dismissChecklist}
          className="flex-shrink-0 text-xs font-medium text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"
          aria-label={allDone ? t('gettingStarted.finish') : t('gettingStarted.skip')}
        >
          {allDone ? t('gettingStarted.finish') : t('gettingStarted.skip')}
          {!allDone && <X className="w-3 h-3" />}
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 sm:px-6 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-500">{t('gettingStarted.progress', { done: doneCount, total })}</span>
          <span className="text-xs font-bold text-[#0066FF]">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#0066FF] transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="p-5 sm:p-6 pt-4 space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isNext = i === nextIdx
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                step.done
                  ? 'bg-emerald-50/60 border-emerald-100'
                  : isNext
                  ? 'bg-[#0066FF]/[0.03] border-[#0066FF]/20'
                  : 'bg-white border-zinc-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                step.done ? 'bg-emerald-500' : isNext ? 'bg-[#0066FF]' : 'bg-zinc-100'
              }`}>
                {step.done
                  ? <Check className="w-4 h-4 text-white" />
                  : <Icon className={`w-4 h-4 ${isNext ? 'text-white' : 'text-zinc-400'}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${
                  step.done ? 'text-emerald-700 line-through decoration-emerald-400/60' : 'text-zinc-900'
                }`}>
                  {step.title}
                </p>
                {!step.done && <p className="text-xs text-zinc-400 mt-0.5">{step.desc}</p>}
              </div>
              {!step.done && !step.locked && (
                <button
                  onClick={step.action}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors ${
                    isNext
                      ? 'text-white bg-[#0066FF] hover:bg-[#0052D6]'
                      : 'text-[#0066FF] bg-[#0066FF]/5 hover:bg-[#0066FF]/10'
                  }`}
                >
                  {step.cta} <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {!step.done && step.locked && (
                <span className="flex-shrink-0 text-[11px] text-zinc-300 font-medium">{t('gettingStarted.locked')}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer — replay the tour */}
      {!allDone && (
        <div className="px-5 sm:px-6 pb-4 -mt-1">
          <button
            onClick={startTour}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-[#0066FF] transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" /> {t('gettingStarted.replayTour')}
          </button>
        </div>
      )}
    </div>
  )
}
