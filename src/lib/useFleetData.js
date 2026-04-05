import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from './supabase'

async function orgUid() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  // Collaborators have org_id stamped directly in metadata by join-org — fast path
  if (user.user_metadata?.org_id) return user.user_metadata.org_id
  // Fallback: look up by user_id only (never by email — email lookup returns wrong
  // org_id for admin accounts that also appear in org_members as a stale/test invite)
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  if (membership?.org_id) return membership.org_id
  return user.id
}

// ─── Realtime invalidation ────────────────────────────────────────────
const REALTIME_TABLES = ['vehicles','drivers','assignments','mileage_entries',
  'maintenance_records','maintenance_schedules','technical_inspections','wash_records',
  'driver_documents']

export function useFleetRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel('fleet-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const table = payload.table
        const keyMap = {
          vehicles: 'vehicles',
          drivers: 'drivers',
          assignments: 'assignments',
          mileage_entries: 'mileageEntries',
          maintenance_records: 'maintenanceRecords',
          maintenance_schedules: 'maintenanceSchedules',
          technical_inspections: 'technicalInspections',
          wash_records: 'washRecords',
          activity_log: 'activityLog',
          driver_documents: 'allDriverDocuments',
        }
        const key = keyMap[table]
        if (key) qc.invalidateQueries({ queryKey: [key] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])
}


async function logActivity(action, entityType, entityId, entityLabel) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const orgId = user.user_metadata?.org_id || user.id
    const { error: logErr } = await supabase.from('activity_log').insert({
      org_id: orgId,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_label: entityLabel || null,
    })
  } catch { /* silent — logging must never break the main action */ }
}

// ── Queries ──────────────────────────────────────────────────────

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const uid = await orgUid()
      const { data, error } = await supabase.from('vehicles').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    placeholderData: () => [],
  })
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const uid = await orgUid()
      const { data, error } = await supabase.from('drivers').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    placeholderData: () => [],
  })
}

export function useAssignments() {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const uid = await orgUid()
      const { data, error } = await supabase.from('assignments').select('*').eq('user_id', uid).order('assigned_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    placeholderData: () => [],
  })
}

