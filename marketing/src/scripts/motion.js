// Chorégraphie d'arrivée du site.
//
// Chaque section se pose quand elle entre dans le champ : le bloc de titre
// d'abord, puis ses cartes une à une. Le script se contente de marquer les
// éléments (.will-enter) et de poser .is-in ; toute l'animation vit dans
// global.css. L'état caché est conditionné à html.js-motion, ajouté en tête de
// page : sans JavaScript, la page reste entièrement lisible.

const STAGGER = 90        // décalage entre deux cartes d'une même rangée
const HEAD_GAP = 140      // respiration entre le titre de section et ses cartes
const MAX_DELAY = 560     // au-delà, l'attente devient pénible

function isGrid(el) {
  const c = el.className
  return typeof c === 'string' && /\b(grid|divide-y)\b/.test(c)
}

// Les éléments à animer dans une section : le contenu du conteneur central,
// en descendant d'un niveau dans les grilles pour obtenir un vrai stagger.
function targetsOf(section) {
  const wrapper = section.firstElementChild
  const top = wrapper && wrapper.children.length ? [...wrapper.children] : [...section.children]
  const out = []
  for (const el of top) {
    const kids = [...el.children]
    if (isGrid(el) && kids.length >= 2 && kids.length <= 14) out.push(...kids)
    else out.push(el)
  }
  return out
}

function choreograph() {
  const sections = document.querySelectorAll('section, footer')
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('is-in')
      io.unobserve(entry.target)
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' })

  for (const section of sections) {
    // La maquette produit a sa propre chorégraphie, en CSS pur.
    if (section.querySelector('.reveal-frame')) continue

    const targets = targetsOf(section)
    if (!targets.length) continue

    let rank = 0
    for (const el of targets) {
      if (el.classList.contains('will-enter')) continue
      el.classList.add('will-enter')
      const delay = Math.min(rank === 0 ? 0 : HEAD_GAP + (rank - 1) * STAGGER, MAX_DELAY)
      el.style.animationDelay = `${delay}ms`
      io.observe(el)
      rank++
    }
  }
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && typeof IntersectionObserver !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', choreograph, { once: true })
  } else {
    choreograph()
  }
} else {
  document.documentElement.classList.remove('js-motion')
}


// ── Accordéon des questions fréquentes ──────────────────────────────────────
// `<details>` ouvre d'un coup : la réponse apparaît sèchement et la page saute.
// On garde l'élément natif — sans JS, tout fonctionne — et on intercepte le clic
// pour animer la hauteur, puis faire apparaître la réponse de gauche à droite.
//
// Le masque n'existe que pendant l'animation : si quoi que ce soit échoue, le
// texte reste lisible plutôt que masqué.

const FAQ_OPEN_MS = 420
const FAQ_CLOSE_MS = 300
const FAQ_REVEAL_MS = 900

function smoothAccordion(details) {
  const summary = details.querySelector('summary')
  if (!summary) return

  // Le contenu qui suit le résumé est regroupé : on ne peut animer la hauteur
  // que d'un conteneur, pas d'une suite de nœuds.
  const body = document.createElement('div')
  body.className = 'faq-body'
  while (summary.nextSibling) body.appendChild(summary.nextSibling)
  details.appendChild(body)

  let animation = null

  const expand = () => {
    details.open = true
    const target = body.scrollHeight
    animation?.cancel()
    animation = body.animate(
      [{ height: '0px', opacity: 0 }, { height: `${target}px`, opacity: 1 }],
      { duration: FAQ_OPEN_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    )
    body.classList.add('is-revealing')
    setTimeout(() => body.classList.remove('is-revealing'), FAQ_REVEAL_MS)
  }

  const collapse = () => {
    const current = body.scrollHeight
    animation?.cancel()
    animation = body.animate(
      [{ height: `${current}px`, opacity: 1 }, { height: '0px', opacity: 0 }],
      { duration: FAQ_CLOSE_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    )
    // L'attribut ne tombe qu'à la fin, sinon le contenu disparaîtrait d'un coup.
    animation.onfinish = () => { details.open = false }
  }

  summary.addEventListener('click', event => {
    event.preventDefault()
    details.open ? collapse() : expand()
  })
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const start = () => document.querySelectorAll('details').forEach(smoothAccordion)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true })
  } else {
    start()
  }
}
