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
      <div class="text-center py-12">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Message envoyé</h3>
        <p className="text-sm text-zinc-500">Merci de nous avoir contactés. Nous vous répondons sous 24h ouvrées.</p>
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
