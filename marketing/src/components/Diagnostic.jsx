import { useEffect, useMemo, useRef, useState } from 'react'
import DiagnosticStory from './DiagnosticStory.jsx'

// Diagnostic de flotte : dix questions, une analyse qui reprend les réponses
// une à une, puis un résultat raconté au défilement (DiagnosticStory) : score de
// maîtrise, ordres de grandeur (échéances par an, temps récupérable), ce que
// FleetDesk change dans ce cas précis, et la formule conseillée.
// Tout ce qui est promis ici existe dans l'application (alertes 30 jours avant,
// e-mail hebdomadaire, alerte entretien 5 000 km avant, documents véhicules et
// conducteurs, affectations, saisie chauffeur sur Enterprise). Les estimations
// sont des ordres de grandeur, présentés comme tels, avec leur mode de calcul.
//
// Deux usages : la page /diagnostic (variant="full"), et un encart sur l'accueil
// (variant="teaser") qui pose les deux premières questions puis ouvre la page
// complète avec les réponses déjà remplies.

const APP_URL = 'https://app.fleetdesk.fr'

export const QUESTIONS = [
  {
    id: 'taille', title: 'Combien de véhicules compte votre flotte ?',
    options: [
      { v: 's', label: '1 à 5' },
      { v: 'm', label: '6 à 25' },
      { v: 'l', label: '26 à 50' },
      { v: 'xl', label: 'Plus de 50' },
    ],
  },
  {
    id: 'suivi', title: 'Comment suivez-vous les échéances : contrôles techniques, assurances, permis ?',
    options: [
      { v: 'memoire', label: 'De mémoire, ou dans un agenda' },
      { v: 'excel', label: 'Dans un tableur Excel' },
      { v: 'logiciel', label: 'Avec un logiciel' },
      { v: 'rien', label: 'On ne les suit pas vraiment' },
    ],
  },
  {
    id: 'secteur', title: 'Quelle est votre activité ?',
    options: [
      { v: 'transport', label: 'Transport de marchandises' },
      { v: 'btp', label: 'BTP ou artisanat' },
      { v: 'vtc', label: 'VTC ou taxi' },
      { v: 'societe', label: 'Véhicules de société, services' },
      { v: 'autre', label: 'Autre' },
    ],
  },
  {
    id: 'vehicules', title: 'Quels véhicules composent votre flotte ?', multi: true, hint: 'Plusieurs réponses possibles.',
    options: [
      { v: 'vl', label: 'Voitures' },
      { v: 'vu', label: 'Utilitaires légers' },
      { v: 'pl', label: 'Poids lourds' },
      { v: 'autre', label: 'Autres : deux-roues, engins…' },
    ],
  },
  {
    id: 'partage', title: 'Vos véhicules changent-ils de conducteur ?',
    options: [
      { v: 'fixe', label: 'Non, chacun a son véhicule' },
      { v: 'parfois', label: 'Parfois, selon les besoins' },
      { v: 'souvent', label: 'Souvent : véhicules partagés ou en pool' },
    ],
  },
  {
    id: 'conducteurs', title: 'Suivez-vous les documents de vos conducteurs : permis, visite médicale, formations ?',
    options: [
      { v: 'oui', label: 'Oui, avec leurs dates d’échéance' },
      { v: 'parfois', label: 'À l’embauche, rarement ensuite' },
      { v: 'non', label: 'Non' },
    ],
  },
  {
    id: 'km', title: 'Qui relève le kilométrage des véhicules ?',
    options: [
      { v: 'moi', label: 'Moi, quand je peux' },
      { v: 'sms', label: 'Les chauffeurs, par SMS ou en photo' },
      { v: 'personne', label: 'Personne, ou presque' },
    ],
  },
  {
    id: 'entretien', title: 'Comment savez-vous qu’un véhicule doit passer à l’entretien ?',
    options: [
      { v: 'plan', label: 'On suit un plan, au kilométrage ou à la date' },
      { v: 'garage', label: 'Le garage nous rappelle' },
      { v: 'voyant', label: 'Quand le voyant s’allume' },
      { v: 'inconnu', label: 'On ne sait pas vraiment' },
    ],
  },
  {
    id: 'temps', title: 'Combien de temps passez-vous chaque semaine sur la gestion de vos véhicules ?',
    hint: 'Relances, recopie de relevés, recherche de documents, rendez-vous…',
    options: [
      { v: 'lt1', label: 'Moins d’une heure' },
      { v: 'h1', label: '1 à 3 heures' },
      { v: 'h3', label: '3 à 6 heures' },
      { v: 'h6', label: 'Plus de 6 heures' },
    ],
  },
  {
    id: 'incidents', title: 'Ces 12 derniers mois, avez-vous eu…', multi: true, hint: 'Plusieurs réponses possibles.',
    options: [
      { v: 'expire', label: 'Un contrôle technique ou un document découvert expiré' },
      { v: 'panne', label: 'Une panne qu’un entretien aurait évitée' },
      { v: 'amende', label: 'Une amende ou un véhicule immobilisé' },
      { v: 'aucun', label: 'Rien de tout ça', exclusive: true },
    ],
  },
]

