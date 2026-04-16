import React from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { ArrowLeftRight, User, Truck, UserMinus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import { Link } from 'react-router-dom'
import {
  useVehicles, useDrivers, useAssignments,
  unassignVehicle, getDriverById, getVehicleById, getLatestAssignments
} from '@/lib/useFleetData'
import { usePageTitle } from '@/lib/usePageTitle'
import { useState } from 'react'

export default function Assignments() {
  usePageTitle('Affectations')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { data: vehicles }    = useVehicles()
  const { data: drivers }     = useDrivers()
  const { data: assignments } = useAssignments()
  const queryClient = useQueryClient()

  const [unassigningId, setUnassigningId] = useState(null)

  const latestAssignments = getLatestAssignments(assignments)
  const activeList = Object.values(latestAssignments)
  const unassignedVehicles = vehicles.filter(v => !latestAssignments[v.id])

  const handleUnassign = async (vehicleId) => {
    setUnassigningId(vehicleId)
    try {
      await unassignVehicle(vehicleId)
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Conducteur désaffecté.')
    } catch { toast.error('Erreur lors de la désaffectation.') }
    finally { setUnassigningId(null) }
  }

  return (
    <div className="p-5 sm:p-8">
      <PageHeader
        title={t('assignments.title')}
        description={`${activeList.length} affectation${activeList.length !== 1 ? 's' : ''} active${activeList.length !== 1 ? 's' : ''} · ${unassignedVehicles.length} véhicule${unassignedVehicles.length !== 1 ? 's' : ''} libre${unassignedVehicles.length !== 1 ? 's' : ''}`}
      />

      {/* ── Active assignments ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        {activeList.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Aucune affectation active"
            description="Affectez un véhicule à un conducteur depuis sa fiche."
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Conducteur</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Depuis</th>
                    <th className="px-5 py-3 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeList.map(a => {
                    const vehicle = getVehicleById(vehicles, a.vehicle_id)
                    const driver  = getDriverById(drivers, a.driver_id)
                    return (
                      <tr key={a.id} className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-5 py-3.5">
                          <Link to={`/Vehicles/${a.vehicle_id}`} className="flex items-center gap-2.5 group/link">
                            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Truck className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover/link:text-[#1D4ED8]">{vehicle?.model || '—'}</p>
                              <p className="text-xs text-slate-400 font-mono">{vehicle?.plate_number || ''}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link to={`/Drivers/${a.driver_id}`} className="flex items-center gap-2.5 group/link">
                            <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <p className="font-medium text-slate-700 group-hover/link:text-[#1D4ED8]">{driver?.name || '—'}</p>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-400">
                          {format(new Date(a.assigned_at), 'd MMM yyyy', { locale: dateLocale })}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleUnassign(a.vehicle_id)}
                              disabled={unassigningId === a.vehicle_id}
                              title="Désaffecter"
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-slate-100">
              {activeList.map(a => {
                const vehicle = getVehicleById(vehicles, a.vehicle_id)
                const driver  = getDriverById(drivers, a.driver_id)
                return (
                  <div key={a.id} className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/Vehicles/${a.vehicle_id}`} className="font-semibold text-slate-900 truncate block">{vehicle?.model || '—'}</Link>
                      <p className="text-xs text-slate-400 font-mono truncate">{vehicle?.plate_number}</p>
                      <Link to={`/Drivers/${a.driver_id}`} className="inline-flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <User className="w-3 h-3" />{driver?.name || '—'}
                      </Link>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-400">{format(new Date(a.assigned_at), 'd MMM', { locale: dateLocale })}</span>
                      <button
                        onClick={() => handleUnassign(a.vehicle_id)}
                        disabled={unassigningId === a.vehicle_id}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Unassigned vehicles ── */}
      {unassignedVehicles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Véhicules sans conducteur</h2>
            <span className="text-xs text-slate-400 ml-0.5">{unassignedVehicles.length}</span>
          </div>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {unassignedVehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link to={`/Vehicles/${v.id}`} className="flex items-center gap-2.5 group/link">
                        <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 group-hover/link:text-[#1D4ED8]">{v.model}</p>
                          <p className="text-xs text-slate-400 font-mono">{v.plate_number}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-300">Non affecté</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden divide-y divide-slate-100">
            {unassignedVehicles.map(v => (
              <Link key={v.id} to={`/Vehicles/${v.id}`} className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-500">{v.model}</p>
                  <p className="text-xs text-slate-400 font-mono">{v.plate_number}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
