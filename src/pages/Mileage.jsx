import React, { useState } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Plus, Gauge, Trash2, Search, Pencil, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import FormModal from '@/components/shared/FormModal'
import {
  useVehicles, useMileageEntries,
  createMileageEntry, deleteMileageEntry, updateMileageEntry,
  getLatestMileage, getVehicleById
} from '@/lib/useFleetData'

import { usePageTitle } from '@/lib/usePageTitle'
export default function Mileage() {
  usePageTitle('Kilométrage')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { data: vehicles }      = useVehicles()
  const { data: mileageEntries } = useMileageEntries()
  const queryClient = useQueryClient()
  const latestMileage = getLatestMileage(mileageEntries)

  const [modal, setModal]       = useState(false)
  const today                   = new Date().toISOString().split('T')[0]
  const [form, setForm]         = useState({ vehicle_id: '', mileage: '', date: '' })
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ mileage: '', vehicle_id: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [search, setSearch]     = useState('')

  const selectedCurrent = form.vehicle_id ? (latestMileage[form.vehicle_id]?.mileage ?? null) : null

  const openCreate = () => { setForm({ vehicle_id: '', mileage: '', date: '' }); setModal(true) }
  const closeModal = () => setModal(false)

  const handleSubmit = async () => {
    if (!form.vehicle_id || !form.mileage) return
    const current = latestMileage[form.vehicle_id]?.mileage
    if (current && parseFloat(form.mileage) < current) {
      toast.error(t('mileage.decreaseError'))
      return
    }
    setSaving(true)
    try {
      await createMileageEntry({
        vehicle_id: form.vehicle_id,
        mileage: parseFloat(form.mileage),
        created_at: form.date ? new Date(form.date + 'T12:00:00').toISOString() : new Date().toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['mileageEntries'] })
      toast.success(t('mileage.saved'))
      closeModal()
    } catch { toast.error(t('common.saveError')) }
    finally { setSaving(false) }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    setEditSaving(true)
    try {
      await updateMileageEntry(editTarget.id, { mileage: Number(editForm.mileage) })
      queryClient.invalidateQueries({ queryKey: ['mileageEntries'] })
      setEditTarget(null)
      toast.success('Kilométrage mis à jour.')
    } catch { toast.error('Erreur lors de la mise à jour.') }
    finally { setEditSaving(false) }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteMileageEntry(id)
      queryClient.invalidateQueries({ queryKey: ['mileageEntries'] })
      toast.success(t('mileage.deleted'))
    } catch { toast.error(t('common.deleteError')) }
    finally { setDeletingId(null) }
  }

  const filtered = mileageEntries.filter(m => {
    if (!search) return true
    const v = getVehicleById(vehicles, m.vehicle_id)
    return v && (v.plate_number.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <div className="p-5 sm:p-8">
      <PageHeader
        title="Kilométrage"
        description={`${mileageEntries.length} entrée${mileageEntries.length !== 1 ? 's' : ''} enregistrée${mileageEntries.length !== 1 ? 's' : ''}`}
      >
        <Button onClick={openCreate} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Plus className="w-4 h-4 mr-2" /> Enregistrer un kilométrage
        </Button>
      </PageHeader>

      {mileageEntries.length > 0 && (
        <div className="relative mb-5 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher par plaque ou modèle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {mileageEntries.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title="Aucun kilométrage enregistré"
            description="Commencez à suivre le kilométrage de vos véhicules."
            action={{ label: 'Enregistrer un kilométrage', onClick: openCreate }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title="Aucun résultat"
            description={`Aucune entrée ne correspond à "${search}"`}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Kilométrage</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                    <th className="px-5 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(m => {
                    const vehicle = getVehicleById(vehicles, m.vehicle_id)
                    return (
                      <tr key={m.id} className="hover:bg-white transition-colors group">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</td>
                        <td className="px-5 py-3.5 text-slate-500">{format(new Date(m.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map(m => {
                const vehicle = getVehicleById(vehicles, m.vehicle_id)
                return (
                  <div key={m.id} className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-slate-900 truncate">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</p>
                      <p className="text-xs text-slate-400">{format(new Date(m.created_at), 'd MMM yyyy', { locale: dateLocale })}</p>
                    </div>
                    <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <FormModal
        open={modal}
        onClose={closeModal}
        title="Enregistrer un kilométrage"
        onSubmit={handleSubmit}
        saving={saving}
      >
        <div>
          <Label>Véhicule</Label>
          <SearchableSelect
            value={form.vehicle_id}
            onValueChange={v => setForm(f => ({...f, vehicle_id: v}))}
            placeholder="Sélectionner un véhicule"
            options={vehicles.map(v => ({
              value: v.id,
              label: `${v.plate_number} — ${v.model}${latestMileage[v.id] ? ` (${latestMileage[v.id].mileage?.toLocaleString('fr-FR') ?? '—'} km)` : ''}`,
            }))}
          />
        </div>
        {selectedCurrent != null && (
          <p className="text-sm text-slate-500 -mt-1">
            Actuel : <span className="font-semibold text-slate-700">{selectedCurrent.toLocaleString('fr-FR')} km</span>
          </p>
        )}
        <div>
          <Label>Nouveau kilométrage (km)</Label>
          <Input type="number" value={form.mileage} onChange={e => setForm(f => ({...f, mileage: e.target.value}))} placeholder="Ex : 125 000" />
        </div>
        <div>
          <Label>Date d’effet <span className="text-slate-400 font-normal">(optionnel — maintenant par défaut)</span></Label>
          <Input type="date" value={form.date} max={today} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
        </div>
      </FormModal>
 
      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle>Modifier le relevé</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Kilométrage (km)</Label><Input type="number" value={editForm.mileage} onChange={e => setEditForm({...editForm, mileage: e.target.value})} /></div>
            <Button onClick={handleEdit} disabled={editSaving || !editForm.mileage} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
              {editSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}