// Ce qui expose le visiteur, et ce que FleetDesk change, réponse par réponse.
const INSIGHTS = {
  suivi: {
    memoire: ['Une échéance gardée en tête est oubliée le jour où vous êtes en congé ou débordé.', 'Chaque échéance est calculée et vous êtes alerté 30 jours avant. Un e-mail récapitule chaque semaine ce qui arrive, même si vous n’ouvrez pas l’application.'],
    excel: ['Un tableur ne prévient personne : il faut l’ouvrir le bon jour, et lire la bonne ligne.', 'Vos colonnes se reprennent en quelques minutes. Ensuite, les alertes partent seules, 30 jours avant, et chaque document est rangé avec son véhicule ou son conducteur.'],
    logiciel: ['Beaucoup d’outils suivent les véhicules mais oublient les conducteurs : permis, visite médicale, formations.', 'FleetDesk suit véhicules et conducteurs au même endroit, avec leurs échéances et leurs justificatifs.'],
    rien: ['Sans suivi, une échéance se découvre au contrôle routier : 135 € d’amende pour un contrôle technique expiré, et un véhicule qui peut être immobilisé.', 'FleetDesk vous montre tout ce qui tombe dans les 30 prochains jours, trié par urgence, dès la première saisie.'],
  },
  incidents: {
    expire: ['Un contrôle technique ou un document expiré, c’est un véhicule ou un conducteur hors la loi sans le savoir.', 'L’alerte arrive 30 jours avant, et un clic dessus vous mène directement au bon document pour le mettre à jour.'],
    panne: ['Une panne évitable, c’est une tournée perdue et une réparation qui coûte bien plus que l’entretien reporté.', 'L’entretien est prévu en kilomètres ou en mois, au premier des deux, et vous êtes prévenu avant la casse.'],
    amende: ['Une amende ou une immobilisation coûte rarement le seul montant affiché : il faut ajouter la journée perdue.', 'Le centre de conformité vous montre ce qui doit être réglé cette semaine, pour ne plus le découvrir au bord de la route.'],
  },
  conducteurs: {
    parfois: ['Un permis ou une aptitude vérifiés à l’embauche ne disent rien de leur validité aujourd’hui.', 'Permis, aptitude à la conduite, visite médicale, formations : chaque document conducteur a sa date d’échéance et la même alerte 30 jours avant.'],
    non: ['Un conducteur au permis suspendu ou à la visite médicale expirée engage aussi l’entreprise qui lui confie le volant.', 'Permis, aptitude à la conduite, visite médicale, formations : chaque document conducteur a sa date d’échéance et la même alerte 30 jours avant.'],
  },
  entretien: {
    garage: ['Le garage vous rappelle quand il y pense, et seulement pour les véhicules qu’il entretient.', 'Le plan d’entretien est le vôtre, véhicule par véhicule : alerte 5 000 km avant, ou à la date, au premier des deux.'],
    voyant: ['Attendre le voyant, c’est souvent entretenir trop tard : la réparation coûte alors plus que la révision.', 'FleetDesk vous alerte 5 000 km avant chaque entretien, ou à la date, au premier des deux, et garde l’historique de chaque intervention.'],
    inconnu: ['Sans plan d’entretien, chaque véhicule s’use à son rythme et la panne décide pour vous.', 'FleetDesk vous alerte 5 000 km avant chaque entretien, ou à la date, au premier des deux, et garde l’historique de chaque intervention.'],
  },
  km: {
    moi: ['Des relevés faits quand vous y pensez, ce sont des entretiens calculés sur de vieux chiffres.', 'Un relevé se saisit en un geste, et l’entretien se recalcule au kilométrage réel. Avec Enterprise, vos chauffeurs saisissent eux-mêmes depuis leur téléphone.'],
    sms: ['Des compteurs en photo dans vos messages, c’est autant de chiffres à recopier, et à perdre.', 'Avec Enterprise, chaque chauffeur a un accès limité à son véhicule : il saisit kilométrage et plein, ticket en photo, et vous n’avez plus rien à recopier.'],
    personne: ['Sans kilométrage à jour, impossible d’anticiper une vidange ou une révision.', 'FleetDesk vous alerte 5 000 km avant chaque entretien, ou à la date, selon ce qui arrive en premier.'],
  },
  partage: {
    souvent: ['Quand un véhicule passe de main en main, retrouver qui le conduisait le jour d’une amende devient une enquête.', 'Chaque affectation est enregistrée avec ses dates : vous savez qui roulait avec quoi, à tout moment.'],
  },
  pl: ['Un poids lourd, c’est un contrôle technique chaque année, et des papiers de plus à tenir à jour.', 'Contrôles, entretiens, carte grise, assurance et licence de transport : tout est suivi au même endroit, poids lourds compris.'],
}
const SECTEURS = {
  transport: ['Transport routier', 'Visite technique annuelle des poids lourds, documents des conducteurs : les échéances s’accumulent vite.', '/secteurs/transport-routier'],
  btp: ['BTP et artisans', 'Des utilitaires qui changent de chantier et de conducteur : FleetDesk trace qui roule avec quoi.', '/secteurs/btp'],
  vtc: ['VTC et taxi', 'Contrôle technique annuel et cartes professionnelles : deux échéances de plus par véhicule et par chauffeur.', '/secteurs/vtc-taxi'],
  societe: ['Véhicules de société', 'Des véhicules confiés à des collaborateurs dont ce n’est pas le métier : FleetDesk fait le suivi à leur place.', '/secteurs/vehicules-de-societe'],
}
const PLANS = {
  starter: { name: 'Starter', price: '9', annual: '70', annualMonthly: '5,83', why: 'jusqu’à 5 véhicules et 3 conducteurs' },
  pro: { name: 'Pro', price: '29', annual: '220', annualMonthly: '18,33', why: 'jusqu’à 25 véhicules, conducteurs illimités' },
  enterprise: { name: 'Enterprise', price: '79', annual: '600', annualMonthly: '50', why: 'véhicules illimités, et vos chauffeurs saisissent eux-mêmes' },
}

