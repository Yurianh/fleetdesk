import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ChevronRight, CreditCard, Users, Trash2, Loader2, MapPin, AlertTriangle, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import { differenceInDays } from 'date-fns'
import {
  useDrivers, useVehicles, useAssignments, useAllDriverDocuments,
  createDriver, deleteDriver, getLatestAssignments, getVehicleById
} from '@/lib/useFleetData'

import { usePageTitle } from '@/lib/usePageTitle'
import { useTranslation } from 'react-i18next'
import { usePlanLimits } from '@/lib/usePlanLimits'
export default function Drivers() {
  usePageTitle('Conducteurs')
  const { t } = useTranslation()
  const { data: drivers } = useDrivers()
  const { data: vehicles } = useVehicles()
  const { data: assignments } = useAssignments()
  const { data: allDocs = [] } = useAllDriverDocuments()
  const { canAddDriver, limits } = usePlanLimits(0, drivers.length)

  const driverDocStatus = useMemo(() => {
    const map = {}
    for (const doc of allDocs) {
      if (!doc.expiry_date) continue
      const days = differenceInDays(new Date(doc.expiry_date), new Date())
      const current = map[doc.driver_id]
      const status = days < 0 ? 'expired' : days <= 30 ? 'expiring' : 'ok'
      if (!current || status === 'expired' || (status === 'expiring' && current === 'ok')) {
        map[doc.driver_id] = status
      }
    }
    return map
  }, [allDocs])
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', employee_id: '', date_of_birth: '', address: '', dkv_card: '', highway_badge: '', wash_card: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const latestAssignments = getLatestAssignments(assignments)
  const driverVehicleMap = {}
  Object.entries(latestAssignments).forEach(([vehicleId, a]) => { driverVehicleMap[a.driver_id] = vehicleId })

  const filtered = drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

  const handleCreate = async () => {
    if (!form.name) return
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

  return (
    <div className="p-5 sm:p-8">
      <PageHeader title="Conducteurs" description={`${drivers.length} conducteur${drivers.length !== 1 ? 's' : ''}`}>
        <div className="flex items-center gap-3">
          {limits.drivers !== Infinity && (
            <span className="text-xs text-zinc-400">{t('plan.usageDrivers', { count: drivers.length, max: limits.drivers })}</span>
          )}
          <Button
            onClick={() => canAddDriver ? setShowAdd(true) : toast.error(t('plan.driverLimitReached') + ' ' + t('plan.upgradeHint'))}
            className={canAddDriver ? 'bg-[#2563EB] hover:bg-[#1D4ED8]' : 'bg-zinc-300 cursor-not-allowed hover:bg-zinc-300'}
          >
            <Plus className="w-4 h-4 mr-2" /> Ajouter
          </Button>
        </div>
      </PageHeader>

      <div className="relative mb-6 max-w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Rechercher un conducteur..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Nom</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">ID</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Téléphone</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Véhicule actuel</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Carte DKV</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Badge autoroute</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500">Carte lavage</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(d => {
                    const vehicleId = driverVehicleMap[d.id]
                    const vehicle = vehicleId ? getVehicleById(vehicles, vehicleId) : null
                    return (
                      <tr key={d.id} className="hover:bg-white transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link to={`/Drivers/${d.id}`} className="font-semibold text-slate-900 hover:text-[#1D4ED8]">{d.name}</Link>
                            {driverDocStatus[d.id] === 'expired' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full"><AlertTriangle className="w-2.5 h-2.5" />Doc. expiré</span>
                            )}
                            {driverDocStatus[d.id] === 'expiring' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full"><Clock className="w-2.5 h-2.5" />Expire bientôt</span>
                            )}
                          </div>
                          {d.address && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{d.address}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{d.employee_id || <span className="text-slate-300">—</span>}</td>
                        <td className="px-5 py-3.5 text-slate-600">{d.phone || '—'}</td>
                        <td className="px-5 py-3.5 text-slate-600">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : '—'}</td>
                        <td className="px-5 py-3.5">
                          {d.dkv_card ? <span className="flex items-center gap-1.5 text-slate-700"><CreditCard className="w-3.5 h-3.5 text-blue-400" />{d.dkv_card}</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          {d.highway_badge ? <span className="text-slate-700">{d.highway_badge}</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          {d.wash_card ? <span className="text-slate-700">{d.wash_card}</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setDeleteTarget(d)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            <Link to={`/Drivers/${d.id}`} className="p-1.5 text-slate-400 hover:text-[#1D4ED8]"><ChevronRight className="w-4 h-4" /></Link>
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
              {filtered.map(d => {
                const vehicleId = driverVehicleMap[d.id]
                const vehicle = vehicleId ? getVehicleById(vehicles, vehicleId) : null
                return (
                  <Link key={d.id} to={`/Drivers/${d.id}`} className="flex items-center justify-between p-4 hover:bg-white transition-colors">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{d.name}</p>
                        {driverDocStatus[d.id] === 'expired' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full"><AlertTriangle className="w-2.5 h-2.5" />Doc. expiré</span>
                        )}
                        {driverDocStatus[d.id] === 'expiring' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full"><Clock className="w-2.5 h-2.5" />Expire bientôt</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{vehicle ? `${vehicle.plate_number} — ${vehicle.model}` : 'Non affecté'}</p>
                      {d.phone && <p className="text-xs text-slate-400 mt-0.5">{d.phone}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.preventDefault(); setDeleteTarget(d) }} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    </div>
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
      </div>

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
            <Button onClick={handleCreate} disabled={saving || !form.name} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]">
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