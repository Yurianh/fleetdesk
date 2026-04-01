import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Truck, Plus, FileText } from 'lucide-react'
import { format, addYears } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/lib/useDateLocale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SearchableSelect } from '@/components/ui/searchable-select'
import FormModal from '@/components/shared/FormModal'
import EmptyState from '@/components/shared/EmptyState'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  useVehicles, useDrivers, useAssignments, useMileageEntries,
  useMaintenanceRecords, useTechnicalInspections, useWashRecords,
  getDriverById, getLatestAssignments, getLatestMileage,
  createMileageEntry, createMaintenanceRecord, createTechnicalInspection, createWashRecord
} from '@/lib/useFleetData'
import { usePageTitle } from '@/lib/usePageTitle'

export default function VehicleDetail() {
  usePageTitle('Véhicule')
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { id } = useParams()
  const queryClient = useQueryClient()

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

  const [mileageForm,     setMileageForm]     = useState({ mileage: '', date: '' })
  const [maintenanceForm, setMaintenanceForm] = useState({ date: '', mileage: '', status: 'OK', issue_description: '' })
  const [inspectionForm,  setInspectionForm]  = useState({ inspection_date: '' })
  const [washForm,        setWashForm]        = useState({ driver_id: '', amount: '', date: '' })

  if (!vehicle) return <div className="p-8 text-center text-slate-400">{t('vehicles.noResults')}</div>

  const vehicleAssignments = assignments.filter(a => a.vehicle_id === id)
  const vehicleMileage     = mileageEntries.filter(m => m.vehicle_id === id)
  const vehicleMaintenance = maintenanceRecords.filter(m => m.vehicle_id === id)
  const vehicleInspections = inspections.filter(i => i.vehicle_id === id)
  const vehicleWashes      = washRecords.filter(w => w.vehicle_id === id)

  const latestAssignment = vehicleAssignments[0]
  const currentDriver    = latestAssignment ? getDriverById(drivers, latestAssignment.driver_id) : null
  const latestMileage    = vehicleMileage[0]

  // ── Submit handlers ───────────────────────────────────────────────
  const handleMileage = async () => {
    if (!mileageForm.mileage) return
    setSaving(true)
    try {
      await createMileageEntry({ vehicle_id: id, mileage: parseFloat(mileageForm.mileage), date: mileageForm.date || undefined })
      queryClient.invalidateQueries({ queryKey: ['mileageEntries'] })
      toast.success('Kilométrage enregistré')
      setMileageModal(false)
      setMileageForm({ mileage: '', date: '' })
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleMaintenance = async () => {
    if (!maintenanceForm.status) return
    setSaving(true)
    try {
      await createMaintenanceRecord({
        vehicle_id: id,
        date: maintenanceForm.date || new Date().toISOString().split('T')[0],
        mileage: maintenanceForm.mileage ? parseFloat(maintenanceForm.mileage) : null,
        status: maintenanceForm.status,
        issue_description: maintenanceForm.issue_description || null,
      })
      queryClient.invalidateQueries({ queryKey: ['maintenanceRecords'] })
      toast.success('Entretien enregistré')
      setMaintenanceModal(false)
      setMaintenanceForm({ date: '', mileage: '', status: 'OK', issue_description: '' })
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleInspection = async () => {
    setSaving(true)
    try {
      const effectiveDate = inspectionForm.inspection_date || new Date().toISOString().split('T')[0]
      await createTechnicalInspection({
        vehicle_id: id,
        inspection_date: effectiveDate,
        expiration_date: format(addYears(new Date(effectiveDate), 1), 'yyyy-MM-dd'),
      })
      queryClient.invalidateQueries({ queryKey: ['technicalInspections'] })
      toast.success('Contrôle enregistré')
      setInspectionModal(false)
      setInspectionForm({ inspection_date: '' })
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  const handleWash = async () => {
    if (!washForm.driver_id || !washForm.amount) return
    setSaving(true)
    try {
      await createWashRecord({
        vehicle_id: id,
        driver_id: washForm.driver_id,
        amount: parseFloat(washForm.amount),
        date: washForm.date || new Date().toISOString().split('T')[0],
      })
      queryClient.invalidateQueries({ queryKey: ['washRecords'] })
      toast.success('Lavage enregistré')
      setWashModal(false)
      setWashForm({ driver_id: '', amount: '', date: '' })
    } catch { toast.error("Erreur lors de l'enregistrement") }
    finally { setSaving(false) }
  }

  // ── Tab header helper ─────────────────────────────────────────────
  const TabHeader = ({ label, onAdd }) => (
    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
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
      <Link to="/Vehicles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1D4ED8] mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('vehicles.title')}
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6 text-[#1D4ED8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{vehicle.plate_number}</h1>
            <p className="text-slate-500">{vehicle.model}</p>
          </div>
          <div className="flex flex-wrap gap-6 sm:gap-8 mt-1 sm:mt-0">
            <div>
              <p className="text-sm text-slate-500">{t('assignments.driver')}</p>
              <p className="font-semibold text-slate-900">{currentDriver?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('mileage.title')}</p>
              <p className="font-semibold text-slate-900">{latestMileage ? `${latestMileage.mileage?.toLocaleString('fr-FR') ?? '—'} km` : '—'}</p>
            </div>
            {vehicle.mec_date && (
              <div>
                <p className="text-sm text-slate-500">Mise en circulation</p>
                <p className="font-semibold text-slate-900">{format(new Date(vehicle.mec_date), 'd MMM yyyy', { locale: dateLocale })}</p>
              </div>
            )}
            {vehicle.registration_card_url && (
              <div>
                <p className="text-sm text-slate-500">Carte grise</p>
                <a href={vehicle.registration_card_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Voir →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Tabs defaultValue="mileage">
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
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Kilométrage</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleMileage.map(m => (
                          <tr key={m.id}><td className="px-5 py-3 font-medium">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</td><td className="px-5 py-3 text-slate-500">{format(new Date(m.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden divide-y divide-slate-100">
                    {vehicleMileage.map(m => (
                      <div key={m.id} className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</p>
                        <p className="text-xs text-slate-400">{format(new Date(m.created_at), 'd MMM yyyy, HH:mm', { locale: dateLocale })}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun kilométrage enregistré" />}
            </TabsContent>

            {/* ── Maintenance ───────────────────────────────────────── */}
            <TabsContent value="maintenance" className="p-0">
              <TabHeader label={`${vehicleMaintenance.length} entretien${vehicleMaintenance.length !== 1 ? 's' : ''}`} onAdd={() => setMaintenanceModal(true)} />
              {vehicleMaintenance.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Kilométrage</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Notes</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Résultat</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleMaintenance.map(m => (
                          <tr key={m.id}>
                            <td className="px-5 py-3 text-slate-500">{format(new Date(m.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                            <td className="px-5 py-3">{m.mileage?.toLocaleString('fr-FR') ?? '—'} km</td>
                            <td className="px-5 py-3 text-slate-600 max-w-xs truncate">{m.issue_description || '—'}</td>
                            <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
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
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun entretien enregistré" />}
            </TabsContent>

            {/* ── Contrôles tech. ───────────────────────────────────── */}
            <TabsContent value="inspections" className="p-0">
              <TabHeader label={`${vehicleInspections.length} contrôle${vehicleInspections.length !== 1 ? 's' : ''}`} onAdd={() => setInspectionModal(true)} />
              {vehicleInspections.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Date du contrôle</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Date d'expiration</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleInspections.map(i => (
                          <tr key={i.id}>
                            <td className="px-5 py-3">{format(new Date(i.inspection_date), 'd MMM yyyy', { locale: dateLocale })}</td>
                            <td className="px-5 py-3">{format(new Date(i.expiration_date), 'd MMM yyyy', { locale: dateLocale })}</td>
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
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyState title="Aucun contrôle technique" />}
            </TabsContent>

            {/* ── Lavages ───────────────────────────────────────────── */}
            <TabsContent value="washes" className="p-0">
              <TabHeader label={`${vehicleWashes.length} lavage${vehicleWashes.length !== 1 ? 's' : ''}`} onAdd={() => setWashModal(true)} />
              {vehicleWashes.length > 0 ? (
                <>
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-white border-b"><th className="text-left px-5 py-3 text-slate-500 font-medium">Date</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Conducteur</th><th className="text-left px-5 py-3 text-slate-500 font-medium">Montant</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicleWashes.map(w => {
                          const driver = getDriverById(drivers, w.driver_id)
                          return (
                            <tr key={w.id}>
                              <td className="px-5 py-3">{format(new Date(w.date), 'd MMM yyyy', { locale: dateLocale })}</td>
                              <td className="px-5 py-3">{driver?.name || '—'}</td>
                              <td className="px-5 py-3 font-medium">{Number(w.amount).toFixed(2)} €</td>
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
                          </div>
                          <p className="font-semibold text-slate-800">{Number(w.amount).toFixed(2)} €</p>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : <EmptyState title="Aucun lavage enregistré" />}
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
              ) : <EmptyState title="Aucune affectation" />}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}

      {/* Kilométrage */}
      <FormModal open={mileageModal} onClose={() => setMileageModal(false)} title="Enregistrer un kilométrage"
        onSubmit={handleMileage} saving={saving} submitLabel="Enregistrer">
        <div>
          <Label>Nouveau kilométrage (km)</Label>
          <Input type="number" value={mileageForm.mileage} onChange={e => setMileageForm(f => ({ ...f, mileage: e.target.value }))} placeholder="Ex : 125 000" />
        </div>
        <div>
          <Label>Date <span className="text-slate-400 font-normal">(optionnel — aujourd'hui par défaut)</span></Label>
          <Input type="date" value={mileageForm.date} onChange={e => setMileageForm(f => ({ ...f, date: e.target.value }))} />
        </div>
      </FormModal>

      {/* Maintenance */}
      <FormModal open={maintenanceModal} onClose={() => setMaintenanceModal(false)} title="Enregistrer un entretien"
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
      </FormModal>

      {/* Contrôle technique */}
      <FormModal open={inspectionModal} onClose={() => setInspectionModal(false)} title="Ajouter un contrôle technique"
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
      </FormModal>

      {/* Lavage */}
      <FormModal open={washModal} onClose={() => setWashModal(false)} title="Ajouter un lavage"
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
      </FormModal>
    </div>
  )
}
