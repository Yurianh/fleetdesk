import { Truck, Users, ArrowLeftRight, Gauge, Wrench, ClipboardCheck, Droplets, BarChart3, Bell, Shield, ArrowRight } from 'lucide-react'
import FeatureCard from '@marketing/components/FeatureCard'
import CTASection from '@marketing/components/CTASection'
import { useTranslation } from 'react-i18next'

// ── Feature preview micro-UIs ─────────────────────────────────────────────────

function VehicleRegistryPreview() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Fiche véhicule</p>
      <div className="bg-zinc-50 rounded-xl p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-semibold text-zinc-900">Renault Master</p>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">BL-934-RM · 2021</p>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Actif</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[['Kilométrage', '92 471 km', true], ['Dernier service', '14 mar. 2025', false]].map(([l, v, mono]) => (
            <div key={l} className="bg-white rounded-lg p-2">
              <p className="text-[9px] text-zinc-400 mb-0.5">{l}</p>
              <p className={`text-[12px] font-bold text-zinc-900 ${mono ? 'font-mono' : ''}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg p-2">
          <p className="text-[9px] text-zinc-400 mb-0.5">Conducteur assigné</p>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-[#2563EB]">KT</span>
            </div>
            <p className="text-[12px] font-semibold text-zinc-800">Karim Tahir</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DriverProfilesPreview() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Profil conducteur</p>
      <div className="bg-zinc-50 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[13px] font-bold text-[#2563EB]">SM</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-zinc-900">Sophie Martin</p>
            <p className="text-[11px] text-zinc-400">+33 6 47 82 13 09</p>
          </div>
        </div>
        {[['Permis', 'Catégorie B', 'text-zinc-900'], ['Expiration permis', '12 juil. 2029', 'text-emerald-700'], ['Véhicule assigné', 'Peugeot Boxer', 'text-zinc-900']].map(([l, v, cls]) => (
          <div key={l} className="bg-white rounded-lg px-3 py-2 flex items-center justify-between">
            <p className="text-[11px] text-zinc-400">{l}</p>
            <p className={`text-[11px] font-semibold ${cls}`}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssignmentsPreview() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Affectations récentes</p>
      <div className="space-y-1.5">
        {[
          { vehicle: 'Renault Master', plate: 'BL-934-RM', driver: 'Karim Tahir', date: 'Depuis 12 jan.' },
          { vehicle: 'Peugeot Boxer',  plate: 'AP-271-KL', driver: 'Sophie Martin', date: 'Depuis 3 fév.' },
          { vehicle: 'Ford Transit',   plate: 'GH-552-FT', driver: 'Lila Noir', date: 'Depuis 20 fév.' },
        ].map(a => (
          <div key={a.plate} className="bg-zinc-50 rounded-lg px-3 py-2.5 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-zinc-800 truncate">{a.vehicle}</p>
              <p className="text-[10px] text-zinc-400 font-mono">{a.plate}</p>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-300 flex-shrink-0" />
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] font-semibold text-zinc-800">{a.driver.split(' ')[0]}</p>
              <p className="text-[10px] text-zinc-400">{a.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MileagePreview() {
  const entries = [
    { date: 'Jan', km: 87240 },
    { date: 'Fév', km: 89180 },
    { date: 'Mar', km: 92471 },
  ]
  const max = Math.max(...entries.map(e => e.km))
  const min = Math.min(...entries.map(e => e.km))
  const bars = [32, 45, 58, 42, 67, 78, 90]

  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Renault Master · BL-934-RM</p>
      {/* Mini bar chart */}
      <div className="bg-zinc-50 rounded-xl p-3 mb-2">
        <div className="flex items-end gap-1 h-12 mb-2">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${h}%`,
                backgroundColor: i === bars.length - 1 ? '#2563EB' : '#e4e4e7',
              }}
            />
          ))}
        </div>
        <p className="text-[10px] text-zinc-400">7 derniers relevés · km parcourus</p>
      </div>
      {/* Last 3 readings */}
      <div className="space-y-1">
        {entries.map((e, i) => (
          <div key={e.date} className="flex items-center justify-between px-1">
            <p className="text-[11px] text-zinc-400">{e.date}</p>
            <p className="text-[12px] font-bold text-zinc-900">{e.km.toLocaleString('fr-FR')} km</p>
            {i > 0 && (
              <p className="text-[10px] text-emerald-600 font-semibold">+{(e.km - entries[i-1].km).toLocaleString('fr-FR')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MaintenancePreview() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Historique maintenance</p>
      <div className="space-y-1.5">
        {[
          { label: 'Vidange + filtres',   date: '14 mar. 2025', done: true  },
          { label: 'Plaquettes de frein', date: '22 jan. 2025', done: true  },
          { label: 'Révision générale',   date: 'Due dans 18 j.', done: false },
          { label: 'Courroie distribution',date: 'Due dans 45 j.', done: false },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2.5 bg-zinc-50 rounded-lg px-3 py-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              <span className={`text-[9px] font-bold ${item.done ? 'text-emerald-600' : 'text-amber-600'}`}>{item.done ? '✓' : '○'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-zinc-800 truncate">{item.label}</p>
            </div>
            <p className={`text-[10px] font-semibold flex-shrink-0 ${item.done ? 'text-zinc-400' : 'text-amber-600'}`}>{item.date}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function InspectionsPreview() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Contrôles techniques</p>
      <div className="space-y-1.5">
        {[
          { vehicle: 'Renault Master',    result: 'Favorable', next: 'nov. 2026', cls: 'text-emerald-700 bg-emerald-50' },
          { vehicle: 'Peugeot Boxer',     result: 'À refaire',  next: 'dans 12 j.', cls: 'text-red-600 bg-red-50'       },
          { vehicle: 'Citroën Jumpy',     result: 'Favorable', next: 'avr. 2026', cls: 'text-emerald-700 bg-emerald-50' },
          { vehicle: 'Mercedes Sprinter', result: 'Bientôt',   next: 'dans 28 j.', cls: 'text-amber-600 bg-amber-50'   },
        ].map(v => (
          <div key={v.vehicle} className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2">
            <div>
              <p className="text-[11px] font-medium text-zinc-800">{v.vehicle}</p>
              <p className="text-[10px] text-zinc-400">Prochain: {v.next}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${v.cls}`}>{v.result}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WashPreview() {
  const months = [
    { m: 'Jan', count: 2, cost: 30 },
    { m: 'Fév', count: 3, cost: 45 },
    { m: 'Mar', count: 4, cost: 60 },
  ]
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Suivi lavages · flotte</p>
      <div className="grid grid-cols-3 divide-x divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden mb-2">
        {months.map(m => (
          <div key={m.m} className="px-3 py-2.5 bg-white text-center">
            <p className="text-[9px] text-zinc-400 mb-1">{m.m}</p>
            <p className="text-[13px] font-bold font-mono text-zinc-900">{m.count}</p>
            <p className="text-[10px] text-zinc-400">{m.cost} €</p>
          </div>
        ))}
      </div>
      <div className="bg-zinc-50 rounded-xl p-3 flex items-center justify-between">
        <p className="text-[11px] text-zinc-500">Coût moyen / lavage</p>
        <p className="text-[13px] font-bold font-mono text-zinc-900">15,00 €</p>
      </div>
    </div>
  )
}

function AnalyticsPreview() {
  const data = [
    { label: 'Oct', vals: [42, 28, 18] },
    { label: 'Nov', vals: [38, 32, 22] },
    { label: 'Déc', vals: [55, 24, 30] },
    { label: 'Jan', vals: [48, 36, 20] },
    { label: 'Fév', vals: [62, 29, 25] },
    { label: 'Mar', vals: [71, 40, 32] },
  ]
  const colors = ['#2563EB', '#d1d5db', '#e4e4e7']
  const maxVal = 71

  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Km / véhicule · 6 mois</p>
      <div className="bg-zinc-50 rounded-xl p-3">
        <div className="flex items-end gap-1.5 h-16 mb-2">
          {data.map(d => (
            <div key={d.label} className="flex-1 flex items-end gap-0.5">
              {d.vals.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{ height: `${(v / maxVal) * 100}%`, backgroundColor: colors[i] }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {data.map(d => (
            <p key={d.label} className="text-[9px] text-zinc-400 flex-1 text-center">{d.label}</p>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 px-1">
        {[['Master', '#2563EB'], ['Boxer', '#d1d5db'], ['Jumpy', '#e4e4e7']].map(([l, c]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: c }} />
            <p className="text-[10px] text-zinc-400">{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ForecastingPreview() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Interventions à prévoir</p>
      <div className="space-y-1.5">
        {[
          { vehicle: 'Peugeot Boxer',      type: 'Vidange',           due: "Aujourd'hui", cls: 'text-red-600 bg-red-50',     dot: 'bg-red-500'     },
          { vehicle: 'Mercedes Sprinter',  type: 'Contrôle technique', due: 'Dans 3 j.',  cls: 'text-amber-600 bg-amber-50', dot: 'bg-amber-500'   },
          { vehicle: 'Ford Transit',       type: 'Pneus',             due: 'Dans 5 j.',   cls: 'text-amber-600 bg-amber-50', dot: 'bg-amber-500'   },
          { vehicle: 'Renault Master',     type: 'Révision',          due: 'Dans 18 j.',  cls: 'text-zinc-500 bg-zinc-100',  dot: 'bg-zinc-300'    },
        ].map(item => (
          <div key={item.vehicle} className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-zinc-800">{item.vehicle}</p>
              <p className="text-[10px] text-zinc-400">{item.type}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${item.cls}`}>{item.due}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompliancePreview() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2.5">Vue conformité</p>
      <div className="space-y-1.5">
        {[
          { vehicle: 'Renault Master',    ct: 'Valide',   ins: 'Valide',   overall: 'ok'       },
          { vehicle: 'Peugeot Boxer',     ct: 'Expiré',   ins: 'Valide',   overall: 'critical' },
          { vehicle: 'Citroën Jumpy',     ct: 'Valide',   ins: 'Bientôt',  overall: 'warn'     },
          { vehicle: 'Ford Transit',      ct: 'Valide',   ins: 'Valide',   overall: 'ok'       },
          { vehicle: 'Mercedes Sprinter', ct: 'Bientôt',  ins: 'Valide',   overall: 'warn'     },
        ].map(v => {
          const color = v.overall === 'ok' ? 'bg-emerald-500' : v.overall === 'warn' ? 'bg-amber-500' : 'bg-red-500'
          return (
            <div key={v.vehicle} className="flex items-center gap-2.5 bg-zinc-50 rounded-lg px-3 py-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
              <p className="text-[11px] font-semibold text-zinc-800 flex-1">{v.vehicle}</p>
              <p className="text-[10px] text-zinc-400">CT: <span className="text-zinc-600">{v.ct}</span></p>
              <p className="text-[10px] text-zinc-400">Ass.: <span className="text-zinc-600">{v.ins}</span></p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Feature data ──────────────────────────────────────────────────────────────

export default function Features() {
  const { t } = useTranslation()

  const features = [
    {
      category: t('marketing.features.cat1'),
      items: [
        { icon: Truck,          title: t('marketing.features.vehicleRegistry_title'), description: t('marketing.features.vehicleRegistry_desc'), preview: <VehicleRegistryPreview /> },
        { icon: Users,          title: t('marketing.features.driverProfiles_title'),  description: t('marketing.features.driverProfiles_desc'),  preview: <DriverProfilesPreview /> },
        { icon: ArrowLeftRight, title: t('marketing.features.assignments_title'),      description: t('marketing.features.assignments_desc'),      preview: <AssignmentsPreview />    },
      ],
    },
    {
      category: t('marketing.features.cat2'),
      items: [
        { icon: Gauge,          title: t('marketing.features.mileage_title'),      description: t('marketing.features.mileage_desc'),      preview: <MileagePreview />        },
        { icon: Wrench,         title: t('marketing.features.maintenance_title'),  description: t('marketing.features.maintenance_desc'),  preview: <MaintenancePreview />    },
        { icon: ClipboardCheck, title: t('marketing.features.inspections_title'),  description: t('marketing.features.inspections_desc'),  preview: <InspectionsPreview />    },
        { icon: Droplets,       title: t('marketing.features.wash_title'),         description: t('marketing.features.wash_desc'),         preview: <WashPreview />           },
      ],
    },
    {
      category: t('marketing.features.cat3'),
      items: [
        { icon: BarChart3, title: t('marketing.features.analytics_title'),   description: t('marketing.features.analytics_desc'),   preview: <AnalyticsPreview />   },
        { icon: Bell,      title: t('marketing.features.forecasting_title'), description: t('marketing.features.forecasting_desc'), preview: <ForecastingPreview /> },
        { icon: Shield,    title: t('marketing.features.compliance_title'),  description: t('marketing.features.compliance_desc'),  preview: <CompliancePreview />  },
      ],
    },
  ]

  return (
    <>
      <section className="bg-background border-b border-zinc-100 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold text-[#2563EB] tracking-wide mb-3">{t('marketing.features.pageTitle')}</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-5">
            {t('marketing.features.headline')}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            {t('marketing.features.sub')}
          </p>
        </div>
      </section>

      {features.map(section => (
        <section key={section.category} className="py-16 even:bg-[#EEF2FA] odd:bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xs font-semibold text-[#2563EB] tracking-wide mb-8">
              {section.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {section.items.map(f => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>
      ))}

      <CTASection />
    </>
  )
}
