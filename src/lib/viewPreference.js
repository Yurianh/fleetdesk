import { useCallback, useEffect, useState } from 'react'

// Préférences d'affichage d'une page, conservées d'une visite à l'autre.
//
// Le stockage local suffit : le choix d'une densité appartient à l'écran qu'on
// a sous les yeux, pas au compte. Quelqu'un qui consulte depuis un portable de
// treize pouces et depuis un écran de bureau ne veut pas le même réglage aux
// deux endroits, et une préférence synchronisée le lui imposerait.
const PREFIX = 'fd-view-'

function read(name, fallback, allowed) {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(PREFIX + name)
    return allowed.includes(stored) ? stored : fallback
  } catch {
    return fallback   // navigation privée, stockage refusé : on garde le défaut
  }
}

export function useViewPreference(name, allowed, fallback = allowed[0]) {
  const [value, setValue] = useState(() => read(name, fallback, allowed))

  // Une autre fenêtre du même navigateur a changé le réglage : on suit.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== PREFIX + name) return
      setValue(allowed.includes(e.newValue) ? e.newValue : fallback)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [name, fallback, allowed])

  const choose = useCallback((next) => {
    if (!allowed.includes(next)) return
    try { window.localStorage.setItem(PREFIX + name, next) } catch { /* stockage indisponible */ }
    setValue(next)
  }, [name, allowed])

  return [value, choose]
}
