import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/lib/AuthContext'
import { useOnboarding } from '@/lib/OnboardingContext'
import { supabase } from '@/lib/supabase'
import { useDesignSetting } from '@/lib/design'
import { releaseToShow, markReleaseSeen } from '@/lib/releases'
import { Check, ArrowRight } from '@/lib/icons'

// Écran « Nouveautés » : une fois par utilisateur et par mise à jour majeure
// (src/lib/releases.js), à la première connexion qui suit. Il attend que
// l'application soit chargée pour ne pas passer sous l'écran de chargement,
// et laisse passer la visite guidée : il s'ouvre après elle, jamais par-dessus.
export default function WhatsNewDialog({ ready }) {
  const { user } = useAuth()
  const { design, setDesign } = useDesignSetting(user)
  const [release, setRelease] = useState(null)

  const { tourOpen, sectionTour } = useOnboarding()

  useEffect(() => {
    if (!ready || release || tourOpen || sectionTour) return
    // Petit délai : la visite démarre juste après le chargement ; si elle
    // s'ouvre entre-temps, ce minuteur est annulé et l'écran attend sa fin.
    const t = setTimeout(() => {
      const r = releaseToShow(user)
      if (r) setRelease(r)
    }, 700)
    return () => clearTimeout(t)
  }, [ready, user, release, tourOpen, sectionTour])

  const close = () => {
    if (!release) return
    markReleaseSeen(release.id)
    if (import.meta.env.VITE_DEMO_MODE !== 'true') {
      supabase.auth.updateUser({ data: { seen_release: release.id } }).catch(() => { /* gardé localement */ })
    }
    setRelease(null)
  }

  if (!release) return null

  return (
    <Dialog open onOpenChange={o => { if (!o) close() }}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg p-0 gap-0 overflow-hidden rounded-none border-[#0052D6]">
        <div className="h-32 bg-[#0052D6] border-b border-[#0052D6] bg-no-repeat"
          style={{ backgroundImage: 'url(/engraving-street.svg)', backgroundSize: '900px auto', backgroundPosition: '-200px bottom' }}
          aria-hidden="true" />
        <div className="p-6 sm:p-7">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0052D6] mb-2">NOUVEAUTÉS</p>
          <DialogTitle className="text-2xl font-bold tracking-tight text-[#0B1B3F]">{release.title}</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-[#34446A]">{release.intro}</DialogDescription>
          <ul className="mt-5 space-y-2.5 border-t-2 border-[#0052D6] pt-4">
            {release.items.map(item => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-[#0B1B3F]">
                <Check className="w-4 h-4 text-[#0052D6] flex-shrink-0 mt-0.5" />{item}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            {release.designSwitch && (
              design === 'planche'
                ? <button type="button" onClick={() => setDesign('classic')} className="text-sm font-medium text-[#34446A] hover:text-[#0B1B3F] underline underline-offset-4">Garder l'ancien design</button>
                : <button type="button" onClick={() => setDesign('planche')} className="text-sm font-medium text-[#34446A] hover:text-[#0B1B3F] underline underline-offset-4">Essayer le nouveau design</button>
            )}
            <div className="flex items-center gap-3 sm:ml-auto">
              <Link to="/Settings?section=feedback" onClick={close} className="text-sm font-semibold text-[#0052D6] hover:underline">Nous écrire</Link>
              <button type="button" onClick={close}
                className="inline-flex items-center justify-center gap-2 bg-[#0052D6] hover:bg-[#003A99] text-white text-sm font-semibold px-5 py-2.5 transition-colors">
                Découvrir <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
