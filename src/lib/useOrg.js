import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function invokeWithAuth(fnName, body) {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.user_metadata?.org_id) return []
      const { data, error } = await supabase
        .from('org_members')
        .select('*')
        .eq('org_id', user.id)
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
    mutationFn: ({ email, role }) => invokeWithAuth('invite-member', { email, role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgMembers'] }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId }) => invokeWithAuth('remove-member', { memberId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgMembers'] }),
  })
}
