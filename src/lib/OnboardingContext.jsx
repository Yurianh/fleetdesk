import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'

const OnboardingContext = createContext(null)

// Per-user localStorage keys so a shared device doesn't leak onboarding state.
const dismissKey = (uid) => `fd_onboard_dismissed_${uid || 'anon'}`
const tourKey    = (uid) => `fd_tour_done_${uid || 'anon'}`

export function OnboardingProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.id
  // Account type drives which onboarding is shown:
  //  - owner  : no org_id (created the org) → fleet-setup checklist
  //  - admin  : org_id + role 'admin' (invited manager) → operations + team
  //  - member : org_id + role 'member' → daily operations across the fleet
  //  - driver : org_id + role 'driver'/'sub-member' (chauffeur, restricted, not
  //             yet provisioned) → only mileage + wash on their own vehicle
  const orgId = user?.user_metadata?.org_id
  const role = user?.user_metadata?.role
  const accountType = !orgId
    ? 'owner'
    : role === 'admin'
    ? 'admin'
    : (role === 'driver' || role === 'sub-member')
    ? 'driver'
    : 'member'
  const isCollaborator = !!orgId

  const [checklistDismissed, setChecklistDismissed] = useState(true)
  const [tourOpen, setTourOpen] = useState(false)
  // True when the tour auto-started on first connection (vs replayed from
  // Settings). Used to nudge the user to their profile only on that first run.
  const [tourAuto, setTourAuto] = useState(false)
  // Set true by AppLayout once the loading overlay has lifted (data ready).
  const [appReady, setAppReady] = useState(false)
  const markAppReady = useCallback(() => setAppReady(true), [])

  // Load the checklist dismissal as soon as we know the user.
  useEffect(() => {
    if (!uid) return
    setChecklistDismissed(localStorage.getItem(dismissKey(uid)) === 'true')
  }, [uid])

  // Auto-start the tour ONLY on the very first connection, and only AFTER the
  // page has finished loading (appReady) so it never appears over the loader.
  //  - desktop only: its steps point at the sidebar, a hidden drawer on mobile
  //  - not for drivers: restricted nav → minimal card instead of the full tour
  //  - once per account: tourKey persists on first completion/skip
  useEffect(() => {
    if (!uid || !appReady) return
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
    if (isDesktop && accountType !== 'driver' && localStorage.getItem(tourKey(uid)) !== 'true') {
      setTourAuto(true)
      setTourOpen(true)
    }
  }, [uid, appReady, accountType])

  const dismissChecklist = useCallback(() => {
    setChecklistDismissed(true)
    if (uid) localStorage.setItem(dismissKey(uid), 'true')
  }, [uid])

  const reopenChecklist = useCallback(() => {
    setChecklistDismissed(false)
    if (uid) localStorage.removeItem(dismissKey(uid))
  }, [uid])

  const startTour = useCallback(() => { setTourAuto(false); setTourOpen(true) }, [])

  const endTour = useCallback(() => {
    setTourOpen(false)
    if (uid) localStorage.setItem(tourKey(uid), 'true')
  }, [uid])

  const value = {
    accountType,
    isCollaborator,
    checklistVisible: !checklistDismissed,
    tourOpen,
    tourAuto,
    dismissChecklist,
    reopenChecklist,
    startTour,
    endTour,
    markAppReady,
  }

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