// Ordres de grandeur utilisés par les estimations (affichés avec le résultat).
const FLEET = { s: { n: 4, label: '1 à 5' }, m: { n: 15, label: '6 à 25' }, l: { n: 38, label: '26 à 50' }, xl: { n: 70, label: 'plus de 50' } }
const HOURS = { lt1: 0.5, h1: 2, h3: 4.5, h6: 8 }
// Part du temps hebdomadaire qui part en relances, recopie et recherches, et
// qu'un suivi automatique fait disparaître. Prudente : jamais plus de la moitié.
const AUTOMATABLE = { memoire: 0.45, excel: 0.4, rien: 0.35, logiciel: 0.15 }
const SUIVI_LABEL = { memoire: 'de mémoire', excel: 'sur tableur', logiciel: 'par logiciel', rien: 'sans suivi' }

function analyse(a) {
  const incidents = (a.incidents || []).filter(x => x !== 'aucun')
  const vehicules = a.vehicules || []

  // Score de maîtrise : 100, moins ce qui repose sur la mémoire ou le hasard.
  let score = 100
  score -= { memoire: 25, excel: 15, logiciel: 0, rien: 35 }[a.suivi] ?? 0
  score -= { moi: 8, sms: 8, personne: 15 }[a.km] ?? 0
  score -= { oui: 0, parfois: 10, non: 18 }[a.conducteurs] ?? 0
  score -= { plan: 0, garage: 8, voyant: 15, inconnu: 15 }[a.entretien] ?? 0
  score -= { fixe: 0, parfois: 2, souvent: 5 }[a.partage] ?? 0
  score -= incidents.length * 8
  score = Math.max(8, Math.min(100, score))
  const level = score < 50 ? 'eleve' : score < 75 ? 'modere' : 'faible'

  // Échéances par an : assurance, entretien (≈ 1,5), contrôle technique (tous
  // les 2 ans pour une voiture, chaque année pour un poids lourd ou un VTC), plus
  // les documents conducteurs (≈ 0,5 par conducteur et par an).
  const fleet = FLEET[a.taille] || FLEET.m
  const ctAnnuel = vehicules.includes('pl') || a.secteur === 'vtc'
  const drivers = Math.round(fleet.n * (a.partage === 'souvent' ? 1.5 : a.partage === 'parfois' ? 1.2 : 1))
  const echeances = Math.round(fleet.n * (2.5 + (ctAnnuel ? 1 : 0.5)) + drivers * 0.5)

  // Temps récupérable par mois.
  let share = AUTOMATABLE[a.suivi] ?? 0.3
  if (a.km === 'sms' || a.km === 'moi') share += 0.05
  const heures = Math.max(1, Math.round((HOURS[a.temps] ?? 2) * 4.33 * share))
  const heuresAn = Math.max(6, Math.round((HOURS[a.temps] ?? 2) * 4.33 * share * 12))

  const items = []
  if (a.suivi && INSIGHTS.suivi[a.suivi]) items.push(INSIGHTS.suivi[a.suivi])
  for (const i of incidents) items.push(INSIGHTS.incidents[i])
  if (INSIGHTS.conducteurs[a.conducteurs]) items.push(INSIGHTS.conducteurs[a.conducteurs])
  if (INSIGHTS.entretien[a.entretien]) items.push(INSIGHTS.entretien[a.entretien])
  if (a.km && INSIGHTS.km[a.km]) items.push(INSIGHTS.km[a.km])
  if (INSIGHTS.partage[a.partage]) items.push(INSIGHTS.partage[a.partage])
  if (vehicules.includes('pl')) items.push(INSIGHTS.pl)

  let plan = { s: 'starter', m: 'pro', l: 'enterprise', xl: 'enterprise' }[a.taille] || 'pro'
  if (a.km === 'sms' && plan !== 'enterprise') plan = 'enterprise'
  // Starter s'arrête à 3 conducteurs : une petite flotte partagée passe en Pro.
  if (plan === 'starter' && a.partage === 'souvent') plan = 'pro'

  return {
    score, level, items, plan, secteur: SECTEURS[a.secteur],
    stats: { echeances, heures, heuresAn, heuresNow: Math.max(1, Math.round((HOURS[a.temps] ?? 2) * 4.33)), drivers, fleet, ctAnnuel, sharePct: Math.round(share * 100), vigilance: items.length },
  }
}

