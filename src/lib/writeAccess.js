// Copie de l'état d'accès pour la couche de données.
//
// useFleetData n'est pas un composant React : il ne peut pas lire le contexte
// d'authentification. AuthContext tient cette valeur à jour à chaque
// changement d'utilisateur, et chaque écriture la consulte avant de partir.
// Module à part pour ne pas créer de dépendance circulaire entre AuthContext
// et capabilities.
let writable = true

export function setWritable(value) { writable = !!value }
export function isWritable() { return writable }

export const READ_ONLY_MESSAGE =
  'Votre compte est en lecture seule : choisissez une formule pour modifier vos données.'
