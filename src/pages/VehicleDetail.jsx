import React, { useState, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Truck, Plus, FileText, Paperclip, Camera, X, ChevronRight, Pencil, Gauge } from 'lucide-react'
import { format, addYears } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/ui/searchable-select'
import FormModal from '@/components/shared/FormModal'
import { InvoiceUpload } from '@/components/shared/InvoiceUpload'
import EmptyState from '@/components/shared/EmptyState'
import AssignDriverDialog from '@/components/shared/AssignDriverDialog'
import { uploadInvoice, deleteInvoice } from '@/lib/invoiceStorage'
import { openSignedFile } from '@/lib/signedFile'
import { useFeature } from '@/lib/activity'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Inline link to a stored file (signed URL). Renders nothing when there's no file.
function FileLink({ url, label = 'Voir', icon: Icon = Paperclip }) {
  if (!url) return null
  return (
    <button type="button" onClick={() => openSignedFile(url)}
      className="inline-flex items-center gap-1 text-xs text-[#0066FF] hover:underline">
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  )
}

// Compact document chip for the header: present → green "Voir", missing →
// dashed "Ajouter". Keeps documents grouped without crowding the fact grid.
function DocChip({ label, url, onView, onAdd }) {
  if (url) return (
    <button type="button" onClick={onView}
      className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 transition-colors">
      <FileText className="w-3.5 h-3.5 text-emerald-600" />
      <span className="font-medium">{label}</span>
      <span className="text-xs font-semibold text-emerald-700">Voir →</span>
    </button>
  )
  return (
    <button type="button" onClick={onAdd}
      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:border-[#0066FF] hover:text-[#0066FF] transition-colors">
      <Plus className="w-3.5 h-3.5" />
      <span className="font-medium">{label}</span>
    </button>
  )
}

// A single vehicle document field: file/camera pick, clear, and a signed link
// to the stored document (the "invoices" bucket is private).
function VehicleDocField({ label, file, setFile, existingUrl, placeholder }) {
  const fileRef = useRef(null)
  const camRef = useRef(null)
  const onPick = (e) => {
    const f = e.target.files?.[0]
    if (f && f.size > 10 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 10 Mo)'); return }
    setFile(f || null)
  }
  return (
    <div>
      <Label>{label} <span className="text-slate-400 font-normal">(optionnel)</span></Label>
      <div className="flex items-center gap-2 mt-1.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
        <div className="w-7 h-7 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
          <FileText className={`w-3.5 h-3.5 ${file || existingUrl ? 'text-slate-400' : 'text-slate-300'}`} />
        </div>
        <div className="flex-1 min-w-0 text-sm">
          {file ? (
            <span className="text-slate-700 truncate block">{file.name}</span>
          ) : existingUrl ? (
            <button type="button" onClick={() => openSignedFile(existingUrl)} className="text-[#0066FF] hover:underline text-sm">Voir →</button>
          ) : (
            <span className="text-slate-400">{placeholder || 'Joindre un fichier'}<span className="block text-xs text-slate-300 mt-0.5">JPG, PNG ou PDF · max 10 Mo</span></span>
          )}
        </div>
        {file ? (
          <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => fileRef.current?.click()} title="Choisir un fichier" className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => camRef.current?.click()} title="Prendre une photo" className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={onPick} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
    </div>
  )
}
import {
  useVehicles, useDrivers, useAssignments, useMileageEntries,
  useMaintenanceRecords, useTechnicalInspections, useWashRecords,
  getDriverById, getLatestAssignments,
  createMileageEntry, createMaintenanceRecord, createTechnicalInspection, createWashRecord,
  updateMileageEntry, updateVehicle
} from '@/lib/useFleetData'
import { usePageTitle } from '@/lib/usePageTitle'

export default function VehicleDetail() {
  usePageTitle('Véhicule')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const showLicense = useFeature('transportLicense')

  // Tab state lives in the URL so alerts and colleagues can deep-link
  // (e.g. /Vehicles/:id?tab=inspections)
  const [searchParams, setSearchParams] = useSearchParams()
  const VALID_TABS = ['mileage', 'maintenance', 'inspections', 'washes', 'assignments']
  const tabParam = searchParams.get('tab')
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'mileage'
  const setActiveTab = (tab) => setSearchParams(tab === 'mileage' ? {} : { tab }, { replace: true })

  const { data: vehicles }          = useVehicles()
  const { data: drivers }           = useDrivers()
  const { data: assignments }       = useAssignments()
  const { data: mileageEntries }    = useMileageEntries()
  const { data: maintenanceRecords } = useMaintenanceRecords()
  const { data: inspections }       = useTechnicalInspections()
  const { data: washRecords }       = useWashRecords()

  const vehicle = vehicles.find(v => v.id === id)

  // ── Modal states ──────────────────────────────────────────────────
  const [mileageModal,     setMileageModal]     = useState(false)
  const [maintenanceModal, setMaintenanceModal] = useState(false)
  const [inspectionModal,  setInspectionModal]  = useState(false)
  const [washModal,        setWashModal]        = useState(false)
  const [saving,           setSaving]           = useState(false)

  const [mileageForm,     setMileageForm]     = useState({ mileage: '' })
  const [editMileageTarget, setEditMileageTarget] = useState(null)
  const [editMileageValue,  setEditMileageValue]  = useState('')
  const [savingEditMileage, setSavingEditMileage] = useState(false)
  const [maintenanceForm, setMaintenanceForm] = useState({ date: '', mileage: '', status: 'OK', issue_description: '' })
  const [maintInvoiceFile,   setMaintInvoiceFile]   = useState(null)
  const [maintInvoiceAmount, setMaintInvoiceAmount] = useState('')
  const [inspectionForm,  setInspectionForm]  = useState({ inspection_date: '' })
  const [inspInvoiceFile,   setInspInvoiceFile]   = useState(null)
  const [inspInvoiceAmount, setInspInvoiceAmount] = useState('')
  const [washForm,        setWashForm]        = useState({ driver_id: '', amount: '', date: '' })
  const [washInvoiceFile,   setWashInvoiceFile]   = useState(null)

  // ── Vehicle info quick-edit ──
  const [vehicleInfoModal, setVehicleInfoModal] = useState(false)
  const [vehicleInfoForm,  setVehicleInfoForm]  = useState({ mec_date: '' })
  const [regFile,          setRegFile]          = useState(null)
  const [insuranceFile,    setInsuranceFile]    = useState(null)
  const [licenseFile,      setLicenseFile]      = useState(null)
  const [savingVehicleInfo, setSavingVehicleInfo] = useState(false)

  // ── Assign driver ──
  const [assignDriverOpen, setAssignDriverOpen] = useState(false)

  if (!vehicle) return <div className="p-8 text-center text-slate-400">{t('vehicles.noResults')}</div>

  const vehicleAssignments = assignments.filter(a => a.vehicle_id === id)
  const vehicleMileage     = mileageEntries.filter(m => m.vehicle_id === id)
  const vehicleMaintenance = maintenanceRecords.filter(m => m.vehicle_id === id)
  const vehicleInspections = inspections.filter(i => i.vehicle_id === id)
  const vehicleWashes      = washRecords.filter(w => w.vehicle_id === id)

  // Active assignment only (ended_at IS NULL) — vehicleAssignments[0] would
  // show the last driver even after unassignment
  const activeAssignment = getLatestAssignments(assignments)[id]
  const currentDriver    = activeAssignment ? getDriverById(drivers, activeAssignment.driver_id) : null
  // Current odometer = highest reading (never decreases), not first-by-date.
  const latestMileage    = vehicleMileage.reduce(
    (best, e) => ((e.mileage ?? 0) > (best?.mileage ?? -1) ? e : best), null
  )

  // ── Submit handlers ───────────────────────────────────────────────
  const handleMileage = async () => {
    if (!mileageForm.mileage) return
    // An odometer never decreases: block a value below the current reading.
    const cur = latestMileage?.mileage
    if (cur != null && parseFloat(mileageForm.mileage) < cur) {
      toast.error(`Le kilométrage ne peut pas être inférieur à ${cur.toLocaleString('fr-FR')} km.`)
      return
    }
    setSaving(true)
    try {
      // created_at is left to the server (real time of entry) so the list keeps
      // the true saisie order, not an artificial 12:00.
      await createMileageEntry({ vehicle_id: id, mileage: parseFloat(mileageForm.mileage) })
      queryClient.invalidateQueries({ queryKey: ['mileageEntries'] })
      toast.success('Kilométrage enregistré')
      setMileageModal(false)
      setMileageForm({ mileage: '' })
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const openEditMileage = (m) => {
    setEditMileageTarget(m)
    setEditMileageValue(String(m.mileage ?? ''))
  }
  const handleEditMileage = async () => {
    if (!editMileageTarget || !editMileageValue) return
    setSavingEditMileage(true)
    try {
      await updateMileageEntry(editMileageTarget.id, { mileage: Number(editMileageValue) })
      queryClient.invalidateQueries({ queryKey: ['mileageEntries'] })
      toast.success('Kilométrage mis à jour.')
      setEditMileageTarget(null)
    } catch (e) { toast.error(e?.message || 'Erreur lors de la mise à jour.') }
    finally { setSavingEditMileage(false) }
  }

  const handleMaintenance = async () => {
    if (!maintenanceForm.status) return
    setSaving(true)
    try {
      let invoiceUrl = null
      if (maintInvoiceFile) invoiceUrl = await uploadInvoice(maintInvoiceFile, 'maintenance')
      await createMaintenanceRecord({
        vehicle_id: id,
        date: maintenanceForm.date || new Date().toISOString().split('T')[0],
        mileage: maintenanceForm.mileage ? parseFloat(maintenanceForm.mileage) : null,
        status: maintenanceForm.status,
        issue_description: maintenanceForm.issue_description || null,
        invoice_url: invoiceUrl,
        invoice_amount: maintInvoiceAmount ? parseFloat(maintInvoiceAmount) : null,
      })
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] })
      toast.success('Entretien enregistré')
      setMaintenanceModal(false)
      setMaintenanceForm({ date: '', mileage: '', status: 'OK', issue_description: '' })
      setMaintInvoiceFile(null)
      setMaintInvoiceAmount('')
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleInspection = async () => {
    setSaving(true)
    try {
      let invoiceUrl = null
      if (inspInvoiceFile) invoiceUrl = await uploadInvoice(inspInvoiceFile, 'inspection')
      const effectiveDate = inspectionForm.inspection_date || new Date().toISOString().split('T')[0]
      await createTechnicalInspection({
        vehicle_id: id,
        inspection_date: effectiveDate,
        expiration_date: format(addYears(new Date(effectiveDate), 1), 'yyyy-MM-dd'),
        invoice_url: invoiceUrl,
        invoice_amount: inspInvoiceAmount ? parseFloat(inspInvoiceAmount) : null,
      })
      queryClient.invalidateQueries({ queryKey: ['technicalInspections'] })
      toast.success('Contrôle enregistré')
      setInspectionModal(false)
      setInspectionForm({ inspection_date: '' })
      setInspInvoiceFile(null)
      setInspInvoiceAmount('')
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleWash = async () => {
    if (!washForm.driver_id || !washForm.amount) return
    setSaving(true)
    try {
      let invoiceUrl = null
      if (washInvoiceFile) invoiceUrl = await uploadInvoice(washInvoiceFile, 'wash')
      await createWashRecord({
        vehicle_id: id,
        driver_id: washForm.driver_id,
        amount: parseFloat(washForm.amount),
        date: washForm.date || new Date().toISOString().split('T')[0],
        invoice_url: invoiceUrl,
      })
      queryClient.invalidateQueries({ queryKey: ['washRecords'] })
      toast.success('Lavage enregistré')
      setWashModal(false)
      setWashForm({ driver_id: '', amount: '', date: '' })
      setWashInvoiceFile(null)
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const openVehicleInfo = () => {
    setVehicleInfoForm({ mec_date: vehicle.mec_date || '' })
    setRegFile(null)
    setInsuranceFile(null)
    setLicenseFile(null)
    setVehicleInfoModal(true)
  }
  const handleSaveVehicleInfo = async () => {
    setSavingVehicleInfo(true)
    try {
      let registration_card_url = vehicle.registration_card_url || null
      let insurance_url = vehicle.insurance_url || null
      let transport_license_url = vehicle.transport_license_url || null
      if (regFile) {
        if (vehicle.registration_card_url) await deleteInvoice(vehicle.registration_card_url)
        registration_card_url = await uploadInvoice(regFile, 'registration')
      }
      if (insuranceFile) {
        if (vehicle.insurance_url) await deleteInvoice(vehicle.insurance_url)
        insurance_url = await uploadInvoice(insuranceFile, 'insurance')
      }
      if (licenseFile) {
        if (vehicle.transport_license_url) await deleteInvoice(vehicle.transport_license_url)
        transport_license_url = await uploadInvoice(licenseFile, 'transport-license')
      }
      await updateVehicle(id, {
        plate_number: vehicle.plate_number,
        model: vehicle.model,
        mec_date: vehicleInfoForm.mec_date || null,
        registration_card_url,
        insurance_url,
        transport_license_url,
      })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Informations mises à jour.')
      setVehicleInfoModal(false)
      setRegFile(null); setInsuranceFile(null); setLicenseFile(null)
    } catch (e) { toast.error(e?.message || 'Erreur lors de la mise à jour.') }
    finally { setSavingVehicleInfo(false) }
  }

  // ── Tab header helper ─────────────────────────────────────────────
  const TabHeader = ({ label, onAdd }) => (
    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1 text-xs font-medium text-[#0066FF] hover:text-[#0052D6] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Ajouter
      </button>
    </div>
  )

  const StatusBadge = ({ status }) => status === 'OK'
    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />OK</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Problème</span>

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <Link to="/Vehicles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0052D6] mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('vehicles.title')}
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6">
        {/* Identity */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6 text-[#0052D6]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">{vehicle.plate_number}</h1>
              <p className="text-slate-500 truncate">{vehicle.model}</p>
            </div>
          </div>
          <button
            onClick={openVehicleInfo}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#0066FF] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#0066FF] transition-colors flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </button>
        </div>

        {/* Facts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 mt-5 pt-5 border-t border-slate-100">
          <div>
            <p className="text-sm text-slate-500">{t('assignments.driver')}</p>
            {currentDriver ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/Drivers/${currentDriver.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:text-[#0052D6] transition-colors">
                  {currentDriver.name} <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </Link>
                <button onClick={() => setAssignDriverOpen(true)}
                  className="text-xs font-medium text-[#0066FF] hover:text-[#0052D6] transition-colors">
                  Changer
                </button>
              </div>
            ) : (
              <button onClick={() => setAssignDriverOpen(true)}
                className="text-sm font-medium text-[#0066FF] hover:text-[#0052D6] transition-colors">
                + Affecter
              </button>
            )}
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('mileage.title')}</p>
            <p className="font-semibold text-slate-900">{latestMileage ? `${latestMileage.mileage?.toLocaleString('fr-FR') ?? '—'} km` : '—'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Mise en circulation</p>
            {vehicle.mec_date
              ? <p className="font-semibold text-slate-900">{format(new Date(vehicle.mec_date), 'd MMM yyyy', { locale: dateLocale })}</p>
              : <button onClick={openVehicleInfo} className="text-sm font-medium text-slate-300 hover:text-[#0066FF] transition-colors">Ajouter →</button>
            }
          </div>
        </div>

        {/* Documents */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Documents</p>
          <div className="flex flex-wrap gap-2">
            <DocChip label="Carte grise" url={vehicle.registration_card_url}
              onView={() => openSignedFile(vehicle.registration_card_url)} onAdd={openVehicleInfo} />
            <DocChip label="Assurance" url={vehicle.insurance_url}
              onView={() => openSignedFile(vehicle.insurance_url)} onAdd={openVehicleInfo} />
            {showLicense && (
              <DocChip label="Licence de transport" url={vehicle.transport_license_url}
                onView={() => openSignedFile(vehicle.transport_license_url)} onAdd={openVehicleInfo} />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start bg-white border-b border-slate-200 rounded-none px-2 h-12 min-w-max">
              <TabsTrigger value="mileage">Kilométrage</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="inspections">Contrôles tech.</TabsTrigger>
              <TabsTrigger value="washes">Lavages</TabsTrigger>
              <TabsTrigger value="assignments">Affectations</TabsTrigger>
            </TabsList>

            {/* ── Kilométrage ───────────────────────────────────────── */}
            <TabsContent value="mileage" className="p-0">
              <TabHeader label={`${vehicleMileage.length} entrée${vehicleMileage.length !== 1 ? 's' : ''}`} onAdd={() => setMileageModal(true)} />
              {vehicleMileage.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Kilométrage</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Justificatifs</th><th className="px-5 py-3 w-16"></th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleMileage.map(m => (
                          <tr key={m.id} className="group hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3 font-medium">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</td>
                            <td className="px-5 py-3 text-slate-500">{format(new Date(m.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <FileLink url={m.odometer_url} label="Compteur" icon={Gauge} />
                                <FileLink url={m.receipt_url} label="Ticket" />
                                {!m.odometer_url && !m.receipt_url && <span className="text-xs text-slate-300">—</span>}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => openEditMileage(m)} title="Modifier"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#0066FF] hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden divide-y divide-slate-100">
                    {vehicleMileage.map(m => (
                      <div key={m.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</p>
                          <p className="text-xs text-slate-400">{format(new Date(m.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</p>
                          {(m.odometer_url || m.receipt_url) && (
                            <div className="flex items-center gap-3 mt-1">
                              <FileLink url={m.odometer_url} label="Compteur" icon={Gauge} />
                              <FileLink url={m.receipt_url} label="Ticket" />
                            </div>
                          )}
                        </div>
                        <button onClick={() => openEditMileage(m)} title="Modifier"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0066FF] hover:bg-blue-50 transition-colors flex-shrink-0">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun kilométrage enregistré"
                    description="Relevez le compteur régulièrement pour suivre l'usage et déclencher les prévisions d'entretien."
                    action={{ label: 'Enregistrer un relevé', onClick: () => setMileageModal(true) }} />}
            </TabsContent>

            {/* ── Maintenance ───────────────────────────────────────── */}
            <TabsContent value="maintenance" className="p-0">
              <TabHeader label={`${vehicleMaintenance.length} entretien${vehicleMaintenance.length !== 1 ? 's' : ''}`} onAdd={() => setMaintenanceModal(true)} />
              {vehicleMaintenance.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Kilométrage</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Notes</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Résultat</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Justificatif</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleMaintenance.map(m => (
                          <tr key={m.id}>
                            <td className="px-5 py-3 text-slate-500">{format(new Date(m.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                            <td className="px-5 py-3">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</td>
                            <td className="px-5 py-3 text-slate-600 max-w-xs truncate">{m.issue_description || '—'}</td>
                            <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                            <td className="px-5 py-3"><FileLink url={m.invoice_url} label="Facture" /></td>
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
                          <StatusBadge status={m.status} />
                        </div>
                        <p className="text-sm text-slate-700">{m.issue_description || '—'}</p>
                        {m.invoice_url && <div className="mt-1"><FileLink url={m.invoice_url} label="Facture" /></div>}
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun entretien enregistré"
                    description="Consignez les entretiens (vidange, freins…) pour garder un historique et suivre les coûts."
                    action={{ label: 'Ajouter un entretien', onClick: () => setMaintenanceModal(true) }} />}
            </TabsContent>

            {/* ── Contrôles tech. ───────────────────────────────────── */}
            <TabsContent value="inspections" className="p-0">
              <TabHeader label={`${vehicleInspections.length} contrôle${vehicleInspections.length !== 1 ? 's' : ''}`} onAdd={() => setInspectionModal(true)} />
              {vehicleInspections.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Date du contrôle</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Date d'expiration</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Justificatif</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleInspections.map(i => (
                          <tr key={i.id}>
                            <td className="px-5 py-3">{format(new Date(i.inspection_date), 'd MMM yyyy', { locale: dateLocale })}</td>
                            <td className="px-5 py-3">{format(new Date(i.expiration_date), 'd MMM yyyy', { locale: dateLocale })}</td>
                            <td className="px-5 py-3"><FileLink url={i.invoice_url} /></td>
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
                        {i.invoice_url && <div className="mt-1"><FileLink url={i.invoice_url} /></div>}
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun contrôle technique"
                    description="Enregistrez le contrôle technique : FleetDesk calcule l'expiration et vous alerte avant l'échéance."
                    action={{ label: 'Ajouter un contrôle', onClick: () => setInspectionModal(true) }} />}
            </TabsContent>

            {/* ── Lavages ───────────────────────────────────────────── */}
            <TabsContent value="washes" className="p-0">
              <TabHeader label={`${vehicleWashes.length} lavage${vehicleWashes.length !== 1 ? 's' : ''}`} onAdd={() => setWashModal(true)} />
              {vehicleWashes.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Conducteur</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Montant</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Justificatif</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleWashes.map(w => {
                          const driver = getDriverById(drivers, w.driver_id)
                          return (
                            <tr key={w.id}>
                              <td className="px-5 py-3">{format(new Date(w.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                              <td className="px-5 py-3">{driver?.name || '—'}</td>
                              <td className="px-5 py-3 font-medium">{Number(w.amount).toFixed(2)} €</td>
                              <td className="px-5 py-3"><FileLink url={w.invoice_url} /></td>
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
                            {w.invoice_url && <div className="mt-1"><FileLink url={w.invoice_url} /></div>}
                          </div>
                          <p className="font-semibold text-slate-800">{Number(w.amount).toFixed(2)} €</p>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : <EmptyState title="Aucun lavage enregistré"
                    description="Suivez les lavages et leurs coûts par véhicule et par conducteur."
                    action={{ label: 'Ajouter un lavage', onClick: () => setWashModal(true) }} />}
            </TabsContent>

            {/* ── Affectations ──────────────────────────────────────── */}
            <TabsContent value="assignments" className="p-0">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-xs text-slate-400 font-medium">{vehicleAssignments.length} affectation{vehicleAssignments.length !== 1 ? 's' : ''}</p>
              </div>
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
              ) : <EmptyState title="Aucune affectation"
                    description="Affectez un conducteur à ce véhicule pour suivre qui le conduit."
                    action={{ label: 'Affecter un conducteur', onClick: () => setAssignDriverOpen(true) }} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}

      {/* Affecter un conducteur */}
      <AssignDriverDialog
        open={assignDriverOpen}
        onClose={() => setAssignDriverOpen(false)}
        vehicleId={id}
      />

      {/* Kilométrage */}
      <FormModal open={mileageModal} onClose={() => setMileageModal(false)} title="Enregistrer un kilométrage"
        onSubmit={handleMileage} saving={saving} submitLabel="Enregistrer">
        <div>
          <Label>Nouveau kilométrage (km)</Label>
          <Input type="number" value={mileageForm.mileage} onChange={e => setMileageForm(f => ({ ...f, mileage: e.target.value }))} placeholder="Ex : 125 000" />
          {latestMileage?.mileage != null && (
            <p className="text-xs text-slate-400 mt-1.5">Actuel : {latestMileage.mileage.toLocaleString('fr-FR')} km — la nouvelle valeur ne peut pas être inférieure.</p>
          )}
        </div>
      </FormModal>

      {/* Modifier un relevé */}
      <FormModal open={!!editMileageTarget} onClose={() => setEditMileageTarget(null)} title="Modifier le kilométrage"
        onSubmit={handleEditMileage} saving={savingEditMileage} submitLabel="Enregistrer">
        <div>
          <Label>Kilométrage (km)</Label>
          <Input type="number" value={editMileageValue} onChange={e => setEditMileageValue(e.target.value)} />
        </div>
      </FormModal>

      {/* Vehicle info quick-edit */}
      <FormModal open={vehicleInfoModal} onClose={() => { setVehicleInfoModal(false); setRegFile(null) }}
        title="Informations du véhicule" onSubmit={handleSaveVehicleInfo} saving={savingVehicleInfo} submitLabel="Enregistrer">
        <div>
          <Label>Date de mise en circulation <span className="text-slate-400 font-normal">(optionnel)</span></Label>
          <Input type="date" value={vehicleInfoForm.mec_date} onChange={e => setVehicleInfoForm(f => ({ ...f, mec_date: e.target.value }))} />
        </div>
        <VehicleDocField label="Carte grise" file={regFile} setFile={setRegFile}
          existingUrl={vehicle.registration_card_url} placeholder="Joindre la carte grise" />
        <VehicleDocField label="Assurance" file={insuranceFile} setFile={setInsuranceFile}
          existingUrl={vehicle.insurance_url} placeholder="Joindre l'attestation d'assurance" />
        {showLicense && (
          <VehicleDocField label="Licence de transport" file={licenseFile} setFile={setLicenseFile}
            existingUrl={vehicle.transport_license_url} placeholder="Joindre la licence de transport" />
        )}
      </FormModal>

      {/* Maintenance */}
      <FormModal open={maintenanceModal} onClose={() => { setMaintenanceModal(false); setMaintInvoiceFile(null); setMaintInvoiceAmount('') }} title="Enregistrer un entretien"
        onSubmit={handleMaintenance} saving={saving} submitLabel="Enregistrer">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Date <span className="text-slate-400 font-normal">(optionnel)</span></Label>
            <Input type="date" value={maintenanceForm.date} onChange={e => setMaintenanceForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <Label>Kilométrage (km)</Label>
            <Input type="number" value={maintenanceForm.mileage} onChange={e => setMaintenanceForm(f => ({ ...f, mileage: e.target.value }))} placeholder="125000" />
          </div>
        </div>
        <div>
          <Label>Résultat</Label>
          <Select value={maintenanceForm.status} onValueChange={v => setMaintenanceForm(f => ({ ...f, status: v, issue_description: v === 'OK' ? '' : f.issue_description }))}>
            <SelectTrigger><SelectValue placeholder="Sélectionner le résultat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OK">Entretien effectué — tout est OK</SelectItem>
              <SelectItem value="PROBLEM">Entretien effectué — problème détecté</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {maintenanceForm.status === 'PROBLEM' && (
          <div>
            <Label>Description du problème</Label>
            <Textarea value={maintenanceForm.issue_description} onChange={e => setMaintenanceForm(f => ({ ...f, issue_description: e.target.value }))} placeholder="Ex : usure des plaquettes de frein..." />
          </div>
        )}
        {maintenanceForm.status === 'OK' && (
          <div>
            <Label>Notes <span className="text-slate-400 font-normal">(optionnel)</span></Label>
            <Textarea value={maintenanceForm.issue_description} onChange={e => setMaintenanceForm(f => ({ ...f, issue_description: e.target.value }))} placeholder="Ex : vidange + filtre à huile..." rows={2} />
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

      {/* Contrôle technique */}
      <FormModal open={inspectionModal} onClose={() => { setInspectionModal(false); setInspInvoiceFile(null); setInspInvoiceAmount('') }} title="Ajouter un contrôle technique"
        onSubmit={handleInspection} saving={saving} submitLabel="Enregistrer">
        <div>
          <Label>Date du contrôle <span className="text-slate-400 font-normal">(optionnel — aujourd'hui par défaut)</span></Label>
          <Input type="date" value={inspectionForm.inspection_date} onChange={e => setInspectionForm(f => ({ ...f, inspection_date: e.target.value }))} />
        </div>
        {inspectionForm.inspection_date && (
          <p className="text-sm text-slate-500 -mt-1">
            Expire le : <span className="font-semibold text-slate-700">{format(addYears(new Date(inspectionForm.inspection_date), 1), 'd MMMM yyyy', { locale: dateLocale })}</span>
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

      {/* Lavage */}
      <FormModal open={washModal} onClose={() => { setWashModal(false); setWashInvoiceFile(null) }} title="Ajouter un lavage"
        onSubmit={handleWash} saving={saving} submitLabel="Enregistrer">
        <div>
          <Label>Conducteur</Label>
          <SearchableSelect value={washForm.driver_id} onValueChange={v => setWashForm(f => ({ ...f, driver_id: v }))}
            placeholder="Sélectionner un conducteur" options={drivers.map(d => ({ value: d.id, label: d.name }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Date <span className="text-slate-400 font-normal">(optionnel)</span></Label>
            <Input type="date" value={washForm.date} onChange={e => setWashForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <Label>Montant (€)</Label>
            <Input type="number" step="0.01" value={washForm.amount} onChange={e => setWashForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
          </div>
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
