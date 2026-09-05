import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { mockUser } from './mockData'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO ? mockUser : null)
  const [loading, setLoading] = useState(!DEMO)

  useEffect(() => {
    if (DEMO) return
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
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DEMO])

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

  // Patch the plan in the local user object so plan gates update instantly after
  // a sync, without waiting for a token refresh (a refreshed JWT doesn't always
  // re-bake app_metadata). The DB app_metadata is already authoritative and is
  // what the server enforces — this only keeps the client UI in step.
  const applyPlan = (plan) =>
    setUser(u => u ? { ...u, app_metadata: { ...u.app_metadata, plan } } : u)

  const setDisplayName = async (name) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: name },
    })
    if (error) throw error
    setUser(data.user)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setDisplayName, applyPlan }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
