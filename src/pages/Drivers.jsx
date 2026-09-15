import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronRight, Users, Trash2, Loader2, Download, Truck, UserMinus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import DataError from '@/components/shared/DataError'
import { downloadCsv, datedName } from '@/lib/exportCsv'
import { differenceInDays } from 'date-fns'
import {
  useDrivers, useVehicles, useAssignments, useAllDriverDocuments,
  createDriver, deleteDriver, getLatestAssignments, getVehicleById
} from '@/lib/useFleetData'

import { usePageTitle } from '@/lib/usePageTitle'
import { useTranslation } from 'react-i18next'
import { usePlanLimits } from '@/lib/usePlanLimits'
import AssignDriverDialog from '@/components/shared/AssignDriverDialog'
import { DOC_TYPE_CONFIG, DOC_TYPES_ORDER, normalizeDocType, docLabel } from '@/components/shared/DriverDocuments'
import { unassignVehicle } from '@/lib/useFleetData'
import { format } from 'date-fns'
import { useDateLocale } from '@/lib/useDateLocale'
const LEVEL_CHIP = {
  expired:  'text-amber-900 bg-amber-100',
  expiring: 'text-amber-900 bg-amber-50 border border-amber-200',
  missing:  'text-zinc-700 bg-zinc-100',
  ok:       'text-emerald-700 bg-emerald-50',
}

// L'état d'une ligne de document, dans l'échelle ambre du reste de l'app.
function DocState({ row, dateLocale }) {
  if (row.state === 'missing')
    return <span className="text-[11px] font-medium text-slate-400 border border-dashed border-slate-200 px-2 py-0.5 rounded-full">manquant</span>
  if (row.state === 'expired')
    return <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">expiré · {Math.abs(row.days)} j</span>
  if (row.state === 'expiring')
    return <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">dans {row.days} j</span>
  return (
    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
      {row.doc?.expiry_date ? format(new Date(row.doc.expiry_date), 'MMM yyyy', { locale: dateLocale }) : 'enregistré'}
    </span>
  )
}

function Initials({ name, warn }) {
  const letters = (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <span className={'w-9 h-9 rounded-full grid place-items-center text-[11px] font-bold flex-shrink-0 ' + (
      warn ? 'bg-amber-100 text-amber-900' : 'bg-[#E5EEFF] text-[#0052D6]'
    )}>{letters}</span>
  )
}

