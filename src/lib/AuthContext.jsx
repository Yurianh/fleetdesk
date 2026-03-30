import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then((result) => {
      setUser(result.data?.session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setUser(user)
      // Sync a cross-subdomain cookie so the marketing site can detect auth state
      if (user) {
        document.cookie = 'fd_auth=1; domain=.fleetdesk.fr; path=/; max-age=604800; SameSite=Lax'
      } else {
        document.cookie = 'fd_auth=; domain=.fleetdesk.fr; path=/; max-age=0'
      }
      if (user?.user_metadata?.org_id) {
        // Verify membership still exists — sign out immediately if removed
        supabase
          .from('org_members')
          .select('id, status')
          .eq('email', user.email)
          .eq('org_id', user.user_metadata.org_id)
          .maybeSingle()
          .then(({ data: member, error }) => {
            // Only revoke if the query succeeded AND definitively returned no row.
            // If there's an RLS/network error, give the benefit of the doubt — do not sign out.
            if (!error && member === null) {
              supabase.auth.signOut()
            }
            // Do NOT auto-activate pending members here — activation only happens via /join
          })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email, password) => {
    const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
    const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
    const res = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
      },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.msg || 'Impossible de créer le compte.')
  }

  const signOut = () => supabase.auth.signOut()

  const setDisplayName = async (name) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: name },
    })
    if (error) throw error
    setUser(data.user)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setDisplayName }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
