import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import {
  Truck, Users, ArrowLeftRight, AlertTriangle,
  Gauge, Wrench, Droplets, ClipboardCheck,
  CheckCircle2, Plus, Loader2, ArrowRight,
  TrendingUp, TrendingDown, Clock, Activity,
  Bell, ChevronRight, Car, StickyNote, Check, Tag, X
} from 'lucide-react'
import {
  format, differenceInDays, subMonths, eachMonthOfInterval,
  endOfMonth, isAfter, subDays
} from 'date-fns'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { computeForecasts, statusColors } from '@/lib/maintenanceForecast'
import {
  useVehicles, useDrivers, useAssignments, useMileageEntries,
  useTechnicalInspections, useMaintenanceRecords, useWashRecords,
  useMaintenanceSchedules, getLatestAssignments, getDriverById, getVehicleById,
  createVehicle, createDriver, createMileageEntry, createWashRecord
} from '@/lib/useFleetData'
import { usePageTitle } from '@/lib/usePageTitle'
import { useTranslation } from 'react-i18next'
import { usePlanLimits } from '@/lib/usePlanLimits'
import { useDateLocale } from '@/lib/useDateLocale'
import { supabase } from '@/lib/supabase'

// ─── Vehicle Usage Analytics ─────────────────────────────────────────

