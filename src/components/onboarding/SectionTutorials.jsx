import {
  LayoutDashboard, Truck, Users, ArrowLeftRight, Gauge, Wrench,
  ClipboardCheck, Droplets, Sparkles, Play,
} from 'lucide-react'
import { useOnboarding } from '@/lib/OnboardingContext'

// Each entry launches an on-page coach-mark tour (see SectionTour). The id must
// match a key in SECTION_TOURS.
const SECTIONS = [
  { id: 'dashboard',   label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'vehicles',    label: 'Véhicules',       icon: Truck },
  { id: 'drivers',     label: 'Conducteurs',     icon: Users },
  { id: 'assignments', label: 'Affectations',    icon: ArrowLeftRight },
  { id: 'mileage',     label: 'Kilométrage',     icon: Gauge },
  { id: 'maintenance', label: 'Maintenance',     icon: Wrench },
  { id: 'inspections', label: 'Contrôles tech.', icon: ClipboardCheck },
  { id: 'washings',    label: 'Lavages',         icon: Droplets },
]

export default function SectionTutorials() {
  const { startSectionTour } = useOnboarding()

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-[#0066FF]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Tutoriels par section</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Une visite guidée s’ouvre directement sur la page concernée. Rien n’est modifié.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SECTIONS.map(tu => {
          const Icon = tu.icon
          return (
            <button
              key={tu.id}
              onClick={() => startSectionTour(tu.id)}
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-200 hover:border-[#0066FF] hover:bg-[#0066FF]/[0.03] text-left transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 group-hover:bg-[#0066FF]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#0066FF] transition-colors" />
                </div>
                <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 transition-colors">{tu.label}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-300 group-hover:text-[#0066FF] flex-shrink-0 transition-colors">
                <Play className="w-3 h-3" /> Lancer
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
