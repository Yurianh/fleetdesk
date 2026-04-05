import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, CreditCard, Car, Droplets, Pencil, Check, X, MapPin, Hash, Truck, ChevronRight, ArrowLeftRight, UserMinus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { format, differenceInCalendarDays } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import EmptyState from '@/components/shared/EmptyState'
import DriverDocuments from '@/components/shared/DriverDocuments'
import {
  useDrivers, useVehicles, useAssignments,
  updateDriver, createAssignment, unassignVehicle, getVehicleById, getLatestAssignments, getDriverById
} from '@/lib/useFleetData'
import { usePageTitle } from '@/lib/usePageTitle'

function CardBadge({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${color}`}>
      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 truncate">{value || <span className="text-slate-300 font-normal">Non renseigné</span>}</p>
      </div>
    </div>
  )
}

export default function DriverDetail() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  usePageTitle('Conducteur')
  const { id } = useParams()
  const { data: drivers }     = useDrivers()
  const { data: vehicles }    = useVehicles()
  const { data: assignments } = useAssignments()
  const queryClient = useQueryClient()

  const [editing, setEditing]             = useState(false)
  const [saving, setSaving]               = useState(false)
  const [form, setForm]                   = useState(null)
  const [assignOpen, setAssignOpen]       = useState(false)
  const [assignVehicleId, setAssignVehicleId] = useState('')
  const [assigning, setAssigning]         = useState(false)
  const [vehicleSearch, setVehicleSearch] = useState('')
  const searchRef = useRef(null)

  const driver = drivers.find(d => d.id === id)
  if (!driver) return <div className="p-8 text-center text-slate-400">Conducteur introuvable</div>

  const latestAssignments = getLatestAssignments(assignments)
  const driverAssignments = assignments.filter(a => a.driver_id === id)

  // Ground truth: vehicle whose *latest* assignment points to this driver
  const currentVehicle = vehicles.find(v => latestAssignments[v.id]?.driver_id === id) || null

  // Current vehicle first, then free, then assigned to others
  const allPickableVehicles = [
    ...(currentVehicle ? [currentVehicle] : []),
    ...vehicles.filter(v => !latestAssignments[v.id] && v.id !== currentVehicle?.id),
    ...vehicles.filter(v => !!latestAssignments[v.id] && v.id !== currentVehicle?.id),
  ]
  const pickableVehicles = vehicleSearch.trim()
    ? allPickableVehicles.filter(v =>
        v.plate_number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.model.toLowerCase().includes(vehicleSearch.toLowerCase())
      )
    : allPickableVehicles

  const startEdit = () => {
    setForm({
      name: driver.name,
      phone: driver.phone || '',
      employee_id: driver.employee_id || '',
      address: driver.address || '',
      dkv_card: driver.dkv_card || '',
      highway_badge: driver.highway_badge || '',
      wash_card: driver.wash_card || '',
      date_of_birth: driver.date_of_birth || '',
    })
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDriver(id, form)
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('Conducteur mis à jour')
      setEditing(false)
    } catch { toast.error('Erreur lors de la mise à jour') }
    finally { setSaving(false) }
  }

  const openAssign = () => {
    setAssignVehicleId('')
    setVehicleSearch('')
    setAssignOpen(true)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  const handleAssign = async () => {
    if (!assignVehicleId) return
    setAssigning(true)
    try {
      const { swapped } = await createAssignment({
        vehicle_id: assignVehicleId,
        driver_id: id,
        assigned_at: new Date().toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      setAssignOpen(false)
      setAssignVehicleId('')
      toast.success(swapped ? 'Véhicules échangés.' : 'Véhicule affecté.')
    } catch { toast.error("Erreur lors de l'affectation.") }
    finally { setAssigning(false) }
  }

  const handleUnassign = async () => {
    if (!currentVehicle) return
    setAssigning(true)
    try {
      await unassignVehicle(currentVehicle.id)
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Conducteur désaffecté.')
    } catch { toast.error('Erreur lors de la désaffectation.') }
    finally { setAssigning(false) }
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <Link to="/Drivers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1D4ED8] mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour aux conducteurs
      </Link>

      {/* ── Driver info card ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-4">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>ID conducteur</Label><Input value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} placeholder="Ex : C-042" /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div><Label>Adresse</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="12 rue de la Paix, 75001 Paris" /></div>
              <div><Label>Date de naissance</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} /></div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Cartes & badges</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><Label>Carte DKV</Label><Input value={form.dkv_card} onChange={e => setForm({...form, dkv_card: e.target.value})} placeholder="N° carte DKV" /></div>
                <div><Label>Badge autoroute</Label><Input value={form.highway_badge} onChange={e => setForm({...form, highway_badge: e.target.value})} placeholder="N° badge" /></div>
                <div><Label>Carte lavage</Label><Input value={form.wash_card} onChange={e => setForm({...form, wash_card: e.target.value})} placeholder="N° carte" /></div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                <Check className="w-4 h-4 mr-1.5" />{saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}><X className="w-4 h-4 mr-1.5" />Annuler</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-slate-900">{driver.name}</h1>
                    {driver.employee_id && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Hash className="w-3 h-3" />{driver.employee_id}
                      </span>
                    )}
                  </div>
                  {driver.phone && <p className="text-slate-500 text-sm mt-0.5">{driver.phone}</p>}
                  {driver.address && (
                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{driver.address}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={startEdit} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CardBadge icon={CreditCard} label="Carte DKV"      value={driver.dkv_card}      color="bg-blue-50" />
              <CardBadge icon={Car}        label="Badge autoroute" value={driver.highway_badge} color="bg-white border border-slate-100" />
              <CardBadge icon={Droplets}   label="Carte lavage"    value={driver.wash_card}     color="bg-cyan-50" />
            </div>
          </div>
        )}
      </div>

      {/* ── Assignment section ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Véhicule actuel</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentVehicle ? 'Ce conducteur est actuellement affecté à ce véhicule.' : 'Aucun véhicule affecté pour le moment.'}
            </p>
          </div>
          {!assignOpen && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentVehicle && (
                <button
                  onClick={handleUnassign}
                  disabled={assigning}
                  className="text-xs font-medium text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <UserMinus className="w-3 h-3" /> Désaffecter
                </button>
              )}
              <button
                onClick={openAssign}
                className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] bg-[#2563EB]/5 hover:bg-[#2563EB]/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                {currentVehicle ? 'Changer' : '+ Affecter'}
              </button>
            </div>
          )}
        </div>

        {/* Current vehicle display */}
        {!assignOpen && (
          <div className="px-5 py-4">
            {currentVehicle ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{currentVehicle.plate_number}</p>
                  <p className="text-xs text-slate-400">{currentVehicle.model}</p>
                </div>
                <Link to={`/Vehicles/${currentVehicle.id}`} className="text-xs text-slate-400 hover:text-[#1D4ED8] flex items-center gap-1 transition-colors">
                  Voir <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">Non affecté</p>
              </div>
            )}
          </div>
        )}

        {/* Vehicle picker */}
        {assignOpen && (
          <div className="p-5">
            {vehicles.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucun véhicule dans la flotte.</p>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={vehicleSearch}
                    onChange={e => setVehicleSearch(e.target.value)}
                    placeholder="Rechercher par plaque ou modèle..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  />
                </div>
                {pickableVehicles.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Aucun véhicule ne correspond à "{vehicleSearch}".</p>
                ) : (
                  <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
                    {pickableVehicles.map(v => {
                      const occupiedBy = latestAssignments[v.id]
                        ? getDriverById(drivers, latestAssignments[v.id].driver_id)
                        : null
                      const isFree     = !latestAssignments[v.id]
                      const isCurrent  = v.id === currentVehicle?.id
                      const isSelected = assignVehicleId === v.id

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setAssignVehicleId(v.id)}
                          className={`w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 ${
                            isSelected
                              ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]/20'
                              : isCurrent
                              ? 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-300'
                              : isFree
                              ? 'border-slate-200 bg-white hover:border-slate-300'
                              : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-[#2563EB]' : isCurrent ? 'bg-emerald-100' : 'bg-slate-100'
                              }`}>
                                <Truck className={`w-3.5 h-3.5 ${
                                  isSelected ? 'text-white' : isCurrent ? 'text-emerald-600' : 'text-slate-400'
                                }`} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-slate-900 truncate">{v.plate_number}</p>
                                <p className="text-xs text-slate-400 truncate">{v.model}</p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Actuel
                                </span>
                              ) : isFree ? (
                                <span className="text-[11px] font-medium text-slate-400">Disponible</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                  <ArrowLeftRight className="w-3 h-3" />
                                  Échange avec {occupiedBy?.name || '—'}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => { setAssignOpen(false); setAssignVehicleId(''); setVehicleSearch('') }}
                className="flex-shrink-0"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!assignVehicleId || assigning}
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40"
              >
                {assigning ? 'Affectation...' : "Confirmer l'affectation"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Documents ── */}
      <div className="mb-4">
        <DriverDocuments driverId={id} driver={driver} />
      </div>

      {/* ── Assignment history ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Historique des affectations</h2>
        </div>
        {driverAssignments.length > 0 ? (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Période</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {driverAssignments.map(a => {
                    const vehicle   = getVehicleById(vehicles, a.vehicle_id)
                    const isCurrent = !a.ended_at
                    const endDate   = a.ended_at ? new Date(a.ended_at) : new Date()
                    const days      = differenceInCalendarDays(endDate, new Date(a.assigned_at))
                    return (
                      <tr key={a.id} className={isCurrent ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                            {vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}
                            {isCurrent && <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-full">Actuel</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {format(new Date(a.assigned_at), 'd MMM yyyy', { locale: dateLocale })}
                          <span className="mx-1.5 text-slate-300">→</span>
                          {isCurrent
                            ? <span className="font-semibold text-emerald-600">Aujourd'hui</span>
                            : format(new Date(a.ended_at), 'd MMM yyyy', { locale: dateLocale })
                          }
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400 tabular-nums">{days}j</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden divide-y divide-slate-100">
              {driverAssignments.map(a => {
                const vehicle   = getVehicleById(vehicles, a.vehicle_id)
                const isCurrent = !a.ended_at
                const endDate   = a.ended_at ? new Date(a.ended_at) : new Date()
                const days      = differenceInCalendarDays(endDate, new Date(a.assigned_at))
                return (
                  <div key={a.id} className={`px-4 py-3 ${isCurrent ? 'bg-emerald-50/40' : ''}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                      <p className="font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
                      {isCurrent && <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded-full">Actuel</span>}
                    </div>
                    <p className="text-xs text-slate-400">
                      {format(new Date(a.assigned_at), 'd MMM yyyy', { locale: dateLocale })}
                      <span className="mx-1">→</span>
                      {isCurrent
                        ? <span className="text-emerald-600 font-medium">Aujourd'hui</span>
                        : format(new Date(a.ended_at), 'd MMM yyyy', { locale: dateLocale })
                      }
                      <span className="ml-1.5 text-slate-300">· {days}j</span>
                    </p>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <EmptyState title="Aucune affectation" description="Ce conducteur n'a pas encore été affecté à un véhicule." />
        )}
      </div>
    </div>
  )
}
