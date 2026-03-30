import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Plus, Wrench, Trash2, Pencil, Check, X, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import FormModal from '@/components/shared/FormModal'
import {
  useVehicles, useMaintenanceRecords, useMaintenanceSchedules, useMileageEntries,
  createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord,
  createMaintenanceSchedule, updateMaintenanceSchedule, deleteMaintenanceSchedule,
  getVehicleById
} from '@/lib/useFleetData'
import { computeForecasts } from '@/lib/maintenanceForecast'
import { usePageTitle } from '@/lib/usePageTitle'

// ── Forecast Card (overdue / due_soon / no_record) ─────────────────
function ForecastCard({ forecast, onMarkDone, onLogMaintenance }) {
  const { vehicle, lastRecord, nextDate, daysUntil, kmUntil, status, schedule, currentMileage } = forecast

  const intervalLabel = [
    schedule.interval_months && `${schedule.interval_months} mois`,
    schedule.interval_km && `${schedule.interval_km.toLocaleString('fr-FR')} km`,
  ].filter(Boolean).join(' · ')

  // ── No record variant ──────────────────────────────────────────────
  if (status === 'no_record') {
    return (
      <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-150 hover:shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300" />
        <div className="pl-5 pr-4 pt-4 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                {vehicle?.plate_number || '—'}{' '}
                <span className="font-normal text-slate-500">{vehicle?.model || ''}</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{schedule.notes || intervalLabel || '—'}</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 shrink-0 whitespace-nowrap">
              Non calibré
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Aucun entretien enregistré. Ajoutez le dernier entretien effectué pour activer les prévisions automatiques.
          </p>
          <button
            onClick={() => onLogMaintenance(schedule.vehicle_id)}
            className="w-full py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] bg-slate-900 hover:bg-slate-700 text-white"
          >
            Enregistrer le premier entretien
          </button>
        </div>
      </div>
    )
  }

  // ── Overdue / due soon variant ─────────────────────────────────────
  const isOverdue = status === 'overdue'
  const s = isOverdue
    ? {
        border: 'border-red-200',
        accent: 'bg-red-500',
        badge: 'bg-red-100 text-red-600',
        primary: 'bg-red-600 hover:bg-red-700 text-white',
        secondary: 'text-red-500 hover:bg-red-50',
        label: 'de retard',
        shadow: 'shadow-sm',
      }
    : {
        border: 'border-amber-200',
        accent: 'bg-amber-400',
        badge: 'bg-yellow-100 text-yellow-600',
        primary: 'bg-amber-500 hover:bg-amber-600 text-white',
        secondary: 'text-amber-600 hover:bg-amber-50',
        label: 'restants',
        shadow: '',
      }

  return (
    <div className={`relative bg-white rounded-2xl border ${s.border} overflow-hidden transition-all duration-150 ${s.shadow} hover:shadow-md`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.accent}`} />
      <div className="pl-5 pr-4 pt-4 pb-4">
        {/* Vehicle + badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-semibold text-slate-900 text-sm">
              {vehicle?.plate_number || '—'}{' '}
              <span className="font-normal text-slate-500">{vehicle?.model || ''}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {schedule.notes || intervalLabel}
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap ${s.badge}`}>
            {Math.abs(daysUntil ?? 0)} j {s.label}
          </span>
        </div>

        {/* KPI chips */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-50 rounded-xl px-3 py-2">
            <p className="text-[10px] text-slate-400 mb-0.5">Km restants</p>
            <p className={`text-sm font-bold tabular-nums ${kmUntil !== null && kmUntil <= 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {kmUntil !== null
                ? `${kmUntil <= 0 ? '−' : ''}${Math.abs(kmUntil).toLocaleString('fr-FR')}`
                : '—'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2">
            <p className="text-[10px] text-slate-400 mb-0.5">Échéance</p>
            <p className="text-sm font-bold text-slate-900">{nextDate ? format(nextDate, 'dd/MM/yy') : '—'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2">
            <p className="text-[10px] text-slate-400 mb-0.5">Dernier</p>
            <p className="text-sm font-bold text-slate-900">
              {lastRecord ? format(new Date(lastRecord.date), 'dd/MM/yy') : 'Jamais'}
            </p>
          </div>
        </div>

        {/* CTAs */}
        <button
          onClick={() => onMarkDone(schedule.vehicle_id, currentMileage)}
          className={`w-full py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${s.primary}`}
        >
          Marquer comme effectué
        </button>
        <button
          onClick={() => onLogMaintenance(schedule.vehicle_id)}
          className={`w-full py-1.5 rounded-xl text-xs font-medium mt-2 transition-colors ${s.secondary}`}
        >
          Ajouter un entretien
        </button>
      </div>
    </div>
  )
}

// ── Forecast Row (ok — compact) ────────────────────────────────────
function ForecastRow({ forecast, onMarkDone }) {
  const { vehicle, nextDate, daysUntil, kmUntil, schedule, currentMileage } = forecast
  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-800">{vehicle?.plate_number || '—'}</span>
        <span className="text-sm text-slate-400"> · {vehicle?.model || ''}</span>
      </div>
      <span className="text-xs text-slate-400 shrink-0 hidden sm:block tabular-nums w-24 text-right">
        {daysUntil !== null ? `dans ${daysUntil} j` : kmUntil !== null ? `${kmUntil.toLocaleString('fr-FR')} km` : '—'}
      </span>
      <span className="text-xs text-slate-400 shrink-0 hidden sm:block w-20 text-right">
        {nextDate ? format(nextDate, 'dd/MM/yy') : '—'}
      </span>
      <button
        onClick={() => onMarkDone(schedule.vehicle_id, currentMileage)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-slate-500 hover:text-slate-800 shrink-0 px-2.5 py-1 rounded-lg hover:bg-slate-100"
      >
        Effectué
      </button>
    </div>
  )
}

// ── Onboarding empty state ─────────────────────────────────────────
function MaintenanceOnboarding({ hasVehicles, hasSchedules, hasRecords, onCreateSchedule, onCreateRecord }) {
  const steps = [
    {
      done: hasVehicles,
      number: 1,
      title: 'Ajoutez vos véhicules',
      desc: 'Commencez par enregistrer votre flotte.',
      action: null,
    },
    {
      done: hasSchedules,
      number: 2,
      title: 'Créez un planning de maintenance',
      desc: 'Définissez les intervalles (ex : vidange tous les 10 000 km).',
      action: hasVehicles && !hasSchedules ? { label: 'Créer un planning', onClick: onCreateSchedule } : null,
    },
    {
      done: hasRecords,
      number: 3,
      title: 'Enregistrez le premier entretien',
      desc: 'Indiquez le dernier entretien effectué pour calibrer les prévisions.',
      action: hasSchedules && !hasRecords ? { label: 'Ajouter un entretien', onClick: onCreateRecord } : null,
    },
  ]

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-5 h-5 text-slate-500" />
        </div>
        <h3 className="font-semibold text-slate-900 text-base mb-2">Commencez à suivre la maintenance de votre flotte</h3>
        <p className="text-sm text-slate-500">
          Les prévisions sont calculées automatiquement à partir de vos plannings et de l'historique d'entretiens.
        </p>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${
              step.done ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
              step.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {step.done ? <Check className="w-3.5 h-3.5" /> : step.number}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'text-emerald-700 line-through decoration-emerald-400' : 'text-slate-900'}`}>
                {step.title}
              </p>
              {!step.done && <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>}
            </div>
            {step.action && !step.done && (
              <button
                onClick={step.action.onClick}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                {step.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Schedule Row (desktop inline-edit) ────────────────────────────
function ScheduleRow({ schedule, vehicles, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ interval_months: schedule.interval_months ?? '', interval_km: schedule.interval_km ?? '', notes: schedule.notes || '' })
  const vehicle = getVehicleById(vehicles, schedule.vehicle_id)

  const handleSave = async () => {
    await onSave(schedule.id, {
      ...form,
      interval_months: form.interval_months ? parseInt(form.interval_months) : null,
      interval_km: form.interval_km ? parseInt(form.interval_km) : null,
    })
    setEditing(false)
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-5 py-3.5 font-medium text-slate-900 text-sm">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
      <td className="px-5 py-3.5">
        {editing
          ? <Input type="number" value={form.interval_months} onChange={e => setForm({ ...form, interval_months: e.target.value })} className="w-20 h-7 text-sm" placeholder="—" />
          : <span className="text-sm text-slate-700">{schedule.interval_months ? `${schedule.interval_months} mois` : <span className="text-slate-300">—</span>}</span>}
      </td>
      <td className="px-5 py-3.5">
        {editing
          ? <Input type="number" value={form.interval_km} onChange={e => setForm({ ...form, interval_km: e.target.value })} className="w-28 h-7 text-sm" placeholder="—" />
          : <span className="text-sm text-slate-700">{schedule.interval_km ? `${schedule.interval_km.toLocaleString('fr-FR')} km` : <span className="text-slate-300">—</span>}</span>}
      </td>
      <td className="px-5 py-3.5">
        {editing
          ? <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="h-7 text-sm" placeholder="Note facultative" />
          : <span className="text-sm text-slate-400">{schedule.notes || '—'}</span>}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </>
          ) : (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(schedule.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Schedule Card (mobile inline-edit) ────────────────────────────
function ScheduleCard({ schedule, vehicles, onDelete, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ interval_months: schedule.interval_months ?? '', interval_km: schedule.interval_km ?? '', notes: schedule.notes || '' })
  const vehicle = getVehicleById(vehicles, schedule.vehicle_id)

  const handleSave = async () => {
    await onSave(schedule.id, {
      ...form,
      interval_months: form.interval_months ? parseInt(form.interval_months) : null,
      interval_km: form.interval_km ? parseInt(form.interval_km) : null,
    })
    setEditing(false)
  }

  return (
    <div className="p-4 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate text-sm">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
          {editing ? (
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1"><Label className="text-xs">Mois</Label><Input type="number" value={form.interval_months} onChange={e => setForm({ ...form, interval_months: e.target.value })} className="h-8 text-sm" placeholder="—" /></div>
                <div className="flex-1"><Label className="text-xs">Km</Label><Input type="number" value={form.interval_km} onChange={e => setForm({ ...form, interval_km: e.target.value })} className="h-8 text-sm" placeholder="—" /></div>
              </div>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="h-8 text-sm" placeholder="Note" />
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mt-0.5">
                {[
                  schedule.interval_months && `${schedule.interval_months} mois`,
                  schedule.interval_km && `${schedule.interval_km.toLocaleString('fr-FR')} km`,
                ].filter(Boolean).join(' · ') || '—'}
              </p>
              {schedule.notes && <p className="text-xs text-slate-400">{schedule.notes}</p>}
            </>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
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

// ── Constants ──────────────────────────────────────────────────────
const EMPTY_RECORD   = { vehicle_id: '', date: '', mileage: '', issue_description: '', status: '' }
const EMPTY_SCHEDULE = { vehicle_id: '', interval_months: '', interval_km: '', notes: '' }

// ── Main ───────────────────────────────────────────────────────────
export default function Maintenance() {
  usePageTitle('Maintenance')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { data: vehicles }      = useVehicles()
  const { data: records }       = useMaintenanceRecords()
  const { data: schedules, isError: schedulesError } = useMaintenanceSchedules()
  const { data: mileageEntries } = useMileageEntries()
  const queryClient = useQueryClient()

  const [recordModal, setRecordModal]     = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [recordForm, setRecordForm]       = useState(EMPTY_RECORD)
  const [savingRecord, setSavingRecord]   = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState(null)
  const [okCollapsed, setOkCollapsed]     = useState(false)

  const [scheduleModal, setScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm]   = useState(EMPTY_SCHEDULE)
  const [savingSchedule, setSavingSchedule] = useState(false)

  // Entretiens filters
  const [filterVehicle, setFilterVehicle] = useState('all')
  const [filterStatus, setFilterStatus]   = useState('all')

  const forecasts = useMemo(
    () => computeForecasts({ schedules, vehicles, maintenanceRecords: records, mileageEntries }),
    [schedules, vehicles, records, mileageEntries]
  )

  const overdueForecasts  = forecasts.filter(f => f.status === 'overdue')
  const dueSoonForecasts  = forecasts.filter(f => f.status === 'due_soon')
  const noRecordForecasts = forecasts.filter(f => f.status === 'no_record')
  const trueOkForecasts   = forecasts.filter(f => f.status === 'ok')
  const overdueCount      = overdueForecasts.length
  const dueSoonCount      = dueSoonForecasts.length
  const okCount           = trueOkForecasts.length

  // Filtered records for the Entretiens tab
  const filteredRecords = records.filter(r => {
    if (filterVehicle !== 'all' && r.vehicle_id !== filterVehicle) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    return true
  })

  // ── Open record modal with smart prefill ─────────────────────────
  const openRecordModal = (vehicleId = '', prefill = {}) => {
    setEditingRecord(null)
    setRecordForm({
      ...EMPTY_RECORD,
      vehicle_id: vehicleId,
      date: new Date().toISOString().split('T')[0],
      ...prefill,
    })
    setRecordModal(true)
  }

  // "Marquer comme effectué" — prefills today + current km + status OK
  const handleMarkDone = (vehicleId, currentMileage) => {
    openRecordModal(vehicleId, {
      mileage: currentMileage ? String(Math.round(currentMileage)) : '',
      status: 'OK',
    })
  }

  const openEditRecord = (r) => {
    setEditingRecord(r)
    setRecordForm({ vehicle_id: r.vehicle_id, date: r.date, mileage: String(r.mileage), issue_description: r.issue_description, status: r.status })
    setRecordModal(true)
  }
  const closeRecordModal = () => { setRecordModal(false); setEditingRecord(null) }

  const handleSaveRecord = async () => {
    if (!recordForm.vehicle_id || !recordForm.mileage || !recordForm.status) return
    setSavingRecord(true)
    try {
      const payload = { ...recordForm, mileage: parseFloat(recordForm.mileage), date: recordForm.date || new Date().toISOString().split('T')[0] }
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
    if (!scheduleForm.vehicle_id || (!scheduleForm.interval_months && !scheduleForm.interval_km)) return
    setSavingSchedule(true)
    try {
      await createMaintenanceSchedule({
        vehicle_id: scheduleForm.vehicle_id,
        interval_months: scheduleForm.interval_months ? parseInt(scheduleForm.interval_months) : null,
        interval_km: scheduleForm.interval_km ? parseInt(scheduleForm.interval_km) : null,
        notes: scheduleForm.notes,
      })
      queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] })
      toast.success(t('maintenance.scheduleSaved'))
      setScheduleModal(false)
      setScheduleForm(EMPTY_SCHEDULE)
    } catch (err) {
      console.error('Schedule creation error:', err)
      toast.error(err?.message || 'Erreur lors de la création')
    } finally { setSavingSchedule(false) }
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

      {/* ── Structured header ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Maintenance</h1>
          <p className="text-sm text-zinc-400 mt-1">Suivi des entretiens et prévisions par véhicule</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* KPI pills */}
          {schedules.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {overdueCount > 0 && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-red-100 text-red-600">
                  {overdueCount} en retard
                </span>
              )}
              {dueSoonCount > 0 && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-yellow-100 text-yellow-600">
                  {dueSoonCount} bientôt
                </span>
              )}
              {okCount > 0 && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-green-100 text-green-600">
                  {okCount} à jour
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleModal(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Nouveau planning
            </Button>
            <Button
              size="sm"
              className="bg-[#2563EB] hover:bg-[#1D4ED8]"
              onClick={() => openRecordModal()}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Ajouter un entretien
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="forecasts">
        <div className="overflow-x-auto">
          <TabsList className="mb-4 bg-white border border-slate-200 p-1 rounded-xl h-auto min-w-max">
            <TabsTrigger value="forecasts" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white text-sm">
              Prévisions
              {(overdueCount + dueSoonCount) > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {overdueCount + dueSoonCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedules" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white text-sm">
              Plannings
              {schedules.length > 0 && <span className="ml-1.5 text-xs opacity-60">{schedules.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="records" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white text-sm">
              Entretiens
              {records.length > 0 && <span className="ml-1.5 text-xs opacity-60">{records.length}</span>}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── PRÉVISIONS ─────────────────────────────────────────── */}
        <TabsContent value="forecasts">

          {/* Context bar */}
          {schedules.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 mb-6 text-sm text-slate-500">
              <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              Les prévisions sont calculées automatiquement à partir des plannings et des entretiens enregistrés.
            </div>
          )}

          {forecasts.length === 0 && schedules.length === 0 ? (
            <MaintenanceOnboarding
              hasVehicles={vehicles.length > 0}
              hasSchedules={schedules.length > 0}
              hasRecords={records.length > 0}
              onCreateSchedule={() => setScheduleModal(true)}
              onCreateRecord={() => openRecordModal()}
            />
          ) : forecasts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="font-medium text-slate-700 mb-1">Tous les véhicules sont à jour</p>
              <p className="text-sm text-slate-400">Aucune maintenance imminente.</p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* ── En retard ── */}
              {overdueForecasts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider">En retard · {overdueForecasts.length}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {overdueForecasts.map(f => (
                      <ForecastCard key={f.schedule.id} forecast={f} onMarkDone={handleMarkDone} onLogMaintenance={openRecordModal} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Bientôt ── */}
              {dueSoonForecasts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Bientôt · {dueSoonForecasts.length}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {dueSoonForecasts.map(f => (
                      <ForecastCard key={f.schedule.id} forecast={f} onMarkDone={handleMarkDone} onLogMaintenance={openRecordModal} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Premier entretien requis ── */}
              {noRecordForecasts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Premier entretien requis · {noRecordForecasts.length}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {noRecordForecasts.map(f => (
                      <ForecastCard key={f.schedule.id} forecast={f} onMarkDone={handleMarkDone} onLogMaintenance={openRecordModal} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── À jour — collapsible ── */}
              {trueOkForecasts.length > 0 && (
                <div>
                  <button
                    onClick={() => setOkCollapsed(v => !v)}
                    className="flex items-center gap-2 mb-3 group"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">
                      À jour · {trueOkForecasts.length}
                    </h3>
                    {okCollapsed
                      ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    }
                  </button>
                  {!okCollapsed && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-b border-slate-100 bg-slate-50">
                        <span className="w-1.5 shrink-0" />
                        <span className="flex-1 text-[11px] font-medium text-slate-400 uppercase tracking-wide">Véhicule</span>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide w-24 text-right">Dans</span>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide w-20 text-right">Prochain</span>
                        <span className="w-16 shrink-0" />
                      </div>
                      {trueOkForecasts.map(f => (
                        <ForecastRow key={f.schedule.id} forecast={f} onMarkDone={handleMarkDone} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── ENTRETIENS ─────────────────────────────────────────── */}
        <TabsContent value="records">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                <SelectTrigger className="h-8 text-xs w-auto min-w-[150px]">
                  <SelectValue placeholder="Tous les véhicules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les véhicules</SelectItem>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.plate_number} — {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs w-auto min-w-[120px]">
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="PROBLEM">Problème</SelectItem>
                </SelectContent>
              </Select>
              {(filterVehicle !== 'all' || filterStatus !== 'all') && (
                <button
                  onClick={() => { setFilterVehicle('all'); setFilterStatus('all') }}
                  className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Effacer
                </button>
              )}
            </div>
            <Button onClick={() => openRecordModal()} className="bg-[#2563EB] hover:bg-[#1D4ED8] shrink-0" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Ajouter un entretien
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {records.length === 0 ? (
              <div className="p-10 text-center">
                <Wrench className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="font-medium text-slate-500 mb-1">Aucun entretien enregistré</p>
                <p className="text-sm text-slate-400 mb-4">Enregistrez le premier entretien d'un véhicule.</p>
                <Button onClick={() => openRecordModal()} size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                  <Plus className="w-4 h-4 mr-1.5" /> Ajouter un entretien
                </Button>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400 mb-2">Aucun entretien ne correspond aux filtres sélectionnés.</p>
                <button
                  onClick={() => { setFilterVehicle('all'); setFilterStatus('all') }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white border-b border-slate-200">
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Kilométrage</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Notes</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Résultat</th>
                        <th className="px-5 py-3 w-24" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map(r => {
                        const vehicle = getVehicleById(vehicles, r.vehicle_id)
                        return (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-5 py-3 font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{format(new Date(r.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                            <td className="px-5 py-3 text-slate-700 tabular-nums">{r.mileage?.toLocaleString('fr-FR') ?? '—'} km</td>
                            <td className="px-5 py-3 max-w-xs truncate text-slate-600">{r.issue_description}</td>
                            <td className="px-5 py-3">
                              {r.status === 'OK'
  ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />OK</span>
  : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Problème</span>
}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditRecord(r)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteRecord(r.id)} disabled={deletingRecordId === r.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="sm:hidden divide-y divide-slate-100">
                  {filteredRecords.map(r => {
                    const vehicle = getVehicleById(vehicles, r.vehicle_id)
                    return (
                      <div key={r.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
                            <p className="text-sm text-slate-600 mt-0.5 truncate">{r.issue_description}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{format(new Date(r.date), 'd MMM yyyy', { locale: dateLocale })} · {r.mileage?.toLocaleString('fr-FR') ?? '—'} km</p>
                            <div className="mt-1.5">{r.status === 'OK'
  ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />OK</span>
  : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Problème</span>
}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditRecord(r)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteRecord(r.id)} disabled={deletingRecordId === r.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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

        {/* ── PLANNINGS ──────────────────────────────────────────── */}
        <TabsContent value="schedules">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{schedules.length} planning{schedules.length !== 1 ? 's' : ''} configuré{schedules.length !== 1 ? 's' : ''}</p>
            <Button onClick={() => setScheduleModal(true)} className="bg-[#2563EB] hover:bg-[#1D4ED8]" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Nouveau planning
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {schedulesError ? (
              <div className="p-8 text-center text-sm text-red-500">Erreur de chargement des plannings.</div>
            ) : schedules.length === 0 ? (
              <div className="p-10 text-center">
                <Wrench className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="font-medium text-slate-500 mb-1">Aucun planning configuré</p>
                <p className="text-sm text-slate-400 mb-4">Définissez les intervalles de maintenance par véhicule pour activer les prévisions.</p>
                <Button onClick={() => setScheduleModal(true)} size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                  <Plus className="w-4 h-4 mr-1.5" /> Nouveau planning
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white border-b border-slate-200">
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Intervalle</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Kilométrage</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Notes</th>
                        <th className="px-5 py-3 w-24" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedules.map(s => (
                        <ScheduleRow key={s.id} schedule={s} vehicles={vehicles} onDelete={handleDeleteSchedule} onSave={handleUpdateSchedule} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="sm:hidden">
                  {schedules.map(s => (
                    <ScheduleCard key={s.id} schedule={s} vehicles={vehicles} onDelete={handleDeleteSchedule} onSave={handleUpdateSchedule} />
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Record modal ─────────────────────────────────────────── */}
      <FormModal
        open={recordModal}
        onClose={closeRecordModal}
        title={editingRecord ? "Modifier l'entretien" : 'Enregistrer un entretien'}
        onSubmit={handleSaveRecord}
        saving={savingRecord}
        submitLabel={editingRecord ? 'Mettre à jour' : 'Enregistrer'}
      >
        <div>
          <Label>Véhicule</Label>
          <SearchableSelect
            value={recordForm.vehicle_id}
            onValueChange={v => setRecordForm(f => ({ ...f, vehicle_id: v }))}
            placeholder="Sélectionner un véhicule"
            options={vehicles.map(v => ({ value: v.id, label: `${v.plate_number} — ${v.model}` }))}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Date <span className="text-slate-400 font-normal">(optionnel — aujourd'hui par défaut)</span></Label>
            <Input type="date" value={recordForm.date} onChange={e => setRecordForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <Label>Kilométrage (km)</Label>
            <Input type="number" value={recordForm.mileage} onChange={e => setRecordForm(f => ({ ...f, mileage: e.target.value }))} placeholder="125000" />
          </div>
        </div>
        <div>
          <Label>Résultat</Label>
          <Select value={recordForm.status} onValueChange={v => setRecordForm(f => ({ ...f, status: v, issue_description: v === 'OK' ? '' : f.issue_description }))}>
            <SelectTrigger><SelectValue placeholder="Sélectionner le résultat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OK">Entretien effectué — tout est OK</SelectItem>
              <SelectItem value="PROBLEM">Entretien effectué — problème détecté</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {recordForm.status === 'PROBLEM' && (
          <div>
            <Label>Description du problème</Label>
            <Textarea value={recordForm.issue_description} onChange={e => setRecordForm(f => ({ ...f, issue_description: e.target.value }))} placeholder="Ex : usure des plaquettes de frein, fuite détectée..." />
          </div>
        )}
        {recordForm.status === 'OK' && (
          <div>
            <Label>Notes <span className="text-slate-400 font-normal">(optionnel)</span></Label>
            <Textarea value={recordForm.issue_description} onChange={e => setRecordForm(f => ({ ...f, issue_description: e.target.value }))} placeholder="Ex : vidange + filtre à huile..." rows={2} />
          </div>
        )}
      </FormModal>

      {/* ── Schedule modal ───────────────────────────────────────── */}
      <FormModal
        open={scheduleModal}
        onClose={() => setScheduleModal(false)}
        title="Nouveau planning de maintenance"
        onSubmit={handleSaveSchedule}
        saving={savingSchedule}
        submitLabel="Créer le planning"
      >
        <div className="flex gap-2.5 rounded-lg bg-blue-50 border border-blue-100 px-3.5 py-3 text-sm text-blue-700">
          <span className="mt-0.5 flex-shrink-0">ℹ️</span>
          <p>Après avoir créé le planning, pensez à <span className="font-semibold">enregistrer le dernier entretien effectué</span> — sans ce point de départ, les prévisions ne peuvent pas être calculées.</p>
        </div>
        <div>
          <Label>Véhicule</Label>
          <SearchableSelect
            value={scheduleForm.vehicle_id}
            onValueChange={v => setScheduleForm(f => ({ ...f, vehicle_id: v }))}
            placeholder="Sélectionner un véhicule"
            options={vehicles.map(v => ({ value: v.id, label: `${v.plate_number} — ${v.model}` }))}
          />
        </div>
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Renseignez au moins un intervalle — les deux peuvent être combinés pour des alertes plus précises.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Intervalle <span className="font-normal text-slate-400">(mois)</span></Label>
              <Input type="number" value={scheduleForm.interval_months} onChange={e => setScheduleForm(f => ({ ...f, interval_months: e.target.value }))} placeholder="Ex : 6" />
            </div>
            <div>
              <Label>Intervalle <span className="font-normal text-slate-400">(km)</span></Label>
              <Input type="number" value={scheduleForm.interval_km} onChange={e => setScheduleForm(f => ({ ...f, interval_km: e.target.value }))} placeholder="Ex : 10000" />
            </div>
          </div>
        </div>
        <div>
          <Label>Notes (facultatif)</Label>
          <Input value={scheduleForm.notes} onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ex : Vidange + filtre" />
        </div>
      </FormModal>
    </div>
  )
}
