import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from './supabase'

async function orgUid() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  // Collaborators write under org owner's user_id for unified data scoping
  return user.user_metadata?.org_id || user.id
}

// ─── Realtime invalidation ────────────────────────────────────────────
const REALTIME_TABLES = ['vehicles','drivers','assignments','mileage_entries',
  'maintenance_records','maintenance_schedules','technical_inspections','wash_records']

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
    await supabase.from('activity_log').insert({
      org_id: orgId,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
      action,
      entity_type: entityType,
      entity_id: String(entityId || ''),
      entity_label: String(entityLabel || ''),
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
  const label = data.plate || data.make || 'Véhicule'
  const { data: result, error } = await supabase.from('vehicles').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
}

export async function createDriver(data) {
  const label = data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : 'Conducteur'
  const { data: result, error } = await supabase.from('drivers').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
}

export async function createAssignment(data) {
  const label = 'Affectation'
  const { data: result, error } = await supabase.from('assignments').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
}

export async function createMileageEntry(data) {
  const label = 'Relevé kilométrique'
  const { data: result, error } = await supabase.from('mileage_entries').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
}

export async function createMaintenanceRecord(data) {
  const label = data.type || 'Maintenance'
  const { data: result, error } = await supabase.from('maintenance_records').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
}

export async function createTechnicalInspection(data) {
  const label = 'Contrôle technique'
  const { data: result, error } = await supabase.from('technical_inspections').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
}

export async function createWashRecord(data) {
  const label = 'Lavage'
  const { data: result, error } = await supabase.from('wash_records').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
}

export async function createMaintenanceSchedule(data) {
  const label = data.task || 'Planning maintenance'
  const { data: result, error } = await supabase.from('maintenance_schedules').insert({ ...data, user_id: await orgUid() })
  if (error) throw error
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

// ── Helpers ───────────────────────────────────────────────────────

export function getLatestAssignments(assignments) {
  const map = {}
  for (const a of assignments) {
    if (!map[a.vehicle_id] || new Date(a.assigned_at) > new Date(map[a.vehicle_id].assigned_at)) {
      map[a.vehicle_id] = a
    }
  }
  return map
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