// Étapes de l'analyse, écrites à partir des réponses : le visiteur voit ses
// propres réponses repasser, une par une.
function analysisSteps(a) {
  const fleet = FLEET[a.taille] || FLEET.m
  const pl = (a.vehicules || []).includes('pl')
  const incidents = (a.incidents || []).filter(x => x !== 'aucun').length
  return [
    `Lecture de votre flotte : ${fleet.label} véhicules${pl ? ', poids lourds compris' : ''}`,
    `Calcul des échéances : contrôles techniques${pl || a.secteur === 'vtc' ? ' annuels' : ''}, assurances, entretiens`,
    a.conducteurs === 'oui' ? 'Prise en compte des documents conducteurs déjà suivis' : 'Ajout des documents conducteurs : permis, visite médicale, formations',
    `Évaluation de votre suivi actuel, ${SUIVI_LABEL[a.suivi] || 'tel que décrit'}`,
    incidents > 1 ? `Analyse des ${incidents} incidents de l’année` : incidents ? 'Analyse de l’incident de l’année' : 'Vérification des points de vigilance',
    'Estimation du temps que vous pouvez récupérer',
    'Choix de la formule adaptée à votre flotte',
  ]
}

const LEVELS = {
  eleve: { label: 'Exposition élevée', tone: 'bg-amber-50 text-amber-800 border-amber-200', ring: '#F59E0B', text: 'Aujourd’hui, une échéance ratée est une question de temps. La bonne nouvelle : c’est exactement ce qu’un suivi automatique règle.' },
  modere: { label: 'Exposition modérée', tone: 'bg-amber-50/60 text-amber-800 border-amber-100', ring: '#FBBF24', text: 'Votre suivi tient, mais il repose sur vous. Le jour où vous êtes absent, plus rien ne prévient.' },
  faible: { label: 'Exposition faible', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200', ring: '#10B981', text: 'Votre flotte est bien tenue. FleetDesk vous ferait surtout gagner le temps que ce suivi vous coûte.' },
}

const Check = ({ className = 'w-4 h-4 mt-0.5 text-[#0066FF]' }) => (
  <svg className={`flex-shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
)

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function Analysis({ steps, onDone }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    // Durées irrégulières : une analyse qui avance d'un pas mécanique sonne faux.
    const pace = reducedMotion() ? 0.35 : 1
    const durations = [700, 1100, 900, 1000, 800, 1200, 700]
    let i = 0, t
    const next = () => {
      i += 1
      setCurrent(i)
      if (i >= steps.length) { t = setTimeout(onDone, 450 * pace); return }
      t = setTimeout(next, (durations[i] || 900) * pace)
    }
    t = setTimeout(next, durations[0] * pace)
    return () => clearTimeout(t)
  }, [steps, onDone])

  const pct = Math.round((current / steps.length) * 100)
  return (
    <div role="status" aria-live="polite" className="py-2">
      <p className="font-display text-2xl sm:text-[1.7rem] font-semibold text-zinc-900">Analyse de vos réponses…</p>
      <div className="flex items-center gap-3 mt-5 mb-7">
        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div className="h-full bg-[#0066FF] rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-medium text-zinc-500 tabular-nums w-9 text-right">{pct} %</span>
      </div>
      <ul className="space-y-3">
        {steps.map((s, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'todo'
          return (
            <li key={s} className={`flex items-start gap-3 text-[15px] transition-colors duration-300 ${state === 'todo' ? 'text-zinc-300' : state === 'active' ? 'text-zinc-900 font-medium' : 'text-zinc-600'}`}>
              <span className="w-5 h-5 mt-0.5 flex items-center justify-center flex-shrink-0">
                {state === 'done' && <Check className="w-4 h-4 text-emerald-500" />}
                {state === 'active' && <span className="w-4 h-4 rounded-full border-2 border-[#0066FF] border-t-transparent animate-spin" />}
                {state === 'todo' && <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
              </span>
              {s}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function Diagnostic({ variant = 'full' }) {
  const teaser = variant === 'teaser'
  const questions = teaser ? QUESTIONS.slice(0, 2) : QUESTIONS
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const [analysed, setAnalysed] = useState(false)
  const topRef = useRef(null)

  // Réponses venues de l'encart de l'accueil : on reprend là où le visiteur en était.
  useEffect(() => {
    if (teaser) return
    const p = new URLSearchParams(window.location.search)
    const pre = {}
    for (const q of QUESTIONS) { const v = p.get(q.id); if (!q.multi && v && q.options.some(o => o.v === v)) pre[q.id] = v }
    if (Object.keys(pre).length) {
      setAnswers(pre)
      setStep(QUESTIONS.findIndex(q => !(q.id in pre)))
    }
  }, [teaser])

  const done = step >= questions.length || step === -1
  const q = questions[step]
  const result = useMemo(() => (done && !teaser ? analyse(answers) : null), [done, teaser, answers])
  const steps = useMemo(() => (result ? analysisSteps(answers) : []), [result, answers])
  const finish = useMemo(() => () => setAnalysed(true), [])

  // L'analyse puis le résultat arrivent sous la barre de navigation flottante :
  // on les cadre en haut, marge comprise.
  useEffect(() => {
    if (!result) return
    topRef.current?.focus({ preventScroll: true })
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [result, analysed])

  const advance = () => setStep(step + 1)
  const choose = (q, v) => {
    if (q.multi) {
      const opt = q.options.find(o => o.v === v)
      const cur = answers[q.id] || []
      const next = opt.exclusive ? [v] : cur.includes(v) ? cur.filter(x => x !== v) : [...cur.filter(x => !q.options.find(o => o.v === x)?.exclusive), v]
      setAnswers({ ...answers, [q.id]: next })
      return
    }
    const next = { ...answers, [q.id]: v }
    setAnswers(next)
    if (teaser && step === questions.length - 1) {
      const p = new URLSearchParams(next)
      window.location.href = `/diagnostic?${p.toString()}`
      return
    }
    advance()
  }
  const restart = () => { setAnswers({}); setAnalysed(false); setStep(0) }

  if (result && !analysed) {
    return <div ref={topRef} tabIndex={-1} className="outline-none scroll-mt-28"><Analysis steps={steps} onDone={finish} /></div>
  }

  if (result) {
    const lvl = LEVELS[result.level], plan = PLANS[result.plan]
    return (
      <div ref={topRef} tabIndex={-1} aria-live="polite" className="outline-none">
        <DiagnosticStory result={result} lvl={lvl} plan={plan} />

        {result.secteur && (
          <p className="mt-6 text-zinc-600 leading-relaxed">
            <span className="font-semibold text-zinc-800">{result.secteur[0]} :</span> {result.secteur[1]}{' '}
            <a href={result.secteur[2]} className="text-[#0066FF] font-medium hover:underline">Voir ce que FleetDesk suit pour vous →</a>
          </p>
        )}

        <div id="diag-plan" className="mt-10 scroll-mt-28 rounded-2xl border-2 border-[#0066FF] bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold text-[#0066FF]">La formule qui vous correspond</p>
          <p className="font-display text-3xl font-semibold text-zinc-900 mt-1">{plan.name}</p>
          <p className="text-zinc-600 mt-1">{plan.why[0].toUpperCase() + plan.why.slice(1)}. {plan.annualMonthly} € par mois en annuel (facturé {plan.annual} € par an), ou {plan.price} € par mois sans engagement.</p>
          <ul className="mt-5 grid sm:grid-cols-2 gap-2 text-sm text-zinc-700">
            {['7 jours d’essai, sans carte bancaire', 'Prévenu par e-mail 48 h avant la fin', 'Rien n’est prélevé sans votre accord', 'Mensuel sans engagement, arrêt sans frais'].map(t => (
              <li key={t} className="flex gap-2"><Check />{t}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href={`${APP_URL}/login?plan=${result.plan}&billing=annual`} className="inline-flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0052D6] text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-colors">
              Essayer {plan.name} 7 jours gratuitement
            </a>
            <a href="/pricing" className="inline-flex items-center justify-center text-sm font-medium text-zinc-600 hover:text-zinc-900 px-5 py-3.5">Comparer les formules</a>
          </div>
        </div>

        <button type="button" onClick={restart} className="mt-6 text-sm text-zinc-500 hover:text-zinc-800 underline underline-offset-2">Refaire le diagnostic</button>
      </div>
    )
  }

  if (!q) return null
  const selected = answers[q.id]
  const last = step === questions.length - 1
  return (
    <div>
      {/* Progression */}
      <div className="flex items-center gap-3 mb-6" aria-hidden="true">
        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div className="h-full bg-[#0066FF] rounded-full transition-all duration-500" style={{ width: `${(step / QUESTIONS.length) * 100}%` }} />
        </div>
        <span className="text-xs font-medium text-zinc-500 tabular-nums">{step + 1} / {QUESTIONS.length}</span>
      </div>

      <fieldset key={q.id}>
        <legend className="font-display text-2xl sm:text-[1.7rem] font-semibold text-zinc-900 leading-snug mb-2">{q.title}</legend>
        {q.hint && <p className="text-sm text-zinc-500 mb-4">{q.hint}</p>}
        <div className={`grid gap-2.5 mt-4 ${q.options.length > 4 ? 'sm:grid-cols-2' : ''}`}>
          {q.options.map(o => {
            const on = q.multi ? (selected || []).includes(o.v) : selected === o.v
            return (
              <button
                key={o.v}
                type="button"
                aria-pressed={on}
                onClick={() => choose(q, o.v)}
                className={`text-left rounded-xl border px-4 py-3.5 text-[15px] font-medium transition-colors ${on ? 'border-[#0066FF] bg-[#F5F8FF] text-[#0052D6]' : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50'}`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex items-center justify-between mt-6">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="text-sm text-zinc-500 hover:text-zinc-800">← Retour</button>
        ) : <span />}
        {q.multi && (
          <button
            type="button"
            disabled={!(selected || []).length}
            onClick={advance}
            className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052D6] disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {last ? 'Lancer l’analyse' : 'Continuer'}
          </button>
        )}
      </div>
    </div>
  )
}
