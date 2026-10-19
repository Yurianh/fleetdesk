// Nouveautés de l'application, de la plus récente à la plus ancienne.
//
// Règle : chaque mise à jour majeure (refonte, grande fonction, changement de
// façon de travailler) ajoute une entrée ici. À sa prochaine connexion, chaque
// utilisateur créé avant la date de l'entrée la voit une fois, dans
// WhatsNewDialog ; l'identifiant vu est gardé dans user_metadata.seen_release.
// Les mises à jour mineures n'ajoutent rien : l'écran doit rester rare.

export const RELEASES = [
  {
    id: '2026-10-planche',
    date: '2026-10-19',
    title: 'FleetDesk fait peau neuve',
    intro: 'Le tableau de bord et la navigation prennent le style de fleetdesk.fr. Rien ne change dans vos données ni dans les fonctions : tout est au même endroit.',
    items: [
      'Encre bleue sur papier, filets fins et pictos cerclés : une lecture plus calme, les alertes ressortent mieux.',
      'Utilisation des véhicules en barres pleines à l\'encre, activité récente en frise, carte de flotte illustrée.',
      'Vous préférez l\'ancienne interface ? Réglages › Affichage › Design classique, à tout moment.',
      'Nouveau : Réglages › Nous écrire, pour signaler un bug ou proposer une amélioration.',
    ],
    designSwitch: true,
  },
]

export const LATEST = RELEASES[0]

const LOCAL = 'fd-seen-release'

// L'entrée à montrer à cet utilisateur, ou null.
export function releaseToShow(user) {
  if (!user || !LATEST) return null
  const seen = user.user_metadata?.seen_release
  let seenHere = null
  try { seenHere = window.localStorage.getItem(LOCAL) } catch { /* stockage indisponible */ }
  if (seen === LATEST.id || seenHere === LATEST.id) return null
  // Un compte créé après la mise à jour n'a rien vu changer : rien à annoncer.
  if (user.created_at && new Date(user.created_at) >= new Date(LATEST.date)) return null
  return LATEST
}

export function markReleaseSeen(id) {
  try { window.localStorage.setItem(LOCAL, id) } catch { /* stockage indisponible */ }
}
