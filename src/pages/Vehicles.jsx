import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronRight, Loader2, Truck, Pencil, Trash2, User, UserMinus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import VehicleStatusBadge from '@/components/shared/VehicleStatusBadge'
import {
  useVehicles, useDrivers, useAssignments, useMileageEntries, useTechnicalInspections,
  createVehicle, updateVehicle, deleteVehicle, unassignVehicle, getLatestAssignments, getLatestMileage, getDriverById
} from '@/lib/useFleetData'
import { usePageTitle } from '@/lib/usePageTitle'
import { useTranslation } from 'react-i18next'
import { usePlanLimits } from '@/lib/usePlanLimits'

function SectionHeader({ color, label, count }) {
  return (
    <tr>
      <td colSpan={6} className="px-5 pt-5 pb-2 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
          <span className="ml-0.5 text-xs font-medium text-slate-400">{count}</span>
        </div>
      </td>
    </tr>
  )
}

function MobileSectionHeader({ color, label, count }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="ml-0.5 text-xs font-medium text-slate-400">{count}</span>
    </div>
  )
}

export default function Vehicles() {
  usePageTitle('Véhicules')
  const { t } = useTranslation()
  const { data: vehicles } = useVehicles()
  const { data: drivers } = useDrivers()
  const { data: assignments } = useAssignments()
  const { data: mileageEntries } = useMileageEntries()
  const { data: inspections } = useTechnicalInspections()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({ plate_number: '', model: '' })
  const [saving, setSaving] = useState(false)
  const [unassigningId, setUnassigningId] = useState(null)

  const { canAddVehicle, limits } = usePlanLimits(vehicles.length)
  const latestAssignments = getLatestAssignments(assignments)
  const latestMileage = getLatestMileage(mileageEntries)

  const filtered = vehicles.filter(v =>
    v.plate_number?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase())
  )

  const assigned   = filtered.filter(v => {
    const a = latestAssignments[v.id]
    return a && getDriverById(drivers, a.driver_id)
  })
  const unassigned = filtered.filter(v => {
    const a = latestAssignments[v.id]
    return !a || !getDriverById(drivers, a.driver_id)
  })

  const handleCreate = async () => {
    if (!form.plate_number || !form.model) return
    setSaving(true)
    try {
      await createVehicle(form)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setShowAdd(false)
      setForm({ plate_number: '', model: '' })
      toast.success(t('vehicles.added'))
    } catch (e) {
      console.error('[createVehicle]', e)
      toast.error(e?.message || t('vehicles.addError'))
    } finally { setSaving(false) }
  }

  const handleEdit = async () => {
    if (!editTarget || !form.plate_number || !form.model) return
    setSaving(true)
    try {
      await updateVehicle(editTarget.id, { plate_number: form.plate_number, model: form.model })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setEditTarget(null)
      toast.success('Véhicule mis à jour.')
    } catch { toast.error('Erreur lors de la mise à jour.') }
    finally { setSaving(false) }
  }

  const handleUnassign = async (vehicleId) => {
    setUnassigningId(vehicleId)
    try {
      await unassignVehicle(vehicleId)
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Conducteur désaffecté.')
    } catch { toast.error('Erreur lors de la désaffectation.') }
    finally { setUnassigningId(null) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteVehicle(deleteTarget.id)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setDeleteTarget(null)
      toast.success('Véhicule supprimé.')
    } catch { toast.error('Erreur lors de la suppression.') }
    finally { setSaving(false) }
  }

  const renderDesktopRow = (v, isAssigned) => {
    const a = latestAssignments[v.id]
    const driver = a ? getDriverById(drivers, a.driver_id) : null
    const mileage = latestMileage[v.id]
    return (
      <tr
        key={v.id}
        className={`transition-colors group ${isAssigned ? 'hover:bg-emerald-50/40' : 'hover:bg-slate-50'}`}
      >
        {/* Left accent bar */}
        <td className={`w-0.5 p-0 ${isAssigned ? 'bg-emerald-400' : 'bg-transparent'}`} />
        <td className="px-5 py-3.5">
          <Link to={`/Vehicles/${v.id}`} className={`font-semibold hover:text-[#1D4ED8] ${isAssigned ? 'text-slate-900' : 'text-slate-400'}`}>
            {v.plate_number}
          </Link>
        </td>
        <td className={`px-5 py-3.5 ${isAssigned ? 'text-slate-600' : 'text-slate-400'}`}>{v.model}</td>
        <td className="px-5 py-3.5">
          {driver ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-emerald-600" />
              </span>
              {driver.name}
            </span>
          ) : (
            <span className="text-slate-300 text-sm">Non affecté</span>
          )}
        </td>
        <td className={`px-5 py-3.5 text-sm ${isAssigned ? 'text-slate-600' : 'text-slate-400'}`}>
          {mileage ? `${mileage.mileage.toLocaleString('fr-FR')} km` : <span className="text-slate-300">—</span>}
        </td>
        <td className="px-5 py-3.5"><VehicleStatusBadge vehicleId={v.id} inspections={inspections} /></td>
        <td className="px-5 py-3.5">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAssigned && (
              <button
                onClick={() => handleUnassign(v.id)}
                disabled={unassigningId === v.id}
                title="Désaffecter le conducteur"
                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <UserMinus className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => { setEditTarget(v); setForm({ plate_number: v.plate_number, model: v.model }) }} className="p-1.5 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDeleteTarget(v)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            <Link to={`/Vehicles/${v.id}`} className="p-1.5 text-slate-400 hover:text-[#1D4ED8]"><ChevronRight className="w-4 h-4" /></Link>
          </div>
        </td>
      </tr>
    )
  }

  const renderMobileRow = (v, isAssigned) => {
    const a = latestAssignments[v.id]
    const driver = a ? getDriverById(drivers, a.driver_id) : null
    const mileage = latestMileage[v.id]
    return (
      <div key={v.id} className={`flex items-center justify-between p-4 border-b border-slate-100 last:border-0 ${isAssigned ? 'border-l-2 border-l-emerald-400' : ''}`}>
        <Link to={`/Vehicles/${v.id}`} className="flex-1 min-w-0 mr-3">
          <p className={`font-semibold ${isAssigned ? 'text-slate-900' : 'text-slate-400'}`}>{v.plate_number}</p>
          <p className={`text-sm truncate ${isAssigned ? 'text-slate-500' : 'text-slate-400'}`}>{v.model}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <VehicleStatusBadge vehicleId={v.id} inspections={inspections} />
            {mileage && <span className="text-xs text-slate-400">{mileage.mileage.toLocaleString('fr-FR')} km</span>}
            {driver
              ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full"><User className="w-2.5 h-2.5" />{driver.name}</span>
              : <span className="text-xs text-slate-300">Non affecté</span>
            }
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {isAssigned && (
            <button onClick={() => handleUnassign(v.id)} disabled={unassigningId === v.id} className="p-1.5 text-slate-400 hover:text-amber-600"><UserMinus className="w-3.5 h-3.5" /></button>
          )}
          <button onClick={() => { setEditTarget(v); setForm({ plate_number: v.plate_number, model: v.model }) }} className="p-1.5 text-slate-400 hover:text-[#2563EB]"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(v)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 sm:p-8">
      <PageHeader title={t('vehicles.title')} description={`${vehicles.length} véhicule${vehicles.length !== 1 ? 's' : ''} · ${assigned.length} affecté${assigned.length !== 1 ? 's' : ''}`}>
        <div className="flex items-center gap-3">
          {limits.vehicles !== Infinity && (
            <span className="text-xs text-zinc-400">{t('plan.usageVehicles', { count: vehicles.length, max: limits.vehicles })}</span>
          )}
          <Button
            onClick={() => canAddVehicle ? setShowAdd(true) : toast.error(t('plan.vehicleLimitReached') + ' ' + t('plan.upgradeHint'))}
            className={canAddVehicle ? 'bg-[#2563EB] hover:bg-[#1D4ED8]' : 'bg-zinc-300 cursor-not-allowed hover:bg-zinc-300'}
          >
            <Plus className="w-4 h-4 mr-2" /> {t('vehicles.addVehicle')}
          </Button>
        </div>
      </PageHeader>

      <div className="relative mb-6 max-w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder={t('vehicles.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length > 0 ? (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="w-0.5 p-0" />
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Plaque</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Modèle</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Conducteur</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Kilométrage</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Statut</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assigned.length > 0 && (
                    <>
                      <SectionHeader color="bg-emerald-400" label="Affectés" count={assigned.length} />
                      {assigned.map(v => renderDesktopRow(v, true))}
                    </>
                  )}
                  {unassigned.length > 0 && (
                    <>
                      <SectionHeader color="bg-slate-300" label="Non affectés" count={unassigned.length} />
                      {unassigned.map(v => renderDesktopRow(v, false))}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="sm:hidden">
              {assigned.length > 0 && (
                <>
                  <MobileSectionHeader color="bg-emerald-400" label="Affectés" count={assigned.length} />
                  {assigned.map(v => renderMobileRow(v, true))}
                </>
              )}
              {unassigned.length > 0 && (
                <>
                  <MobileSectionHeader color="bg-slate-300" label="Non affectés" count={unassigned.length} />
                  {unassigned.map(v => renderMobileRow(v, false))}
                </>
              )}
            </div>
          </>
        ) : (
          <EmptyState icon={Truck} title={search ? 'Aucun véhicule ne correspond' : 'Aucun véhicule'} description={search ? 'Essayez une autre plaque ou un autre modèle.' : 'Ajoutez votre premier véhicule à la flotte.'} action={!search ? { label: 'Ajouter un véhicule', onClick: () => setShowAdd(true) } : undefined} />
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle>Ajouter un véhicule</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Plaque d&apos;immatriculation</Label><Input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} placeholder="AB-123-CD" /></div>
            <div><Label>Modèle</Label><Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Renault Trafic" /></div>
            <Button onClick={handleCreate} disabled={saving || !form.plate_number || !form.model} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle>Modifier le véhicule</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Plaque d&apos;immatriculation</Label><Input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} /></div>
            <div><Label>Modèle</Label><Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} /></div>
            <Button onClick={handleEdit} disabled={saving || !form.plate_number || !form.model} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader><DialogTitle>Supprimer le véhicule</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500 mt-1">Supprimer <span className="font-semibold text-slate-800">{deleteTarget?.plate_number}</span> ({deleteTarget?.model}) ? Cette action est irréversible.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
