import React, { useState } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Plus, ArrowLeftRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import FormModal from '@/components/shared/FormModal'
import {
  useVehicles, useDrivers, useAssignments,
  createAssignment, deleteAssignment,
  getDriverById, getVehicleById, getLatestAssignments
} from '@/lib/useFleetData'

import { usePageTitle } from '@/lib/usePageTitle'
export default function Assignments() {
  usePageTitle('Affectations')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { data: vehicles }    = useVehicles()
  const { data: drivers }     = useDrivers()
  const { data: assignments } = useAssignments()
  const queryClient = useQueryClient()

  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState({ vehicle_id: '', driver_id: '' })
  const [saving, setSaving]   = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const latestAssignments = getLatestAssignments(assignments)

  const openCreate = () => { setForm({ vehicle_id: '', driver_id: '' }); setModal(true) }
  const closeModal = () => setModal(false)

  const handleSubmit = async () => {
    if (!form.vehicle_id || !form.driver_id) return
    setSaving(true)
    try {
      await createAssignment({ vehicle_id: form.vehicle_id, driver_id: form.driver_id, assigned_at: new Date().toISOString() })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success(t('assignments.saved'))
      closeModal()
    } catch { toast.error(t('assignments.saveError')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteAssignment(id)
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success(t('assignments.deleted'))
    } catch { toast.error(t('assignments.deleteError')) }
    finally { setDeletingId(null) }
  }

  const currentAssignmentIds = new Set(Object.values(latestAssignments).map(a => a.id))

  return (
    <div className="p-5 sm:p-8">
      <PageHeader
        title={t('assignments.title')}
        description={`${Object.keys(latestAssignments).length} ${t('assignments.vehicle').toLowerCase()}${Object.keys(latestAssignments).length !== 1 ? 's' : ''} · ${assignments.length} ${t('common.total')}`}
      >
        <Button onClick={openCreate} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Plus className="w-4 h-4 mr-2" /> {t('assignments.newAssignment')}
        </Button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {assignments.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Aucune affectation"
            description="Associez un conducteur à un véhicule pour commencer."
            action={{ label: 'Créer une affectation', onClick: openCreate }}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Conducteur</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Affecté le</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Statut</th>
                    <th className="px-5 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(a => {
                    const vehicle = getVehicleById(vehicles, a.vehicle_id)
                    const driver  = getDriverById(drivers, a.driver_id)
                    const isCurrent = currentAssignmentIds.has(a.id)
                    return (
                      <tr key={a.id} className="hover:bg-white transition-colors group">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
                        <td className="px-5 py-3.5 text-slate-700">{driver?.name || '—'}</td>
                        <td className="px-5 py-3.5 text-slate-500">{format(new Date(a.assigned_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</td>
                        <td className="px-5 py-3.5">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Actuelle
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Historique</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {assignments.map(a => {
                const vehicle = getVehicleById(vehicles, a.vehicle_id)
                const driver  = getDriverById(drivers, a.driver_id)
                const isCurrent = currentAssignmentIds.has(a.id)
                return (
                  <div key={a.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
                        <p className="text-sm text-slate-600">{driver?.name || '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{format(new Date(a.assigned_at), 'd MMM yyyy', { locale: dateLocale })}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Actuelle
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Historique</span>
                        )}
                        <button onClick={() => handleDelete(a.id)} disabled={deletingId === a.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <FormModal
        open={modal}
        onClose={closeModal}
        title="Nouvelle affectation"
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel="Affecter"
      >
        <div>
          <Label>Véhicule</Label>
          <Select value={form.vehicle_id} onValueChange={v => setForm(f => ({...f, vehicle_id: v}))}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger>
            <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate_number} — {v.model}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Conducteur</Label>
          <Select value={form.driver_id} onValueChange={v => setForm(f => ({...f, driver_id: v}))}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un conducteur" /></SelectTrigger>
            <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </FormModal>
    </div>
  )
}
