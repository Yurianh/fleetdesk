import React, { useState } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Plus, Droplets, Pencil, Trash2, Paperclip } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { openSignedFile } from '@/lib/signedFile'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import FormModal from '@/components/shared/FormModal'
import { InvoiceUpload } from '@/components/shared/InvoiceUpload'
import DataError from '@/components/shared/DataError'
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog'
import UpgradePrompt from '@/components/shared/UpgradePrompt'
import { useCan } from '@/lib/capabilities'
import { uploadInvoice, deleteInvoice } from '@/lib/invoiceStorage'
import {
  useVehicles, useDrivers, useWashRecords, useAssignments,
  createWashRecord, updateWashRecord, deleteWashRecord,
  getVehicleById, getDriverById, getLatestAssignments
} from '@/lib/useFleetData'

import { usePageTitle } from '@/lib/usePageTitle'
import { useAuth } from '@/lib/AuthContext'
const EMPTY_FORM = { vehicle_id: '', driver_id: '', amount: '', date: '' }

export default function Washings() {
  usePageTitle('Lavages')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { data: vehicles }   = useVehicles()
  const { data: drivers }    = useDrivers()
  const { data: assignments } = useAssignments()
  const washQ = useWashRecords()
  const { data: washRecords } = washQ
  const queryClient = useQueryClient()
  const { user } = useAuth()
  // Chauffeur: vehicle locked to their account; driver auto-filled from the
  // vehicle's active assignment (they aren't a driver record themselves).
  const isDriver = ['driver', 'sub-member'].includes(user?.user_metadata?.role)
  // Wash tracking is a Pro feature. Chauffeurs belong to an Enterprise org so
  // they always pass; only starter owners are gated. Existing records stay
  // visible (grandfathered) — we only block adding new ones.
  const canWashings = useCan('washings').allowed
  const driverVehicleId = user?.user_metadata?.vehicle_id || ''
  // A chauffeur can have up to two vehicles and pick one per wash.
  const driverVehicleIds = user?.user_metadata?.vehicle_ids?.length
    ? user.user_metadata.vehicle_ids
    : (driverVehicleId ? [driverVehicleId] : [])
  const latestAssignments = getLatestAssignments(assignments)
  const driverIdForVehicle = (vid) => latestAssignments[vid]?.driver_id || ''

  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [invoiceFile, setInvoiceFile] = useState(null)
  const [invoiceExistingUrl, setInvoiceExistingUrl] = useState('')

  // A chauffeur only sees washes for their own assigned vehicles.
  const visibleWashes = isDriver && driverVehicleIds.length
    ? washRecords.filter(w => driverVehicleIds.includes(w.vehicle_id))
    : washRecords
  const totalAmount = visibleWashes.reduce((s, w) => s + (Number(w.amount) || 0), 0)

  const openCreate = () => {
    setEditing(null)
    const vid = isDriver ? (driverVehicleIds[0] || '') : ''
    setForm(isDriver ? { ...EMPTY_FORM, vehicle_id: vid, driver_id: driverIdForVehicle(vid) } : EMPTY_FORM)
    setInvoiceFile(null)
    setInvoiceExistingUrl('')
    setModal(true)
  }
  const openEdit = (w) => {
    setEditing(w)
    setForm({ vehicle_id: w.vehicle_id, driver_id: w.driver_id, amount: String(w.amount), date: w.date })
    setInvoiceFile(null)
    setInvoiceExistingUrl(w.invoice_url || '')
    setModal(true)
  }
  const closeModal = () => {
    setModal(false)
    setEditing(null)
    setInvoiceFile(null)
    setInvoiceExistingUrl('')
  }

  const canSubmit = form.vehicle_id && form.amount && (isDriver || form.driver_id)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      let finalInvoiceUrl = invoiceExistingUrl
      if (invoiceFile) {
        if (editing?.invoice_url) await deleteInvoice(editing.invoice_url)
        finalInvoiceUrl = await uploadInvoice(invoiceFile, 'wash')
      } else if (!invoiceExistingUrl && editing?.invoice_url) {
        await deleteInvoice(editing.invoice_url)
        finalInvoiceUrl = null
      }

      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        date: form.date || new Date().toISOString().split('T')[0],
        invoice_url: finalInvoiceUrl || null,
      }
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

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      const record = washRecords.find(w => w.id === id)
      if (record?.invoice_url) await deleteInvoice(record.invoice_url)
      await deleteWashRecord(id)
      queryClient.invalidateQueries({ queryKey: ['washRecords'] })
      toast.success(t('washings.deleted'))
    } catch { toast.error('Erreur lors de la suppression') }
    finally { setDeletingId(null); setConfirmDeleteId(null) }
  }

  return (
    <div className="p-5 sm:p-8">
      <PageHeader
        title="Lavages"
        description={visibleWashes.length > 0 ? `${visibleWashes.length} lavage${visibleWashes.length !== 1 ? 's' : ''} · Total : ${totalAmount.toFixed(2)} €` : 'Aucun lavage enregistré'}
      >
        {canWashings && (
          <Button onClick={openCreate} className="bg-[#0066FF] hover:bg-[#0052D6]">
            <Plus className="w-4 h-4 mr-2" /> Ajouter un lavage
          </Button>
        )}
      </PageHeader>

      <DataError queries={[washQ]} />

      {!canWashings && (
        <div className="mb-4">
          <UpgradePrompt
            requiredPlan="pro"
            title="Suivez les lavages et leurs justificatifs"
            description="Enregistrez chaque lavage avec son montant et sa facture, et gardez l'historique par véhicule. Disponible à partir de la formule Pro."
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {visibleWashes.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="Aucun lavage enregistré"
            description={canWashings ? "Enregistrez le premier lavage d'un véhicule pour commencer le suivi." : "Passez à la formule Pro pour enregistrer les lavages de vos véhicules."}
            action={canWashings ? { label: 'Ajouter un lavage', onClick: openCreate } : undefined}
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
                    <th className="px-5 py-3 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleWashes.map(w => {
                    const vehicle = getVehicleById(vehicles, w.vehicle_id)
                    const driver  = getDriverById(drivers, w.driver_id)
                    return (
                      <tr key={w.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3.5 font-medium text-slate-900">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
                        <td className="px-5 py-3.5 text-slate-600">{driver?.name || '—'}</td>
                        <td className="px-5 py-3.5 text-slate-500">{format(new Date(w.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{Number(w.amount).toFixed(2)} €</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {w.invoice_url && (
                              <button type="button" onClick={() => openSignedFile(w.invoice_url)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                title="Voir la facture">
                                <Paperclip className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setConfirmDeleteId(w.id)} disabled={deletingId === w.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-slate-100">
              {visibleWashes.map(w => {
                const vehicle = getVehicleById(vehicles, w.vehicle_id)
                const driver  = getDriverById(drivers, w.driver_id)
                return (
                  <div key={w.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</p>
                        <p className="text-sm text-slate-600">{driver?.name || '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(new Date(w.date), 'd MMM yyyy', { locale: dateLocale })} · <span className="font-semibold text-slate-700">{Number(w.amount).toFixed(2)} €</span>
                          {w.invoice_url && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[#0066FF]"><Paperclip className="w-3 h-3" /></span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {w.invoice_url && (
                          <button type="button" onClick={() => openSignedFile(w.invoice_url)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                            <Paperclip className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDeleteId(w.id)} disabled={deletingId === w.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
          {isDriver ? (
            driverVehicleIds.length > 1 ? (
              <Select value={form.vehicle_id} onValueChange={v => setForm(f => ({...f, vehicle_id: v, driver_id: driverIdForVehicle(v)}))}>
                <SelectTrigger><SelectValue placeholder="Choisir un véhicule" /></SelectTrigger>
                <SelectContent>
                  {driverVehicleIds.map(id => {
                    const v = getVehicleById(vehicles, id)
                    return <SelectItem key={id} value={id}>{v ? `${v.plate_number}${v.model ? ` — ${v.model}` : ''}` : 'Véhicule'}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
                <Droplets className="w-4 h-4 text-slate-400" />
                {(() => { const v = getVehicleById(vehicles, driverVehicleIds[0]); return v ? `${v.plate_number}${v.model ? ` — ${v.model}` : ''}` : 'Votre véhicule' })()}
              </div>
            )
          ) : (
            <SearchableSelect
              value={form.vehicle_id}
              onValueChange={v => setForm(f => ({...f, vehicle_id: v}))}
              placeholder="Sélectionner un véhicule"
              options={vehicles.map(v => ({ value: v.id, label: `${v.plate_number} — ${v.model}` }))}
            />
          )}
        </div>
        {!isDriver && (
          <div>
            <Label>Conducteur</Label>
            <SearchableSelect
              value={form.driver_id}
              onValueChange={v => setForm(f => ({...f, driver_id: v}))}
              placeholder="Sélectionner un conducteur"
              options={drivers.map(d => ({ value: d.id, label: d.name }))}
            />
          </div>
        )}
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
        <InvoiceUpload
          file={invoiceFile}
          existingUrl={invoiceExistingUrl}
          amount=""
          onFileChange={f => { setInvoiceFile(f); if (!f) setInvoiceExistingUrl('') }}
          onAmountChange={() => {}}
          showAmount={false}
        />
      </FormModal>

      {/* Delete confirm dialog */}
      <ConfirmDeleteDialog
        open={!!confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => handleDelete(confirmDeleteId)}
        deleting={deletingId === confirmDeleteId}
        title={t('deleteConfirm.washTitle')}
        description={t('deleteConfirm.washDesc')}
      />
    </div>
  )
}
