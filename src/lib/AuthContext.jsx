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
      if (user?.user_metadata?.org_id) {
        // Verify membership still exists — sign out immediately if removed
        supabase
          .from('org_members')
          .select('id, status')
          .eq('email', user.email)
          .eq('org_id', user.user_metadata.org_id)
          .maybeSingle()
          .then(({ data: member }) => {
            if (!member) {
              // Row deleted — access revoked
              supabase.auth.signOut()
            } else if (member.status !== 'active') {
              // Still pending — activate
              supabase
                .from('org_members')
                .update({ status: 'active', user_id: user.id })
                .eq('email', user.email)
                .eq('org_id', user.user_metadata.org_id)
                .then(() => {})
            }
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
