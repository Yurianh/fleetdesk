import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Truck } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/shared/EmptyState'
import {
  useVehicles, useDrivers, useAssignments, useMileageEntries,
  useMaintenanceRecords, useTechnicalInspections, useWashRecords,
  getDriverById, getLatestAssignments, getLatestMileage
} from '@/lib/useFleetData'

import { usePageTitle } from '@/lib/usePageTitle'
export default function VehicleDetail() {
  usePageTitle('Véhicule')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { id } = useParams()
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()
  const { data: assignments } = useAssignments()
  const { data: mileageEntries } = useMileageEntries()
  const { data: maintenanceRecords } = useMaintenanceRecords()
  const { data: inspections } = useTechnicalInspections()
  const { data: washRecords } = useWashRecords()

  const vehicle = vehicles.find(v => v.id === id)
  if (!vehicle) return <div className="p-8 text-center text-slate-400">{t('vehicles.noResults')}</div>

  const vehicleAssignments = assignments.filter(a => a.vehicle_id === id)
  const vehicleMileage = mileageEntries.filter(m => m.vehicle_id === id)
  const vehicleMaintenance = maintenanceRecords.filter(m => m.vehicle_id === id)
  const vehicleInspections = inspections.filter(i => i.vehicle_id === id)
  const vehicleWashes = washRecords.filter(w => w.vehicle_id === id)

  const latestAssignment = vehicleAssignments[0]
  const currentDriver = latestAssignment ? getDriverById(drivers, latestAssignment.driver_id) : null
  const latestMileage = vehicleMileage[0]

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <Link to="/Vehicles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1D4ED8] mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('vehicles.title')}
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{vehicle.plate_number}</h1>
            <p className="text-slate-500">{vehicle.model}</p>
          </div>
          <div className="flex gap-6 sm:gap-8 mt-1 sm:mt-0">
            <div>
              <p className="text-sm text-slate-500">{t('assignments.driver')}</p>
              <p className="font-semibold text-slate-900">{currentDriver?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('mileage.title')}</p>
              <p className="font-semibold text-slate-900">{latestMileage ? `${latestMileage.mileage?.toLocaleString('fr-FR') ?? '—'} km` : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Tabs defaultValue="mileage">
            <TabsList className="w-full justify-start bg-white border-b border-slate-200 rounded-none px-2 h-12 min-w-max">
              <TabsTrigger value="mileage">Kilométrage</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="inspections">Contrôles tech.</TabsTrigger>
              <TabsTrigger value="washes">Lavages</TabsTrigger>
              <TabsTrigger value="assignments">Affectations</TabsTrigger>
            </TabsList>

            <TabsContent value="mileage" className="p-0">
              {vehicleMileage.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Kilométrage</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleMileage.map(m => (
                          <tr key={m.id}><td className="px-5 py-3 font-medium">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</td><td className="px-5 py-3 text-slate-500">{format(new Date(m.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden divide-y divide-slate-100">
                    {vehicleMileage.map(m => (
                      <div key={m.id} className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</p>
                        <p className="text-xs text-slate-400">{format(new Date(m.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun kilométrage enregistré" />}
            </TabsContent>

            <TabsContent value="maintenance" className="p-0">
              {vehicleMaintenance.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Kilométrage</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Description</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Statut</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleMaintenance.map(m => (
                          <tr key={m.id}>
                            <td className="px-5 py-3 text-slate-500">{format(new Date(m.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                            <td className="px-5 py-3">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</td>
                            <td className="px-5 py-3">{m.issue_description}</td>
                            <td className="px-5 py-3">{m.status === 'OK'
  ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />OK</span>
  : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Problème</span>
}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden divide-y divide-slate-100">
                    {vehicleMaintenance.map(m => (
                      <div key={m.id} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-slate-400">{format(new Date(m.date), 'd MMM yyyy', { locale: dateLocale })} · {m.mileage?.toLocaleString('fr-FR') ?? '—'} km</p>
                          {m.status === 'OK'
  ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />OK</span>
  : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Problème</span>
}
                        </div>
                        <p className="text-sm text-slate-700">{m.issue_description}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun entretien enregistré" />}
            </TabsContent>

            <TabsContent value="inspections" className="p-0">
              {vehicleInspections.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Date du contrôle</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Date d'expiration</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleInspections.map(i => (
                          <tr key={i.id}>
                            <td className="px-5 py-3">{format(new Date(i.inspection_date), 'd MMM yyyy', { locale: dateLocale })}</td>
                            <td className="px-5 py-3">{format(new Date(i.expiration_date), 'd MMM yyyy', { locale: dateLocale })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden divide-y divide-slate-100">
                    {vehicleInspections.map(i => (
                      <div key={i.id} className="px-4 py-3">
                        <p className="text-sm text-slate-700">Contrôle : {format(new Date(i.inspection_date), 'd MMM yyyy', { locale: dateLocale })}</p>
                        <p className="text-sm text-slate-500">Expire : {format(new Date(i.expiration_date), 'd MMM yyyy', { locale: dateLocale })}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun contrôle technique" />}
            </TabsContent>

            <TabsContent value="washes" className="p-0">
              {vehicleWashes.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Conducteur</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Montant</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleWashes.map(w => {
                          const driver = getDriverById(drivers, w.driver_id)
                          return (
                            <tr key={w.id}>
                              <td className="px-5 py-3">{format(new Date(w.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                              <td className="px-5 py-3">{driver?.name || '—'}</td>
                              <td className="px-5 py-3 font-medium">{Number(w.amount).toFixed(2)} €</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden divide-y divide-slate-100">
                    {vehicleWashes.map(w => {
                      const driver = getDriverById(drivers, w.driver_id)
                      return (
                        <div key={w.id} className="px-4 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-700">{driver?.name || '—'}</p>
                            <p className="text-xs text-slate-400">{format(new Date(w.date), 'd MMM yyyy', { locale: dateLocale })}</p>
                          </div>
                          <p className="font-semibold text-slate-800">{Number(w.amount).toFixed(2)} €</p>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : <EmptyState title="Aucun lavage enregistré" />}
            </TabsContent>

            <TabsContent value="assignments" className="p-0">
              {vehicleAssignments.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Conducteur</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Affecté le</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleAssignments.map(a => {
                          const driver = getDriverById(drivers, a.driver_id)
                          return (
                            <tr key={a.id}>
                              <td className="px-5 py-3 font-medium">{driver?.name || '—'}</td>
                              <td className="px-5 py-3 text-slate-500">{format(new Date(a.assigned_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden divide-y divide-slate-100">
                    {vehicleAssignments.map(a => {
                      const driver = getDriverById(drivers, a.driver_id)
                      return (
                        <div key={a.id} className="px-4 py-3">
                          <p className="font-medium text-slate-900">{driver?.name || '—'}</p>
                          <p className="text-xs text-slate-400">{format(new Date(a.assigned_at), 'd MMM yyyy', { locale: dateLocale })}</p>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : <EmptyState title="Aucune affectation" />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
