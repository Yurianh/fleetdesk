import { useState } from 'react'

const APP_URL = 'https://app.fleetdesk.fr'

const TABS = [
  { id: 'dashboard',   label: 'Tableau de bord' },
  { id: 'vehicles',    label: 'Véhicules'        },
  { id: 'maintenance', label: 'Maintenance'      },
  { id: 'drivers',     label: 'Conducteurs'      },
]

const SB = ({ activeIndex }) => (
  <div className="w-44 border-r border-zinc-200 bg-white flex-shrink-0 p-3 space-y-1">
    <div className="flex items-center gap-2 px-2 py-2 mb-3">
      <div className="w-5 h-5 bg-[#0066FF] rounded flex items-center justify-center flex-shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
          <rect x="9" y="11" width="14" height="10" rx="2"/>
        </svg>
      </div>
      <span className="text-[11px] font-semibold text-zinc-900">FleetDesk</span>
    </div>
    {[
      { label: 'Tableau de bord' },
      { label: 'Véhicules' },
      { label: 'Conducteurs' },
      { label: 'Affectations' },
    ].map((i, idx) => (
      <div key={i.label} className={`px-2 py-1.5 rounded-md text-[10px] font-medium ${idx === activeIndex ? 'bg-[#E5EEFF] text-[#0066FF]' : 'text-zinc-400'}`}>
        {i.label}
      </div>
    ))}
    <div className="pt-2">
      <p className="px-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-300 mb-1">Opérations</p>
      {['Kilométrage', 'Maintenance', 'Contrôles', 'Lavages'].map(l => (
        <div key={l} className="px-2 py-1.5 rounded-md text-[10px] text-zinc-400">{l}</div>
      ))}
    </div>
  </div>
)

