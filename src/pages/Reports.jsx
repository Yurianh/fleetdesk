import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Download, Wrench, Droplets, Fuel, CalendarClock, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Gauge, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/AuthContext'
import { useDateLocale } from '@/lib/useDateLocale'
import { usePageTitle } from '@/lib/usePageTitle'
import {
  useVehicles, useDrivers, useMileageEntries, useMaintenanceRecords,
  useWashRecords, useTechnicalInspections, useAllDriverDocuments,
  getVehicleById, getDriverById,
} from '@/lib/useFleetData'

const euro = (n) => `${(Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`

const DOC_LABELS = {
  permis_conduire: 'Permis de conduire', aptitude: 'Aptitude à la conduite',
  casier: 'Casier judiciaire', sst: 'SST / PSC1', tpmr: 'TPMR',
  visite_medicale: 'Visite médicale', eco_conduite: 'Éco-conduite',
}

export default function Reports() {
  usePageTitle('Rapports')
  const { user } = useAuth()
  const dateLocale = useDateLocale()

  const { data: vehicles = [] }   = useVehicles()
  const { data: drivers = [] }    = useDrivers()
  const { data: mileage = [] }    = useMileageEntries()
  const { data: maintenance = [] } = useMaintenanceRecords()
  const { data: washes = [] }     = useWashRecords()
  const { data: inspections = [] } = useTechnicalInspections()
  const { data: driverDocs = [] } = useAllDriverDocuments()

  // Default to the current month (YYYY-MM).
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  const report = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const start = new Date(y, m - 1, 1, 0, 0, 0)
    const end = new Date(y, m, 0, 23, 59, 59)

    // Total fleet spend over an arbitrary range — reused for the trend vs the
    // previous month.
    const spendInRange = (from, to) => {
      const within = (v) => { if (!v) return false; const d = new Date(v); return d >= from && d <= to }
      return maintenance.filter(r => r.invoice_amount != null && within(r.date)).reduce((s, r) => s + Number(r.invoice_amount), 0)
        + washes.filter(w => w.amount != null && within(w.date)).reduce((s, w) => s + Number(w.amount), 0)
        + mileage.filter(e => e.amount != null && within(e.created_at)).reduce((s, e) => s + Number(e.amount), 0)
    }

    const inMonth = (v) => { if (!v) return false; const d = new Date(v); return d >= start && d <= end }

    const maintRows = maintenance.filter(r => r.invoice_amount != null && inMonth(r.date))
    const washRows  = washes.filter(w => w.amount != null && inMonth(w.date))
    const fuelRows  = mileage.filter(e => e.amount != null && inMonth(e.created_at))

    const maintTotal = maintRows.reduce((s, r) => s + Number(r.invoice_amount), 0)
    const washTotal  = washRows.reduce((s, w) => s + Number(w.amount), 0)
    const fuelTotal  = fuelRows.reduce((s, e) => s + Number(e.amount), 0)
    const total = maintTotal + washTotal + fuelTotal

    // Trend vs the previous month.
    const prevStart = new Date(y, m - 2, 1, 0, 0, 0)
    const prevEnd = new Date(y, m - 1, 0, 23, 59, 59)
    const prevTotal = spendInRange(prevStart, prevEnd)
    const trendPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null

    // Distance travelled this month — per vehicle, from the last reading before
    // the month (baseline) to the last reading within it.
    const readingsInMonth = mileage.filter(e => inMonth(e.created_at))
    const byVeh = {}
    mileage.forEach(e => { if (e.mileage != null) (byVeh[e.vehicle_id] ||= []).push(e) })
    let distanceKm = 0
    Object.values(byVeh).forEach(list => {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      const before = list.filter(e => new Date(e.created_at) < start)
      const inM = list.filter(e => inMonth(e.created_at))
      if (!inM.length) return
      const baseline = before.length ? Number(before[before.length - 1].mileage) : Number(inM[0].mileage)
      const endVal = Number(inM[inM.length - 1].mileage)
      distanceKm += Math.max(0, endVal - baseline)
    })

    // Spend per vehicle across all three sources → top 5.
    const perVehicle = {}
    const add = (vid, amt) => { if (!vid) return; perVehicle[vid] = (perVehicle[vid] || 0) + Number(amt) }
    maintRows.forEach(r => add(r.vehicle_id, r.invoice_amount))
    washRows.forEach(w => add(w.vehicle_id, w.amount))
    fuelRows.forEach(e => add(e.vehicle_id, e.amount))
    const topVehicles = Object.entries(perVehicle)
      .map(([id, amt]) => ({ vehicle: getVehicleById(vehicles, id), amount: amt }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Deadlines falling within the month.
    const ctDeadlines = inspections
      .filter(i => inMonth(i.expiration_date))
      .map(i => ({ vehicle: getVehicleById(vehicles, i.vehicle_id), date: i.expiration_date }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    const docDeadlines = driverDocs
      .filter(d => inMonth(d.expiry_date))
      .map(d => ({ driver: getDriverById(drivers, d.driver_id), type: d.type, date: d.expiry_date }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    return {
      label: format(start, 'MMMM yyyy', { locale: dateLocale }),
      maintTotal, washTotal, fuelTotal, total,
      prevTotal, trendPct,
      distanceKm,
      fuelCount: fuelRows.length,
      maintCount: maintRows.length,
      washCount: washRows.length,
      readingsCount: readingsInMonth.length,
      hasData: total > 0 || readingsInMonth.length > 0 || ctDeadlines.length > 0 || docDeadlines.length > 0,
      topVehicles, ctDeadlines, docDeadlines,
    }
  }, [month, vehicles, drivers, mileage, maintenance, washes, inspections, driverDocs, dateLocale])

  const company = user?.user_metadata?.company || user?.user_metadata?.full_name || 'Votre flotte'
  const pct = (part) => report.total > 0 ? Math.round((part / report.total) * 100) : 0
  const euroShort = (n) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR')} €`

  // Shift the selected month by delta (±1), clamped to a real YYYY-MM.
  const shiftMonth = (delta) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const isCurrentMonth = month === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const bars = [
    { key: 'maint', label: 'Maintenance', icon: Wrench,    value: report.maintTotal, color: '#0066FF' },
    { key: 'fuel',  label: 'Carburant',   icon: Fuel,      value: report.fuelTotal,  color: '#16a34a' },
    { key: 'wash',  label: 'Lavages',     icon: Droplets,  value: report.washTotal,  color: '#0ea5e9' },
  ]

  return (
    <div className="p-5 sm:p-8">
      {/* Controls — not printed */}
      <div data-no-print className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-900 tracking-tight">Rapports</h1>
          <p className="text-sm text-zinc-400 mt-1">Rapport mensuel d'activité, prêt à imprimer ou archiver.</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Mois</label>
            <div className="flex items-center gap-1.5">
              <button onClick={() => shiftMonth(-1)} aria-label="Mois précédent"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30"
              />
              <button onClick={() => shiftMonth(1)} disabled={isCurrentMonth} aria-label="Mois suivant"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Button onClick={() => window.print()} className="bg-[#0066FF] hover:bg-[#0052D6]">
            <Download className="w-4 h-4 mr-2" /> Télécharger le PDF
          </Button>
        </div>
      </div>

      {/* ── Report (printed) ── */}
      <div id="report" className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0066FF] px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Rapport mensuel</p>
            <p className="text-white text-xl font-bold tracking-tight mt-0.5">FleetDesk</p>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold">{company}</p>
            <p className="text-white/70 text-sm capitalize">{report.label}</p>
            <p className="text-white/60 text-xs mt-0.5">{vehicles.length} véhicule{vehicles.length !== 1 ? 's' : ''} · {drivers.length} conducteur{drivers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {!report.hasData && (
            <div className="text-center py-6">
              <p className="text-sm text-zinc-400">Aucune activité enregistrée sur ce mois. Choisissez un autre mois ou saisissez vos premières données.</p>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Spend + trend vs previous month */}
            <div className="border border-zinc-100 rounded-xl p-4">
              <Coins className="w-4 h-4 text-[#0066FF] mb-2" />
              <p className="text-xl font-bold text-zinc-900 tracking-tight leading-none">{euroShort(report.total)}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <p className="text-xs text-zinc-400">Dépenses du mois</p>
                {report.trendPct !== null && report.trendPct !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${report.trendPct > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {report.trendPct > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(report.trendPct)}%
                  </span>
                )}
              </div>
            </div>
            {[
              { icon: Gauge, label: 'Distance parcourue', value: `${report.distanceKm.toLocaleString('fr-FR')} km` },
              { icon: Fuel, label: 'Pleins', value: report.fuelCount },
              { icon: Wrench, label: 'Entretiens', value: report.maintCount },
            ].map(k => (
              <div key={k.label} className="border border-zinc-100 rounded-xl p-4">
                <k.icon className="w-4 h-4 text-[#0066FF] mb-2" />
                <p className="text-xl font-bold text-zinc-900 tracking-tight leading-none">{k.value}</p>
                <p className="text-xs text-zinc-400 mt-1.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Expenses breakdown */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Dépenses par catégorie</h2>
            {report.total > 0 ? (
              <div className="space-y-3">
                {bars.map(b => (
                  <div key={b.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-600">
                        <b.icon className="w-3.5 h-3.5" style={{ color: b.color }} /> {b.label}
                      </span>
                      <span className="text-sm text-zinc-900 font-medium tabular-nums">{euro(b.value)} <span className="text-zinc-300">·</span> <span className="text-zinc-400">{pct(b.value)}%</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct(b.value)}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-zinc-100">
                  <span className="text-sm font-semibold text-zinc-900">Total</span>
                  <span className="text-sm font-bold text-zinc-900 tabular-nums">{euro(report.total)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Aucune dépense enregistrée sur ce mois.</p>
            )}
          </section>

          {/* Top vehicles */}
          {report.topVehicles.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-zinc-900 mb-4">Véhicules les plus coûteux</h2>
              <div className="divide-y divide-zinc-100">
                {report.topVehicles.map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <span className="inline-flex items-center gap-2.5 text-sm text-zinc-700">
                      <span className="w-5 text-center text-xs font-bold text-zinc-300 tabular-nums">{i + 1}</span>
                      <span className="font-medium text-zinc-900">{row.vehicle?.plate_number || '—'}</span>
                      <span className="text-zinc-400">{row.vehicle?.model || ''}</span>
                    </span>
                    <span className="text-sm font-medium text-zinc-900 tabular-nums">{euro(row.amount)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Deadlines */}
          {(report.ctDeadlines.length > 0 || report.docDeadlines.length > 0) && (
            <section>
              <h2 className="text-sm font-semibold text-zinc-900 mb-4 inline-flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-[#0066FF]" /> Échéances du mois
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">Contrôles techniques</p>
                  {report.ctDeadlines.length ? (
                    <ul className="space-y-1.5">
                      {report.ctDeadlines.map((d, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-700">{d.vehicle?.plate_number || '—'}</span>
                          <span className="text-zinc-400">{format(new Date(d.date), 'd MMM', { locale: dateLocale })}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-zinc-300">Aucun</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-2">Documents conducteurs</p>
                  {report.docDeadlines.length ? (
                    <ul className="space-y-1.5">
                      {report.docDeadlines.map((d, i) => (
                        <li key={i} className="flex items-center justify-between text-sm gap-3">
                          <span className="text-zinc-700 truncate">{d.driver?.name || '—'} <span className="text-zinc-400">· {DOC_LABELS[d.type] || d.type}</span></span>
                          <span className="text-zinc-400 flex-shrink-0">{format(new Date(d.date), 'd MMM', { locale: dateLocale })}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-zinc-300">Aucun</p>}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <p className="text-xs text-zinc-400">Généré le {format(now, 'd MMMM yyyy', { locale: dateLocale })}</p>
          <p className="text-xs text-zinc-400">fleetdesk.fr</p>
        </div>
      </div>

      {/* Print: show only the report, edge to edge. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report, #report * { visibility: visible; }
          #report {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none; border-radius: 0; max-width: none;
          }
          @page { margin: 1.2cm; }
        }
      `}</style>
    </div>
  )
}
