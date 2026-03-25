import React from 'react'
import { differenceInDays } from 'date-fns'
import { useTranslation } from 'react-i18next'

export function getVehicleInspectionStatus(vehicleId, inspections) {
  const sorted = inspections
    .filter(i => i.vehicle_id === vehicleId)
    .sort((a, b) => new Date(b.expiration_date) - new Date(a.expiration_date))

  if (sorted.length === 0) return { status: 'unknown', daysLeft: null }

  const daysLeft = differenceInDays(new Date(sorted[0].expiration_date), new Date())

  if (daysLeft < 0)  return { status: 'expired',  daysLeft }
  if (daysLeft < 7)  return { status: 'urgent',   daysLeft }
  if (daysLeft < 30) return { status: 'upcoming', daysLeft }
  return              { status: 'ok',       daysLeft }
}

const BADGE_STYLES = {
  urgent:   { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200' },
  expired:  { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200' },
  upcoming: { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ok:       { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  unknown:  { dot: 'bg-slate-300',   badge: 'bg-slate-100 text-slate-500 border-slate-200' },
}

export default function VehicleStatusBadge({ vehicleId, inspections }) {
  const { t } = useTranslation()
  const { status, daysLeft } = getVehicleInspectionStatus(vehicleId, inspections)
  const cfg = BADGE_STYLES[status] || BADGE_STYLES.unknown

  const labelMap = {
    urgent: t('vehicleStatus.urgent'),
    expired: t('vehicleStatus.expired'),
    upcoming: t('vehicleStatus.upcoming'),
    ok: t('vehicleStatus.valid'),
    unknown: t('vehicleStatus.noInspection'),
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {labelMap[status] || labelMap.unknown}
      {daysLeft !== null && daysLeft >= 0 && status !== 'ok' && status !== 'unknown' && (
        <span className="opacity-60 font-normal">{daysLeft}j</span>
      )}
    </span>
  )
}
