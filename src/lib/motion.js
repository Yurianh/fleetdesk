import { useCallback, useEffect, useState } from 'react'

// Préférence d'animation de l'application.
//
// Les animations d'arrivée sont pilotées par une seule classe sur <html> :
// `motion-on`. Tout l'habillage vit dans index.css, ici on ne gère que l'état.
// Par défaut elles sont actives, sauf si le système demande moins d'animations
// (prefers-reduced-motion) — l'utilisateur peut forcer l'un ou l'autre depuis
// Réglages › Affichage, et son choix est conservé sur l'appareil.

const KEY = 'fd-motion'
const LANDED = 'fd-landed'

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function motionEnabled() {
  if (typeof window === 'undefined') return false
  const stored = window.localStorage.getItem(KEY)
  if (stored === 'on') return true
  if (stored === 'off') return false
  return !prefersReducedMotion()
}

export function applyMotion(on) {
  document.documentElement.classList.toggle('motion-on', on)
}

// Appelé une fois au démarrage, avant le rendu de l'app.
export function initMotion() {
  applyMotion(motionEnabled())
}

export function useMotionSetting() {
  const [enabled, setEnabled] = useState(motionEnabled)

  useEffect(() => { applyMotion(enabled) }, [enabled])

  const setMotion = useCallback((on) => {
    try { window.localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* stockage indisponible */ }
    setEnabled(on)
  }, [])

  return { enabled, setMotion, systemReduced: prefersReducedMotion() }
}

// ── Atterrissage : une seule fois par session, juste après la connexion ──────
// La chorégraphie du tableau de bord est un moment d'accueil, pas un effet à
// rejouer à chaque navigation. Le drapeau vit en sessionStorage : il disparaît
// avec l'onglet, et signOut() le remet à zéro pour la connexion suivante.

export function shouldLand() {
  if (!motionEnabled()) return false
  try { return window.sessionStorage.getItem(LANDED) !== '1' } catch { return false }
}

export function markLanded() {
  try { window.sessionStorage.setItem(LANDED, '1') } catch { /* stockage indisponible */ }
}

export function clearLanding() {
  try { window.sessionStorage.removeItem(LANDED) } catch { /* stockage indisponible */ }
}
