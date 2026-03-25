import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, CreditCard, Car, Droplets, Pencil, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import EmptyState from '@/components/shared/EmptyState'
import {
  useDrivers, useVehicles, useAssignments,
  updateDriver, getVehicleById, getLatestAssignments
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
  const { data: drivers } = useDrivers()
  const { data: vehicles } = useVehicles()
  const { data: assignments } = useAssignments()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(null)

  const driver = drivers.find(d => d.id === id)
  if (!driver) return <div className="p-8 text-center text-slate-400">Conducteur introuvable</div>

  const driverAssignments = assignments.filter(a => a.driver_id === id)
  const latestAssignment = driverAssignments[0]
  const currentVehicle = latestAssignment ? getVehicleById(vehicles, latestAssignment.vehicle_id) : null

  const startEdit = () => {
    setForm({ name: driver.name, phone: driver.phone || '', dkv_card: driver.dkv_card || '', highway_badge: driver.highway_badge || '', wash_card: driver.wash_card || '' })
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

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <Link to="/Drivers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1D4ED8] mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour aux conducteurs
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
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
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{driver.name}</h1>
                  {driver.phone && <p className="text-slate-500 text-sm">{driver.phone}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-400">Véhicule actuel</p>
                  <p className="font-semibold text-slate-900 text-sm">
                    {currentVehicle ? `${currentVehicle.plate_number} — ${currentVehicle.model}` : '—'}
                  </p>
                </div>
                <button onClick={startEdit} className="p-2 rounded-lg border border-slate-200 hover:bg-white text-slate-500">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CardBadge icon={CreditCard} label="Carte DKV" value={driver.dkv_card} color="bg-blue-50" />
              <CardBadge icon={Car} label="Badge autoroute" value={driver.highway_badge} color="bg-white" />
              <CardBadge icon={Droplets} label="Carte lavage" value={driver.wash_card} color="bg-cyan-50" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Historique des affectations</h2>
        </div>
        {driverAssignments.length > 0 ? (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Affecté le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {driverAssignments.map(a => {
                    const vehicle = getVehicleById(vehicles, a.vehicle_id)
                    return (
                      <tr key={a.id}>
                        <td className="px-5 py-3 font-medium">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
                        <td className="px-5 py-3 text-slate-500">{format(new Date(a.assigned_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden divide-y divide-slate-100">
              {driverAssignments.map(a => {
                const vehicle = getVehicleById(vehicles, a.vehicle_id)
                return (
                  <div key={a.id} className="px-4 py-3">
                    <p className="font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
                    <p className="text-xs text-slate-400">{format(new Date(a.assigned_at), 'd MMM yyyy', { locale: dateLocale })}</p>
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
