import React from 'react'
import { Gauge, Droplets, ArrowLeftRight, Users, Sparkles, ArrowRight, X, PlayCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOnboarding } from '@/lib/OnboardingContext'

// Onboarding for invited accounts (collaborators). Unlike the owner's
// fleet-setup checklist, this is a role-tailored set of quick actions:
//  - driver (chauffeur, restricted): only mileage + wash on their own vehicle
//  - member: daily operations across the fleet
//  - admin:  operations + team management
export default function MemberOnboarding({ role = 'member', onLogMileage, onLogWash, onAssign, onManageTeam }) {
  const { t } = useTranslation()
  const { dismissChecklist, startTour } = useOnboarding()

  const actions = [
    { key: 'mileage', icon: Gauge,        title: t('memberOnboarding.mileage'), desc: t('memberOnboarding.mileageDesc'), onClick: onLogMileage, roles: ['driver', 'member', 'admin'] },
    { key: 'wash',    icon: Droplets,     title: t('memberOnboarding.wash'),    desc: t('memberOnboarding.washDesc'),    onClick: onLogWash,    roles: ['driver', 'member', 'admin'] },
    { key: 'assign',  icon: ArrowLeftRight, title: t('memberOnboarding.assign'), desc: t('memberOnboarding.assignDesc'), onClick: onAssign,     roles: ['member', 'admin'] },
    { key: 'team',    icon: Users,        title: t('memberOnboarding.team'),    desc: t('memberOnboarding.teamDesc'),    onClick: onManageTeam, roles: ['admin'] },
  ].filter(a => a.roles.includes(role) && a.onClick)

  const isDriver = role === 'driver'

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-zinc-100">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#0066FF]/[0.08] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-zinc-900 leading-tight">{t('memberOnboarding.title')}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">{t(`memberOnboarding.subtitle_${role}`)}</p>
          </div>
        </div>
        <button
          onClick={dismissChecklist}
          className="flex-shrink-0 text-xs font-medium text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1"
        >
          {t('gettingStarted.skip')}<X className="w-3 h-3" />
        </button>
      </div>

      {/* Intro line (driver gets the auto-vehicle reassurance) */}
      {isDriver && (
        <div className="px-5 sm:px-6 pt-4">
          <p className="text-sm text-zinc-500 bg-[#0066FF]/[0.04] border border-[#0066FF]/15 rounded-xl px-4 py-3">
            {t('memberOnboarding.driverNote')}
          </p>
        </div>
      )}

      {/* Action cards */}
      <div className="p-5 sm:p-6 pt-4 grid sm:grid-cols-2 gap-2.5">
        {actions.map(({ key, icon: Icon, title, desc, onClick }, i) => (
          <button
            key={key}
            onClick={onClick}
            className={`group flex items-center gap-3 text-left rounded-xl border px-4 py-3 transition-colors ${
              i === 0 ? 'bg-[#0066FF]/[0.03] border-[#0066FF]/20' : 'bg-white border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-[#0066FF]' : 'bg-zinc-100'}`}>
              <Icon className={`w-4 h-4 ${i === 0 ? 'text-white' : 'text-zinc-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-[#0066FF] flex-shrink-0 transition-colors" />
          </button>
        ))}
      </div>

      {/* Footer — replay tour (not for drivers: restricted nav, no tour) */}
      {!isDriver && (
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
