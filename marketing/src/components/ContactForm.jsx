import { useState } from 'react'

export default function ContactForm() {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('https://cigxngzdnhqrbhshrpgj.supabase.co/functions/v1/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          message: form.message,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        throw new Error(data.message)
      }
    } catch (err) {
      alert('Erreur lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0066FF]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-[#0066FF]">C'est envoyé</span>
        </div>
        <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-3">On revient vers vous très vite.</h3>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
          Un accusé de réception vient de partir vers{' '}
          <span className="font-medium text-zinc-900">{form.email}</span>. Notre équipe vous répond sous 24h ouvrées.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nom complet</label>
          <input required value={form.name} onChange={set('name')} placeholder="Votre nom"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30 placeholder:text-zinc-300" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Adresse email</label>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.com"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30 placeholder:text-zinc-300" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Entreprise (optionnel)</label>
        <input value={form.company} onChange={set('company')} placeholder="Votre entreprise"
          className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30 placeholder:text-zinc-300" />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Message</label>
        <textarea required rows={5} value={form.message} onChange={set('message')} placeholder="Comment pouvons-nous vous aider ?"
          className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30 placeholder:text-zinc-300 resize-none" />
      </div>
      <button type="submit" disabled={sending}
        className="w-full bg-[#0066FF] hover:bg-[#0052D6] disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-lg transition-colors">
        {sending ? 'Envoi…' : 'Envoyer le message'}
      </button>
    </form>
  )
}
