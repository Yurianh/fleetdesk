import React, { useState, useRef } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Plus, Gauge, Trash2, Pencil, Search, Loader2, Paperclip, FileText, Camera, X, Users, CreditCard } from 'lucide-react'
import { compressImage } from '@/lib/compressImage'
import { uploadReceipt } from '@/lib/receiptStorage'
import { openSignedFile } from '@/lib/signedFile'
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
import DataError from '@/components/shared/DataError'
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog'
import {
  useVehicles, useMileageEntries, useDrivers, useAssignments,
  createMileageEntry, deleteMileageEntry, updateMileageEntry,
  getLatestMileage, getVehicleById, getLatestAssignments, getDriverById
} from '@/lib/useFleetData'

import { usePageTitle } from '@/lib/usePageTitle'
import { useAuth } from '@/lib/AuthContext'

// A single photo field (file pick or camera), used for the odometer + fuel
// ticket proofs a chauffeur must attach.
function PhotoField({ label, hint, required, file, setFile }) {
  const fileRef = useRef(null)
  const camRef = useRef(null)
  const onPick = (e) => {
    const f = e.target.files?.[0] || null
    if (f && f.size > 10 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 10 Mo)'); e.target.value = ''; return }
    if (f && !(f.type === 'application/pdf' || f.type.startsWith('image/'))) { toast.error('Photo ou PDF uniquement'); e.target.value = ''; return }
    setFile(f)
  }
  return (
    <div>
      <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
      <div className={`flex items-center gap-3 p-3 rounded-xl border bg-slate-50 ${required && !file ? 'border-slate-300' : 'border-slate-200'}`}>
        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
          <FileText className={`w-4 h-4 ${file ? 'text-slate-600' : 'text-slate-300'}`} />
        </div>
        <div className="flex-1 min-w-0">
          {file ? (
            <p className="text-sm text-slate-700 truncate">{file.name}</p>
          ) : (
            <span className="text-sm text-slate-400">{hint}<span className="block text-xs text-slate-300 mt-0.5">Photo ou PDF · max 10 Mo</span></span>
          )}
        </div>
        {file ? (
          <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => camRef.current?.click()} title="Prendre une photo"
              className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} title="Choisir un fichier"
              className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
              <Paperclip className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={onPick} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
    </div>
  )
}

