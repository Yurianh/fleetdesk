import React, { useState, useMemo } from 'react'
import { format, addMonths } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Plus, Wrench, Trash2, Pencil, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import FormModal from '@/components/shared/FormModal'
import {
  useVehicles, useMaintenanceRecords, useMaintenanceSchedules, useMileageEntries,
  createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord,
  createMaintenanceSchedule, updateMaintenanceSchedule, deleteMaintenanceSchedule,
  getVehicleById
} from '@/lib/useFleetData'
import { computeForecasts, statusColors } from '@/lib/maintenanceForecast'

import { usePageTitle } from '@/lib/usePageTitle'
function ForecastCard({ forecast }) {
  const { vehicle, lastRecord, currentMileage, nextDate, daysUntil, kmUntil, status, schedule } = forecast
  const c = statusColors(status)
  return (
    <div className={`rounded-2xl border p-5 ${c.bg} ${c.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
          <span className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>{t(`maintenance.status.${status ?? 'unknown'}`)}</span>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
          {nextDate ? format(nextDate, 'dd/MM/yyyy') : '—'}
        </span>
      </div>
      <p className="font-bold text-slate-900 text-base mb-0.5">{vehicle?.plate_number || 'Inconnu'} — {vehicle?.model || ''}</p>
      <p className="text-xs text-slate-400 mb-4">
        {schedule.notes || `Tous les ${schedule.interval_months} mois ou ${schedule.interval_km?.toLocaleString('fr-FR')} km`}
      </p>
      <div className="bg-white/80 rounded-xl px-4 py-3 mb-3">
        {kmUntil !== null ? (
          kmUntil <= 0 ? (
            <p className="text-sm font-bold text-red-600">Révision dépassée de {Math.abs(kmUntil).toLocaleString('fr-FR')} km</p>
          ) : (
            <p className={`text-sm font-bold ${kmUntil <= 5000 ? 'text-amber-600' : 'text-slate-900'}`}>
              Prochaine révision dans <span className="text-base">{kmUntil.toLocaleString('fr-FR')} km</span>
              {kmUntil <= 5000 && <span className="text-xs font-normal text-amber-500 ml-1">(moins de 5 000 km !)</span>}
            </p>
          )
        ) : <p className="text-sm text-slate-400">Kilométrage actuel inconnu</p>}
        {currentMileage !== null && <p className="text-xs text-slate-400 mt-0.5">Compteur actuel : {currentMileage.toLocaleString('fr-FR')} km</p>}
      </div>
      <div className="bg-white/70 rounded-xl p-3">
        <p className="text-xs text-slate-400 mb-0.5">Jours restants</p>
        <p className={`text-lg font-bold ${daysUntil !== null && daysUntil < 0 ? 'text-red-600' : 'text-slate-900'}`}>
          {daysUntil !== null ? (daysUntil < 0 ? `${Math.abs(daysUntil)} j de retard` : `${daysUntil} j`) : '—'}
        </p>
      </div>
      {lastRecord && (
        <p className="text-xs text-slate-400 mt-3">
          Dernière révision : <span className="font-medium text-slate-600">{format(new Date(lastRecord.date), 'dd/MM/yyyy')}</span>
          {' · '}{lastRecord.mileage?.toLocaleString('fr-FR') ?? '—'} km
        </p>
      )}
    </div>
  )
}

// ── Schedule inline-edit row ───────────────────────────────────────
function ScheduleRow({ schedule, vehicles, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ interval_months: schedule.interval_months, interval_km: schedule.interval_km, notes: schedule.notes || '' })
  const vehicle = getVehicleById(vehicles, schedule.vehicle_id)

  const handleSave = async () => {
    await onSave(schedule.id, { ...form, interval_months: parseInt(form.interval_months), interval_km: parseInt(form.interval_km) })
    setEditing(false)
  }

  return (
    <tr className="hover:bg-white transition-colors group">
      <td className="px-5 py-3.5 font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
      <td className="px-5 py-3.5">
        {editing ? <Input type="number" value={form.interval_months} onChange={e => setForm({...form, interval_months: e.target.value})} className="w-20 h-7 text-sm" />
          : <span className="text-slate-700">{schedule.interval_months} mois</span>}
      </td>
      <td className="px-5 py-3.5">
        {editing ? <Input type="number" value={form.interval_km} onChange={e => setForm({...form, interval_km: e.target.value})} className="w-28 h-7 text-sm" />
          : <span className="text-slate-700">{schedule.interval_km?.toLocaleString('fr-FR')} km</span>}
      </td>
      <td className="px-5 py-3.5">
        {editing ? <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="h-7 text-sm" placeholder="Note facultative" />
          : <span className="text-slate-500 text-sm">{schedule.notes || '—'}</span>}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-3.5 h-3.5" /></button>
            </>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(schedule.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// Mobile schedule card with inline editing
function ScheduleCard({ schedule, vehicles, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ interval_months: schedule.interval_months, interval_km: schedule.interval_km, notes: schedule.notes || '' })
  const vehicle = getVehicleById(vehicles, schedule.vehicle_id)

  const handleSave = async () => {
    await onSave(schedule.id, { ...form, interval_months: parseInt(form.interval_months), interval_km: parseInt(form.interval_km) })
    setEditing(false)
  }

  return (
    <div className="p-4 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
          {editing ? (
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1"><Label className="text-xs">Mois</Label><Input type="number" value={form.interval_months} onChange={e => setForm({...form, interval_months: e.target.value})} className="h-8 text-sm" /></div>
                <div className="flex-1"><Label className="text-xs">Km</Label><Input type="number" value={form.interval_km} onChange={e => setForm({...form, interval_km: e.target.value})} className="h-8 text-sm" /></div>
              </div>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="h-8 text-sm" placeholder="Note" />
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mt-0.5">{schedule.interval_months} mois · {schedule.interval_km?.toLocaleString('fr-FR')} km</p>
              {schedule.notes && <p className="text-xs text-slate-400">{schedule.notes}</p>}
            </>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => onDelete(schedule.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────
const EMPTY_RECORD   = { vehicle_id: '', date: '', mileage: '', issue_description: '', status: '' }
const EMPTY_SCHEDULE = { vehicle_id: '', interval_months: '6', interval_km: '10000', notes: '' }

export default function Maintenance() {
  usePageTitle('Maintenance')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { data: vehicles }      = useVehicles()
  const { data: records }       = useMaintenanceRecords()
  const { data: schedules, isError: schedulesError } = useMaintenanceSchedules()
  const { data: mileageEntries } = useMileageEntries()
  const queryClient = useQueryClient()

  const [recordModal, setRecordModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [recordForm, setRecordForm] = useState(EMPTY_RECORD)
  const [savingRecord, setSavingRecord] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState(null)

  const [scheduleModal, setScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE)
  const [savingSchedule, setSavingSchedule] = useState(false)

  const forecasts = useMemo(
    () => computeForecasts({ schedules, vehicles, maintenanceRecords: records, mileageEntries }),
    [schedules, vehicles, records, mileageEntries]
  )
  const overdueCount  = forecasts.filter(f => f.status === 'overdue').length
  const dueSoonCount  = forecasts.filter(f => f.status === 'due_soon').length

  const openCreateRecord = () => { setEditingRecord(null); setRecordForm(EMPTY_RECORD); setRecordModal(true) }
  const openEditRecord   = (r) => {
    setEditingRecord(r)
    setRecordForm({ vehicle_id: r.vehicle_id, date: r.date, mileage: String(r.mileage), issue_description: r.issue_description, status: r.status })
    setRecordModal(true)
  }
  const closeRecordModal = () => { setRecordModal(false); setEditingRecord(null) }

  const handleSaveRecord = async () => {
    if (!recordForm.vehicle_id || !recordForm.date || !recordForm.mileage || !recordForm.issue_description || !recordForm.status) return
    setSavingRecord(true)
    try {
      const payload = { ...recordForm, mileage: parseFloat(recordForm.mileage) }
      if (editingRecord) {
        await updateMaintenanceRecord(editingRecord.id, payload)
        toast.success(t('maintenance.updated'))
      } else {
        await createMaintenanceRecord(payload)
        toast.success(t('maintenance.saved'))
      }
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] })
      closeRecordModal()
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSavingRecord(false) }
  }

  const handleDeleteRecord = async (id) => {
    setDeletingRecordId(id)
    try {
      await deleteMaintenanceRecord(id)
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] })
      toast.success(t('maintenance.deleted'))
    } catch { toast.error('Erreur lors de la suppression') }
    finally { setDeletingRecordId(null) }
  }

  const handleSaveSchedule = async () => {
    if (!scheduleForm.vehicle_id) return
    setSavingSchedule(true)
    try {
      await createMaintenanceSchedule({
        vehicle_id: scheduleForm.vehicle_id,
        interval_months: parseInt(scheduleForm.interval_months),
        interval_km: parseInt(scheduleForm.interval_km),
        notes: scheduleForm.notes,
      })
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] })
      toast.success(t('maintenance.scheduleSaved'))
      setScheduleModal(false)
      setScheduleForm(EMPTY_SCHEDULE)
    } catch (err) { 
      console.error('Schedule creation error:', err)
      toast.error(err?.message || 'Erreur lors de la création')
    }
    finally { setSavingSchedule(false) }
  }

  const handleUpdateSchedule = async (id, data) => {
    try {
      await updateMaintenanceSchedule(id, data)
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] })
      toast.success(t('maintenance.scheduleUpdated'))
    } catch { toast.error(t('common.saveError')) }
  }

  const handleDeleteSchedule = async (id) => {
    try {
      await deleteMaintenanceSchedule(id)
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] })
      toast.success(t('maintenance.scheduleDeleted'))
    } catch { toast.error('Erreur lors de la suppression') }
  }

  return (
    <div className="p-5 sm:p-8">
      <PageHeader title="Maintenance" description="Suivi des entretiens, plannings et prévisions">
        <div className="flex items-center gap-2 flex-wrap">
          {overdueCount > 0 && (
            <span className="text-xs font-semibold bg-red-100 text-red-600 px-3 py-1.5 rounded-full">
              {overdueCount} en retard
            </span>
          )}
          {dueSoonCount > 0 && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
              {dueSoonCount} bientôt
            </span>
          )}
        </div>
      </PageHeader>

      <Tabs defaultValue="forecast">
        <div className="overflow-x-auto">
          <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-xl h-auto min-w-max">
            <TabsTrigger value="forecast" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Prévisions
              {(overdueCount + dueSoonCount) > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {overdueCount + dueSoonCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedules" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Plannings
              {schedules.length > 0 && <span className="ml-1.5 text-xs opacity-60">{schedules.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="records" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              Entretiens
              {records.length > 0 && <span className="ml-1.5 text-xs opacity-60">{records.length}</span>}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* PRÉVISIONS */}
        <TabsContent value="forecast">
          {forecasts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Wrench className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-slate-500">Aucun planning configuré</p>
              <p className="text-sm text-slate-400 mt-1">Allez dans l'onglet Plannings pour configurer les intervalles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {forecasts.map(f => <ForecastCard key={f.schedule.id} forecast={f} />)}
            </div>
          )}
        </TabsContent>

        {/* PLANNINGS */}
        <TabsContent value="schedules">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{schedules.length} planning{schedules.length !== 1 ? 's' : ''} configuré{schedules.length !== 1 ? 's' : ''}</p>
            <Button onClick={() => setScheduleModal(true)} className="bg-[#2563EB] hover:bg-[#1D4ED8]" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Nouveau planning
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {schedulesError ? (
              <div className="p-8 text-center text-sm text-red-500">
                Erreur de chargement des plannings. Vérifiez la connexion à la base de données.
              </div>
            ) : schedules.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Aucun planning configuré"
                description="Configurez des intervalles de maintenance par véhicule pour activer les prévisions."
                action={{ label: 'Nouveau planning', onClick: () => setScheduleModal(true) }}
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white border-b border-slate-200">
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Intervalle</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Kilométrage</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Notes</th>
                        <th className="px-5 py-3 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedules.map(s => (
                        <ScheduleRow key={s.id} schedule={s} vehicles={vehicles} onDelete={handleDeleteSchedule} onSave={handleUpdateSchedule} />
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="sm:hidden">
                  {schedules.map(s => (
                    <ScheduleCard key={s.id} schedule={s} vehicles={vehicles} onDelete={handleDeleteSchedule} onSave={handleUpdateSchedule} />
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ENTRETIENS */}
        <TabsContent value="records">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{records.length} entretien{records.length !== 1 ? 's' : ''} enregistré{records.length !== 1 ? 's' : ''}</p>
            <Button onClick={openCreateRecord} className="bg-[#2563EB] hover:bg-[#1D4ED8]" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Ajouter un entretien
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {records.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Aucun entretien enregistré"
                description="Enregistrez le premier entretien d'un véhicule."
                action={{ label: 'Ajouter un entretien', onClick: openCreateRecord }}
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white border-b border-slate-200">
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Kilométrage</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Description</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Statut</th>
                        <th className="px-5 py-3 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map(r => {
                        const vehicle = getVehicleById(vehicles, r.vehicle_id)
                        return (
                          <tr key={r.id} className="hover:bg-white transition-colors group">
                            <td className="px-5 py-3 font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{format(new Date(r.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                            <td className="px-5 py-3">{r.mileage?.toLocaleString('fr-FR') ?? '—'} km</td>
                            <td className="px-5 py-3 max-w-xs truncate text-slate-600">{r.issue_description}</td>
                            <td className="px-5 py-3">
                              <Badge variant={r.status === 'OK' ? 'default' : 'destructive'}>{r.status === 'OK' ? 'OK' : 'Problème'}</Badge>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditRecord(r)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteRecord(r.id)} disabled={deletingRecordId === r.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
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
                  {records.map(r => {
                    const vehicle = getVehicleById(vehicles, r.vehicle_id)
                    return (
                      <div key={r.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
                            <p className="text-sm text-slate-600 mt-0.5 truncate">{r.issue_description}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{format(new Date(r.date), 'd MMM yyyy', { locale: dateLocale })} · {r.mileage?.toLocaleString('fr-FR') ?? '—'} km</p>
                            <div className="mt-1.5">
                              <Badge variant={r.status === 'OK' ? 'default' : 'destructive'}>{r.status === 'OK' ? 'OK' : 'Problème'}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEditRecord(r)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteRecord(r.id)} disabled={deletingRecordId === r.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>
      </Tabs>

      {/* Record modal */}
      <FormModal
        open={recordModal}
        onClose={closeRecordModal}
        title={editingRecord ? "Modifier l'entretien" : 'Ajouter un entretien'}
        onSubmit={handleSaveRecord}
        saving={savingRecord}
        submitLabel={editingRecord ? 'Mettre à jour' : 'Enregistrer'}
      >
        <div>
          <Label>Véhicule</Label>
          <Select value={recordForm.vehicle_id} onValueChange={v => setRecordForm(f => ({...f, vehicle_id: v}))}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger>
            <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate_number} — {v.model}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Date</Label>
            <Input type="date" value={recordForm.date} onChange={e => setRecordForm(f => ({...f, date: e.target.value}))} />
          </div>
          <div>
            <Label>Kilométrage (km)</Label>
            <Input type="number" value={recordForm.mileage} onChange={e => setRecordForm(f => ({...f, mileage: e.target.value}))} placeholder="125000" />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={recordForm.issue_description} onChange={e => setRecordForm(f => ({...f, issue_description: e.target.value}))} placeholder="Décrire l'entretien effectué..." />
        </div>
        <div>
          <Label>Statut</Label>
          <Select value={recordForm.status} onValueChange={v => setRecordForm(f => ({...f, status: v}))}>
            <SelectTrigger><SelectValue placeholder="Sélectionner le statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OK">OK</SelectItem>
              <SelectItem value="PROBLEM">Problème</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormModal>

      {/* Schedule modal */}
      <FormModal
        open={scheduleModal}
        onClose={() => setScheduleModal(false)}
        title="Nouveau planning de maintenance"
        onSubmit={handleSaveSchedule}
        saving={savingSchedule}
        submitLabel="Créer le planning"
      >
        <div>
          <Label>Véhicule</Label>
          <Select value={scheduleForm.vehicle_id} onValueChange={v => setScheduleForm(f => ({...f, vehicle_id: v}))}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger>
            <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate_number} — {v.model}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Intervalle (mois)</Label>
            <Input type="number" value={scheduleForm.interval_months} onChange={e => setScheduleForm(f => ({...f, interval_months: e.target.value}))} placeholder="6" />
          </div>
          <div>
            <Label>Intervalle (km)</Label>
            <Input type="number" value={scheduleForm.interval_km} onChange={e => setScheduleForm(f => ({...f, interval_km: e.target.value}))} placeholder="10000" />
          </div>
        </div>
        <div>
          <Label>Notes (facultatif)</Label>
          <Input value={scheduleForm.notes} onChange={e => setScheduleForm(f => ({...f, notes: e.target.value}))} placeholder="Ex : Vidange + filtre" />
        </div>
      </FormModal>
    </div>
  )
}
