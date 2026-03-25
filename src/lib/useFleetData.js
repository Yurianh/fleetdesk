import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

async function uid() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

// ── Queries ──────────────────────────────────────────────────────

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    initialData: [],
  })
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drivers').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    initialData: [],
  })
}

export function useAssignments() {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assignments').select('*').order('assigned_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    initialData: [],
  })
}

export function useMileageEntries() {
  return useQuery({
    queryKey: ['mileageEntries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mileage_entries').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    initialData: [],
  })
}

export function useMaintenanceRecords() {
  return useQuery({
    queryKey: ['maintenanceRecords'],
    queryFn: async () => {
      const { data, error } = await supabase.from('maintenance_records').select('*').order('date', { ascending: false })
      if (error) throw error
      return data || []
    },
    initialData: [],
  })
}

export function useTechnicalInspections() {
  return useQuery({
    queryKey: ['technicalInspections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('technical_inspections').select('*').order('inspection_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    initialData: [],
  })
}

export function useWashRecords() {
  return useQuery({
    queryKey: ['washRecords'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wash_records').select('*').order('date', { ascending: false })
      if (error) throw error
      return data || []
    },
    initialData: [],
  })
}

export function useMaintenanceSchedules() {
  return useQuery({
    queryKey: ['maintenanceSchedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    initialData: [],
  })
}

// ── Mutations ─────────────────────────────────────────────────────

export async function createVehicle(data) {
  const { error } = await supabase.from('vehicles').insert({ ...data, user_id: await uid() })
  if (error) throw error
}

export async function createDriver(data) {
  const { error } = await supabase.from('drivers').insert({ ...data, user_id: await uid() })
  if (error) throw error
}

export async function createAssignment(data) {
  const { error } = await supabase.from('assignments').insert({ ...data, user_id: await uid() })
  if (error) throw error
}

export async function createMileageEntry(data) {
  const { error } = await supabase.from('mileage_entries').insert({ ...data, user_id: await uid() })
  if (error) throw error
}

export async function createMaintenanceRecord(data) {
  const { error } = await supabase.from('maintenance_records').insert({ ...data, user_id: await uid() })
  if (error) throw error
}

export async function createTechnicalInspection(data) {
  const { error } = await supabase.from('technical_inspections').insert({ ...data, user_id: await uid() })
  if (error) throw error
}

export async function createWashRecord(data) {
  const { error } = await supabase.from('wash_records').insert({ ...data, user_id: await uid() })
  if (error) throw error
}

export async function createMaintenanceSchedule(data) {
  const { error } = await supabase.from('maintenance_schedules').insert({ ...data, user_id: await uid() })
  if (error) throw error
}

export async function updateMaintenanceSchedule(id, data) {
  const { error } = await supabase.from('maintenance_schedules').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteMaintenanceSchedule(id) {
  const { error } = await supabase.from('maintenance_schedules').delete().eq('id', id)
  if (error) throw error
}

export async function updateDriver(id, data) {
  const { error } = await supabase.from('drivers').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteMileageEntry(id) {
  const { error } = await supabase.from('mileage_entries').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAssignment(id) {
  const { error } = await supabase.from('assignments').delete().eq('id', id)
  if (error) throw error
}

export async function updateTechnicalInspection(id, data) {
  const { error } = await supabase.from('technical_inspections').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteTechnicalInspection(id) {
  const { error } = await supabase.from('technical_inspections').delete().eq('id', id)
  if (error) throw error
}

export async function updateWashRecord(id, data) {
  const { error } = await supabase.from('wash_records').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteWashRecord(id) {
  const { error } = await supabase.from('wash_records').delete().eq('id', id)
  if (error) throw error
}

export async function updateMaintenanceRecord(id, data) {
  const { error } = await supabase.from('maintenance_records').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteMaintenanceRecord(id) {
  const { error } = await supabase.from('maintenance_records').delete().eq('id', id)
  if (error) throw error
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
