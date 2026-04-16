import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronRight, Loader2, Truck, Pencil, Trash2, User, UserMinus, Paperclip, FileText, X, Camera, Wrench, ClipboardCheck, Droplets } from 'lucide-react'
import { format, addYears } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import FormModal from '@/components/shared/FormModal'
import { InvoiceUpload } from '@/components/shared/InvoiceUpload'
import VehicleStatusBadge from '@/components/shared/VehicleStatusBadge'
import {
  useVehicles, useDrivers, useAssignments, useMileageEntries, useTechnicalInspections,
  createVehicle, updateVehicle, deleteVehicle, unassignVehicle, getLatestAssignments, getLatestMileage, getDriverById,
  createMaintenanceRecord, createTechnicalInspection, createWashRecord,
} from '@/lib/useFleetData'
import { uploadInvoice, deleteInvoice } from '@/lib/invoiceStorage'
import { usePageTitle } from '@/lib/usePageTitle'
import { useTranslation } from 'react-i18next'
import { usePlanLimits } from '@/lib/usePlanLimits'

function RegistrationUpload({ file, existingUrl, onFileChange, onClear }) {
  const fileRef   = useRef(null)
  const cameraRef = useRef(null)
  const hasFile   = file || existingUrl

  function handleChange(e) {
    const f = e.target.files?.[0] || null
    if (f && f.size > 10 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 10 Mo)'); e.target.value = ''; return }
    onFileChange(f)
  }

  return (
    <div>
      <Label>Carte grise <span className="text-slate-400 font-normal">(optionnel)</span></Label>
      <div className="flex items-center gap-2 mt-1.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
        <div className="w-7 h-7 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
          <FileText className={`w-3.5 h-3.5 ${hasFile ? 'text-slate-400' : 'text-slate-300'}`} />
        </div>
        <div className="flex-1 min-w-0 text-sm">
          {file ? (
            <span className="text-slate-700 truncate block">{file.name}</span>
          ) : existingUrl ? (
            <a href={existingUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] hover:underline text-sm">
              Voir la carte grise →
            </a>
          ) : (
            <span className="text-slate-400">
              Joindre la carte grise
              <span className="block text-xs text-slate-300 mt-0.5">JPG, PNG ou PDF · max 10 Mo</span>
            </span>
          )}
        </div>
        {hasFile ? (
          <button type="button" onClick={onClear} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => fileRef.current?.click()} title="Choisir un fichier"
              className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => cameraRef.current?.click()} title="Prendre une photo"
              className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <input ref={fileRef}   type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
    </div>
  )
}

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
  const [form, setForm] = useState({ plate_number: '', model: '', mec_date: '' })
  const [registrationFile, setRegistrationFile] = useState(null)
  const [registrationUrl, setRegistrationUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [unassigningId, setUnassigningId] = useState(null)

  // ── Maintenance quick-add ──
  const [maintModal, setMaintModal] = useState(false)
  const [maintVehicleId, setMaintVehicleId] = useState('')
  const [maintForm, setMaintForm] = useState({ date: '', mileage: '', status: 'ok', description: '' })
  const [maintInvoiceFile, setMaintInvoiceFile] = useState(null)
  const [maintInvoiceAmount, setMaintInvoiceAmount] = useState('')
  const [savingMaint, setSavingMaint] = useState(false)

  // ── Inspection quick-add ──
  const [inspModal, setInspModal] = useState(false)
  const [inspVehicleId, setInspVehicleId] = useState('')
  const [inspForm, setInspForm] = useState({ date: '' })
  const [inspInvoiceFile, setInspInvoiceFile] = useState(null)
  const [inspInvoiceAmount, setInspInvoiceAmount] = useState('')
  const [savingInsp, setSavingInsp] = useState(false)

  // ── Washing quick-add ──
  const [washModal, setWashModal] = useState(false)
  const [washVehicleId, setWashVehicleId] = useState('')
  const [washForm, setWashForm] = useState({ driver_id: '', date: '', amount: '' })
  const [washInvoiceFile, setWashInvoiceFile] = useState(null)
  const [savingWash, setSavingWash] = useState(false)

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
      let registration_card_url = null
      if (registrationFile) registration_card_url = await uploadInvoice(registrationFile, 'registration')
      await createVehicle({ ...form, mec_date: form.mec_date || null, registration_card_url })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setShowAdd(false)
      setForm({ plate_number: '', model: '', mec_date: '' })
      setRegistrationFile(null)
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
      let registration_card_url = registrationUrl || null
      if (registrationFile) {
        if (registrationUrl) await deleteInvoice(registrationUrl)
        registration_card_url = await uploadInvoice(registrationFile, 'registration')
      }
      await updateVehicle(editTarget.id, {
        plate_number: form.plate_number,
        model: form.model,
        mec_date: form.mec_date || null,
        registration_card_url,
      })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setEditTarget(null)
      setRegistrationFile(null)
      setRegistrationUrl('')
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

  const openMaint = (vehicleId) => {
    setMaintVehicleId(vehicleId)
    setMaintForm({ date: '', mileage: latestMileage[vehicleId]?.mileage?.toString() || '', status: 'ok', description: '' })
    setMaintInvoiceFile(null)
    setMaintInvoiceAmount('')
    setMaintModal(true)
  }
  const handleSaveMaint = async () => {
    if (!maintVehicleId || !maintForm.mileage) return
    setSavingMaint(true)
    try {
      let invoiceUrl = null
      if (maintInvoiceFile) invoiceUrl = await uploadInvoice(maintInvoiceFile, 'maintenance')
      await createMaintenanceRecord({
        vehicle_id: maintVehicleId,
        date: maintForm.date || new Date().toISOString().split('T')[0],
        mileage: parseFloat(maintForm.mileage),
        status: maintForm.status,
        description: maintForm.description || null,
        invoice_url: invoiceUrl,
        invoice_amount: maintInvoiceAmount ? parseFloat(maintInvoiceAmount) : null,
      })
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] })
      setMaintModal(false)
      toast.success('Entretien enregistré.')
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSavingMaint(false) }
  }

  const openInsp = (vehicleId) => {
    setInspVehicleId(vehicleId)
    setInspForm({ date: '' })
    setInspInvoiceFile(null)
    setInspInvoiceAmount('')
    setInspModal(true)
  }
  const handleSaveInsp = async () => {
    if (!inspVehicleId) return
    setSavingInsp(true)
    try {
      let invoiceUrl = null
      if (inspInvoiceFile) invoiceUrl = await uploadInvoice(inspInvoiceFile, 'inspection')
      const effectiveDate = inspForm.date || new Date().toISOString().split('T')[0]
      await createTechnicalInspection({
        vehicle_id: inspVehicleId,
        inspection_date: effectiveDate,
        expiration_date: format(addYears(new Date(effectiveDate), 1), 'yyyy-MM-dd'),
        invoice_url: invoiceUrl,
        invoice_amount: inspInvoiceAmount ? parseFloat(inspInvoiceAmount) : null,
      })
      queryClient.invalidateQueries({ queryKey: ['technicalInspections'] })
      setInspModal(false)
      toast.success('Contrôle technique enregistré.')
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSavingInsp(false) }
  }

  const openWash = (vehicleId) => {
    setWashVehicleId(vehicleId)
    const a = latestAssignments[vehicleId]
    const driver = a ? getDriverById(drivers, a.driver_id) : null
    setWashForm({ driver_id: driver?.id || '', date: '', amount: '' })
    setWashInvoiceFile(null)
    setWashModal(true)
  }
  const handleSaveWash = async () => {
    if (!washVehicleId || !washForm.driver_id || !washForm.amount) return
    setSavingWash(true)
    try {
      let invoiceUrl = null
      if (washInvoiceFile) invoiceUrl = await uploadInvoice(washInvoiceFile, 'wash')
      await createWashRecord({
        vehicle_id: washVehicleId,
        driver_id: washForm.driver_id,
        date: washForm.date || new Date().toISOString().split('T')[0],
        amount: parseFloat(washForm.amount),
        invoice_url: invoiceUrl,
      })
      queryClient.invalidateQueries({ queryKey: ['washRecords'] })
      setWashModal(false)
      toast.success('Lavage enregistré.')
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSavingWash(false) }
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
            {v.model}
          </Link>
        </td>
        <td className={`px-5 py-3.5 font-mono text-sm ${isAssigned ? 'text-slate-600' : 'text-slate-400'}`}>{v.plate_number}</td>
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
            <button onClick={() => openMaint(v.id)} title="Ajouter un entretien" className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"><Wrench className="w-3.5 h-3.5" /></button>
            <button onClick={() => openInsp(v.id)} title="Ajouter un contrôle technique" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><ClipboardCheck className="w-3.5 h-3.5" /></button>
            <button onClick={() => openWash(v.id)} title="Ajouter un lavage" className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"><Droplets className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setEditTarget(v); setForm({ plate_number: v.plate_number, model: v.model, mec_date: v.mec_date || '' }); setRegistrationFile(null); setRegistrationUrl(v.registration_card_url || '') }} className="p-1.5 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
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
          <p className={`font-semibold ${isAssigned ? 'text-slate-900' : 'text-slate-400'}`}>{v.model}</p>
          <p className={`text-sm font-mono truncate ${isAssigned ? 'text-slate-500' : 'text-slate-400'}`}>{v.plate_number}</p>
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
          <button onClick={() => openMaint(v.id)} title="Entretien" className="p-1.5 text-slate-400 hover:text-orange-500"><Wrench className="w-3.5 h-3.5" /></button>
          <button onClick={() => openInsp(v.id)} title="Contrôle technique" className="p-1.5 text-slate-400 hover:text-emerald-600"><ClipboardCheck className="w-3.5 h-3.5" /></button>
          <button onClick={() => openWash(v.id)} title="Lavage" className="p-1.5 text-slate-400 hover:text-sky-500"><Droplets className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setEditTarget(v); setForm({ plate_number: v.plate_number, model: v.model, mec_date: v.mec_date || '' }); setRegistrationFile(null); setRegistrationUrl(v.registration_card_url || '') }} className="p-1.5 text-slate-400 hover:text-[#2563EB]"><Pencil className="w-3.5 h-3.5" /></button>
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
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Modèle</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Plaque</th>
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
      <Dialog open={showAdd} onOpenChange={open => { setShowAdd(open); if (!open) { setRegistrationFile(null); setRegistrationUrl('') } }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ajouter un véhicule</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2 min-w-0">
            <div><Label>Plaque d&apos;immatriculation</Label><Input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} placeholder="AB-123-CD" /></div>
            <div><Label>Modèle</Label><Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Renault Trafic" /></div>
            <div><Label>Date de mise en circulation <span className="text-slate-400 font-normal">(optionnel)</span></Label><Input type="date" value={form.mec_date} onChange={e => setForm({...form, mec_date: e.target.value})} /></div>
            <RegistrationUpload file={registrationFile} existingUrl={registrationUrl}
              onFileChange={setRegistrationFile} onClear={() => { setRegistrationFile(null); setRegistrationUrl('') }} />
            <Button onClick={handleCreate} disabled={saving || !form.plate_number || !form.model} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) { setEditTarget(null); setRegistrationFile(null); setRegistrationUrl('') } }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modifier le véhicule</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2 min-w-0">
            <div><Label>Plaque d&apos;immatriculation</Label><Input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} /></div>
            <div><Label>Modèle</Label><Input value={form.model} onChange={e => setForm({...form, model: e.target.value})} /></div>
            <div><Label>Date de mise en circulation <span className="text-slate-400 font-normal">(optionnel)</span></Label><Input type="date" value={form.mec_date} onChange={e => setForm({...form, mec_date: e.target.value})} /></div>
            <RegistrationUpload file={registrationFile} existingUrl={registrationUrl}
              onFileChange={setRegistrationFile} onClear={() => { setRegistrationFile(null); setRegistrationUrl('') }} />
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

      {/* ── Maintenance quick-add modal ── */}
      <FormModal
        open={maintModal}
        onClose={() => setMaintModal(false)}
        title="Ajouter un entretien"
        onSubmit={handleSaveMaint}
        saving={savingMaint}
        submitLabel="Enregistrer"
      >
        <div>
          <Label>Date <span className="text-slate-400 font-normal">(optionnel — aujourd&apos;hui par défaut)</span></Label>
          <Input type="date" value={maintForm.date} onChange={e => setMaintForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <div>
          <Label>Kilométrage</Label>
          <Input type="number" value={maintForm.mileage} onChange={e => setMaintForm(f => ({ ...f, mileage: e.target.value }))} placeholder="ex : 45000" />
        </div>
        <div>
          <Label>Résultat</Label>
          <Select value={maintForm.status} onValueChange={v => setMaintForm(f => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="problem">Problème</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {maintForm.status === 'problem' && (
          <div>
            <Label>Description du problème</Label>
            <Textarea value={maintForm.description} onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez le problème constaté..." rows={3} />
          </div>
        )}
        <InvoiceUpload
          file={maintInvoiceFile}
          existingUrl=""
          amount={maintInvoiceAmount}
          onFileChange={setMaintInvoiceFile}
          onAmountChange={setMaintInvoiceAmount}
          showAmount
        />
      </FormModal>

      {/* ── Inspection quick-add modal ── */}
      <FormModal
        open={inspModal}
        onClose={() => setInspModal(false)}
        title="Ajouter un contrôle technique"
        onSubmit={handleSaveInsp}
        saving={savingInsp}
        submitLabel="Enregistrer"
      >
        <div>
          <Label>Date du contrôle <span className="text-slate-400 font-normal">(optionnel — aujourd&apos;hui par défaut)</span></Label>
          <Input type="date" value={inspForm.date} onChange={e => setInspForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        {inspForm.date && (
          <p className="text-xs text-slate-400">
            Expiration prévue : <span className="font-medium text-slate-600">{format(addYears(new Date(inspForm.date), 1), 'dd/MM/yyyy')}</span>
          </p>
        )}
        <InvoiceUpload
          file={inspInvoiceFile}
          existingUrl=""
          amount={inspInvoiceAmount}
          onFileChange={setInspInvoiceFile}
          onAmountChange={setInspInvoiceAmount}
          showAmount
        />
      </FormModal>

      {/* ── Washing quick-add modal ── */}
      <FormModal
        open={washModal}
        onClose={() => setWashModal(false)}
        title="Ajouter un lavage"
        onSubmit={handleSaveWash}
        saving={savingWash}
        submitLabel="Enregistrer"
      >
        <div>
          <Label>Conducteur</Label>
          <SearchableSelect
            value={washForm.driver_id}
            onValueChange={v => setWashForm(f => ({ ...f, driver_id: v }))}
            placeholder="Sélectionner un conducteur"
            options={drivers.map(d => ({ value: d.id, label: d.name }))}
          />
        </div>
        <div>
          <Label>Date <span className="text-slate-400 font-normal">(optionnel — aujourd&apos;hui par défaut)</span></Label>
          <Input type="date" value={washForm.date} onChange={e => setWashForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        <div>
          <Label>Montant (€)</Label>
          <Input type="number" step="0.01" value={washForm.amount} onChange={e => setWashForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
        </div>
        <InvoiceUpload
          file={washInvoiceFile}
          existingUrl=""
          onFileChange={setWashInvoiceFile}
          showAmount={false}
        />
      </FormModal>
    </div>
  )
}
