import { useEffect, useMemo, useRef, useState } from 'react'

// Diagnostic de flotte : cinq questions, puis un résultat qui dit ce qui expose
// le visiteur aujourd'hui et ce que FleetDesk change dans son cas précis.
// Tout ce qui est promis ici existe dans l'application (alertes 30 jours avant,
// e-mail hebdomadaire, alerte entretien 5 000 km avant, documents conducteurs,
// saisie chauffeur sur Enterprise). Les chiffres viennent des guides du site.
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
    id: 'km', title: 'Qui relève le kilométrage des véhicules ?',
    options: [
      { v: 'moi', label: 'Moi, quand je peux' },
      { v: 'sms', label: 'Les chauffeurs, par SMS ou en photo' },
      { v: 'personne', label: 'Personne, ou presque' },
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
    logiciel: ['Beaucoup d’outils suivent les véhicules mais oublient les conducteurs : permis, visite médicale, FCO, carte conducteur.', 'FleetDesk suit véhicules et conducteurs au même endroit, avec leurs échéances et leurs justificatifs.'],
    rien: ['Sans suivi, une échéance se découvre au contrôle routier : 135 € d’amende pour un contrôle technique expiré, et un véhicule qui peut être immobilisé.', 'FleetDesk vous montre tout ce qui tombe dans les 30 prochains jours, trié par urgence, dès la première saisie.'],
  },
  km: {
    moi: ['Des relevés faits quand vous y pensez, ce sont des entretiens calculés sur de vieux chiffres.', 'Un relevé se saisit en un geste, et l’entretien se recalcule au kilométrage réel. Avec Enterprise, vos chauffeurs saisissent eux-mêmes depuis leur téléphone.'],
    sms: ['Des compteurs en photo dans vos messages, c’est autant de chiffres à recopier, et à perdre.', 'Avec Enterprise, chaque chauffeur a un accès limité à son véhicule : il saisit kilométrage et plein, ticket en photo, et vous n’avez plus rien à recopier.'],
    personne: ['Sans kilométrage à jour, impossible d’anticiper une vidange ou une révision.', 'FleetDesk vous alerte 5 000 km avant chaque entretien, ou à la date, selon ce qui arrive en premier.'],
  },
  incidents: {
    expire: ['Un contrôle technique ou un document expiré, c’est un véhicule ou un conducteur hors la loi sans le savoir.', 'L’alerte arrive 30 jours avant, et un clic dessus vous mène directement au bon document pour le mettre à jour.'],
    panne: ['Une panne évitable, c’est une tournée perdue et une réparation qui coûte bien plus que l’entretien reporté.', 'L’entretien est prévu en kilomètres ou en mois, au premier des deux, et vous êtes prévenu avant la casse.'],
    amende: ['Une amende ou une immobilisation coûte rarement le seul montant affiché : il faut ajouter la journée perdue.', 'Le centre de conformité vous montre ce qui doit être réglé cette semaine, pour ne plus le découvrir au bord de la route.'],
  },
}
const SECTEURS = {
  transport: ['Transport routier', 'Visite technique annuelle des poids lourds, FCO et carte conducteur : les échéances s’accumulent vite.', '/secteurs/transport-routier'],
  btp: ['BTP et artisans', 'Des utilitaires qui changent de chantier et de conducteur : FleetDesk trace qui roule avec quoi.', '/secteurs/btp'],
  vtc: ['VTC et taxi', 'Contrôle technique annuel et cartes professionnelles : deux échéances de plus par véhicule et par chauffeur.', '/secteurs/vtc-taxi'],
  societe: ['Véhicules de société', 'Des véhicules confiés à des collaborateurs dont ce n’est pas le métier : FleetDesk fait le suivi à leur place.', '/secteurs/vehicules-de-societe'],
}
const PLANS = {
  starter: { name: 'Starter', price: '9', annual: '5,60', why: 'jusqu’à 5 véhicules et 3 conducteurs' },
  pro: { name: 'Pro', price: '29', annual: '18,40', why: 'jusqu’à 25 véhicules, conducteurs illimités' },
  enterprise: { name: 'Enterprise', price: '79', annual: '50,40', why: 'véhicules illimités, et vos chauffeurs saisissent eux-mêmes' },
}

function analyse(a) {
  const incidents = (a.incidents || []).filter(x => x !== 'aucun')
  let score = { memoire: 3, excel: 2, logiciel: 0, rien: 4 }[a.suivi] ?? 0
  score += { moi: 1, sms: 1, personne: 2 }[a.km] ?? 0
  score += incidents.length * 2
  score += a.taille && a.taille !== 's' ? 1 : 0
  const level = score >= 6 ? 'eleve' : score >= 3 ? 'modere' : 'faible'
  const items = []
  if (a.suivi && INSIGHTS.suivi[a.suivi]) items.push(INSIGHTS.suivi[a.suivi])
  for (const i of incidents) items.push(INSIGHTS.incidents[i])
  if (a.km && INSIGHTS.km[a.km]) items.push(INSIGHTS.km[a.km])
  let plan = { s: 'starter', m: 'pro', l: 'enterprise', xl: 'enterprise' }[a.taille] || 'pro'
  if (a.km === 'sms' && plan !== 'enterprise') plan = 'enterprise'
  return { level, items, plan, secteur: SECTEURS[a.secteur] }
}

