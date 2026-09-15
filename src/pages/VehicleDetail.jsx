import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Truck, Plus, FileText, Paperclip, Camera, X, ChevronRight, Pencil, Gauge } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { format, addYears } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/ui/searchable-select'
import FormModal from '@/components/shared/FormModal'
import { InvoiceUpload } from '@/components/shared/InvoiceUpload'
import EmptyState from '@/components/shared/EmptyState'
import AssignDriverDialog from '@/components/shared/AssignDriverDialog'
import IconTip from '@/components/shared/IconTip'
import { uploadInvoice, deleteInvoice } from '@/lib/invoiceStorage'
import { openSignedFile } from '@/lib/signedFile'
import { useFeature } from '@/lib/activity'
import { computeForecasts } from '@/lib/maintenanceForecast'
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
            <IconTip label="Choisir un fichier">
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Choisir un fichier" className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
                <Paperclip className="w-3.5 h-3.5" />
              </button>
            </IconTip>
            <IconTip label="Prendre une photo">
              <button type="button" onClick={() => camRef.current?.click()} aria-label="Prendre une photo" className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </IconTip>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={onPick} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
    </div>
  )
}
import {
  useVehiclesWithArchived, useDrivers, useAssignments, useMileageEntries,
  useMaintenanceRecords, useTechnicalInspections, useWashRecords, useMaintenanceSchedules,
  getDriverById, getLatestAssignments,
  createMileageEntry, createMaintenanceRecord, createTechnicalInspection, createWashRecord,
  updateMileageEntry, updateVehicle
} from '@/lib/useFleetData'
import { usePageTitle } from '@/lib/usePageTitle'

// Échéance datée : ambre quand c'est passé ou imminent, graphite quand c'est
// à surveiller, émeraude au-delà. Même échelle que le badge véhicule et que
// la fiche conducteur — aucun rouge hors suppression.
function DeadlineChip({ days }) {
  const style = days < 0 ? 'text-amber-900 bg-amber-100'
    : days <= 30 ? 'text-amber-900 bg-amber-50'
    : days <= 90 ? 'text-zinc-700 bg-zinc-100'
    : 'text-emerald-700 bg-emerald-50'
  const label = days < 0 ? `expiré · ${Math.abs(days)} j`
    : days === 0 ? "aujourd'hui"
    : `dans ${days} j`
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${style}`}>{label}</span>
}

// Prévision d'entretien : elle tombe en kilomètres ou en jours, on affiche
// celui des deux qui arrive en premier, puisque c'est lui qui déclenche.
function ForecastChip({ forecast }) {
  const { status, kmUntil, daysUntil } = forecast
  const style = status === 'overdue' ? 'text-amber-900 bg-amber-100'
    : status === 'due_soon' ? 'text-amber-900 bg-amber-50'
    : status === 'no_record' ? 'text-zinc-700 bg-zinc-100'
    : 'text-emerald-700 bg-emerald-50'
  let label = 'à jour'
  if (status === 'no_record') label = 'sans historique'
  else if (kmUntil != null && (daysUntil == null || kmUntil / 60 < daysUntil))
    label = kmUntil <= 0 ? `dépassée de ${Math.abs(kmUntil).toLocaleString('fr-FR')} km`
                         : `dans ${kmUntil.toLocaleString('fr-FR')} km`
  else if (daysUntil != null)
    label = daysUntil < 0 ? `dépassée de ${Math.abs(daysUntil)} j` : `dans ${daysUntil} j`
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${style}`}>{label}</span>
}

