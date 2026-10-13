import { useEffect, useMemo, useRef, useState } from 'react'

// Résultat du diagnostic raconté au défilement : une scène collante (sticky)
// qui reste à l'écran pendant que le visiteur fait défiler, et des « diapos »
// qui se succèdent avec leur chorégraphie d'arrivée. Score, échéances de
// l'année, chaque point de vigilance en deux temps (aujourd'hui, puis avec
// FleetDesk), temps récupéré, puis un résumé qui mène à la formule conseillée.
//
// Les animations d'arrivée sont des keyframes CSS (global.css, .story-*) qui se
// rejouent quand une diapo redevient active. Le défilement ne fait que choisir
// la diapo active et la phase d'un point de vigilance.

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MAX_ITEMS = 9
// Hauteur de défilement d'une diapo, en vh. Un point de vigilance a deux
// temps : il lui faut plus de course.
const STEP_VH = 85
const WEIGHT = { item: 1.3 }

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useCount(target, on, duration = 1300) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!on) { setV(0); return }
    if (reduced()) { setV(target); return }
    let raf, t0
    const tick = t => {
      t0 ??= t
      const k = Math.min(1, (t - t0) / duration)
      setV(Math.round(target * (1 - Math.pow(1 - k, 4))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, on, duration])
  return v
}

const d = ms => ({ '--d': `${ms}ms` })

function Ring({ score, color, on }) {
  const v = useCount(score, on, 1600)
  const r = 44, c = 2 * Math.PI * r
  return (
    <div className="relative w-52 h-52 sm:w-60 sm:h-60 land" style={d(150)}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#F4F4F5" strokeWidth="6" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-7xl sm:text-8xl font-semibold text-zinc-900 tabular-nums leading-none">{v}</span>
        <span className="text-sm text-zinc-500 mt-1">sur 100</span>
      </div>
    </div>
  )
}

function ScoreSlide({ result, lvl, on }) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm font-semibold tracking-wide uppercase text-zinc-500 land" style={d(0)}>Votre score de maîtrise</p>
      <div className="mt-6"><Ring score={result.score} color={lvl.ring} on={on} /></div>
      <p className={`mt-6 inline-flex items-center text-sm font-semibold border rounded-full px-4 py-1.5 pop ${lvl.tone}`} style={d(1300)}>{lvl.label}</p>
      <p className="mt-5 text-xl sm:text-2xl text-zinc-700 leading-relaxed max-w-2xl land" style={d(1500)}>{lvl.text}</p>
    </div>
  )
}

