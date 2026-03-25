import { useState } from 'react'

const APP_URL = 'https://app.fleetdesk.fr'

const TABS = [
  { id: 'dashboard',   label: 'Tableau de bord' },
  { id: 'vehicles',    label: 'Véhicules'        },
  { id: 'maintenance', label: 'Maintenance'      },
  { id: 'drivers',     label: 'Conducteurs'      },
]

function DashboardPanel() {
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-4 divide-x divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden">
        {[
          { label: 'Véhicules',   value: '14'    },
          { label: 'Conducteurs', value: '9'     },
          { label: 'Maintenance', value: '3',  warn: true },
          { label: 'Km ce mois',  value: '4 812' },
        ].map(s => (
          <div key={s.label} className="px-3 py-2.5 bg-white">
            <p className="text-[9px] text-zinc-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-sm font-bold font-mono ${s.warn ? 'text-amber-600' : 'text-zinc-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-zinc-100 overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-zinc-700">Véhicules récents</p>
          <span className="text-[10px] text-[#2563EB]">Voir tout</span>
        </div>
        {[
          { name: 'Renault Master', plate: 'BL-934-RM', driver: 'Karim T.',  ok: true  },
          { name: 'Peugeot Boxer',  plate: 'AP-271-KL', driver: 'Sophie M.', ok: false },
          { name: 'Citroën Jumpy',  plate: 'DF-108-XX', driver: 'Ahmed B.',  ok: true  },
        ].map(r => (
          <div key={r.plate} className="px-3 py-2 flex items-center justify-between hover:bg-zinc-50">
            <div>
              <p className="text-[11px] font-semibold text-zinc-800">{r.name}</p>
              <p className="text-[10px] text-zinc-400 font-mono">{r.plate} · {r.driver}</p>
            </div>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {r.ok ? 'Actif' : 'Attention'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VehiclesPanel() {
  return (
    <div className="p-4">
      <div className="bg-white rounded-lg border border-zinc-100 overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-100">
          <p className="text-[11px] font-semibold text-zinc-700">Registre des véhicules</p>
        </div>
        {[
          { name: 'Renault Master', plate: 'BL-934-RM', km: '48 200', ct: '2025-06' },
          { name: 'Peugeot Boxer',  plate: 'AP-271-KL', km: '62 500', ct: '2024-12' },
          { name: 'Citroën Jumpy',  plate: 'DF-108-XX', km: '31 100', ct: '2025-03' },
          { name: 'Ford Transit',   plate: 'ER-019-VT', km: '89 700', ct: '2025-09' },
        ].map(v => (
          <div key={v.plate} className="px-3 py-2.5 border-b border-zinc-50 flex items-center justify-between last:border-0 hover:bg-zinc-50">
            <div>
              <p className="text-[11px] font-semibold text-zinc-800">{v.name}</p>
              <p className="text-[10px] text-zinc-400 font-mono">{v.plate}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-mono text-zinc-700">{v.km} km</p>
              <p className="text-[10px] text-zinc-400">CT {v.ct}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MaintenancePanel() {
  return (
    <div className="p-4 space-y-2">
      <div className="bg-white rounded-lg border border-zinc-100 overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-100">
          <p className="text-[11px] font-semibold text-zinc-700">Prochaines maintenances</p>
        </div>
        {[
          { name: 'Renault Master', type: 'Vidange',       due: 'Dans 800 km',  urgent: false },
          { name: 'Peugeot Boxer',  type: 'Freins',        due: 'En retard',    urgent: true  },
          { name: 'Ford Transit',   type: 'Filtres',       due: 'Dans 2 400 km',urgent: false },
          { name: 'Citroën Jumpy',  type: 'Distribution',  due: 'Dans 5 200 km',urgent: false },
        ].map(m => (
          <div key={m.name + m.type} className="px-3 py-2.5 border-b border-zinc-50 flex items-center justify-between last:border-0 hover:bg-zinc-50">
            <div>
              <p className="text-[11px] font-semibold text-zinc-800">{m.name}</p>
              <p className="text-[10px] text-zinc-400">{m.type}</p>
            </div>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${m.urgent ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500'}`}>
              {m.due}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DriversPanel() {
  return (
    <div className="p-4">
      <div className="bg-white rounded-lg border border-zinc-100 overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-100">
          <p className="text-[11px] font-semibold text-zinc-700">Conducteurs actifs</p>
        </div>
        {[
          { name: 'Karim Tarek',   vehicle: 'Renault Master', since: 'Depuis jan. 2024' },
          { name: 'Sophie Martin', vehicle: 'Peugeot Boxer',  since: 'Depuis mars 2024' },
          { name: 'Ahmed Benzara', vehicle: 'Citroën Jumpy',  since: 'Depuis juin 2024' },
          { name: 'Marie Dupont',  vehicle: 'Ford Transit',   since: 'Depuis sept. 2024'},
        ].map(d => (
          <div key={d.name} className="px-3 py-2.5 border-b border-zinc-50 flex items-center gap-2.5 last:border-0 hover:bg-zinc-50">
            <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-zinc-500">{d.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-800 truncate">{d.name}</p>
              <p className="text-[10px] text-zinc-400 truncate">{d.vehicle} · {d.since}</p>
            </div>
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 flex-shrink-0">Actif</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PANELS = { dashboard: DashboardPanel, vehicles: VehiclesPanel, maintenance: MaintenancePanel, drivers: DriversPanel }

export default function HeroSection() {
  const [tab, setTab] = useState('dashboard')
  const Panel = PANELS[tab]

  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-24 sm:pt-20 sm:pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2563EB] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                <rect x="9" y="11" width="14" height="10" rx="2"/>
                <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              </svg>
              Logiciel de gestion de flotte
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 tracking-tight leading-[1.08] mb-6">
              Chaque véhicule.<br />
              Chaque conducteur.<br />
              <span className="text-[#2563EB]">Une seule plateforme.</span>
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed mb-8 max-w-lg">
              FleetDesk maintient votre flotte en marche — alertes de maintenance, suivi kilométrique, affectations des conducteurs et contrôles techniques, tout en un seul endroit.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href={`${APP_URL}/login?plan=starter`}
                className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors">
                Commencer gratuitement
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
              <a href="/features"
                className="inline-flex items-center justify-center text-sm font-medium text-zinc-500 hover:text-zinc-900 px-6 py-3 transition-colors">
                Voir les fonctionnalités
              </a>
            </div>
          </div>

          {/* Right: app preview */}
          <div className="relative">
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden shadow-xl shadow-zinc-200/60">
              {/* Window bar */}
              <div className="bg-white border-b border-zinc-200 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-zinc-100 rounded px-3 py-0.5 text-[10px] text-zinc-400 font-mono">app.fleetdesk.fr</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-3 pt-3 bg-white border-b border-zinc-100">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`px-3 py-1.5 text-[11px] font-medium rounded-t transition-colors ${
                      tab === t.id
                        ? 'bg-zinc-50 border border-zinc-200 border-b-0 text-zinc-900 -mb-px pb-[7px]'
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Panel */}
              <div className="bg-zinc-50 min-h-[220px]">
                <Panel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
