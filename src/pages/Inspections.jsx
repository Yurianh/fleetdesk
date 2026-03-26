import React, { useState } from 'react'
import { format, addYears, differenceInDays } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Plus, ClipboardCheck, Pencil, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import FormModal from '@/components/shared/FormModal'
import {
  useVehicles, useTechnicalInspections,
  createTechnicalInspection, updateTechnicalInspection, deleteTechnicalInspection,
  getVehicleById
} from '@/lib/useFleetData'

import { usePageTitle } from '@/lib/usePageTitle'

const EMPTY_FORM = { vehicle_id: '', inspection_date: '' }

function StatusBadge({ expirationDate }) {
  const days = differenceInDays(new Date(expirationDate), new Date())
  if (days < 0)   return <Badge variant="destructive">Expiré</Badge>
  if (days < 7)   return <Badge className="bg-red-100 text-red-700 border-red-200">Urgent · {days}j</Badge>
  if (days < 30)  return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Bientôt · {days}j</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Valide</Badge>
}

export default function Inspections() {
  usePageTitle('Contrôles techniques')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { data: vehicles }    = useVehicles()
  const { data: inspections } = useTechnicalInspections()
  const queryClient = useQueryClient()

  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  const openEdit   = (ins) => {
    setEditing(ins)
    setForm({ vehicle_id: ins.vehicle_id, inspection_date: ins.inspection_date })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }

  const expiryPreview = form.inspection_date
    ? format(addYears(new Date(form.inspection_date), 1), 'd MMMM yyyy', { locale: dateLocale })
    : null

  const handleSubmit = async () => {
    if (!form.vehicle_id) return
    setSaving(true)
    try {
      const effectiveDate = form.inspection_date || new Date().toISOString().split('T')[0]
      const payload = {
        vehicle_id: form.vehicle_id,
        inspection_date: effectiveDate,
        expiration_date: format(addYears(new Date(effectiveDate), 1), 'yyyy-MM-dd'),
      }
      if (editing) {
        await updateTechnicalInspection(editing.id, payload)
        toast.success(t('inspections.updated'))
      } else {
        await createTechnicalInspection(payload)
        toast.success(t('inspections.saved'))
      }
      queryClient.invalidateQueries({ queryKey: ['technicalInspections'] })
      closeModal()
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteTechnicalInspection(id)
      queryClient.invalidateQueries({ queryKey: ['technicalInspections'] })
      toast.success(t('inspections.deleted'))
    } catch { toast.error('Erreur lors de la suppression') }
    finally { setDeletingId(null) }
  }

  const expiredCount  = inspections.filter(i => differenceInDays(new Date(i.expiration_date), new Date()) < 0).length
  const urgentCount   = inspections.filter(i => { const d = differenceInDays(new Date(i.expiration_date), new Date()); return d >= 0 && d < 7 }).length

  return (
    <div className="p-5 sm:p-8">
      <PageHeader
        title="Contrôles techniques"
        description={
          expiredCount > 0
            ? `${expiredCount} expiré${expiredCount > 1 ? 's' : ''}`
            : urgentCount > 0
            ? `${urgentCount} urgent${urgentCount > 1 ? 's' : ''}`
            : `${inspections.length} contrôle${inspections.length !== 1 ? 's' : ''} enregistré${inspections.length !== 1 ? 's' : ''}`
        }
      >
        <Button onClick={openCreate} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
          <Plus className="w-4 h-4 mr-2" /> Ajouter un contrôle
        </Button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {inspections.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Aucun contrôle technique"
            description="Enregistrez le premier contrôle pour commencer le suivi des expirations."
            action={{ label: 'Ajouter un contrôle', onClick: openCreate }}
          />
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Date du contrôle</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Expiration</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Statut</th>
                    <th className="px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections.map(ins => {
                    const vehicle = getVehicleById(vehicles, ins.vehicle_id)
                    return (
                      <tr key={ins.id} className="hover:bg-white transition-colors group">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
                        <td className="px-5 py-3.5 text-slate-500">{format(new Date(ins.inspection_date), 'd MMM yyyy', { locale: dateLocale })}</td>
                        <td className="px-5 py-3.5 text-slate-500">{format(new Date(ins.expiration_date), 'd MMM yyyy', { locale: dateLocale })}</td>
                        <td className="px-5 py-3.5"><StatusBadge expirationDate={ins.expiration_date} /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(ins)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(ins.id)} disabled={deletingId === ins.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-slate-100">
              {inspections.map(ins => {
                const vehicle = getVehicleById(vehicles, ins.vehicle_id)
                return (
                  <div key={ins.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Contrôle : {format(new Date(ins.inspection_date), 'd MMM yyyy', { locale: dateLocale })}</p>
                        <p className="text-xs text-slate-400">Expire : {format(new Date(ins.expiration_date), 'd MMM yyyy', { locale: dateLocale })}</p>
                        <div className="mt-1.5"><StatusBadge expirationDate={ins.expiration_date} /></div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(ins)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(ins.id)} disabled={deletingId === ins.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
        title={editing ? 'Modifier le contrôle' : 'Ajouter un contrôle technique'}
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={editing ? 'Mettre à jour' : 'Enregistrer'}
      >
        <div>
          <Label>Véhicule</Label>
          <Select value={form.vehicle_id} onValueChange={v => setForm(f => ({...f, vehicle_id: v}))}>
            <SelectTrigger><SelectValue placeholder="Sélectionner un véhicule" /></SelectTrigger>
            <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate_number} — {v.model}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date du contrôle <span className="text-slate-400 font-normal">(optionnel — aujourd'hui par défaut)</span></Label>
          <Input type="date" value={form.inspection_date} onChange={e => setForm(f => ({...f, inspection_date: e.target.value}))} />
        </div>
        {expiryPreview && (
          <p className="text-sm text-slate-500 -mt-1">
            Expire le : <span className="font-semibold text-slate-700">{expiryPreview}</span>
          </p>
        )}
      </FormModal>
    </div>
  )
}
