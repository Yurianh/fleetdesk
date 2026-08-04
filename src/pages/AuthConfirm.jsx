import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppLoader from '@/components/layout/AppLoader'

// Handles email links that point to our own domain instead of the raw
// Supabase verify URL. The email template builds:
//   https://app.fleetdesk.fr/auth/confirm?token_hash=…&type=invite&next=/join
// We exchange the token_hash for a session here, then continue to `next`.
export default function AuthConfirm() {
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const type = params.get('type')
    // Only allow same-origin relative paths for `next` (avoid open redirect)
    const rawNext = params.get('next') || '/'
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

    if (!tokenHash || !type) {
      window.location.replace(next)
      return
    }

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type })
      .then(({ error: err }) => {
        if (err) setError(err.message || 'Lien invalide ou expiré.')
        else window.location.replace(next)
      })
      .catch((e) => setError(String(e?.message || e)))
  }, [])

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="font-display text-xl text-zinc-900 mb-2">Lien invalide ou expiré</h1>
          <p className="text-sm text-zinc-500 mb-6">{error}</p>
          <a href="/login" className="inline-flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0052D6] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Retour à la connexion
          </a>
        </div>
      </div>
    )
  }

  return <AppLoader message="Vérification de votre lien…" />
}
