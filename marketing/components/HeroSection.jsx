import { Link } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, Truck, Wrench, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const TABS = [
  { id: 'dashboard',    label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'vehicles',     label: 'Véhicules',        icon: Truck           },
  { id: 'maintenance',  label: 'Maintenance',      icon: Wrench          },
  { id: 'drivers',      label: 'Conducteurs',      icon: Users           },
]

function DashboardPanel() {
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-4 divide-x divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden">
        {[
          { label: 'Véhicules',  value: '14'    },
          { label: 'Conducteurs',value: '9'     },
          { label: 'Maintenance',value: '3',  warn: true },
          { label: 'Km ce mois', value: '4 812' },
        ].map(s => (
          <div key={s.label} className="px-3 py-2.5 bg-white">
            <p className="text-[9px] text-zinc-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-sm font-bold ${s.warn ? 'text-amber-600' : 'text-zinc-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-zinc-100 overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-zinc-700">Véhicules récents</p>
          <span className="text-[10px] text-[#2563EB]">Voir tout</span>
        </div>
        {[
          { name: 'Renault Master',  plate: 'BL-934-RM', driver: 'Karim T.',  ok: true  },
          { name: 'Peugeot Boxer',   plate: 'AP-271-KL', driver: 'Sophie M.', ok: false },
          { name: 'Citroën Jumpy',   plate: 'DF-108-XX', driver: 'Ahmed B.',  ok: true  },
        ].map(r => (
          <div key={r.plate} className="px-3 py-2 flex items-center justify-between border-b border-zinc-50 last:border-0">
            <div>
              <p className="text-[11px] font-medium text-zinc-800">{r.name}</p>
              <p className="text-[10px] text-zinc-400 font-mono">{r.plate} · {r.driver}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.ok ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
              {r.ok ? 'Valide' : 'Bientôt'}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        <p className="text-[10px] text-amber-800 font-medium">3 véhicules ont une maintenance due cette semaine</p>
      </div>
    </div>
  )
}

function VehiclesPanel() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { model: 'Renault Master',     plate: 'BL-934-RM', driver: 'Karim T.',   s: 'ok'       },
          { model: 'Peugeot Boxer',      plate: 'AP-271-KL', driver: 'Sophie M.',  s: 'warn'     },
          { model: 'Citroën Jumpy',      plate: 'DF-108-XX', driver: 'Ahmed B.',   s: 'ok'       },
          { model: 'Ford Transit',       plate: 'GH-552-FT', driver: 'Lila N.',    s: 'ok'       },
          { model: 'Mercedes Sprinter',  plate: 'KP-773-MS', driver: 'Omar D.',    s: 'critical' },
          { model: 'VW Crafter',         plate: 'TR-219-VC', driver: 'Julie R.',   s: 'ok'       },
        ].map(v => (
          <div key={v.plate} className="bg-white rounded-lg border-2 border-dashed border-zinc-200 p-3">
            <div className="flex items-start justify-between mb-1">
              <p className="text-[11px] font-semibold text-zinc-800 leading-tight">{v.model}</p>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${v.s === 'ok' ? 'bg-emerald-500' : v.s === 'warn' ? 'bg-amber-500' : 'bg-red-500'}`} />
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">{v.plate}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{v.driver}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MaintenancePanel() {
  return (
    <div className="p-4 space-y-2">
      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        <p className="text-[10px] text-amber-800 font-medium">3 interventions dues cette semaine</p>
      </div>
      {[
        { vehicle: 'Peugeot Boxer',      type: 'Vidange + filtres',    due: "Aujourd'hui", cls: 'text-red-600 bg-red-50'     },
        { vehicle: 'Mercedes Sprinter',  type: 'Contrôle technique',   due: 'Dans 3 j.',   cls: 'text-amber-600 bg-amber-50' },
        { vehicle: 'Ford Transit',       type: 'Remplacement pneus',   due: 'Dans 5 j.',   cls: 'text-amber-600 bg-amber-50' },
        { vehicle: 'Renault Master',     type: 'Révision générale',    due: 'Dans 18 j.',  cls: 'text-zinc-500 bg-zinc-100'  },
        { vehicle: 'Citroën Jumpy',      type: 'Plaquettes de frein',  due: 'Dans 30 j.',  cls: 'text-zinc-500 bg-zinc-100'  },
      ].map(item => (
        <div key={item.vehicle} className="bg-white border border-zinc-100 rounded-lg px-3 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-800">{item.vehicle}</p>
            <p className="text-[10px] text-zinc-400">{item.type}</p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-3 ${item.cls}`}>{item.due}</span>
        </div>
      ))}
    </div>
  )
}

