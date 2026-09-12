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

// ── Chorégraphie : ordre visuel, cadence décélérante ─────────────────────────
// Les éléments marqués `data-land` se posent de haut en bas et de gauche à
// droite, quelle que soit leur place dans le DOM : c'est l'œil qui donne
// l'ordre, pas l'arbre React. L'écart entre deux entrées se resserre à mesure
// qu'on descend (loi exponentielle) — large au début, serré à la fin, pour que
// la séquence respire sans s'éterniser.

const LAND_SPREAD = 3200   // étalement total des départs, en ms
const LAND_EASE = 9        // plus grand = cadence plus régulière
const LAND_DURATION = 1500 // durée d'entrée d'un élément
const BAR_OFFSET = 240     // les barres se remplissent après leur ligne

export function runLanding(root = document) {
  const items = [...root.querySelectorAll('[data-land]')]
  if (!items.length) return 0

  const placed = items
    .map(el => ({ el, rect: el.getBoundingClientRect() }))
    // Regroupe par bandes horizontales de 24px : deux blocs côte à côte
    // partent quasi ensemble, de la gauche vers la droite.
    .sort((a, b) =>
      Math.round(a.rect.top / 24) - Math.round(b.rect.top / 24) || a.rect.left - b.rect.left)

  placed.forEach(({ el }, i) => {
    const delay = Math.round(LAND_SPREAD * (1 - Math.exp(-i / LAND_EASE)))
    el.style.setProperty('--land-delay', `${delay}ms`)
  })

  // Une barre de progression suit sa propre ligne, avec un temps de retard.
  for (const bar of root.querySelectorAll('[data-land-bar]')) {
    const owner = bar.closest('[data-land]')
    const base = owner ? parseInt(owner.style.getPropertyValue('--land-delay'), 10) || 0 : 0
    bar.style.setProperty('--land-delay', `${base + BAR_OFFSET}ms`)
  }

  return LAND_SPREAD + LAND_DURATION
}
