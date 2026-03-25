import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

export function useOrgMembers() {
  return useQuery({
    queryKey: ['orgMembers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.user_metadata?.org_id) return []  // collaborators don't see team
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
    mutationFn: async ({ email, role }) => {
      const { data, error } = await supabase.functions.invoke('invite-member', { body: { email, role } })
      if (error) {
        let detail = error.message
        try { const b = await error.context?.json?.(); if (b?.error) detail = b.error } catch {}
        throw new Error(detail)
      }
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgMembers'] }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ memberId }) => {
      const { data, error } = await supabase.functions.invoke('remove-member', { body: { memberId } })
      if (error) {
        let detail = error.message
        try { const b = await error.context?.json?.(); if (b?.error) detail = b.error } catch {}
        throw new Error(detail)
      }
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgMembers'] }),
  })
}