export default function Drivers() {
  usePageTitle('Conducteurs')
  const { t } = useTranslation()
  const driversQ = useDrivers()
  const { data: drivers } = driversQ
  const { data: vehicles } = useVehicles()
  const { data: assignments } = useAssignments()
  const { data: allDocs = [] } = useAllDriverDocuments()
  const { canAddDriver, limits } = usePlanLimits(0, drivers.length)

  // Le dossier de chaque conducteur : les sept lignes réglementaires, leur
  // état, et la première échéance qui tombe. C'est ce que la liste doit dire,
  // au lieu d'un « Doc. expiré » identique pour tout le monde.
  const driverFiles = useMemo(() => {
    const byDriver = {}
    for (const doc of allDocs) {
      const type = normalizeDocType(doc.type)
      const cur = byDriver[doc.driver_id] || (byDriver[doc.driver_id] = {})
      cur[type] = doc
    }

    const files = {}
    for (const d of drivers) {
      const held = byDriver[d.id] || {}
      const rows = DOC_TYPES_ORDER.map(type => {
        const doc = held[type]
        const days = doc?.expiry_date
          ? differenceInDays(new Date(doc.expiry_date), new Date())
          : null
        const state = !doc ? 'missing'
          : days == null ? 'valid'
          : days < 0 ? 'expired'
          : days <= 30 ? 'expiring'
          : 'valid'
        return { type, label: DOC_TYPE_CONFIG[type]?.label || docLabel(type), doc, days, state }
      })

      const done = rows.filter(r => r.state === 'valid').length
      const due = rows
        .filter(r => r.days != null && (r.state === 'expired' || r.state === 'expiring'))
        .sort((a, b) => a.days - b.days)[0] || null
      const missing = rows.filter(r => r.state === 'missing')

      let level = 'ok', headline = 'Dossier à jour'
      if (due?.state === 'expired') {
        level = 'expired'
        headline = `${due.label} expiré depuis ${Math.abs(due.days)} j`
      } else if (due?.state === 'expiring') {
        level = 'expiring'
        headline = `${due.label} dans ${due.days} j`
      } else if (missing.length) {
        level = 'missing'
        headline = `${missing.length} document${missing.length > 1 ? 's' : ''} manquant${missing.length > 1 ? 's' : ''}`
      }

      files[d.id] = { rows, done, total: rows.length, due, level, headline }
    }
    return files
  }, [allDocs, drivers])

  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('conformite')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', employee_id: '', date_of_birth: '', address: '', dkv_card: '', highway_badge: '', wash_card: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [unassigning, setUnassigning] = useState(false)
  const dateLocale = useDateLocale()
  const navigate = useNavigate()

  const latestAssignments = getLatestAssignments(assignments)
  const driverVehicleMap = {}
  Object.entries(latestAssignments).forEach(([vehicleId, a]) => { driverVehicleMap[a.driver_id] = vehicleId })

  // Alphabetical by default; the user can flip the order or show recent first.
  const filtered = useMemo(() => {
    const arr = drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    const byName = (a, b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
    const RANK = { expired: 0, expiring: 1, missing: 2, ok: 3 }
    if (sort === 'za') arr.sort((a, b) => byName(b, a))
    else if (sort === 'recent') arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    else if (sort === 'conformite') arr.sort((a, b) => {
      const d = (RANK[driverFiles[a.id]?.level] ?? 3) - (RANK[driverFiles[b.id]?.level] ?? 3)
      return d !== 0 ? d : byName(a, b)
    })
    else arr.sort(byName)
    return arr
  }, [drivers, search, sort, driverFiles])

  // Le conducteur montré dans l'aperçu : celui qu'on a choisi, sinon le
  // premier de la liste — l'aperçu n'est jamais vide.
  const selected = filtered.find(d => d.id === selectedId) || filtered[0] || null
  const selectedFile = selected ? driverFiles[selected.id] : null
  const selectedVehicle = selected && driverVehicleMap[selected.id]
    ? getVehicleById(vehicles, driverVehicleMap[selected.id])
    : null

  const handleUnassign = async () => {
    if (!selectedVehicle) return
    setUnassigning(true)
    try {
      await unassignVehicle(selectedVehicle.id)
      await queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success('Véhicule désaffecté.')
    } catch { toast.error('Erreur lors de la désaffectation.') }
    finally { setUnassigning(false) }
  }

  const handleCreate = async () => {
    if (!form.name) return
    if (form.employee_id && drivers.some(d => d.employee_id === form.employee_id)) {
      toast.error(`L'ID conducteur "${form.employee_id}" est déjà utilisé.`)
      return
    }
    setSaving(true)
    try {
      await createDriver({ ...form, date_of_birth: form.date_of_birth || null, email: form.email || null })
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      setShowAdd(false)
      setForm({ name: '', phone: '', email: '', employee_id: '', date_of_birth: '', address: '', dkv_card: '', highway_badge: '', wash_card: '' })
      toast.success(t('drivers.added'))
    } catch { toast.error(t('drivers.addError')) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteDriver(deleteTarget.id)
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      setDeleteTarget(null)
      toast.success('Conducteur supprimé.')
    } catch { toast.error('Erreur lors de la suppression.') }
    finally { setSaving(false) }
  }

  // CSV export of every driver (not the filtered view) for accounting / HR.
  const exportDriversCsv = () => {
    const cols = [
      { label: 'Nom', map: d => d.name },
      { label: 'Email', map: d => d.email || '' },
      { label: 'Téléphone', map: d => d.phone || '' },
      { label: 'Date de naissance', map: d => d.date_of_birth || '' },
      { label: 'Adresse', map: d => d.address || '' },
      { label: 'Carte DKV', map: d => d.dkv_card || '' },
      { label: 'Badge autoroute', map: d => d.highway_badge || '' },
      { label: 'Carte lavage', map: d => d.wash_card || '' },
    ]
    downloadCsv(datedName('conducteurs'), cols, drivers)
    toast.success(`Export de ${drivers.length} conducteur${drivers.length !== 1 ? 's' : ''} généré.`)
  }

  return (
    <div className="p-5 sm:p-8">
      <PageHeader title="Conducteurs" description={`${drivers.length} conducteur${drivers.length !== 1 ? 's' : ''}`}>
        <div className="flex items-center gap-3">
          {limits.drivers !== Infinity && (
            <span className="text-xs text-zinc-400">{t('plan.usageDrivers', { count: drivers.length, max: limits.drivers })}</span>
          )}
          {drivers.length > 0 && (
            <Button variant="outline" onClick={exportDriversCsv} className="border-zinc-200 text-zinc-600 hover:text-zinc-900">
              <Download className="w-4 h-4 mr-2" /> Exporter
            </Button>
          )}
          <Button
            onClick={() => canAddDriver ? setShowAdd(true) : toast.error(t('plan.driverLimitReached') + ' ' + t('plan.upgradeHint'))}
            className={canAddDriver ? 'bg-[#0066FF] hover:bg-[#0052D6]' : 'bg-zinc-300 cursor-not-allowed hover:bg-zinc-300'}
          >
            <Plus className="w-4 h-4 mr-2" /> Ajouter
          </Button>
        </div>
      </PageHeader>

      <DataError queries={[driversQ]} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Rechercher un conducteur..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-[190px] flex-shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="conformite">Conformité d'abord</SelectItem>
            <SelectItem value="az">Nom (A → Z)</SelectItem>
            <SelectItem value="za">Nom (Z → A)</SelectItem>
            <SelectItem value="recent">Récemment ajoutés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <>
          {/* ── Bureau : la liste choisit, le dossier s'ouvre à côté ── */}
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {filtered.map(d => {
                const file = driverFiles[d.id]
                const vehicleId = driverVehicleMap[d.id]
                const vehicle = vehicleId ? getVehicleById(vehicles, vehicleId) : null
                const warn = file?.level === 'expired' || file?.level === 'expiring'
                const active = selected?.id === d.id
                return (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(d.id)}
                    onDoubleClick={() => navigate(`/Drivers/${d.id}`)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(d.id) }
                    }}
                    className={'w-full text-left flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer select-none ' + (
                      active ? 'bg-[#E5EEFF]' : 'hover:bg-slate-50/70'
                    )}
                  >
                    <Initials name={d.name} warn={warn} />
                    <span className="min-w-0 flex-1">
                      {/* Le nom mène à la fiche ; le reste de la ligne choisit.
                          Un double-clic n'importe où sur la ligne fait pareil. */}
                      <Link
                        to={`/Drivers/${d.id}`}
                        onClick={e => e.stopPropagation()}
                        className="block text-sm font-semibold text-slate-900 truncate hover:text-[#0052D6] hover:underline decoration-[#0066FF]/40 underline-offset-2"
                      >
                        {d.name}
                      </Link>
                      <span className="block text-xs text-slate-400 truncate">
                        {vehicle ? `${vehicle.plate_number} · ${vehicle.model}` : 'Sans véhicule'}
                      </span>
                    </span>
                    <span className={'text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ' + LEVEL_CHIP[file?.level || 'ok']}>
                      {file?.headline || 'Dossier à jour'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* ── Le dossier ────────────────────────────────────────── */}
            {selected && (
              // La clé force un remontage à chaque sélection : la chorégraphie
              // d'arrivée se rejoue, et on voit que le contenu a changé.
              <div key={selected.id} data-panel-land className="sticky top-6 space-y-3">

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <Initials name={selected.name} warn={selectedFile?.level === 'expired'} />
                    <div className="min-w-0">
                      <Link to={`/Drivers/${selected.id}`}
                        className="block text-sm font-semibold text-slate-900 truncate hover:text-[#0052D6] hover:underline decoration-[#0066FF]/40 underline-offset-2">
                        {selected.name}
                      </Link>
                      <p className="text-xs text-slate-400 truncate">
                        {selected.employee_id || 'Sans matricule'}{selected.phone ? ` · ${selected.phone}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Réaffecter suppose de comparer des conducteurs : c'est une
                    tâche de liste, elle a donc sa place ici. */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <p className="px-4 py-3 text-sm font-semibold text-slate-900 border-b border-slate-100">Véhicule actuel</p>
                  {selectedVehicle ? (
                    <>
                      <Link to={`/Vehicles/${selectedVehicle.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70 transition-colors">
                        <span className="w-9 h-9 rounded-lg bg-[#E5EEFF] text-[#0052D6] grid place-items-center flex-shrink-0">
                          <Truck className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-900">{selectedVehicle.plate_number}</span>
                          <span className="block text-xs text-slate-400 truncate">{selectedVehicle.model}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      </Link>
                      <div className="flex gap-2 px-4 pb-4">
                        <button onClick={handleUnassign} disabled={unassigning}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0066FF] px-3 py-2 rounded-lg border border-slate-200 hover:border-[#0066FF] transition-colors disabled:opacity-50">
                          {unassigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />} Désaffecter
                        </button>
                        <button onClick={() => setAssignOpen(true)}
                          className="flex-1 text-xs font-semibold text-[#0066FF] bg-[#0066FF]/5 hover:bg-[#0066FF]/10 px-3 py-2 rounded-lg transition-colors">
                          Changer
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-4">
                      <p className="text-sm text-slate-400 mb-3">Aucun véhicule affecté.</p>
                      <button onClick={() => setAssignOpen(true)}
                        className="w-full text-xs font-semibold text-[#0066FF] bg-[#0066FF]/5 hover:bg-[#0066FF]/10 px-3 py-2 rounded-lg transition-colors">
                        Affecter un véhicule
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Documents</p>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {selectedFile?.done}/{selectedFile?.total} conformes
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-2.5">
                    {selectedFile?.rows.map((row, i) => (
                      <div key={row.type} data-row-land style={{ '--row-delay': `${210 + i * 32}ms` }}
                        className="flex items-center justify-between gap-3">
                        <span className="text-[13px] text-slate-600 truncate">{row.label}</span>
                        <DocState row={row} dateLocale={dateLocale} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plus de gros lien bleu : la fiche s'ouvre en cliquant le
                    nom, ou d'un double-clic sur la ligne. */}
                <div className="flex items-center justify-between gap-3 px-1">
                  <span className="text-[11px] text-slate-400">Double-clic pour ouvrir la fiche</span>
                  <button onClick={() => setDeleteTarget(selected)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sous 1024 px : la liste seule, chaque ligne mène à la fiche ── */}
          <div className="lg:hidden bg-white rounded-xl border border-slate-200 overflow-hidden">
            {filtered.map(d => {
              const file = driverFiles[d.id]
              const vehicleId = driverVehicleMap[d.id]
              const vehicle = vehicleId ? getVehicleById(vehicles, vehicleId) : null
              const warn = file?.level === 'expired' || file?.level === 'expiring'
              return (
                <Link key={d.id} to={`/Drivers/${d.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70 transition-colors">
                  <Initials name={d.name} warn={warn} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{d.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {vehicle ? `${vehicle.plate_number} · ${vehicle.model}` : 'Sans véhicule'}
                    </p>
                    <span className={'inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ' + LEVEL_CHIP[file?.level || 'ok']}>
                      {file?.headline || 'Dossier à jour'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </>
        ) : (
          <EmptyState
            icon={Users}
            title={search ? 'Aucun résultat' : 'Aucun conducteur'}
            description={search ? `Aucun conducteur ne correspond à "${search}"` : 'Ajoutez votre premier conducteur pour commencer.'}
            action={!search ? { label: 'Ajouter un conducteur', onClick: () => setShowAdd(true) } : undefined}
          />
      )}

      {/* Affecter ou changer le véhicule du conducteur sélectionné */}
      <AssignDriverDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        driverId={selected?.id || null}
      />

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ajouter un conducteur</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Nom complet *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jean Dupont" /></div>
              <div><Label>ID conducteur</Label><Input value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} placeholder="Ex : C-042" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+33 6 00 00 00 00" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jean.dupont@email.com" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Date de naissance</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} /></div>
              <div><Label>Adresse domicile</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="12 rue de la Paix, 75001 Paris" /></div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Cartes & badges</p>
              <div className="space-y-3">
                <div><Label>Carte DKV</Label><Input value={form.dkv_card} onChange={e => setForm({...form, dkv_card: e.target.value})} placeholder="N° carte DKV" /></div>
                <div><Label>Badge autoroute</Label><Input value={form.highway_badge} onChange={e => setForm({...form, highway_badge: e.target.value})} placeholder="N° badge autoroute" /></div>
                <div><Label>Carte de lavage</Label><Input value={form.wash_card} onChange={e => setForm({...form, wash_card: e.target.value})} placeholder="N° carte lavage" /></div>
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving || !form.name} className="w-full bg-[#0066FF] hover:bg-[#0052D6]">
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Enregistrement...
                </span>
              ) : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
 
      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader><DialogTitle>Supprimer le conducteur</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500 mt-1">Supprimer <span className="font-semibold text-slate-800">{deleteTarget?.name}</span> ? Cette action est irréversible.</p>
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