export default function VehicleDetail() {
  usePageTitle('Véhicule')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const showLicense = useFeature('transportLicense')

  // Les sections sont des ancres, plus des onglets. L'URL conserve ?tab= pour
  // que les liens existants — alertes, messages entre collègues — amènent
  // toujours au bon endroit, en faisant défiler au lieu de commuter.
  const [searchParams] = useSearchParams()
  const SECTIONS = [
    { key: 'mileage',     label: 'Kilométrage' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'inspections', label: 'Contrôles tech.' },
    { key: 'washes',      label: 'Lavages' },
    { key: 'assignments', label: 'Affectations' },
  ]
  const [activeSection, setActiveSection] = useState('mileage')

  const { data: vehicles }          = useVehiclesWithArchived()
  const { data: drivers }           = useDrivers()
  const { data: assignments }       = useAssignments()
  const { data: mileageEntries }    = useMileageEntries()
  const { data: maintenanceRecords } = useMaintenanceRecords()
  const { data: inspections }       = useTechnicalInspections()
  const { data: washRecords }       = useWashRecords()
  const { data: schedules }         = useMaintenanceSchedules()

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

  // La pastille active suit ce qu'on regarde, sinon elle ment dès qu'on
  // fait défiler à la main.
  useEffect(() => {
    const seen = document.querySelectorAll('[data-section]')
    if (!seen.length) return
    const io = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) setActiveSection(visible.target.dataset.section)
    }, { rootMargin: '-96px 0px -60% 0px' })
    seen.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [vehicle?.id])

  // Un lien existant ?tab=inspections continue d'amener au bon endroit.
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (!tab) return
    const el = document.getElementById(`section-${tab}`)
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveSection(tab) }
  }, [searchParams, vehicle?.id])

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

  // ── Ce qui tombe ──────────────────────────────────────────────────
  // La colonne de gauche existe pour répondre à une seule question : « ce
  // véhicule, il me demande quoi ? ». On la calcule ici plutôt que de laisser
  // l'information dormir au fond d'une section.
  const latestInspection = vehicleInspections.reduce(
    (best, i) => (!best || new Date(i.expiration_date) > new Date(best.expiration_date) ? i : best), null
  )
  const ctDays = latestInspection?.expiration_date
    ? differenceInDays(new Date(latestInspection.expiration_date), new Date())
    : null

  const forecast = computeForecasts({
    schedules: schedules.filter(sc => sc.vehicle_id === id),
    vehicles: [vehicle], maintenanceRecords, mileageEntries,
  })[0] || null

  const docs = [
    { label: 'Carte grise', url: vehicle.registration_card_url },
    { label: 'Assurance',   url: vehicle.insurance_url },
    ...(showLicense ? [{ label: 'Licence de transport', url: vehicle.transport_license_url }] : []),
  ]
  const docsDone = docs.filter(d => d.url).length

  // Les ancres remplacent les onglets : on amène la section sous les yeux
  // plutôt que de masquer les quatre autres.
  const goToSection = (key) => {
    document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(key)
  }

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
        // La colonne est NOT NULL : une note vide s'écrit en chaîne vide, pas en NULL.
        issue_description: maintenanceForm.issue_description || '',
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
  const TabHeader = ({ title, label, onAdd }) => (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100">
      <p className="text-sm font-semibold text-slate-900 truncate">
        {title}{label && <span className="ml-2 text-xs font-normal text-slate-400">{label}</span>}
      </p>
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
    <div className="p-4 lg:p-8 max-w-[1180px] mx-auto">
      <Link to="/Vehicles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0052D6] mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('vehicles.title')}
      </Link>

      {/* Deux colonnes : à gauche ce que le véhicule est et ce qu'il demande,
          qui reste sous les yeux ; à droite son histoire, empilée et parcourue
          au défilement. Les onglets cachaient quatre sections sur cinq. */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">

        {/* ── Colonne fixe ─────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6 space-y-4">

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-[#0052D6]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">{vehicle.plate_number}</h1>
                <p className="text-sm text-slate-500 truncate">{vehicle.model}</p>
                {vehicle.archived_at && (
                  <span className="inline-block mt-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Hors parc
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-slate-500 flex-shrink-0">{t('assignments.driver')}</span>
                {currentDriver ? (
                  <Link to={`/Drivers/${currentDriver.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-[#0052D6] transition-colors truncate">
                    {currentDriver.name} <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  </Link>
                ) : (
                  <button onClick={() => setAssignDriverOpen(true)}
                    className="text-sm font-medium text-[#0066FF] hover:text-[#0052D6] transition-colors">
                    + Affecter
                  </button>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-slate-500">{t('mileage.title')}</span>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                  {latestMileage ? `${latestMileage.mileage?.toLocaleString('fr-FR') ?? '—'} km` : '—'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-slate-500">Mise en circulation</span>
                {vehicle.mec_date
                  ? <span className="text-sm font-semibold text-slate-900">{format(new Date(vehicle.mec_date), 'd MMM yyyy', { locale: dateLocale })}</span>
                  : <button onClick={openVehicleInfo} className="text-sm font-medium text-slate-300 hover:text-[#0066FF] transition-colors">Ajouter →</button>
                }
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setMileageModal(true)}
                className="text-xs font-semibold text-[#0066FF] bg-[#0066FF]/5 hover:bg-[#0066FF]/10 px-3 py-2 rounded-lg transition-colors">
                Saisir un relevé
              </button>
              <button onClick={openVehicleInfo}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0066FF] px-3 py-2 rounded-lg border border-slate-200 hover:border-[#0066FF] transition-colors">
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </button>
            </div>
          </div>

          {/* Ce qui tombe — la raison d'être de la colonne */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Ce qui tombe</p>
            </div>
            <div className="p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Contrôle technique</span>
                {ctDays == null
                  ? <span className="text-xs font-medium text-slate-400 border border-dashed border-slate-200 px-2 py-0.5 rounded-full">jamais saisi</span>
                  : <DeadlineChip days={ctDays} />}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Révision</span>
                {!forecast
                  ? <span className="text-xs font-medium text-slate-400 border border-dashed border-slate-200 px-2 py-0.5 rounded-full">sans planning</span>
                  : <ForecastChip forecast={forecast} />}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Documents</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  docsDone === docs.length ? 'text-emerald-700 bg-emerald-50' : 'text-zinc-700 bg-zinc-100'
                }`}>
                  {docsDone}/{docs.length}
                </span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Documents</p>
              <button onClick={openVehicleInfo}
                className="text-xs font-medium text-[#0066FF] hover:text-[#0052D6] transition-colors">
                Déposer
              </button>
            </div>
            <div className="p-5 space-y-2.5">
              {docs.map(d => (
                <div key={d.label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600 truncate">{d.label}</span>
                  {d.url
                    ? <button onClick={() => openSignedFile(d.url)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066FF] hover:text-[#0052D6] transition-colors flex-shrink-0">
                        <Paperclip className="w-3 h-3" /> Voir
                      </button>
                    : <span className="text-xs font-medium text-slate-400 border border-dashed border-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">manquant</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Colonne d'historique ─────────────────────────────────── */}
        <div className="space-y-4 min-w-0">

          {/* Ancres : le même rôle que les onglets, sans rien masquer */}
          <div className="flex flex-wrap gap-1.5 -mb-1">
            {SECTIONS.map(sec => (
              <button key={sec.key} onClick={() => goToSection(sec.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  activeSection === sec.key
                    ? 'bg-[#E5EEFF] text-[#0052D6] border-transparent'
                    : 'bg-white text-slate-500 border-slate-200 hover:text-[#0066FF] hover:border-[#0066FF]'
                }`}>
                {sec.label}
              </button>
            ))}
          </div>

            <section id="section-mileage" data-section="mileage" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <TabHeader title="Kilométrage" label={`${vehicleMileage.length} entrée${vehicleMileage.length !== 1 ? 's' : ''}`} onAdd={() => setMileageModal(true)} />
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
                              <IconTip label="Modifier ce relevé">
                                <button onClick={() => openEditMileage(m)} aria-label="Modifier ce relevé"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#0066FF] hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </IconTip>
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
                        <IconTip label="Modifier ce relevé">
                          <button onClick={() => openEditMileage(m)} aria-label="Modifier ce relevé"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0066FF] hover:bg-blue-50 transition-colors flex-shrink-0">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </IconTip>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun kilométrage enregistré"
                    description="Relevez le compteur régulièrement pour suivre l'usage et déclencher les prévisions d'entretien."
                    action={{ label: 'Enregistrer un relevé', onClick: () => setMileageModal(true) }} />}
            </section>

            {/* ── Maintenance ───────────────────────────────────────── */}
            <section id="section-maintenance" data-section="maintenance" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <TabHeader title="Maintenance" label={`${vehicleMaintenance.length} entretien${vehicleMaintenance.length !== 1 ? 's' : ''}`} onAdd={() => setMaintenanceModal(true)} />
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
            </section>

            {/* ── Contrôles tech. ───────────────────────────────────── */}
            <section id="section-inspections" data-section="inspections" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <TabHeader title="Contrôles techniques" label={`${vehicleInspections.length} contrôle${vehicleInspections.length !== 1 ? 's' : ''}`} onAdd={() => setInspectionModal(true)} />
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
            </section>

            {/* ── Lavages ───────────────────────────────────────────── */}
            <section id="section-washes" data-section="washes" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <TabHeader title="Lavages" label={`${vehicleWashes.length} lavage${vehicleWashes.length !== 1 ? 's' : ''}`} onAdd={() => setWashModal(true)} />
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
            </section>

            {/* ── Affectations ──────────────────────────────────────── */}
            <section id="section-assignments" data-section="assignments" className="scroll-mt-24 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">
                  Affectations
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {vehicleAssignments.length} affectation{vehicleAssignments.length !== 1 ? 's' : ''}
                  </span>
                </p>
                <button onClick={() => setAssignDriverOpen(true)}
                  className="flex items-center gap-1 text-xs font-medium text-[#0066FF] hover:text-[#0052D6] transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Changer
                </button>
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
            </section>
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
