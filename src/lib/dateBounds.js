// Bornes de saisie des dates.
//
// Un champ `type="date"` accepte les années jusqu'à 275760 : « 22026 » tapé à
// la place de « 2026 » passe sans rien dire, et l'application affiche ensuite
// une échéance à vingt mille ans. C'est donc à nous de refuser ce qui n'a pas
// de sens pour une flotte.

export const DATE_FLOOR = '1990-01-01'   // avant, aucun véhicule ne nous concerne
export const BIRTH_FLOOR = '1920-01-01'  // date de naissance d'un conducteur

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// Une date passée : entretien réalisé, contrôle passé, lavage, mise en
// circulation. Rien de tout cela ne se produit demain.
export const pastBounds = () => ({ min: DATE_FLOOR, max: todayISO() })

export const birthBounds = () => ({ min: BIRTH_FLOOR, max: todayISO() })

// Une échéance regarde devant : permis, assurance, formation. Trente ans
// couvrent le plus long des documents d'une flotte, et arrêtent le millésime
// à cinq chiffres.
export function expiryBounds(yearsAhead = 30) {
  const d = new Date()
  d.setFullYear(d.getFullYear() + yearsAhead)
  return { min: DATE_FLOOR, max: d.toISOString().slice(0, 10) }
}

// Une date hors bornes est le signe d'une faute de frappe, pas d'un cas
// limite : on préfère la signaler que calculer sur elle.
export function isPlausibleDate(value, { min = DATE_FLOOR, max = todayISO() } = {}) {
  if (!value) return true
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return false
  return d >= new Date(min) && d <= new Date(max)
}
