import { differenceInDays, addMonths } from 'date-fns'

export const WARN_KM = 5000   // alert threshold: 5 000 km before service

export function computeForecasts({ schedules, vehicles, maintenanceRecords, mileageEntries }) {
  const today = new Date()

  return schedules.map(schedule => {
    const vehicle = vehicles.find(v => v.id === schedule.vehicle_id)

    const vehicleRecords = maintenanceRecords
      .filter(r => r.vehicle_id === schedule.vehicle_id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    const lastRecord = vehicleRecords[0] || null

    const latestMileageEntry = mileageEntries
      .filter(e => e.vehicle_id === schedule.vehicle_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    const currentMileage = latestMileageEntry?.mileage ?? null

    let nextDate = null
    let nextKm = null
    let daysUntil = null
    let kmUntil = null

    if (lastRecord) {
      nextDate = addMonths(new Date(lastRecord.date), schedule.interval_months)
      nextKm = lastRecord.mileage + schedule.interval_km
      daysUntil = differenceInDays(nextDate, today)
      kmUntil = currentMileage !== null ? nextKm - currentMileage : null
    }

    // Status: overdue > due_soon (within 5 000 km or 30 days) > ok
    let status = 'ok'
    if (lastRecord === null) {
      status = 'no_record'
    } else if ((daysUntil !== null && daysUntil < 0) || (kmUntil !== null && kmUntil <= 0)) {
      status = 'overdue'
    } else if ((daysUntil !== null && daysUntil <= 30) || (kmUntil !== null && kmUntil <= WARN_KM)) {
      status = 'due_soon'
    }

    return { schedule, vehicle, lastRecord, currentMileage, nextDate, nextKm, daysUntil, kmUntil, status }
  }).sort((a, b) => {
    const order = { overdue: 0, due_soon: 1, no_record: 2, ok: 3 }
    return (order[a.status] ?? 3) - (order[b.status] ?? 3)
  })
}


export function statusColors(status) {
  return {
    overdue:   { bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-500',    border: 'border-red-200' },
    due_soon:  { bg: 'bg-amber-50',  text: 'text-amber-600',  dot: 'bg-amber-400',  border: 'border-amber-200' },
    no_record: { bg: 'bg-slate-50',  text: 'text-slate-500',  dot: 'bg-slate-300',  border: 'border-slate-200' },
    ok:        { bg: 'bg-emerald-50',text: 'text-emerald-600',dot: 'bg-emerald-400',border: 'border-emerald-200' },
  }[status] ?? { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300', border: 'border-slate-200' }
}