const LEVELS = {
  eleve: { label: 'Exposition élevée', tone: 'bg-amber-50 text-amber-800 border-amber-200', text: 'Aujourd’hui, une échéance ratée est une question de temps. La bonne nouvelle : c’est exactement ce qu’un suivi automatique règle.' },
  modere: { label: 'Exposition modérée', tone: 'bg-amber-50/60 text-amber-800 border-amber-100', text: 'Votre suivi tient, mais il repose sur vous. Le jour où vous êtes absent, plus rien ne prévient.' },
  faible: { label: 'Exposition faible', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'Votre flotte est bien tenue. FleetDesk vous ferait surtout gagner le temps que ce suivi vous coûte.' },
}

const Check = () => (
  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#0066FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
)

export default function Diagnostic({ variant = 'full' }) {
  const teaser = variant === 'teaser'
  const questions = teaser ? QUESTIONS.slice(0, 2) : QUESTIONS
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const resultRef = useRef(null)

  // Réponses venues de l'encart de l'accueil : on reprend là où le visiteur en était.
  useEffect(() => {
    if (teaser) return
    const p = new URLSearchParams(window.location.search)
    const pre = {}
    for (const q of QUESTIONS) { const v = p.get(q.id); if (v && q.options.some(o => o.v === v)) pre[q.id] = v }
    if (Object.keys(pre).length) {
      setAnswers(pre)
      setStep(QUESTIONS.findIndex(q => !(q.id in pre)))
    }
  }, [teaser])

  const done = step >= questions.length || step === -1
  const q = questions[step]
  const result = useMemo(() => (done && !teaser ? analyse(answers) : null), [done, teaser, answers])
  // Le résultat arrive sous la barre de navigation flottante : on le cadre en haut, marge comprise.
  useEffect(() => {
    if (!result) return
    resultRef.current?.focus({ preventScroll: true })
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [result])

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
    setStep(step + 1)
  }

  if (result) {
    const lvl = LEVELS[result.level], plan = PLANS[result.plan]
    return (
      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="outline-none scroll-mt-28">
        <p className={`inline-flex items-center gap-2 text-sm font-semibold border rounded-full px-3.5 py-1.5 ${lvl.tone}`}>{lvl.label}</p>
        <p className="mt-4 text-lg text-zinc-700 leading-relaxed max-w-2xl">{lvl.text}</p>

        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-900 mt-10 mb-5">Ce qui change pour vous</h2>
        <div className="space-y-3">
          {result.items.map(([risk, gain], i) => (
            <div key={i} className="grid md:grid-cols-2 gap-px rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-200">
              <div className="bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1.5">Aujourd’hui</p>
                <p className="text-zinc-700 leading-relaxed">{risk}</p>
              </div>
              <div className="bg-[#F5F8FF] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0052D6] mb-1.5">Avec FleetDesk</p>
                <p className="text-zinc-800 leading-relaxed flex gap-2"><Check />{gain}</p>
              </div>
            </div>
          ))}
        </div>

        {result.secteur && (
          <p className="mt-6 text-zinc-600 leading-relaxed">
            <span className="font-semibold text-zinc-800">{result.secteur[0]} :</span> {result.secteur[1]}{' '}
            <a href={result.secteur[2]} className="text-[#0066FF] font-medium hover:underline">Voir ce que FleetDesk suit pour vous →</a>
          </p>
        )}

        <div className="mt-10 rounded-2xl border-2 border-[#0066FF] bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold text-[#0066FF]">La formule qui vous correspond</p>
          <p className="font-display text-3xl font-semibold text-zinc-900 mt-1">{plan.name}</p>
          <p className="text-zinc-600 mt-1">{plan.why[0].toUpperCase() + plan.why.slice(1)}. {plan.price} € par mois, ou {plan.annual} € par mois en annuel.</p>
          <ul className="mt-5 grid sm:grid-cols-2 gap-2 text-sm text-zinc-700">
            {['7 jours d’essai, sans carte bancaire', 'Prévenu par e-mail 48 h avant la fin', 'Rien n’est prélevé sans votre accord', 'Mensuel sans engagement, arrêt sans frais'].map(t => (
              <li key={t} className="flex gap-2"><Check />{t}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href={`${APP_URL}/login?plan=${result.plan}`} className="inline-flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0052D6] text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-colors">
              Essayer {plan.name} 7 jours gratuitement
            </a>
            <a href="/pricing" className="inline-flex items-center justify-center text-sm font-medium text-zinc-600 hover:text-zinc-900 px-5 py-3.5">Comparer les formules</a>
          </div>
        </div>

        <button type="button" onClick={() => { setAnswers({}); setStep(0) }} className="mt-6 text-sm text-zinc-500 hover:text-zinc-800 underline underline-offset-2">Refaire le diagnostic</button>
      </div>
    )
  }

  if (!q) return null
  const selected = answers[q.id]
  return (
    <div>
      {/* Progression */}
      <div className="flex items-center gap-3 mb-6" aria-hidden="true">
        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div className="h-full bg-[#0066FF] rounded-full transition-all duration-500" style={{ width: `${(step / (teaser ? QUESTIONS.length : questions.length)) * 100}%` }} />
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
            onClick={() => setStep(step + 1)}
            className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052D6] disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Voir mon diagnostic
          </button>
        )}
      </div>
    </div>
  )
}
