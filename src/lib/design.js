import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

// Design de l'application : « planche » (gravure, depuis octobre 2026) ou
// « classic » (l'interface d'avant). Tout l'habillage Planche vit dans
// index.css sous html[data-design="planche"] ; ici, seulement l'état.
//
// Le choix appartient au compte (user_metadata.ui_design) pour suivre
// l'utilisateur d'un appareil à l'autre ; une copie locale l'applique dès le
// premier rendu, avant que la session ne soit chargée.

const KEY = 'fd-design'
export const DESIGNS = ['planche', 'classic']
export const DEFAULT_DESIGN = 'planche'

function valid(v) { return DESIGNS.includes(v) ? v : null }

export function storedDesign() {
  try { return valid(window.localStorage.getItem(KEY)) || DEFAULT_DESIGN } catch { return DEFAULT_DESIGN }
}

export function applyDesign(design) {
  document.documentElement.dataset.design = valid(design) || DEFAULT_DESIGN
}

// Appelé une fois au démarrage, avant le rendu de l'app.
export function initDesign() {
  applyDesign(storedDesign())
}

function remember(design) {
  try { window.localStorage.setItem(KEY, design) } catch { /* stockage indisponible */ }
}

// Aligne l'appareil sur le choix enregistré dans le compte, à la connexion.
export function syncDesignFromUser(user) {
  const fromAccount = valid(user?.user_metadata?.ui_design)
  if (!fromAccount) return
  remember(fromAccount)
  applyDesign(fromAccount)
}

export function useDesignSetting(user) {
  const [design, setLocal] = useState(() => valid(user?.user_metadata?.ui_design) || storedDesign())

  useEffect(() => { applyDesign(design) }, [design])

  const setDesign = useCallback(async (next) => {
    if (!valid(next)) return
    remember(next)
    setLocal(next)
    // Hors démo, le choix suit le compte ; un échec réseau n'empêche pas le
    // changement local, il sera simplement propre à cet appareil.
    if (import.meta.env.VITE_DEMO_MODE === 'true') return
    try { await supabase.auth.updateUser({ data: { ui_design: next } }) } catch { /* hors ligne */ }
  }, [])

  return { design, setDesign }
}
