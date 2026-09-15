import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { mockUser } from './mockData'
import { clearLanding } from '@/lib/motion'

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

  // Version des conditions en vigueur. À incrémenter à chaque modification des
  // CGU : c'est ce qui permet de savoir *quelles* conditions un client a
  // acceptées, et de redemander une acceptation si elles changent.
  const TERMS_VERSION = '2026-09-15'

  const signUp = async (email, password) => {
    const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
    const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
    const res = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
      },
      // L'horodatage est posé côté client : c'est une preuve d'usage, pas une
      // preuve légale opposable — mais datée et versionnée, elle vaut infiniment
      // mieux qu'une case cochée dont il ne reste aucune trace.
      body: JSON.stringify({
        email,
        password,
        data: {
          terms_accepted_at: new Date().toISOString(),
          terms_version: TERMS_VERSION,
        },
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || data.msg || 'Impossible de créer le compte.')
  }

  // La déconnexion réarme l'atterrissage : la prochaine connexion rejoue l'accueil.
  const signOut = () => { clearLanding(); return supabase.auth.signOut() }

  // Patch the plan in the local user object so plan gates update instantly after
  // a sync, without waiting for a token refresh (a refreshed JWT doesn't always
  // re-bake app_metadata). The DB app_metadata is already authoritative and is
  // what the server enforces — this only keeps the client UI in step.
  const applyPlan = (plan) =>
    setUser(u => u ? { ...u, app_metadata: { ...u.app_metadata, plan } } : u)

  // Mark onboarding complete locally so routing leaves the setup flow instantly
  // (an already-subscribed account shouldn't be forced back through onboarding).
  const applyOnboarded = () =>
    setUser(u => u ? { ...u, user_metadata: { ...u.user_metadata, onboarding_complete: true } } : u)

  const setDisplayName = async (name) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: name },
    })
    if (error) throw error
    setUser(data.user)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setDisplayName, applyPlan, applyOnboarded }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
