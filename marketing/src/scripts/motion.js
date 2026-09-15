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


// ── Titres composés lettre par lettre ───────────────────────────────────────
// Les titres de section s'écrivent de gauche à droite quand ils entrent dans le
// champ : chaque lettre apparaît en fondu, avec un flou qui se dissipe. Le
// découpage se fait ici plutôt que dans le HTML — aucune page à modifier, et
// le texte reste intact dans la source pour les moteurs.
//
// Découpage par mots, puis par lettres : un mot reste insécable, donc le retour
// à la ligne se comporte normalement. Le titre garde son texte complet en
// `aria-label` et les lettres sont masquées aux lecteurs d'écran, qui liraient
// sinon l'énoncé caractère par caractère.

const CHAR_STEP = 16        // ms entre deux lettres
const CHAR_CAP = 900        // au-delà, le titre traîne
const MAX_CHARS = 90        // un paragraphe n'est pas un titre

function splitHeading(el) {
  const text = el.textContent.trim()
  if (!text || text.length > MAX_CHARS) return false
  // Un seul nœud texte : on ne casse pas un titre qui contient déjà du balisage.
  if (el.childNodes.length !== 1 || el.childNodes[0].nodeType !== Node.TEXT_NODE) return false

  el.setAttribute('aria-label', text)
  el.textContent = ''
  el.classList.add('type-in')

  let index = 0
  for (const word of text.split(' ')) {
    const wordEl = document.createElement('span')
    wordEl.className = 'type-in-word'
    wordEl.setAttribute('aria-hidden', 'true')
    for (const char of word) {
      const charEl = document.createElement('span')
      charEl.textContent = char
      charEl.style.setProperty('--d', `${Math.min(index * CHAR_STEP, CHAR_CAP)}ms`)
      wordEl.appendChild(charEl)
      index++
    }
    el.appendChild(wordEl)
    el.appendChild(document.createTextNode(' '))
    index++
  }
  return true
}

function typeHeadings() {
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('typed')
      io.unobserve(entry.target)
    }
  }, { threshold: 0.4, rootMargin: '0px 0px -5% 0px' })

  for (const heading of document.querySelectorAll('h1, h2')) {
    if (splitHeading(heading)) io.observe(heading)
  }
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && typeof IntersectionObserver !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', typeHeadings, { once: true })
  } else {
    typeHeadings()
  }
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
