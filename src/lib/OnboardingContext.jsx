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

  // Load persisted state once we know the user. Auto-start the tour for any
  // brand-new account (tour never completed), non-intrusively — Skip is always shown.
  useEffect(() => {
    if (!uid) return
    const dismissed = localStorage.getItem(dismissKey(uid)) === 'true'
    setChecklistDismissed(dismissed)
    // Auto-start the tour on desktop only — its steps point at the sidebar,
    // which is a hidden drawer on mobile. Drivers have a restricted nav, so
    // they get the minimal card instead of the full nav tour.
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
    if (isDesktop && accountType !== 'driver' && localStorage.getItem(tourKey(uid)) !== 'true') setTourOpen(true)
  }, [uid, accountType])

  const dismissChecklist = useCallback(() => {
    setChecklistDismissed(true)
    if (uid) localStorage.setItem(dismissKey(uid), 'true')
  }, [uid])

  const reopenChecklist = useCallback(() => {
    setChecklistDismissed(false)
    if (uid) localStorage.removeItem(dismissKey(uid))
  }, [uid])

  const startTour = useCallback(() => setTourOpen(true), [])

  const endTour = useCallback(() => {
    setTourOpen(false)
    if (uid) localStorage.setItem(tourKey(uid), 'true')
  }, [uid])

  const value = {
    accountType,
    isCollaborator,
    checklistVisible: !checklistDismissed,
    tourOpen,
    dismissChecklist,
    reopenChecklist,
    startTour,
    endTour,
  }

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
  return ctx
}