const CHART_COLORS = ['#1D4ED8', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#06b6d4']

function UsageTooltip({ active, payload, vehicles }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  const rows  = payload.filter(p => p.value != null).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  return (
    <div className="bg-[#0f172a] text-white text-xs rounded-xl px-3 py-2.5 shadow-2xl border border-white/10 min-w-[160px]">
      <p className="text-zinc-400 font-medium mb-2 capitalize">{point?.month}</p>
      {rows.map(p => {
        const v = vehicles.find(v => v.id === p.dataKey)
        return (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-zinc-300 truncate">{v?.plate_number ?? p.dataKey}</span>
            </div>
            <span className="font-semibold flex-shrink-0">{p.value.toLocaleString()} km</span>
          </div>
        )
      })}
    </div>
  )
}

function VehicleUsageAnalytics({ vehicles, mileageEntries }) {
  const [timeRange, setTimeRange] = useState(3)
  const dateLocale = useDateLocale()

  const allMonths = useMemo(
    () => eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() }),
    []
  )
  const months = useMemo(() => allMonths.slice(-timeRange), [allMonths, timeRange])

  const vehicleMonthlyKm = useMemo(() => {
    const byVehicle = {}
    for (const e of mileageEntries) {
      if (!byVehicle[e.vehicle_id]) byVehicle[e.vehicle_id] = []
      byVehicle[e.vehicle_id].push({ ...e, _date: new Date(e.created_at) })
    }
    for (const vid of Object.keys(byVehicle)) {
      byVehicle[vid].sort((a, b) => a._date - b._date)
    }
    const result = {}
    for (const v of vehicles) {
      result[v.id] = {}
      const entries = byVehicle[v.id] || []
      for (const month of allMonths) {
        const monthKey = format(month, 'yyyy-MM')
        const mEnd     = endOfMonth(month)
        const mStart   = new Date(month.getFullYear(), month.getMonth(), 1)
        const curr     = entries.filter(e => e._date <= mEnd).pop()
        const prevMonth = entries.filter(e => e._date < mStart).pop()
        const baseline = prevMonth ?? entries.filter(e => e._date >= mStart && e._date <= mEnd)[0]
        result[v.id][monthKey] =
          curr && baseline && curr.mileage > baseline.mileage
            ? curr.mileage - baseline.mileage : null
      }
    }
    return result
  }, [vehicles, mileageEntries, allMonths])

  const colorMap = useMemo(() => {
    const m = {}
    vehicles.forEach((v, i) => { m[v.id] = CHART_COLORS[i % CHART_COLORS.length] })
    return m
  }, [vehicles])

  const chartData = useMemo(() =>
    months.map(month => {
      const monthKey = format(month, 'yyyy-MM')
      const row = { month: format(month, 'MMM', { locale: dateLocale }), monthKey }
      for (const v of vehicles) {
        row[v.id] = vehicleMonthlyKm[v.id]?.[monthKey] ?? null
      }
      return row
    }),
    [months, vehicles, vehicleMonthlyKm, dateLocale]
  )

  const hasData = mileageEntries.length >= 2

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Utilisation des véhicules</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Kilométrage mensuel parcouru</p>
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-[3px]">
          {[3, 6, 12].map(n => (
            <button
              key={n}
              onClick={() => setTimeRange(n)}
              className={'px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 ' + (
                timeRange === n ? 'bg-slate-900 text-white' : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              {n}M
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="h-52 flex items-center justify-center">
          <div className="text-center">
            <Gauge className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Pas encore assez de données</p>
            <p className="text-xs text-zinc-300 mt-0.5">Enregistrez au moins 2 kilométrages pour voir le graphique</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={v => v >= 1000 ? Math.round(v / 1000) + 'k' : v} />
                <Tooltip content={<UsageTooltip vehicles={vehicles} />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                {vehicles.map(v => (
                  <Line
                    key={v.id}
                    type="monotone"
                    dataKey={v.id}
                    stroke={colorMap[v.id]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-zinc-100">
            {vehicles.map(v => (
              <div key={v.id} className="flex items-center gap-1.5 text-xs text-zinc-600">
                <span className="w-3 h-[2px] rounded-full" style={{ backgroundColor: colorMap[v.id] }} />
                {v.plate_number}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
// ─── Quick-action modals ──────────────────────────────────────────
function AddVehicleModal({ open, onClose }) {
  const [form, setForm] = useState({ plate_number: '', model: '' })
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const handle = async () => {
    if (!form.plate_number || !form.model) return
    setSaving(true)
    try {
      await createVehicle(form)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success(t('vehicles.added'))
      setForm({ plate_number: '', model: '' })
      onClose()
    } catch { toast.error(t('vehicles.addError')) }
    finally { setSaving(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader><DialogTitle>{t('vehicles.addVehicle')}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><Label>{t('vehicles.plate')}</Label><Input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} placeholder="AB-123-CD" /></div>
          <div><Label>{t('vehicles.model')}</Label><Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Renault Trafic" /></div>
          <Button onClick={handle} disabled={saving || !form.plate_number || !form.model} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</> : t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddDriverModal({ open, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const handle = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      await createDriver(form)
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success(t('drivers.added'))
      setForm({ name: '', phone: '' })
      onClose()
    } catch { toast.error(t('drivers.addError')) }
    finally { setSaving(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader><DialogTitle>{t('drivers.addDriver')}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><Label>{t('drivers.name')}</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jean Dupont" /></div>
          <div><Label>{t('dashboard.phoneOptional')}</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+33 6 00 00 00 00" /></div>
          <Button onClick={handle} disabled={saving || !form.name} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</> : t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RecordMileageModal({ open, onClose, vehicles }) {
  const today = new Date().toISOString().split('T')[0]
  const [vehicleId, setVehicleId] = useState('')
  const [mileage,   setMileage]   = useState('')
  const [date,      setDate]      = useState(today)
  const [saving,    setSaving]    = useState(false)
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const reset = () => { setVehicleId(''); setMileage(''); setDate(today) }

  const handle = async () => {
    if (!vehicleId || !mileage || !date) return
    setSaving(true)
    try {
      await createMileageEntry({
        vehicle_id: vehicleId,
        mileage: parseFloat(mileage),
        created_at: new Date(date + 'T12:00:00').toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['mileageEntries'] })
      toast.success(t('mileage.saved'))
      reset()
      onClose()
    } catch { toast.error(t('mileage.saveError')) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose() }}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader><DialogTitle>{t('dashboard.logMileageBtn')}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>{t('mileage.vehicle')}</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger><SelectValue placeholder={t('mileage.selectVehicle')} /></SelectTrigger>
              <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate_number} — {v.model}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('mileage.mileageKm')}</Label>
            <Input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="Ex : 45 000" />
          </div>
          <div>
            <Label>{t('dashboard.effectiveDate')}</Label>
            <Input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} />
          </div>
          <Button onClick={handle} disabled={saving || !vehicleId || !mileage || !date} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</> : t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddWashModal({ open, onClose, vehicles, drivers }) {
  const today = new Date().toISOString().split('T')[0]
  const [vehicleId, setVehicleId] = useState('')
  const [driverId,  setDriverId]  = useState('')
  const [amount,    setAmount]    = useState('')
  const [date,      setDate]      = useState(today)
  const [saving,    setSaving]    = useState(false)
  const queryClient = useQueryClient()

  const reset = () => { setVehicleId(''); setDriverId(''); setAmount(''); setDate(today) }

  const handle = async () => {
    if (!vehicleId || !date) return
    setSaving(true)
    try {
      await createWashRecord({
        vehicle_id: vehicleId,
        driver_id: (driverId && driverId !== 'none') ? driverId : null,
        amount: amount ? parseFloat(amount) : null,
        date,
      })
      queryClient.invalidateQueries({ queryKey: ['washRecords'] })
      toast.success('Lavage enregistré')
      reset()
      onClose()
    } catch { toast.error('Erreur lors de l\'enregistrement') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose() }}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader><DialogTitle>Ajouter un lavage</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Véhicule</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger>
              <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate_number} — {v.model}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Conducteur <span className="text-slate-400 font-normal">(optionnel)</span></Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un conducteur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Aucun</SelectItem>
                {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Montant (€) <span className="text-slate-400 font-normal">(optionnel)</span></Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} />
          </div>
          <Button onClick={handle} disabled={saving || !vehicleId || !date} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Alert Center ─────────────────────────────────────────────────
// Groups all time-sensitive alerts (inspections + maintenance) by priority
function AlertCenter({ urgentInspections, warningInspections, urgentForecasts, vehicles }) {
  const { t } = useTranslation()
  const totalUrgent = urgentInspections.length + urgentForecasts.filter(f => f.status === 'overdue').length
  const totalWarning = warningInspections.length + urgentForecasts.filter(f => f.status === 'due_soon').length
  const allClear = totalUrgent === 0 && totalWarning === 0

  return (
    <div className="bg-white rounded-xl p-5 border border-zinc-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-zinc-500" />
          <h3 className="font-bold text-zinc-900">{t('alerts.title')}</h3>
        </div>
        {(totalUrgent + totalWarning) > 0 && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${totalUrgent > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            {totalUrgent + totalWarning}
          </span>
        )}
      </div>

      {allClear ? (
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800">{t('alerts.allGood')}</p>
            <p className="text-xs text-zinc-400">{t('alerts.allGoodDesc')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Red group */}
          {totalUrgent > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-100 overflow-hidden">
              <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-700 flex-1">
                  {t('alerts.urgentGroup', { count: totalUrgent })}
                </p>
              </div>
              <div className="space-y-0.5 pb-2">
                {urgentInspections.map(ins => {
                  const v = getVehicleById(vehicles, ins.vehicle_id)
                  const d = differenceInDays(new Date(ins.expiration_date), new Date())
                  return (
                    <Link key={ins.id} to="/Inspections" className="flex items-center justify-between px-3 py-1.5 hover:bg-red-100/50 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">{v?.plate_number || '—'}</p>
                        <p className="text-xs text-red-600">
                          {d === 0 ? t('alerts.ctExpiresToday') : t('alerts.ctExpiresDays', { count: d })}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    </Link>
                  )
                })}
                {urgentForecasts.filter(f => f.status === 'overdue').map(f => (
                  <Link key={f.schedule.id} to="/Maintenance" className="flex items-center justify-between px-3 py-1.5 hover:bg-red-100/50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{f.vehicle?.plate_number || '—'}</p>
                      <p className="text-xs text-red-600">{t('alerts.overdueService')}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Orange group */}
          {totalWarning > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 overflow-hidden">
              <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-amber-700 flex-1">
                  {t('alerts.warningGroup', { count: totalWarning })}
                </p>
              </div>
              <div className="space-y-0.5 pb-2">
                {warningInspections.map(ins => {
                  const v = getVehicleById(vehicles, ins.vehicle_id)
                  const d = differenceInDays(new Date(ins.expiration_date), new Date())
                  return (
                    <Link key={ins.id} to="/Inspections" className="flex items-center justify-between px-3 py-1.5 hover:bg-amber-100/50 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">{v?.plate_number || '—'}</p>
                        <p className="text-xs text-amber-600">{t('alerts.ctDueDays', { count: d })}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    </Link>
                  )
                })}
                {urgentForecasts.filter(f => f.status === 'due_soon').map(f => (
                  <Link key={f.schedule.id} to="/Maintenance" className="flex items-center justify-between px-3 py-1.5 hover:bg-amber-100/50 transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{f.vehicle?.plate_number || '—'}</p>
                      <p className="text-xs text-amber-600">
                        {f.kmUntil !== null
                          ? t('alerts.serviceInKm', { km: f.kmUntil.toLocaleString() })
                          : t('alerts.serviceInDays', { count: f.daysUntil })}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Fleet Insights ───────────────────────────────────────────────
// Lightweight data-driven insights: no charts, just compact cards
function FleetInsights({ vehicles, mileageEntries }) {
  const { t } = useTranslation()

  const insights = useMemo(() => {
    if (vehicles.length === 0) return null

    // Total mileage per vehicle
    const mileageByVehicle = {}
    mileageEntries.forEach(e => {
      if (!mileageByVehicle[e.vehicle_id]) mileageByVehicle[e.vehicle_id] = 0
      mileageByVehicle[e.vehicle_id] = Math.max(mileageByVehicle[e.vehicle_id], e.mileage || 0)
    })

    const vehiclesWithMileage = vehicles.filter(v => mileageByVehicle[v.id] !== undefined)
    const mostUsed = vehiclesWithMileage.sort((a, b) => (mileageByVehicle[b.id] || 0) - (mileageByVehicle[a.id] || 0))[0]
    const leastUsed = vehiclesWithMileage.sort((a, b) => (mileageByVehicle[a.id] || 0) - (mileageByVehicle[b.id] || 0))[0]

    // Inactive: no mileage entry in the last 30 days
    const cutoff = subDays(new Date(), 30)
    const activeVehicleIds = new Set(
      mileageEntries
        .filter(e => e.created_at && isAfter(new Date(e.created_at), cutoff))
        .map(e => e.vehicle_id)
    )
    const inactiveCount = vehicles.filter(v => !activeVehicleIds.has(v.id)).length

    return { mostUsed, leastUsed, mileageByVehicle, inactiveCount }
  }, [vehicles, mileageEntries])

  if (!insights || vehicles.length === 0) return null

  return (
    <div className="bg-white rounded-xl p-5 border border-zinc-100">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-zinc-500" />
        <h3 className="font-bold text-zinc-900">{t('insights.title')}</h3>
      </div>
      <div className="space-y-3">
        {insights.mostUsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400">{t('insights.mostUsed')}</p>
              <p className="text-sm font-semibold text-zinc-900 truncate">{insights.mostUsed.plate_number} — {insights.mostUsed.model}</p>
            </div>
            <p className="text-xs font-bold text-emerald-600 flex-shrink-0">{(insights.mileageByVehicle[insights.mostUsed.id] || 0).toLocaleString()} km</p>
          </div>
        )}

        {insights.leastUsed && insights.leastUsed.id !== insights.mostUsed?.id && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400">{t('insights.leastUsed')}</p>
              <p className="text-sm font-semibold text-zinc-900 truncate">{insights.leastUsed.plate_number} — {insights.leastUsed.model}</p>
            </div>
            <p className="text-xs font-bold text-zinc-500 flex-shrink-0">{(insights.mileageByVehicle[insights.leastUsed.id] || 0).toLocaleString()} km</p>
          </div>
        )}

        {insights.inactiveCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400">{t('insights.noRecentActivity')}</p>
              <p className="text-sm font-semibold text-zinc-900">{t('insights.inactiveVehicles', { count: insights.inactiveCount })}</p>
            </div>
            <Link to="/Vehicles" className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex-shrink-0">{t('dashboard.viewAll')}</Link>
          </div>
        )}

        {!insights.mostUsed && (
          <p className="text-sm text-zinc-400 text-center py-2">{t('insights.noData')}</p>
        )}
      </div>
    </div>
  )
}

// ─── Timeline item ────────────────────────────────────────────────
// A single event in the activity timeline
function TimelineItem({ icon: Icon, iconBg, iconColor, title, subtitle, time, isLast }) {
  return (
    <div className="flex gap-4 group">
      {/* Spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-zinc-100 mt-1" />}
      </div>
      {/* Content */}
      <div className={`pb-5 flex-1 min-w-0 ${isLast ? '' : ''}`}>
        <p className="text-sm font-medium text-zinc-900 leading-snug">{title}</p>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        <p className="text-xs text-zinc-300 mt-1">{time}</p>
      </div>
    </div>
  )
}


// ─── Smart Notepad ────────────────────────────────────────────────
const CHIPS = [
  { label: 'Vidange à prévoir',    emoji: '🔧' },
  { label: 'CT à planifier',       emoji: '📋' },
  { label: 'Pneus à vérifier',     emoji: '🔩' },
  { label: 'Conducteur absent',    emoji: '👤' },
  { label: 'Carburant faible',     emoji: '⛽' },
  { label: 'Sinistre à déclarer',  emoji: '⚠️' },
]

function SmartNotepad({ userId }) {
  const [text, setText] = useState('')
  const [savedAt, setSavedAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef(null)
  const { t } = useTranslation()

  // Load from Supabase on mount
  useEffect(() => {
    if (!userId) return
    supabase
      .from('user_notes')
      .select('content')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) setText(data.content)
      })
  }, [userId])

  const save = useCallback(async (value) => {
    if (!userId) return
    await supabase
      .from('user_notes')
      .upsert({ user_id: userId, content: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setSaving(false)
    setSavedAt(new Date())
  }, [userId])

  function handleChange(e) {
    const val = e.target.value
    setText(val)
    setSaving(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(val), 800)
  }

  function insertChip(label) {
    const newText = text ? text + '\n• ' + label : '• ' + label
    setText(newText)
    setSaving(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(newText), 800)
  }

  function clearAll() {
    setText('')
    save('')
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const lines = text.split('\n').filter(Boolean).length

  return (
    <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="text-sm font-semibold text-zinc-900">Notes</span>
          {lines > 0 && (
            <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-500 rounded-full px-1.5 py-0.5">{lines}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[10px] text-zinc-300">Enregistrement...</span>}
          {!saving && savedAt && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-300">
              <Check className="w-3 h-3" /> Enregistré
            </span>
          )}
          {text && (
            <button onClick={clearAll} className="text-zinc-300 hover:text-zinc-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={handleChange}
        placeholder={"Vos notes de flotte...\n\nEx: BL-934-RM → vidange le 28/03\nAP-271-KL → CT avant fin du mois"}
        className="flex-1 w-full resize-none px-4 py-3 text-sm text-zinc-700 placeholder-zinc-300 focus:outline-none min-h-[140px] leading-relaxed font-[inherit]"
      />

      {/* Quick insert chips */}
      <div className="px-3 pb-3 pt-1 border-t border-zinc-50">
        <div className="flex items-center gap-1 mb-2">
          <Tag className="w-3 h-3 text-zinc-300" />
          <span className="text-[10px] text-zinc-300 font-medium uppercase tracking-wide">Insertion rapide</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map(chip => (
            <button
              key={chip.label}
              onClick={() => insertChip(chip.label)}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 rounded-lg px-2 py-1 transition-colors leading-none"
            >
              <span>{chip.emoji}</span>
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
    const { t } = useTranslation()
  const dateLocale = useDateLocale()
  usePageTitle(t('nav.dashboard'))

  const { data: vehicles }           = useVehicles()
  const { data: drivers }            = useDrivers()
  const { data: assignments }        = useAssignments()
  const { data: mileageEntries }     = useMileageEntries()
  const { data: inspections }        = useTechnicalInspections()
  const { data: maintenanceRecords } = useMaintenanceRecords()
  const { data: washRecords }        = useWashRecords()
  const { data: schedules }          = useMaintenanceSchedules()

  const { canAddVehicle, canAddDriver } = usePlanLimits(vehicles.length, drivers.length)

  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [showAddDriver,  setShowAddDriver]  = useState(false)
  const [showMileage,    setShowMileage]    = useState(false)
  const [showWash,       setShowWash]       = useState(false)

  const today = new Date()
  const latestAssignments = getLatestAssignments(assignments)
  const assignedCount = Object.keys(latestAssignments).length

  const forecasts = useMemo(
    () => computeForecasts({ schedules, vehicles, maintenanceRecords, mileageEntries }),
    [schedules, vehicles, maintenanceRecords, mileageEntries]
  )
  const urgentForecasts = forecasts.filter(f => f.status === 'overdue' || f.status === 'due_soon')

  const urgentInspections = inspections.filter(i => {
    const d = differenceInDays(new Date(i.expiration_date), today)
    return d >= 0 && d < 7
  })
  const warningInspections = inspections.filter(i => {
    const d = differenceInDays(new Date(i.expiration_date), today)
    return d >= 7 && d < 30
  })

  const totalAlerts = urgentInspections.length + urgentForecasts.length
  const openIssues  = maintenanceRecords.filter(m => m.status === 'PROBLEM').length

  // ── Unified activity timeline ──────────────────────────────────
  // Merges all event types: assignments, mileage, washes, maintenance
  const timelineItems = useMemo(() => {
    const items = [
      ...assignments.map(a => ({
        id: 'a-' + a.id,
        date: new Date(a.assigned_at),
        type: 'assignment',
        driver: getDriverById(drivers, a.driver_id),
        vehicle: getVehicleById(vehicles, a.vehicle_id),
      })),
      ...mileageEntries.map(m => ({
        id: 'm-' + m.id,
        date: new Date(m.created_at),
        type: 'mileage',
        vehicle: getVehicleById(vehicles, m.vehicle_id),
        mileage: m.mileage,
      })),
      ...washRecords.map(w => ({
        id: 'w-' + w.id,
        date: new Date(w.date + 'T12:00:00'),
        type: 'wash',
        vehicle: getVehicleById(vehicles, w.vehicle_id),
        driver: getDriverById(drivers, w.driver_id),
        amount: w.amount,
      })),
      ...maintenanceRecords.map(r => ({
        id: 'r-' + r.id,
        date: new Date(r.date + 'T12:00:00'),
        type: 'maintenance',
        vehicle: getVehicleById(vehicles, r.vehicle_id),
        status: r.status,
        description: r.issue_description,
      })),
    ]
    return items.sort((a, b) => b.date - a.date).slice(0, 8)
  }, [assignments, mileageEntries, washRecords, maintenanceRecords, drivers, vehicles])

  const statCards = [
    { label: t('dashboard.statVehicles'),    sub: t('dashboard.statVehiclesSub'),    value: vehicles.length,    icon: Truck },
    { label: t('dashboard.statDrivers'),     sub: t('dashboard.statDriversSub'),     value: drivers.length,     icon: Users },
    { label: t('dashboard.statAssignments'), sub: t('dashboard.statAssignmentsSub'), value: Object.keys(latestAssignments).length, icon: ArrowLeftRight },
    { label: t('dashboard.statIssues'),      sub: t('dashboard.statIssuesSub'),      value: openIssues,         icon: AlertTriangle },
  ]

  // Helper: format relative time
  const relativeTime = (date) => {
    const mins = Math.round((today - date) / 60000)
    if (mins < 1)  return t('timeline.instant')
    if (mins < 60) return t('timeline.minutesAgo', { count: mins })
    const hrs = Math.round(mins / 60)
    if (hrs < 24)  return t('timeline.hoursAgo', { count: hrs })
    const days = Math.round(hrs / 24)
    if (days < 7)  return t('timeline.daysAgo', { count: days })
    return format(date, 'd MMM', { locale: dateLocale })
  }

  // Resolve timeline item presentation
  const resolveTimelineItem = (item) => {
    switch (item.type) {
      case 'assignment':
        return {
          icon: ArrowLeftRight,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          title: t('timeline.assigned', { driver: item.driver?.name || t('timeline.driver'), plate: item.vehicle?.plate_number || '\u2014' }),
          subtitle: item.vehicle?.model || '',
        }
      case 'mileage':
        return {
          icon: Gauge,
          iconBg: 'bg-zinc-100',
          iconColor: 'text-zinc-500',
          title: t('timeline.mileageUpdated', { plate: item.vehicle?.plate_number || '\u2014' }),
          subtitle: `${item.mileage?.toLocaleString()} km`,
        }
      case 'wash':
        return {
          icon: Droplets,
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
          title: t('timeline.washed', { plate: item.vehicle?.plate_number || t('dashboard.vehicle') }),
          subtitle: `${item.driver?.name || '\u2014'} \u00b7 ${Number(item.amount).toFixed(2)} \u20ac`,
        }
      case 'maintenance':
        return {
          icon: Wrench,
          iconBg: item.status === 'PROBLEM' ? 'bg-red-100' : 'bg-emerald-100',
          iconColor: item.status === 'PROBLEM' ? 'text-red-500' : 'text-emerald-600',
          title: t('timeline.maintenanceRecorded', { plate: item.vehicle?.plate_number || '\u2014' }),
          subtitle: item.description || (item.status === 'OK' ? t('timeline.maintenanceOk') : t('timeline.problemDetected')),
        }
      default:
        return { icon: Activity, iconBg: 'bg-zinc-100', iconColor: 'text-zinc-400', title: '\u2014', subtitle: '' }
    }
  }

  return (
    <div className="flex flex-col xl:flex-row min-h-dvh">
      <AddVehicleModal open={showAddVehicle} onClose={() => setShowAddVehicle(false)} />
      <AddDriverModal  open={showAddDriver}  onClose={() => setShowAddDriver(false)} />
      <RecordMileageModal open={showMileage} onClose={() => setShowMileage(false)} vehicles={vehicles} />
      <AddWashModal open={showWash} onClose={() => setShowWash(false)} vehicles={vehicles} drivers={drivers} />

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 p-5 sm:p-8 min-w-0">

        {/* Header */}
        <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-1 capitalize">
              {format(new Date(), 'EEEE d MMMM yyyy', { locale: dateLocale })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
              {t('dashboard.greeting', { name: user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || '' })}
            </h1>
            <p className="text-zinc-400 text-sm mt-0.5">{t('dashboard.subtitle')}</p>
          </div>
          {totalAlerts > 0 && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              urgentInspections.length + urgentForecasts.filter(f => f.status === 'overdue').length > 0
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              <Bell className="w-4 h-4" />
              {t('dashboard.alerts', { count: totalAlerts })}
            </div>
          )}
        </div>

        {/* ── Quick actions ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-7">
          {[
            { label: t('dashboard.addVehicle'), icon: Truck,     onClick: () => canAddVehicle ? setShowAddVehicle(true) : toast.error(t('plan.vehicleLimitReached') + ' ' + t('plan.upgradeHint')) },
            { label: t('dashboard.addDriver'),  icon: Users,     onClick: () => canAddDriver  ? setShowAddDriver(true)  : toast.error(t('plan.driverLimitReached')  + ' ' + t('plan.upgradeHint'))  },
            { label: t('dashboard.logMileage'), icon: Gauge,     onClick: () => setShowMileage(true) },
            { label: 'Ajouter lavage',          icon: Droplets,  onClick: () => setShowWash(true)    },
          ].map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 active:scale-[0.98] transition-all duration-150 w-full sm:w-auto"
            >
              <Icon className="w-4 h-4 text-zinc-400" />
              {label}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="flex flex-col sm:flex-row bg-white border border-zinc-100 rounded-xl overflow-hidden mb-8">
          {statCards.map(({ label, sub, value, icon: Icon }, idx) => (
            <div key={label} className={`flex-1 px-5 py-5 min-w-0 ${idx < statCards.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-zinc-100' : ''}`}>
              <p className="text-xs font-medium text-zinc-400 mb-3">{label}</p>
              <p className="text-[28px] font-bold text-zinc-900 leading-none tracking-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* Vehicle Usage Analytics */}
        <VehicleUsageAnalytics vehicles={vehicles} mileageEntries={mileageEntries} />

        {/* ── Activity Timeline ────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">{t('dashboard.recentActivity')}</h2>
              <p className="text-sm text-zinc-400">{t('dashboard.recentActivitySub')}</p>
            </div>
            <Link to="/Assignments" className="text-xs text-zinc-400 hover:text-zinc-700 font-medium">{t('dashboard.viewAll')}</Link>
          </div>

          {timelineItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-zinc-300" />
              </div>
              <p className="font-semibold text-zinc-600 mb-1">{t('dashboard.noActivity')}</p>
              <p className="text-sm text-zinc-400 mb-4">{t('dashboard.noActivityDesc')}</p>
              <Button size="sm" variant="outline" onClick={() => setShowMileage(true)}>
                {t('dashboard.logMileageBtn')}
              </Button>
            </div>
          ) : (
            <div className="px-4 sm:px-6 pb-6 pt-2">
              {timelineItems.map((item, i) => {
                const resolved = resolveTimelineItem(item)
                return (
                  <TimelineItem
                    key={item.id}
                    {...resolved}
                    time={relativeTime(item.date)}
                    isLast={i === timelineItems.length - 1}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────── */}
      <div className="xl:w-80 flex-shrink-0 p-4 sm:p-7 xl:pl-0 flex flex-col gap-5">

        {/* Fleet summary card */}
        <div className="bg-white border border-zinc-100 rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-[#2563EB]/[0.08] rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#2563EB]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">{t('dashboard.fleet')}</p>
              <p className="text-sm font-bold text-zinc-900 leading-tight">{user?.user_metadata?.org_company || user?.user_metadata?.company || 'FleetDesk'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-zinc-100">
            <div>
              <p className="text-xs font-medium text-zinc-400 mb-1">{t('dashboard.total')}</p>
              <p className="text-xl font-bold text-zinc-900">{vehicles.length} <span className="text-sm font-medium text-zinc-400">{vehicles.length !== 1 ? t('dashboard.vehiclesLabel') : t('dashboard.vehicleLabel')}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-zinc-400 mb-1">{t('dashboard.assignedLabel')}</p>
              <p className="text-xl font-bold text-zinc-900">{assignedCount} <span className="text-sm font-medium text-zinc-400">/ {vehicles.length}</span></p>
            </div>
          </div>
        </div>

        {/* Alert Center — consolidated, priority-based */}
        <AlertCenter
          urgentInspections={urgentInspections}
          warningInspections={warningInspections}
          urgentForecasts={urgentForecasts}
          vehicles={vehicles}
        />

        {/* Fleet Insights */}
        <FleetInsights vehicles={vehicles} mileageEntries={mileageEntries} />

        {/* Smart Notepad */}
        <SmartNotepad userId={user?.id} />

      </div>
    </div>
  )
}
