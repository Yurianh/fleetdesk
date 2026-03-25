import { useActivityLog } from '@/lib/useOrg'
import { usePageTitle } from '@/lib/usePageTitle'
import PageHeader from '@/components/shared/PageHeader'
import { Truck, Users, Gauge, Wrench, ClipboardCheck, Droplets, ArrowLeftRight, Clock } from 'lucide-react'

const ACTION_META = {
  createVehicle:            { label: 'Ajout véhicule',       icon: Truck,          color: 'bg-blue-50 text-blue-600' },
  createDriver:             { label: 'Ajout conducteur',     icon: Users,          color: 'bg-violet-50 text-violet-600' },
  createAssignment:         { label: 'Nouvelle affectation', icon: ArrowLeftRight, color: 'bg-amber-50 text-amber-600' },
  createMileageEntry:       { label: 'Relevé km',            icon: Gauge,          color: 'bg-sky-50 text-sky-600' },
  createMaintenanceRecord:  { label: 'Maintenance ajoutée',  icon: Wrench,         color: 'bg-orange-50 text-orange-600' },
  createMaintenanceSchedule:{ label: 'Planning créé',        icon: Wrench,         color: 'bg-orange-50 text-orange-600' },
  createTechnicalInspection:{ label: 'Contrôle technique',   icon: ClipboardCheck, color: 'bg-emerald-50 text-emerald-600' },
  createWashRecord:         { label: 'Lavage enregistré',    icon: Droplets,       color: 'bg-cyan-50 text-cyan-600' },
  updateDriver:             { label: 'Conducteur modifié',   icon: Users,          color: 'bg-zinc-50 text-zinc-500' },
  updateMaintenanceRecord:  { label: 'Maintenance modifiée', icon: Wrench,         color: 'bg-zinc-50 text-zinc-500' },
  updateTechnicalInspection:{ label: 'Contrôle modifié',     icon: ClipboardCheck, color: 'bg-zinc-50 text-zinc-500' },
  updateWashRecord:         { label: 'Lavage modifié',       icon: Droplets,       color: 'bg-zinc-50 text-zinc-500' },
  updateMaintenanceSchedule:{ label: 'Planning modifié',     icon: Wrench,         color: 'bg-zinc-50 text-zinc-500' },
  deleteMileageEntry:       { label: 'Relevé supprimé',      icon: Gauge,          color: 'bg-red-50 text-red-500' },
  deleteAssignment:         { label: 'Affectation supprimée',icon: ArrowLeftRight, color: 'bg-red-50 text-red-500' },
  deleteTechnicalInspection:{ label: 'Contrôle supprimé',    icon: ClipboardCheck, color: 'bg-red-50 text-red-500' },
  deleteWashRecord:         { label: 'Lavage supprimé',      icon: Droplets,       color: 'bg-red-50 text-red-500' },
  deleteMaintenanceRecord:  { label: 'Maintenance supprimée',icon: Wrench,         color: 'bg-red-50 text-red-500' },
  deleteMaintenanceSchedule:{ label: 'Planning supprimé',    icon: Wrench,         color: 'bg-red-50 text-red-500' },
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Il y a ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function ActivityLog() {
  usePageTitle('Journal d\'activité')
  const { data: logs = [], isLoading } = useActivityLog(100)

  return (
    <div className="p-5 sm:p-8">
      <PageHeader title="Journal d'activité" description="Toutes les actions effectuées dans votre organisation." />

      <div className="mt-6 max-w-2xl">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-zinc-100 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-zinc-100 rounded w-3/4" />
                  <div className="h-2.5 bg-zinc-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && logs.length === 0 && (
          <div className="text-center py-16 text-zinc-400">
            <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucune activité pour le moment.</p>
            <p className="text-xs mt-1 opacity-70">Les actions de votre équipe apparaîtront ici.</p>
          </div>
        )}

        {!isLoading && logs.length > 0 && (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-zinc-100" />

            <div className="space-y-1">
              {logs.map((log, i) => {
                const meta = ACTION_META[log.action] || { label: log.action, icon: Clock, color: 'bg-zinc-50 text-zinc-500' }
                const Icon = meta.icon
                return (
                  <div key={log.id} className="flex gap-3 pl-0 group">
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-800 leading-snug">
                            {meta.label}
                            {log.entity_label && (
                              <span className="font-normal text-zinc-500"> — {log.entity_label}</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-200 text-zinc-600 text-[8px] font-bold flex-shrink-0">
                              {initials(log.user_name)}
                            </span>
                            <span className="text-xs text-zinc-400">{log.user_name}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-zinc-400 flex-shrink-0 mt-0.5 whitespace-nowrap">
                          {relativeTime(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
