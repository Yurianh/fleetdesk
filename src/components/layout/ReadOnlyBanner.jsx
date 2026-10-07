import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAccess } from '@/lib/capabilities'

// Compte sans abonnement : les données restent consultables, rien ne peut être
// ajouté ni modifié. Le bandeau n'est pas masquable — c'est un état du compte,
// pas un rappel — et il dit tout de suite ce qui est préservé avant ce qui est
// bloqué : personne ne doit croire qu'il a perdu sa flotte.
export default function ReadOnlyBanner() {
  const { readOnly } = useAccess()
  if (!readOnly) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2.5">
      <div className="flex items-center gap-3 flex-wrap">
        <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
        <p className="text-sm text-amber-900 flex-1 min-w-0">
          <span className="font-semibold">Votre compte est en lecture seule.</span>{' '}
          Vos données sont conservées et restent consultables ; choisissez une formule pour les modifier.
        </p>
        <Link
          to="/Settings?section=plan"
          className="inline-flex items-center bg-[#0066FF] hover:bg-[#0052D6] text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
        >
          Choisir une formule
        </Link>
      </div>
    </div>
  )
}