function DeadlinesSlide({ s, on }) {
  const v = useCount(s.echeances, on)
  const perMonth = Math.max(1, Math.round(s.echeances / 12))
  const dots = Math.min(perMonth, 9)
  return (
    <div className="text-center">
      <p className="text-sm font-semibold tracking-wide uppercase text-zinc-500 land" style={d(0)}>Ce que votre flotte doit tenir chaque année</p>
      <p className="mt-4 font-display font-semibold text-zinc-900 tabular-nums leading-none text-7xl sm:text-9xl land" style={d(120)}>≈ {v}</p>
      <p className="mt-2 text-2xl sm:text-3xl font-display text-zinc-800 land" style={d(220)}>échéances</p>
      <div className="mt-9 mx-auto max-w-xl grid grid-cols-12 gap-1.5 sm:gap-2.5 items-end" aria-hidden="true">
        {MONTHS.map((m, col) => (
          <div key={col} className="flex flex-col-reverse items-center gap-1 sm:gap-1.5">
            <span className="text-[10px] sm:text-xs text-zinc-400 mt-1">{m}</span>
            {Array.from({ length: dots }, (_, row) => (
              <span key={row} className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full pop ${row === dots - 1 && col % 4 === 1 ? 'bg-amber-400' : 'bg-[#0066FF]/80'}`} style={d(500 + col * 70 + row * 45)} />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-8 text-lg sm:text-xl text-zinc-700 leading-relaxed max-w-2xl mx-auto land" style={d(1500)}>
        Soit environ <strong className="text-zinc-900">{perMonth} par mois</strong>. Une seule oubliée peut suffire : 135 € d’amende pour un contrôle technique expiré, et un véhicule qui peut être immobilisé.
      </p>
      <p className="mt-3 text-sm text-zinc-500 land" style={d(1700)}>
        Contrôles techniques{s.ctAnnuel ? ' annuels' : ''}, assurances, entretiens, et documents d’environ {s.drivers} conducteur{s.drivers > 1 ? 's' : ''}.
      </p>
    </div>
  )
}

function ItemSlide({ item: [risk, gain], n, total }) {
  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-sm font-semibold tracking-wide uppercase text-zinc-500 land" style={d(0)}>Point de vigilance {n + 1} / {total}</p>
      <div className="story-risk mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 land" style={d(120)}>Aujourd’hui</p>
        <p className="mt-3 font-display text-3xl sm:text-[2.6rem] leading-[1.15] font-semibold text-zinc-900 land" style={d(200)}>{risk}</p>
      </div>
      <div className="story-gain mt-8 rounded-3xl bg-white border border-[#0066FF]/25 shadow-2xl shadow-[#0066FF]/10 p-6 sm:p-8 flex gap-4 sm:gap-5">
        <span className="story-check w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0066FF] text-white flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0052D6]">Avec FleetDesk</p>
          <p className="mt-2 text-lg sm:text-xl text-zinc-800 leading-relaxed">{gain}</p>
        </div>
      </div>
    </div>
  )
}

function TimeSlide({ s, on }) {
  const v = useCount(s.heures, on)
  const after = Math.max(0, s.heuresNow - s.heures)
  return (
    <div className="max-w-2xl mx-auto text-center">
      <p className="text-sm font-semibold tracking-wide uppercase text-zinc-500 land" style={d(0)}>Le temps que vous récupérez</p>
      <p className="mt-4 font-display font-semibold text-zinc-900 tabular-nums leading-none text-7xl sm:text-9xl land" style={d(120)}>≈ {v} h</p>
      <p className="mt-2 text-2xl sm:text-3xl font-display text-zinc-800 land" style={d(220)}>rendues chaque mois</p>
      <div className="mt-10 space-y-4 text-left">
        <div className="land" style={d(450)}>
          <div className="flex justify-between text-sm"><span className="font-medium text-zinc-600">Aujourd’hui</span><span className="tabular-nums text-zinc-500">≈ {s.heuresNow} h / mois</span></div>
          <div className="mt-1.5 h-3.5 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full rounded-full bg-zinc-400" style={{ width: '100%' }} /></div>
        </div>
        <div className="land" style={d(600)}>
          <div className="flex justify-between text-sm"><span className="font-semibold text-[#0052D6]">Avec FleetDesk</span><span className="tabular-nums text-[#0052D6]">≈ {after} h / mois</span></div>
          <div className="mt-1.5 h-3.5 rounded-full bg-zinc-100 overflow-hidden">
            <div className="story-bar h-full rounded-full bg-[#0066FF]" style={{ width: on ? `${Math.max(4, (after / s.heuresNow) * 100)}%` : '100%' }} />
          </div>
        </div>
      </div>
      <p className="mt-8 text-base sm:text-lg text-zinc-600 leading-relaxed land" style={d(1400)}>
        Environ {s.sharePct} % du temps que vous y passez : relances, recopie de relevés, recherche de documents.
      </p>
    </div>
  )
}

function SummarySlide({ s, plan }) {
  const lines = [
    `≈ ${s.echeances} échéances suivies, et rappelées 30 jours avant`,
    `≈ ${s.heures} h rendues chaque mois`,
    s.vigilance ? `${s.vigilance} point${s.vigilance > 1 ? 's' : ''} de vigilance couvert${s.vigilance > 1 ? 's' : ''}` : 'Un e-mail chaque semaine avec ce qui arrive',
  ]
  return (
    <div className="max-w-2xl mx-auto">
      <p className="font-display text-4xl sm:text-6xl font-semibold text-zinc-900 leading-[1.05] land" style={d(0)}>Avec FleetDesk, votre flotte :</p>
      <ul className="mt-9 space-y-4">
        {lines.map((t, i) => (
          <li key={t} className="flex items-center gap-4 text-xl sm:text-2xl text-zinc-800 land" style={d(350 + i * 260)}>
            <span className="w-9 h-9 rounded-full bg-[#0066FF] text-white flex items-center justify-center flex-shrink-0 pop" style={d(450 + i * 260)}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            {t}
          </li>
        ))}
      </ul>
      <a href="#diag-plan" className="mt-10 inline-flex items-center gap-2 text-lg font-semibold text-[#0066FF] land" style={d(1300)}>
        Votre formule : {plan.name} <span className="story-hint inline-block">↓</span>
      </a>
    </div>
  )
}

export default function DiagnosticStory({ result, lvl, plan }) {
  const s = result.stats
  const trackRef = useRef(null)
  const slides = useMemo(() => {
    const items = result.items.slice(0, MAX_ITEMS)
    return [
      { key: 'score', tone: result.level === 'faible' ? 'cool' : 'warm' },
      { key: 'deadlines', tone: 'warm' },
      ...items.map((item, n) => ({ key: `item${n}`, type: 'item', item, n, total: items.length })),
      { key: 'time', tone: 'cool' },
      { key: 'summary', tone: 'cool' },
    ]
  }, [result])
  const weights = slides.map(sl => WEIGHT[sl.type] || 1)
  const total = weights.reduce((a, b) => a + b, 0)

  const [state, setState] = useState({ idx: 0, phase2: false })
  useEffect(() => {
    let raf = 0
    const read = () => {
      raf = 0
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const run = rect.height - window.innerHeight
      const p = Math.min(0.9999, Math.max(0, -rect.top / run)) * total
      let acc = 0, idx = 0
      for (; idx < weights.length - 1 && p >= acc + weights[idx]; idx++) acc += weights[idx]
      const local = (p - acc) / weights[idx]
      const phase2 = slides[idx].type === 'item' && local > 0.4
      setState(prev => (prev.idx === idx && prev.phase2 === phase2 ? prev : { idx, phase2 }))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read) }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [slides, total])

  const active = slides[state.idx]
  const tone = active.type === 'item' ? (state.phase2 ? 'cool' : 'warm') : active.tone

  // Cliquer sur un repère du rail fait défiler jusqu'à la diapo correspondante.
  const goTo = i => {
    const el = trackRef.current
    if (!el) return
    const run = el.offsetHeight - window.innerHeight
    const before = weights.slice(0, i).reduce((a, b) => a + b, 0)
    const top = el.getBoundingClientRect().top + window.scrollY + (run * (before + 0.05)) / total
    window.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' })
  }

  return (
    <div ref={trackRef} className="relative left-1/2 w-screen -ml-[50vw]" style={{ height: `calc(${total * STEP_VH}vh + 100svh)` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Fond : chaud pour ce qui expose, froid (bleu) pour ce que FleetDesk change. */}
        <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-1000 bg-[radial-gradient(ellipse_at_50%_35%,#FEF3C7_0%,#FFFBEB_35%,#FFFFFF_75%)] ${tone === 'warm' ? 'opacity-100' : 'opacity-0'}`} />
        <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-1000 bg-[radial-gradient(ellipse_at_50%_35%,#DBEAFE_0%,#EFF6FF_35%,#FFFFFF_75%)] ${tone === 'cool' ? 'opacity-100' : 'opacity-0'}`} />

        {slides.map((sl, i) => {
          const on = i === state.idx
          const cls = `story-slide ${on ? 'is-active' : i < state.idx ? 'is-past' : ''} ${on && state.phase2 ? 'is-phase2' : ''}`
          return (
            <section key={sl.key} className={cls} aria-hidden={!on}>
              <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 pt-24 pb-16">
                {sl.key === 'score' && <ScoreSlide result={result} lvl={lvl} on={on} />}
                {sl.key === 'deadlines' && <DeadlinesSlide s={s} on={on} />}
                {sl.type === 'item' && <ItemSlide item={sl.item} n={sl.n} total={sl.total} />}
                {sl.key === 'time' && <TimeSlide s={s} on={on} />}
                {sl.key === 'summary' && <SummarySlide s={s} plan={plan} />}
              </div>
            </section>
          )
        })}

        {/* Rail de progression */}
        <nav aria-label="Étapes du résultat" className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-2.5">
          {slides.map((sl, i) => (
            <button key={sl.key} type="button" onClick={() => goTo(i)} aria-label={`Aller à l’étape ${i + 1}`} aria-current={i === state.idx ? 'step' : undefined}
              className={`w-2 rounded-full transition-all duration-500 ${i === state.idx ? 'h-7 bg-[#0066FF]' : i < state.idx ? 'h-2 bg-[#0066FF]/40' : 'h-2 bg-zinc-300'}`} />
          ))}
        </nav>
        <div aria-hidden="true" className="sm:hidden absolute top-[84px] left-5 right-5 h-1 rounded-full bg-zinc-200/70 overflow-hidden">
          <div className="h-full bg-[#0066FF] transition-all duration-500" style={{ width: `${((state.idx + 1) / slides.length) * 100}%` }} />
        </div>

        <div className="absolute bottom-5 inset-x-0 flex items-center justify-between px-5 sm:px-8 text-xs text-zinc-400">
          <span>Ordres de grandeur calculés à partir de vos réponses, pas un audit.</span>
          <a href="#diag-plan" className="hidden sm:inline text-zinc-500 hover:text-zinc-800">Passer à ma formule ↓</a>
        </div>
        <p aria-hidden="true" className={`absolute bottom-14 inset-x-0 text-center text-sm text-zinc-500 transition-opacity duration-500 ${state.idx === 0 ? 'opacity-100' : 'opacity-0'}`}>
          Faites défiler <span className="story-hint inline-block">↓</span>
        </p>
      </div>
    </div>
  )
}