export default function Mileage() {
  usePageTitle('Carburant & Kilométrage')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { user } = useAuth()
  // Chauffeur: their account is tied to one vehicle, pre-selected and locked.
  const isDriver = ['driver', 'sub-member'].includes(user?.user_metadata?.role)
  const driverVehicleId = user?.user_metadata?.vehicle_id || ''
  const { data: vehicles }      = useVehicles()
  const { data: drivers }       = useDrivers()
  const { data: assignments }   = useAssignments()
  const mileageQ = useMileageEntries()
  const { data: mileageEntries } = mileageQ
  const queryClient = useQueryClient()
  const latestMileage = getLatestMileage(mileageEntries)
  const latestAssignments = getLatestAssignments(assignments)

  // Conducteur for an entry: the one stored on it, else the vehicle's current
  // assignee (covers entries logged before driver_id existed).
  const driverFor = (m) => getDriverById(drivers, m.driver_id || latestAssignments[m.vehicle_id]?.driver_id)

  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ vehicle_id: '', mileage: '', label: '' })
  const [receiptFile, setReceiptFile] = useState(null)
  const [odometerFile, setOdometerFile] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({ mileage: '', vehicle_id: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [search, setSearch]     = useState('')

  const selectedCurrent = form.vehicle_id ? (latestMileage[form.vehicle_id]?.mileage ?? null) : null

  const openCreate = () => { setForm({ vehicle_id: isDriver ? driverVehicleId : '', mileage: '', label: '' }); setReceiptFile(null); setOdometerFile(null); setModal(true) }
  const openEdit = (m) => { setEditTarget(m); setEditForm({ mileage: String(m.mileage ?? ''), vehicle_id: m.vehicle_id }) }
  const closeModal = () => setModal(false)

  const handleSubmit = async () => {
    if (!form.vehicle_id || !form.mileage) return
    // Chauffeurs must prove the reading: a photo of the odometer AND a photo of
    // the fuel ticket / gauge.
    if (isDriver && (!odometerFile || !receiptFile)) {
      toast.error('Ajoutez la photo du compteur et celle du ticket / compteur essence.')
      return
    }
    const current = latestMileage[form.vehicle_id]?.mileage
    if (current && parseFloat(form.mileage) < current) {
      toast.error(t('mileage.decreaseError'))
      return
    }
    setSaving(true)
    try {
      // Photos are compressed client-side before upload.
      let receipt_url = null, odometer_url = null
      if (odometerFile) odometer_url = await uploadReceipt(await compressImage(odometerFile))
      if (receiptFile)  receipt_url  = await uploadReceipt(await compressImage(receiptFile))
      await createMileageEntry({
        vehicle_id: form.vehicle_id,
        mileage: parseFloat(form.mileage),
        // created_at left to the server (real time of entry) → list keeps the
        // true saisie order, not an artificial 12:00.
        label: form.label?.trim() || null,
        receipt_url,
        odometer_url,
        driver_id: latestAssignments[form.vehicle_id]?.driver_id || null,
      })
      queryClient.invalidateQueries({ queryKey: ['mileageEntries'] })
      toast.success(t('mileage.saved'))
      closeModal()
    } catch (e) {
      console.error('mileage save error:', e)
      toast.error(e?.message || t('common.saveError'))
    }
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

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteMileageEntry(id)
      queryClient.invalidateQueries({ queryKey: ['mileageEntries'] })
      toast.success(t('mileage.deleted'))
    } catch { toast.error(t('common.deleteError')) }
    finally { setDeletingId(null); setConfirmDeleteId(null) }
  }

  // A chauffeur only sees entries for their own assigned vehicle.
  const visibleEntries = isDriver && driverVehicleId
    ? mileageEntries.filter(m => m.vehicle_id === driverVehicleId)
    : mileageEntries

  const filtered = visibleEntries.filter(m => {
    if (!search) return true
    const v = getVehicleById(vehicles, m.vehicle_id)
    return v && (v.plate_number.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <div className="p-5 sm:p-8">
      <PageHeader
        title="Carburant & Kilométrage"
        description={`${visibleEntries.length} entrée${visibleEntries.length !== 1 ? 's' : ''} enregistrée${visibleEntries.length !== 1 ? 's' : ''}`}
      >
        <Button onClick={openCreate} className="bg-[#0066FF] hover:bg-[#0052D6]">
          <Plus className="w-4 h-4 mr-2" /> Enregistrer un kilométrage
        </Button>
      </PageHeader>

      <DataError queries={[mileageQ]} />

      {visibleEntries.length > 0 && (
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
        {visibleEntries.length === 0 ? (
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
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Conducteur</th>
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
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          {vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}
                          {m.label && <span className="block text-xs font-normal text-slate-400 mt-0.5 truncate max-w-[220px]">{m.label}</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          {(() => {
                            const d = driverFor(m)
                            if (!d) return <span className="text-slate-300">—</span>
                            return (
                              <div>
                                <p className="text-slate-700">{d.name}</p>
                                {d.dkv_card && (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                    <CreditCard className="w-3 h-3" /> DKV {d.dkv_card}
                                  </span>
                                )}
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</td>
                        <td className="px-5 py-3.5 text-slate-500">{format(new Date(m.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {m.odometer_url && (
                              <button type="button" onClick={() => openSignedFile(m.odometer_url)}
                                className="inline-flex items-center gap-1 text-xs text-[#0066FF] hover:underline mr-1" title="Voir la photo du compteur">
                                <Gauge className="w-3.5 h-3.5" /> Compteur
                              </button>
                            )}
                            {m.receipt_url && (
                              <button type="button" onClick={() => openSignedFile(m.receipt_url)}
                                className="inline-flex items-center gap-1 text-xs text-[#0066FF] hover:underline mr-1" title="Voir le ticket">
                                <Paperclip className="w-3.5 h-3.5" /> Ticket
                              </button>
                            )}
                            <button onClick={() => openEdit(m)} title="Modifier" className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-[#0066FF] transition-colors opacity-0 group-hover:opacity-100">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConfirmDeleteId(m.id)} disabled={deletingId === m.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
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
                      {(() => {
                        const d = driverFor(m)
                        if (!d) return null
                        return <p className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" />{d.name}{d.dkv_card ? ` · DKV ${d.dkv_card}` : ''}</p>
                      })()}
                      {m.label && <p className="text-xs text-slate-400 truncate">{m.label}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">{format(new Date(m.created_at), 'd MMM yyyy', { locale: dateLocale })}</p>
                        {m.odometer_url && (
                          <button type="button" onClick={() => openSignedFile(m.odometer_url)} className="inline-flex items-center gap-1 text-xs text-[#0066FF]">
                            <Gauge className="w-3 h-3" /> Compteur
                          </button>
                        )}
                        {m.receipt_url && (
                          <button type="button" onClick={() => openSignedFile(m.receipt_url)} className="inline-flex items-center gap-1 text-xs text-[#0066FF]">
                            <Paperclip className="w-3 h-3" /> Ticket
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(m)} title="Modifier" className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-[#0066FF] transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDeleteId(m.id)} disabled={deletingId === m.id} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        title="Enregistrer un kilométrage"
        onSubmit={handleSubmit}
        saving={saving}
      >
        <div>
          <Label>Véhicule</Label>
          {isDriver ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
              <Gauge className="w-4 h-4 text-slate-400" />
              {(() => { const v = getVehicleById(vehicles, driverVehicleId); return v ? `${v.plate_number}${v.model ? ` — ${v.model}` : ''}` : 'Votre véhicule' })()}
            </div>
          ) : (
            <SearchableSelect
              value={form.vehicle_id}
              onValueChange={v => setForm(f => ({...f, vehicle_id: v}))}
              placeholder="Sélectionner un véhicule"
              options={vehicles.map(v => ({
                value: v.id,
                label: `${v.plate_number} — ${v.model}${latestMileage[v.id] ? ` (${latestMileage[v.id].mileage?.toLocaleString('fr-FR') ?? '—'} km)` : ''}`,
              }))}
            />
          )}
        </div>
        {(() => {
          const vid = isDriver ? driverVehicleId : form.vehicle_id
          const d = vid ? getDriverById(drivers, latestAssignments[vid]?.driver_id) : null
          if (!d) return null
          return (
            <div className="flex items-center gap-2.5 rounded-lg bg-[#0066FF]/[0.04] border border-[#0066FF]/15 px-3 py-2 -mt-1">
              <Users className="w-4 h-4 text-[#0066FF] flex-shrink-0" />
              <p className="text-sm text-slate-600">
                {d.name}
                {d.dkv_card && <> · <span className="inline-flex items-center gap-1 font-medium text-slate-800"><CreditCard className="w-3.5 h-3.5 text-slate-400" />DKV {d.dkv_card}</span></>}
              </p>
            </div>
          )
        })()}
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
          <Label>Libellé <span className="text-slate-400 font-normal">(optionnel)</span></Label>
          <Input value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} placeholder="Ex : Plein Total A7, gasoil…" />
        </div>
        {isDriver && (
          <p className="text-xs text-[#0066FF] bg-[#0066FF]/[0.05] border border-[#0066FF]/15 rounded-lg px-3 py-2">
            Deux photos sont requises : le compteur kilométrique et le ticket (ou le compteur d'essence).
          </p>
        )}
        <PhotoField
          label="Photo du compteur (km)"
          hint="Prendre le compteur en photo"
          required={isDriver}
          file={odometerFile}
          setFile={setOdometerFile}
        />
        <PhotoField
          label="Photo du ticket / compteur essence"
          hint="Ticket de carburant ou compteur d'essence"
          required={isDriver}
          file={receiptFile}
          setFile={setReceiptFile}
        />
      </FormModal>
 
      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle>Modifier le relevé</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Kilométrage (km)</Label><Input type="number" value={editForm.mileage} onChange={e => setEditForm({...editForm, mileage: e.target.value})} /></div>
            <Button onClick={handleEdit} disabled={editSaving || !editForm.mileage} className="w-full bg-[#0066FF] hover:bg-[#0052D6]">
              {editSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <ConfirmDeleteDialog
        open={!!confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => handleDelete(confirmDeleteId)}
        deleting={deletingId === confirmDeleteId}
        title={t('deleteConfirm.mileageTitle')}
        description={t('deleteConfirm.mileageDesc')}
      />
    </div>
  )
}