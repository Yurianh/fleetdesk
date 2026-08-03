import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Users, ArrowLeftRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  useVehicles, useDrivers, useAssignments,
  getLatestAssignments, getVehicleById, createAssignment,
} from '@/lib/useFleetData'

// Assign a driver to a vehicle — the mirror of DriverDetail's inline vehicle
// picker, with the same visual vocabulary (Actuel / Disponible / Échange).
// With `vehicleId` fixed it assigns to that vehicle; without, a vehicle
// select is shown first (used by the Assignments page create action).
export default function AssignDriverDialog({ open, onClose, vehicleId: fixedVehicleId = null }) {
  const { data: vehicles }    = useVehicles()
  const { data: drivers }     = useDrivers()
  const { data: assignments } = useAssignments()
  const queryClient = useQueryClient()

  const [vehicleId, setVehicleId] = useState(fixedVehicleId || '')
  const [driverId,  setDriverId]  = useState('')
  const [search,    setSearch]    = useState('')
  const [assigning, setAssigning] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    if (open) {
      setVehicleId(fixedVehicleId || '')
      setDriverId('')
      setSearch('')
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open, fixedVehicleId])

  const latestAssignments = useMemo(() => getLatestAssignments(assignments), [assignments])
  // driver id → vehicle id they currently drive
  const vehicleByDriver = useMemo(() => {
    const map = {}
    for (const [vid, a] of Object.entries(latestAssignments)) map[a.driver_id] = vid
    return map
  }, [latestAssignments])

  const currentDriverId = vehicleId ? (latestAssignments[vehicleId]?.driver_id ?? null) : null

  const pickableDrivers = drivers.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAssign = async () => {
    if (!vehicleId || !driverId) return
    setAssigning(true)
    try {
      const { swapped } = await createAssignment({
        vehicle_id: vehicleId,
        driver_id: driverId,
        assigned_at: new Date().toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      toast.success(swapped ? 'Véhicules échangés.' : 'Conducteur affecté.')
      onClose()
    } catch { toast.error("Erreur lors de l'affectation.") }
    finally { setAssigning(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader><DialogTitle>Affecter un conducteur</DialogTitle></DialogHeader>

        {!fixedVehicleId && (
          <div className="mt-1">
            <SearchableSelect
              value={vehicleId}
              onValueChange={setVehicleId}
              placeholder="Sélectionner un véhicule"
              options={vehicles.map(v => ({ value: v.id, label: `${v.plate_number} — ${v.model}` }))}
            />
          </div>
        )}

        {drivers.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Aucun conducteur enregistré.</p>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un conducteur..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30 focus:border-[#0066FF]"
              />
            </div>

            {pickableDrivers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucun conducteur ne correspond à "{search}".</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {pickableDrivers.map(d => {
                  const drivenVehicleId = vehicleByDriver[d.id]
                  const drivenVehicle   = drivenVehicleId ? getVehicleById(vehicles, drivenVehicleId) : null
                  const isCurrent  = vehicleId && d.id === currentDriverId
                  const isFree     = !drivenVehicleId
                  const isSelected = driverId === d.id

                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDriverId(d.id)}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 ${
                        isSelected
                          ? 'border-[#0066FF] bg-[#0066FF]/5 ring-1 ring-[#0066FF]/20'
                          : isCurrent
                          ? 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-300'
                          : isFree
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-[#0066FF]' : isCurrent ? 'bg-emerald-100' : 'bg-slate-100'
                          }`}>
                            <Users className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-white' : isCurrent ? 'text-emerald-600' : 'text-slate-400'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{d.name}</p>
                            {d.phone && <p className="text-xs text-slate-400 truncate">{d.phone}</p>}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Actuel
                            </span>
                          ) : isFree ? (
                            <span className="text-[11px] font-medium text-slate-400">Disponible</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                              <ArrowLeftRight className="w-3 h-3" />
                              Conduit {drivenVehicle?.plate_number || '—'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} className="flex-shrink-0">Annuler</Button>
          <Button
            onClick={handleAssign}
            disabled={!vehicleId || !driverId || driverId === currentDriverId || assigning}
            className="flex-1 bg-[#0066FF] hover:bg-[#0052D6] disabled:opacity-40"
          >
            {assigning ? 'Affectation...' : "Confirmer l'affectation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
