import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'

const OnboardingContext = createContext(null)

// Per-user localStorage keys so a shared device doesn't leak onboarding state.
const dismissKey = (uid) => `fd_onboard_dismissed_${uid || 'anon'}`
const tourKey    = (uid) => `fd_tour_done_${uid || 'anon'}`

export function OnboardingProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.id
  // Collaborators (org_id in metadata) don't set up a fleet — no admin onboarding.
  const isCollaborator = !!user?.user_metadata?.org_id

  const [checklistDismissed, setChecklistDismissed] = useState(true)
  const [tourOpen, setTourOpen] = useState(false)

  // Load persisted state once we know the user. Auto-start the tour for a
  // brand-new admin (tour never completed), non-intrusively — Skip is always shown.
  useEffect(() => {
    if (!uid || isCollaborator) return
    const dismissed = localStorage.getItem(dismissKey(uid)) === 'true'
    setChecklistDismissed(dismissed)
    if (localStorage.getItem(tourKey(uid)) !== 'true') setTourOpen(true)
  }, [uid, isCollaborator])

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
    isCollaborator,
    checklistVisible: !isCollaborator && !checklistDismissed,
    tourOpen: !isCollaborator && tourOpen,
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