export function useMileageEntries() {
  return useQuery({
    queryKey: ['mileageEntries'],
    queryFn: async () => {
      const uid = await orgUid()
      const { data, error } = await supabase.from('mileage_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    placeholderData: () => [],
  })
}

export function useMaintenanceRecords() {
  return useQuery({
    queryKey: ['maintenanceRecords'],
    queryFn: async () => {
      const uid = await orgUid()
      const { data, error } = await supabase.from('maintenance_records').select('*').eq('user_id', uid).order('date', { ascending: false })
      if (error) throw error
      return data || []
    },
    placeholderData: () => [],
  })
}

export function useTechnicalInspections() {
  return useQuery({
    queryKey: ['technicalInspections'],
    queryFn: async () => {
      const uid = await orgUid()
      const { data, error } = await supabase.from('technical_inspections').select('*').eq('user_id', uid).order('inspection_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    placeholderData: () => [],
  })
}

export function useWashRecords() {
  return useQuery({
    queryKey: ['washRecords'],
    queryFn: async () => {
      const uid = await orgUid()
      const { data, error } = await supabase.from('wash_records').select('*').eq('user_id', uid).order('date', { ascending: false })
      if (error) throw error
      return data || []
    },
    placeholderData: () => [],
  })
}

export function useMaintenanceSchedules() {
  return useQuery({
    queryKey: ['maintenanceSchedules'],
    queryFn: async () => {
      const uid = await orgUid()
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    placeholderData: () => [],
  })
}

// ── Mutations ─────────────────────────────────────────────────────

export async function createVehicle(data) {
  const label = `${data.plate_number || ''}${data.model ? ' — ' + data.model : ''}`.trim() || 'Véhicule'
  const { error } = await supabase.from('vehicles').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
  logActivity('createVehicle', 'vehicle', '', label)
}

export async function createDriver(data) {
  const label = data.name || 'Conducteur'
  const { error } = await supabase.from('drivers').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
  logActivity('createDriver', 'driver', '', label)
}

export async function createAssignment(data) {
  const uid = await orgUid()
  const now = new Date().toISOString()

  // Read current state before making any changes
  const { data: driverActive } = await supabase
    .from('assignments').select('vehicle_id')
    .eq('user_id', uid).eq('driver_id', data.driver_id).is('ended_at', null)
    .maybeSingle()

  const { data: vehicleActive } = await supabase
    .from('assignments').select('driver_id')
    .eq('user_id', uid).eq('vehicle_id', data.vehicle_id).is('ended_at', null)
    .maybeSingle()

  // Already the exact same active pair — nothing to do
  if (driverActive?.vehicle_id === data.vehicle_id) return { swapped: false }

  const swapped = !!(driverActive?.vehicle_id && vehicleActive?.driver_id
    && driverActive.vehicle_id !== data.vehicle_id)

  // Close driver's current assignment
  await supabase.from('assignments').update({ ended_at: now })
    .eq('user_id', uid).eq('driver_id', data.driver_id).is('ended_at', null)

  // Close vehicle's current assignment
  await supabase.from('assignments').update({ ended_at: now })
    .eq('user_id', uid).eq('vehicle_id', data.vehicle_id).is('ended_at', null)

  // If both sides had active assignments → swap: put the displaced driver on the freed vehicle
  if (swapped) {
    await supabase.from('assignments').insert({
      vehicle_id: driverActive.vehicle_id,
      driver_id: vehicleActive.driver_id,
      assigned_at: now,
      user_id: uid,
    })
  }

  const { error } = await supabase.from('assignments').insert({ ...data, user_id: uid })
  if (error) throw error
  logActivity('createAssignment', 'assignment', '', '')
  return { swapped }
}

export async function unassignVehicle(vehicleId) {
  const uid = await orgUid()
  const { error } = await supabase.from('assignments')
    .update({ ended_at: new Date().toISOString() })
    .eq('user_id', uid).eq('vehicle_id', vehicleId).is('ended_at', null)
  if (error) throw error
  logActivity('unassignVehicle', 'assignment', vehicleId, '')
}

export async function createMileageEntry(data) {
  const label = data.mileage ? `${Number(data.mileage).toLocaleString('fr-FR')} km` : 'Relevé kilométrique'
  const { error } = await supabase.from('mileage_entries').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
  logActivity('createMileageEntry', 'mileage', '', label)
}

export async function createMaintenanceRecord(data) {
  const label = data.type || 'Maintenance'
  const { error } = await supabase.from('maintenance_records').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
  logActivity('createMaintenanceRecord', 'maintenance', '', label)
}

export async function createTechnicalInspection(data) {
  const { error } = await supabase.from('technical_inspections').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
  logActivity('createTechnicalInspection', 'inspection', '', 'Contrôle technique')
}

export async function createWashRecord(data) {
  const label = data.amount ? `Lavage ${Number(data.amount).toFixed(2)} €` : 'Lavage'
  const { error } = await supabase.from('wash_records').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
  logActivity('createWashRecord', 'wash', '', label)
}

export async function createMaintenanceSchedule(data) {
  const label = data.task || 'Planning maintenance'
  const { error } = await supabase.from('maintenance_schedules').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
  logActivity('createMaintenanceSchedule', 'maintenance_schedule', '', label)
}

export async function updateMaintenanceSchedule(id, data) {
  const { error } = await supabase.from('maintenance_schedules').update(data).eq('id', id)
  if (error) throw error
  logActivity('updateMaintenanceSchedule', 'maintenance_schedule', id, '')
}

export async function deleteMaintenanceSchedule(id) {
  const { error } = await supabase.from('maintenance_schedules').delete().eq('id', id)
  if (error) throw error
  logActivity('deleteMaintenanceSchedule', 'maintenance_schedules', id, '')
}

export async function updateDriver(id, data) {
  const { error } = await supabase.from('drivers').update(data).eq('id', id)
  if (error) throw error
  logActivity('updateDriver', 'driver', id, '')
}

export async function deleteDriver(id) {
  const { error } = await supabase.from('drivers').delete().eq('id', id)
  if (error) throw error
  logActivity('deleteDriver', 'driver', id, '')
}

export async function updateVehicle(id, data) {
  const { error } = await supabase.from('vehicles').update(data).eq('id', id)
  if (error) throw error
  logActivity('updateVehicle', 'vehicle', id, data.plate_number || '')
}

export async function deleteVehicle(id) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
  logActivity('deleteVehicle', 'vehicle', id, '')
}

export async function updateMileageEntry(id, data) {
  const { error } = await supabase.from('mileage_entries').update(data).eq('id', id)
  if (error) throw error
  logActivity('updateMileageEntry', 'mileage', id, '')
}

export async function updateAssignment(id, data) {
  const { error } = await supabase.from('assignments').update(data).eq('id', id)
  if (error) throw error
  logActivity('updateAssignment', 'assignment', id, '')
}

export async function deleteMileageEntry(id) {
  const { error } = await supabase.from('mileage_entries').delete().eq('id', id)
  if (error) throw error
  logActivity('deleteMileageEntry', 'mileage_entries', id, '')
}

export async function deleteAssignment(id) {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) throw error
  logActivity('deleteAssignment', 'assignments', id, '')
}

export async function updateTechnicalInspection(id, data) {
  const { error } = await supabase.from('technical_inspections').update(data).eq('id', id)
  if (error) throw error
  logActivity('updateTechnicalInspection', 'inspection', id, '')
}

export async function deleteTechnicalInspection(id) {
  const { error } = await supabase.from('technical_inspections').delete().eq('id', id)
  if (error) throw error
  logActivity('deleteTechnicalInspection', 'technical_inspections', id, '')
}

export async function updateWashRecord(id, data) {
  const { error } = await supabase.from('wash_records').update(data).eq('id', id)
  if (error) throw error
  logActivity('updateWashRecord', 'wash', id, '')
}

export async function deleteWashRecord(id) {
  const { error } = await supabase.from('wash_records').delete().eq('id', id)
  if (error) throw error
  logActivity('deleteWashRecord', 'wash_records', id, '')
}

export async function updateMaintenanceRecord(id, data) {
  const { error } = await supabase.from('maintenance_records').update(data).eq('id', id)
  if (error) throw error
  logActivity('updateMaintenanceRecord', 'maintenance', id, '')
}

export async function deleteMaintenanceRecord(id) {
  const { error } = await supabase.from('maintenance_records').delete().eq('id', id)
  if (error) throw error
  logActivity('deleteMaintenanceRecord', 'maintenance_records', id, '')
}

// ── Driver Documents ──────────────────────────────────────────────

export function useDriverDocuments(driverId) {
  return useQuery({
    queryKey: ['driverDocuments', driverId],
    queryFn: async () => {
      if (!driverId) return []
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!driverId,
    placeholderData: () => [],
  })
}

export function useAllDriverDocuments() {
  return useQuery({
    queryKey: ['allDriverDocuments'],
    queryFn: async () => {
      const uid = await orgUid()
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('org_id', uid)
      if (error) throw error
      return data || []
    },
    placeholderData: () => [],
  })
}

export async function createDriverDocument(data) {
  const uid = await orgUid()
  const { error } = await supabase.from('driver_documents').insert({ ...data, org_id: uid })
  if (error) throw error
  logActivity('createDriverDocument', 'driver_document', data.driver_id, data.type || '')
}

export async function updateDriverDocument(id, data) {
  const { error } = await supabase.from('driver_documents')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  logActivity('updateDriverDocument', 'driver_document', id, data.type || '')
}

export async function deleteDriverDocument(id) {
  const { error } = await supabase.from('driver_documents').delete().eq('id', id)
  if (error) throw error
  logActivity('deleteDriverDocument', 'driver_document', id, '')
}

// ── Helpers ───────────────────────────────────────────────────────

export function getLatestAssignments(assignments) {
  // Primary: active assignments are those with ended_at IS NULL.
  // Cross-check by driver handles any legacy records that predate the ended_at column.
  const active = assignments.filter(a => !a.ended_at)

  const byVehicle = {}
  for (const a of active) {
    if (!byVehicle[a.vehicle_id] || new Date(a.assigned_at) > new Date(byVehicle[a.vehicle_id].assigned_at)) {
      byVehicle[a.vehicle_id] = a
    }
  }
  const byDriver = {}
  for (const a of active) {
    if (!byDriver[a.driver_id] || new Date(a.assigned_at) > new Date(byDriver[a.driver_id].assigned_at)) {
      byDriver[a.driver_id] = a
    }
  }
  const result = {}
  for (const [vehicleId, assignment] of Object.entries(byVehicle)) {
    const driverLatest = byDriver[assignment.driver_id]
    if (driverLatest && driverLatest.vehicle_id === vehicleId) {
      result[vehicleId] = assignment
    }
  }
  return result
}

export function getLatestMileage(entries) {
  const map = {}
  for (const e of entries) {
    if (!map[e.vehicle_id] || new Date(e.created_at) > new Date(map[e.vehicle_id].created_at)) {
      map[e.vehicle_id] = e
    }
  }
  return map
}

export function getDriverById(drivers, id) {
  return drivers.find(d => d.id === id)
}

export function getVehicleById(vehicles, id) {
  return vehicles.find(v => v.id === id)
}
