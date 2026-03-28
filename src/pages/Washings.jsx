import React, { useState } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Plus, Droplets, Pencil, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import FormModal from '@/components/shared/FormModal'
import {
  useVehicles, useDrivers, useWashRecords,
  createWashRecord, updateWashRecord, deleteWashRecord,
  getVehicleById, getDriverById
} from '@/lib/useFleetData'

import { usePageTitle } from '@/lib/usePageTitle'
const EMPTY_FORM = { vehicle_id: '', driver_id: '', amount: '', date: '' }

export default function Washings() {
  usePageTitle('Lavages')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { data: vehicles }   = useVehicles()
  const { data: drivers }    = useDrivers()
  const { data: washRecords } = useWashRecords()
  const queryClient = useQueryClient()

  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const totalAmount = washRecords.reduce((s, w) => s + (Number(w.amount) || 0), 0)

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  const openEdit   = (w)  => {
    setEditing(w)
    setForm({ vehicle_id: w.vehicle_id, driver_id: w.driver_id, amount: String(w.amount), date: w.date })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }

  const canSubmit = form.vehicle_id && form.driver_id && form.amount

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount), date: form.date || new Date().toISOString().split('T')[0] }
      if (editing) {
        await updateWashRecord(editing.id, payload)
        toast.success(t('washings.updated'))
      } else {
        await createWashRecord(payload)
        toast.success(t('washings.saved'))
      }
      queryClient.invalidateQueries({ queryKey: ['washRecords'] })
      closeModal()
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteWashRecord(id)
      queryClient.invalidateQueries({ queryKey: ['washRecords'] })
      toast.success(t('washings.deleted'))
    } catch { toast.error('Erreur lors de la suppression') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="p-5 sm:p-8">
      <PageHeader
        title="Lavages"
        description={washRecords.length > 0 ? `${washRecords.length} lavage${washRecords.length !== 1 ? 's' : ''} · Total : ${totalAmount.toFixed(2)} €` : 'Aucun lavage enregistré'}
      >
        <Button onClick={openCreate} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Plus className="w-4 h-4 mr-2" /> Ajouter un lavage
        </Button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {washRecords.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="Aucun lavage enregistré"
            description="Enregistrez le premier lavage d'un véhicule pour commencer le suivi."
            action={{ label: 'Ajouter un lavage', onClick: openCreate }}
          />
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Conducteur</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Date</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Montant</th>
                    <th className="px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {washRecords.map(w => {
                    const vehicle = getVehicleById(vehicles, w.vehicle_id)
                    const driver  = getDriverById(drivers, w.driver_id)
                    return (
                      <tr key={w.id} className="hover:bg-white transition-colors group">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
                        <td className="px-5 py-3.5 text-slate-600">{driver?.name || '—'}</td>
                        <td className="px-5 py-3.5 text-slate-500">{format(new Date(w.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{Number(w.amount).toFixed(2)} €</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(w.id)} disabled={deletingId === w.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-slate-100">
              {washRecords.map(w => {
                const vehicle = getVehicleById(vehicles, w.vehicle_id)
                const driver  = getDriverById(drivers, w.driver_id)
                return (
                  <div key={w.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
                        <p className="text-sm text-slate-600">{driver?.name || '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{format(new Date(w.date), 'd MMM yyyy', { locale: dateLocale })} · <span className="font-semibold text-slate-700">{Number(w.amount).toFixed(2)} €</span></p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(w.id)} disabled={deletingId === w.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
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
        title={editing ? 'Modifier le lavage' : 'Ajouter un lavage'}
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={editing ? 'Mettre à jour' : 'Enregistrer'}
      >
        <div>
          <Label>Véhicule</Label>
          <SearchableSelect
            value={form.vehicle_id}
            onValueChange={v => setForm(f => ({...f, vehicle_id: v}))}
            placeholder="Sélectionner un véhicule"
            options={vehicles.map(v => ({ value: v.id, label: `${v.plate_number} — ${v.model}` }))}
          />
        </div>
        <div>
          <Label>Conducteur</Label>
          <SearchableSelect
            value={form.driver_id}
            onValueChange={v => setForm(f => ({...f, driver_id: v}))}
            placeholder="Sélectionner un conducteur"
            options={drivers.map(d => ({ value: d.id, label: d.name }))}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Date <span className="text-slate-400 font-normal">(optionnel — aujourd'hui par défaut)</span></Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
          </div>
          <div>
            <Label>Montant (€)</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="0.00" />
          </div>
        </div>
      </FormModal>
    </div>
  )
}
