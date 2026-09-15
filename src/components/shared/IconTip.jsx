import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// Infobulle des boutons-icônes.
//
// L'attribut `title` du navigateur met une seconde à apparaître, s'affiche dans
// une boîte système qui recouvre les icônes voisines, et ne se laisse ni styler
// ni animer. Ici : apparition quasi immédiate, au-dessus du bouton, avec un
// fondu et une légère montée. Le survol d'une icône voisine enchaîne sans
// nouveau délai (skipDelayDuration côté AppLayout).
//
// L'infobulle ne remplace jamais un libellé accessible : `aria-label` reste sur
// le bouton, pour les lecteurs d'écran et la navigation au clavier.
export default function IconTip({ label, side = 'top', children }) {
  if (!label) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={8}
        className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-lg shadow-zinc-900/20 duration-150"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
