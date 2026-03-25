import { useState } from 'react'
import { Mail, MessageSquare, Clock } from 'lucide-react'
import CTASection from '@marketing/components/CTASection'
import { useTranslation } from 'react-i18next'

export default function Contact() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  const infoItems = [
    { icon: MessageSquare, title: t('marketing.contact.sales'),        desc: t('marketing.contact.salesDesc') },
    { icon: Mail,          title: t('marketing.contact.general'),      desc: t('marketing.contact.generalDesc') },
    { icon: Clock,         title: t('marketing.contact.responseTime'), desc: t('marketing.contact.responseTimeDesc') },
  ]

  return (
    <>
      {/* Header */}
      <section className="bg-white border-b border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold text-[#2563EB] tracking-wide mb-3">{t('marketing.contact.pageTitle')}</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-5">
            {t('marketing.contact.headline')}
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            {t('marketing.contact.sub')}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-6">{t('marketing.contact.howWeCanHelp')}</h2>
              <div className="space-y-5">
                {infoItems.map(item => (
                  <div key={item.title} className="flex gap-3">
                    <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">{t('marketing.contact.thankYou')}</h2>
                <p className="text-slate-500 text-sm">{t('marketing.contact.thankYouDesc')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('marketing.contact.name')}</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder={t('marketing.contact.namePlaceholder')}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('marketing.contact.email')}</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder={t('marketing.contact.emailPlaceholder')}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('marketing.contact.company')}</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder={t('marketing.contact.companyPlaceholder')}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('marketing.contact.message')}</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder={t('marketing.contact.messagePlaceholder')}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]/50 transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-sm px-6 py-3 rounded-xl transition-colors"
                >
                  {t('marketing.contact.send')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  )
}