function DriversPanel() {
  return (
    <div className="p-4 space-y-1.5">
      {[
        { name: 'Karim Tahir',    initials: 'KT', vehicle: 'Renault Master',    active: true  },
        { name: 'Sophie Martin',  initials: 'SM', vehicle: 'Peugeot Boxer',     active: true  },
        { name: 'Ahmed Bensaid',  initials: 'AB', vehicle: 'Citroën Jumpy',     active: true  },
        { name: 'Lila Noir',      initials: 'LN', vehicle: 'Ford Transit',      active: false },
        { name: 'Omar Diallo',    initials: 'OD', vehicle: 'Mercedes Sprinter', active: true  },
        { name: 'Julie Renard',   initials: 'JR', vehicle: 'VW Crafter',        active: false },
      ].map(d => (
        <div key={d.name} className="bg-white border border-zinc-100 rounded-lg px-3 py-2.5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[#2563EB]">{d.initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-zinc-800">{d.name}</p>
            <p className="text-[10px] text-zinc-400 truncate">{d.vehicle}</p>
          </div>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${d.active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
        </div>
      ))}
    </div>
  )
}

const PANELS = {
  dashboard:   <DashboardPanel   />,
  vehicles:    <VehiclesPanel    />,
  maintenance: <MaintenancePanel />,
  drivers:     <DriversPanel     />,
}

function InteractiveWindow() {
  const { t } = useTranslation()
  const [active, setActive]   = useState('dashboard')
  const [visible, setVisible] = useState(true)

  const switchTo = (id) => {
    if (id === active) return
    setVisible(false)
    setTimeout(() => { setActive(id); setVisible(true) }, 140)
  }

  // Auto-rotate every 3.5 s
  useEffect(() => {
    const ids = TABS.map(t => t.id)
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActive(prev => {
          const next = ids[(ids.indexOf(prev) + 1) % ids.length]
          return next
        })
        setVisible(true)
      }, 140)
    }, 18000)
    return () => clearInterval(timer)
  }, [])

  const currentTab = TABS.find(t => t.id === active)

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-2xl shadow-slate-200/80 select-none">
      {/* Window chrome */}
      <div className="bg-zinc-50 border-b border-zinc-100 h-8 flex items-center px-4 gap-1.5 flex-shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
        <span className="ml-3 text-[11px] text-zinc-400 font-mono">
          FleetDesk — {currentTab?.label}
        </span>
      </div>

      {/* App body */}
      <div className="flex bg-zinc-50" style={{ height: '340px' }}>

        {/* Mini sidebar */}
        <div className="w-36 border-r border-zinc-100 bg-white flex flex-col py-2 flex-shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = active === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => switchTo(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 mx-1.5 rounded-md text-left transition-colors duration-100 ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-100 ${isActive ? 'text-[#2563EB]' : ''}`}
                />
                <span className="text-[11px] font-medium truncate">{t(`marketing.hero.tabs.${tab.id}`)}</span>
              </button>
            )
          })}

          {/* Progress dots at bottom */}
          <div className="mt-auto px-3 pb-3 flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => switchTo(tab.id)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  active === tab.id ? 'bg-[#2563EB] w-4' : 'bg-zinc-200 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0px)' : 'translateY(5px)',
              transition: 'opacity 140ms ease, transform 140ms ease',
            }}
          >
            {PANELS[active]}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function HeroSection() {
  const { t } = useTranslation()
  return (
    <section className="relative bg-background overflow-hidden">

      {/* Subtle grid — masked to left quadrant */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 60% 70% at 0% 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 0% 0%, black 40%, transparent 100%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 items-center">

          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#2563EB]/[0.07] border border-[#2563EB]/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
              <span className="text-xs font-medium text-[#2563EB]">Simple fleet management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.1] mb-6" style={{ textWrap: 'balance' }}>
              {t('marketing.hero.headline1')}<br />
              {t('marketing.hero.headline2')}{' '}
              <span className="text-[#2563EB]">{t('marketing.hero.headline3')}</span>
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed max-w-lg mb-10">
              {t('marketing.hero.sub')}
            </p>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
            >
              {t('marketing.hero.cta')}
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="mt-6 text-xs text-zinc-400">
              {t('marketing.cta.note')}
            </p>
          </div>

          {/* Right: Interactive window */}
          <div className="hidden lg:block">
            <InteractiveWindow />
          </div>

        </div>
      </div>
    </section>
  )
}
