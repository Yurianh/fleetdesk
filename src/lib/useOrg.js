import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { activityLog as mockActivityLog } from './mockData'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function invokeWithAuth(fnName, body) {
  if (DEMO) return {} // demo: member invite/remove are no-ops
  const headers = await getAuthHeader()
  const { data, error } = await supabase.functions.invoke(fnName, { body, headers })
  if (error) {
    let detail = error.message
    try {
      const b = typeof error.context?.json === 'function'
        ? await error.context.json()
        : JSON.parse(error.context)
      if (b?.error) detail = b.error
    } catch {}
    throw new Error(detail)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export function useOrgMembers() {
  return useQuery({
    queryKey: ['orgMembers'],
    queryFn: async () => {
      if (DEMO) return []
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      // Owner (no org_id) manages their own org; an admin manages the owner's org.
      // Other collaborators (member/driver) don't need the list. RLS enforces the
      // real permission — a forged metadata.role just yields an empty list.
      const isCollaborator = !!user.user_metadata?.org_id
      if (isCollaborator && user.user_metadata?.role !== 'admin') return []
      const orgId = user.user_metadata?.org_id || user.id
      const { data, error } = await supabase
        .from('org_members')
        .select('*')
        .eq('org_id', orgId)
        .order('invited_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

export function useActivityLog(limit = 50) {
  return useQuery({
    queryKey: ['activityLog', limit],
    queryFn: async () => {
      if (DEMO) return mockActivityLog.slice(0, limit)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const orgId = user.user_metadata?.org_id || user.id
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    },
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ email, role, vehicleId, vehicleIds }) => invokeWithAuth('invite-member', { email, role, vehicleId, vehicleIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgMembers'] }),
  })
}

export function useSetDriverVehicles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberUserId, driverId, vehicleIds }) =>
      invokeWithAuth('set-driver-vehicles', { member_user_id: memberUserId, driver_id: driverId, vehicle_ids: vehicleIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgMembers'] })
      qc.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId }) => invokeWithAuth('remove-member', { memberId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgMembers'] }),
  })
}
