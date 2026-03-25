import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email, password) => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    console.log('[signUp] URL:', JSON.stringify(url), 'len:', url?.length)
    console.log('[signUp] KEY len:', key?.length, 'hasNewline:', key?.includes('\n') || key?.includes('\r'))
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