function DashboardPanel() {
  return (
    <div className="flex h-full">
      <SB activeIndex={0} />
      <div className="flex-1 p-4 overflow-hidden bg-zinc-50">
        <p className="text-[11px] text-zinc-400 mb-1">Mercredi 20 Mai 2026</p>
        <h2 className="text-sm font-bold text-zinc-900 mb-4">Bonjour, Thomas 👋</h2>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Véhicules',   value: '14' },
            { label: 'Conducteurs', value: '9' },
            { label: 'Maintenance', value: '3', warn: true },
            { label: 'Km ce mois',  value: '4 812' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-zinc-200 rounded-lg px-3 py-2">
              <p className="text-[9px] text-zinc-400 uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`text-sm font-bold font-mono ${s.warn ? 'text-amber-500' : 'text-zinc-900'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
            <p className="text-[10px] font-semibold text-zinc-700">Véhicules récents</p>
            <span className="text-[9px] text-[#0066FF]">Voir tout</span>
          </div>
          {[
            { name: 'Renault Master', plate: 'BL-934-RM', driver: 'Karim T.',  ok: true  },
            { name: 'Peugeot Boxer',  plate: 'AP-271-KL', driver: 'Sophie M.', ok: false },
            { name: 'Citroën Jumpy',  plate: 'DF-108-XX', driver: 'Ahmed B.',  ok: true  },
          ].map(r => (
            <div key={r.plate} className="px-3 py-2 flex items-center justify-between border-b border-zinc-100 last:border-0">
              <div>
                <p className="text-[10px] font-semibold text-zinc-800">{r.name}</p>
                <p className="text-[9px] text-zinc-400 font-mono">{r.plate} · {r.driver}</p>
              </div>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${r.ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {r.ok ? 'Actif' : 'Attention'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function VehiclesPanel() {
  return (
    <div className="flex h-full">
      <SB activeIndex={1} />
      <div className="flex-1 p-4 bg-zinc-50">
        <h2 className="text-sm font-bold text-zinc-900 mb-1">Véhicules</h2>
        <p className="text-[10px] text-zinc-400 mb-3">14 véhicules · 12 affectés</p>
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-100 flex gap-4">
            {['Immatriculation', 'Conducteur', 'Km', 'CT'].map(h => (
              <p key={h} className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 flex-1">{h}</p>
            ))}
          </div>
          {[
            { plate: 'BL-934-RM', name: 'Renault Master', driver: 'Karim T.',  km: '48 200', ct: 'juin 25' },
            { plate: 'AP-271-KL', name: 'Peugeot Boxer',  driver: 'Sophie M.', km: '62 500', ct: 'déc. 24', warn: true },
            { plate: 'DF-108-XX', name: 'Citroën Jumpy',  driver: 'Ahmed B.',  km: '31 100', ct: 'mars 25' },
            { plate: 'ER-019-VT', name: 'Ford Transit',   driver: 'Marie D.',  km: '89 700', ct: 'sept 25' },
          ].map(v => (
            <div key={v.plate} className="px-3 py-2.5 flex gap-4 items-center border-b border-zinc-100 last:border-0">
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-zinc-800">{v.name}</p>
                <p className="text-[9px] text-zinc-400 font-mono">{v.plate}</p>
              </div>
              <p className="text-[10px] text-zinc-500 flex-1">{v.driver}</p>
              <p className="text-[10px] font-mono text-zinc-600 flex-1">{v.km} km</p>
              <p className={`text-[10px] flex-1 ${v.warn ? 'text-amber-500' : 'text-zinc-400'}`}>{v.ct}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MaintenancePanel() {
  return (
    <div className="flex h-full">
      <SB activeIndex={-1} />
      <div className="flex-1 p-4 bg-zinc-50">
        <h2 className="text-sm font-bold text-zinc-900 mb-1">Maintenance</h2>
        <p className="text-[10px] text-zinc-400 mb-3">3 interventions à planifier</p>
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          {[
            { vehicle: 'Renault Master', type: 'Vidange',      due: 'Dans 800 km',   urgent: false },
            { vehicle: 'Peugeot Boxer',  type: 'Freins',       due: 'En retard',      urgent: true  },
            { vehicle: 'Ford Transit',   type: 'Filtres',      due: 'Dans 2 400 km', urgent: false },
            { vehicle: 'Citroën Jumpy',  type: 'Distribution', due: 'Dans 5 200 km', urgent: false },
          ].map(m => (
            <div key={m.vehicle + m.type} className="px-3 py-2.5 border-b border-zinc-100 last:border-0 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-zinc-800">{m.vehicle}</p>
                <p className="text-[9px] text-zinc-400">{m.type}</p>
              </div>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${m.urgent ? 'bg-red-50 text-red-500' : 'bg-zinc-100 text-zinc-400'}`}>
                {m.due}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DriversPanel() {
  return (
    <div className="flex h-full">
      <SB activeIndex={2} />
      <div className="flex-1 p-4 bg-zinc-50">
        <h2 className="text-sm font-bold text-zinc-900 mb-1">Conducteurs</h2>
        <p className="text-[10px] text-zinc-400 mb-3">9 conducteurs actifs</p>
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          {[
            { name: 'Karim Tarek',   vehicle: 'Renault Master', docs: '6/6' },
            { name: 'Sophie Martin', vehicle: 'Peugeot Boxer',  docs: '4/6', warn: true },
            { name: 'Ahmed Benzara', vehicle: 'Citroën Jumpy',  docs: '6/6' },
            { name: 'Marie Dupont',  vehicle: 'Ford Transit',   docs: '5/6' },
          ].map(d => (
            <div key={d.name} className="px-3 py-2.5 border-b border-zinc-100 last:border-0 flex items-center gap-3">
              <div className="w-6 h-6 bg-[#E5EEFF] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-bold text-[#0066FF]">{d.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-zinc-800 truncate">{d.name}</p>
                <p className="text-[9px] text-zinc-400 truncate">{d.vehicle}</p>
              </div>
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${d.warn ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {d.docs}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PANELS = { dashboard: DashboardPanel, vehicles: VehiclesPanel, maintenance: MaintenancePanel, drivers: DriversPanel }

export default function HeroSection() {
  const [tab, setTab] = useState('dashboard')
  const Panel = PANELS[tab]

  return (
    <section className="bg-white overflow-hidden border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-16 lg:pb-24">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-14 lg:gap-10 items-center">

          {/* Left — copy, left-aligned */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-[#E5EEFF] text-[#0066FF] text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                <rect x="9" y="11" width="14" height="10" rx="2"/>
                <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              </svg>
              Pour les flottes de 2 à 50 véhicules
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-zinc-900 tracking-tight leading-[1.05] mb-6">
              Zéro contrôle raté.<br />
              Zéro document expiré.<br />
              <span className="text-[#0066FF]">Zéro panne surprise.</span>
            </h1>

            <p className="text-lg text-zinc-500 leading-relaxed mb-8">
              FleetDesk surveille chaque véhicule et chaque conducteur à votre place, et vous alerte avant l'échéance. Toute votre flotte, dans un seul outil.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <a href={`${APP_URL}/login?plan=pro`}
                className="inline-flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0052D6] text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#0066FF]/25">
                Essayer gratuitement
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
              <a href="#how"
                className="inline-flex items-center justify-center gap-2 border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900 font-medium text-sm px-8 py-3.5 rounded-xl transition-all">
                Comment ça marche
              </a>
            </div>

            <div className="flex items-center gap-x-5 gap-y-2 text-sm text-zinc-500 flex-wrap">
              {['14 jours d\'essai', 'Sans carte bancaire', 'Hébergé en France'].map((item, i) => (
                <div key={item} className="flex items-center gap-2">
                  {i > 0 && <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-300 -ml-2.5" />}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right: product mockup, tilted with depth, bleeding off the right edge */}
          <div className="relative lg:-mr-24 xl:-mr-44" style={{ perspective: '1800px' }}>
            <div className="relative lg:[transform:rotateY(-9deg)_rotateX(3deg)] lg:origin-left transition-transform duration-500">
              {/* Browser window */}
              <div className="rounded-xl overflow-hidden shadow-2xl shadow-zinc-300/60 border border-zinc-200 bg-white">
                {/* Chrome bar */}
                <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2.5 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white border border-zinc-200 rounded px-4 py-1 text-[11px] text-zinc-400 flex items-center gap-2">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      app.fleetdesk.fr
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-0.5 px-4 pt-2 bg-white border-b border-zinc-200 overflow-x-auto">
                  {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`px-3.5 py-1.5 text-[11px] font-medium rounded-t-lg transition-all whitespace-nowrap ${
                        tab === t.id
                          ? 'bg-zinc-50 border border-b-0 border-zinc-200 text-zinc-900 -mb-px pb-[7px]'
                          : 'text-zinc-400 hover:text-zinc-600'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Panel */}
                <div className="min-h-[300px] sm:min-h-[340px]">
                  <Panel />
                </div>
              </div>

              {/* Floating alert card: makes the value (proactive alert) explicit */}
              <div className="hidden sm:flex absolute -left-5 lg:-left-10 bottom-10 items-center gap-3 bg-white rounded-xl shadow-xl shadow-zinc-300/50 border border-zinc-100 pl-3 pr-4 py-2.5">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-900 leading-tight">Contrôle technique</p>
                  <p className="text-[11px] text-red-500 leading-tight">AB-123-CD expire dans 3 jours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
