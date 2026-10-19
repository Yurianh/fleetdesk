import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { MessageSquare, Bug, Lightbulb, Sparkles, Send, Loader2, CheckCircle2 } from '@/lib/icons'

// Réglages › Nous écrire : signaler un bug, demander une fonctionnalité ou
// proposer une amélioration. Le message part par la fonction `app-feedback`,
// qui le transmet à l'équipe par email avec le compte et l'écran d'origine.

const TYPES = [
  { id: 'bug',         icon: Bug,       label: 'Signaler un bug',          hint: 'Quelque chose ne marche pas comme prévu.' },
  { id: 'feature',     icon: Sparkles,  label: 'Nouvelle fonctionnalité',  hint: 'Une chose que FleetDesk ne fait pas encore.' },
  { id: 'improvement', icon: Lightbulb, label: 'Amélioration',             hint: 'Une chose existante qui pourrait mieux faire.' },
]

const PLACEHOLDER = {
  bug: 'Ce que vous faisiez, ce qui s\'est passé, ce que vous attendiez.\n\nEx. : en enregistrant un plein sur AB-123-CD, la photo du ticket ne s\'ajoute pas.',
  feature: 'Ce dont vous auriez besoin, et pourquoi.\n\nEx. : suivre les amendes reçues par véhicule et par conducteur.',
  improvement: 'Ce qui vous gêne aujourd\'hui, et ce qui vous aiderait.\n\nEx. : pouvoir filtrer les alertes par site.',
}

const MAX = 4000

export default function SectionFeedback() {
  const [type, setType] = useState('bug')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const tooShort = message.trim().length < 10

  async function submit(e) {
    e.preventDefault()
    if (tooShort || sending) return
    setSending(true)
    try {
      if (import.meta.env.VITE_DEMO_MODE !== 'true') {
        const { error } = await supabase.functions.invoke('app-feedback', {
          body: {
            type,
            message: message.trim(),
            context: {
              page: window.location.pathname,
              design: document.documentElement.dataset.design || 'planche',
              userAgent: navigator.userAgent,
              screen: `${window.innerWidth}×${window.innerHeight}`,
            },
          },
        })
        if (error) throw error
      }
      setSent(true)
      setMessage('')
    } catch {
      toast.error('Le message n\'est pas parti. Réessayez, ou écrivez-nous à contact@fleetdesk.fr.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-zinc-900 mb-1">Merci, c'est bien reçu.</h2>
        <p className="text-sm text-zinc-600 mb-5">
          L'équipe lit chaque message. Si nous avons besoin de précisions, nous vous répondons par email.
        </p>
        <button type="button" onClick={() => setSent(false)} className="text-sm font-semibold text-[#0052D6] hover:underline">
          Écrire un autre message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 mb-1 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#0066FF]" /> Nous écrire
        </h2>
        <p className="text-xs text-zinc-500">
          Un bug, une fonctionnalité qui vous manque, une idée d'amélioration : dites-le-nous, c'est ce qui décide de
          la suite de FleetDesk.
        </p>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-zinc-700 mb-2">Type de message</legend>
        <div className="grid sm:grid-cols-3 gap-2">
          {TYPES.map(({ id, icon: Icon, label, hint }) => {
            const on = type === id
            return (
              <label key={id}
                className={`flex flex-col gap-1 cursor-pointer rounded-lg border px-3 py-2.5 transition-colors ${
                  on ? 'border-[#0052D6] bg-[#F5F8FF]' : 'border-zinc-200 hover:border-zinc-300'
                }`}>
                <input type="radio" name="feedback-type" value={id} checked={on} onChange={() => setType(id)} className="sr-only" />
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  <Icon className={`w-4 h-4 ${on ? 'text-[#0052D6]' : 'text-zinc-500'}`} /> {label}
                </span>
                <span className="text-xs text-zinc-500">{hint}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="feedback-message" className="block text-xs font-medium text-zinc-700 mb-1.5">Votre message</label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, MAX))}
          rows={7}
          placeholder={PLACEHOLDER[type]}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30 resize-y"
        />
        <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
          <span>L'écran d'où vous écrivez et votre navigateur sont joints, pour nous aider à reproduire un bug.</span>
          <span className="tabular-nums flex-shrink-0 ml-3">{message.length} / {MAX}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={tooShort || sending}
          className="inline-flex items-center gap-2 bg-[#0052D6] hover:bg-[#003A99] disabled:bg-zinc-200 disabled:text-zinc-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer
        </button>
      </div>
    </form>
  )
}
