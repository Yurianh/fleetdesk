import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import PricingCard from '@marketing/components/PricingCard'
import CTASection from '@marketing/components/CTASection'
import { useTranslation } from 'react-i18next'

export default function Pricing() {
  const { t } = useTranslation()
  const { hash } = useLocation()

  useEffect(() => {
    if (hash !== '#plans') return
    const target = document.getElementById('plans')
    if (!target) return

    const startY   = window.scrollY
    const endY     = target.getBoundingClientRect().top + window.scrollY - 24
    const distance = endY - startY
    const duration = 800
    let startTime  = null

    // easeInOutSine — continuous derivative, no sudden acceleration spikes
    const ease = t => -(Math.cos(Math.PI * t) - 1) / 2

    function frame(ts) {
      if (!startTime) startTime = ts
      const p = Math.min((ts - startTime) / duration, 1)
      window.scrollTo({ top: startY + distance * ease(p) })
      if (p < 1) requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
  }, [hash])

  const plans = [
    {
      plan: t('marketing.pricing.plans.starter.name'),
      price: t('marketing.pricing.plans.starter.price'),
      period: t('marketing.pricing.plans.starter.period'),
      description: t('marketing.pricing.plans.starter.desc'),
      features: [
        t('marketing.pricing.features.up5'),
        t('marketing.pricing.features.up3drivers'),
        t('marketing.pricing.features.profiles'),
        t('marketing.pricing.features.basicMileage'),
        t('marketing.pricing.features.maintenanceRecords'),
        t('marketing.pricing.features.emailSupport'),
      ],
      cta: t('marketing.pricing.plans.starter.cta'),
      highlighted: false,
      planId: 'starter',
    },
    {
      plan: t('marketing.pricing.plans.pro.name'),
      price: t('marketing.pricing.plans.pro.price'),
      period: t('marketing.pricing.plans.pro.period'),
      description: t('marketing.pricing.plans.pro.desc'),
      features: [
        t('marketing.pricing.features.up25'),
        t('marketing.pricing.features.unlimitedDrivers'),
        t('marketing.pricing.features.everythingStarter'),
        t('marketing.pricing.features.inspectionTracking'),
        t('marketing.pricing.features.washTracking'),
        t('marketing.pricing.features.forecasting'),
        t('marketing.pricing.features.analytics'),
        t('marketing.pricing.features.prioritySupport'),
      ],
      cta: t('marketing.pricing.plans.pro.cta'),
      highlighted: true,
      planId: 'pro',
    },
    {
      plan: t('marketing.pricing.plans.enterprise.name'),
      price: t('marketing.pricing.plans.enterprise.price'),
      period: t('marketing.pricing.plans.enterprise.period'),
      description: t('marketing.pricing.plans.enterprise.desc'),
      features: [
        t('marketing.pricing.features.unlimitedVehicles'),
        t('marketing.pricing.features.unlimitedDrivers'),
        t('marketing.pricing.features.everythingPro'),
        t('marketing.pricing.features.integrations'),
        t('marketing.pricing.features.onboarding'),
        t('marketing.pricing.features.sla'),
        t('marketing.pricing.features.invoiced'),
      ],
      cta: t('marketing.pricing.plans.enterprise.cta'),
      highlighted: false,
      planId: 'enterprise',
    },
  ]

  const faq = [
    { q: t('marketing.pricing.faq.q1'), a: t('marketing.pricing.faq.a1') },
    { q: t('marketing.pricing.faq.q2'), a: t('marketing.pricing.faq.a2') },
    { q: t('marketing.pricing.faq.q3'), a: t('marketing.pricing.faq.a3') },
    { q: t('marketing.pricing.faq.q4'), a: t('marketing.pricing.faq.a4') },
  ]

  return (
    <>
      {/* Header */}
      <section className="bg-white border-b border-slate-100 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold text-[#2563EB] tracking-wide mb-3">{t('marketing.pricing.pageTitle')}</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-5">
            {t('marketing.pricing.headline')}
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            {t('marketing.pricing.sub')}
          </p>
        </div>
      </section>

      {/* Cards */}
      <section id="plans" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map(p => <PricingCard key={p.plan} {...p} planId={p.planId} />)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-10 text-center">
            {t('marketing.pricing.faqTitle')}
          </h2>
          <div className="space-y-6">
            {faq.map(item => (
              <div key={item.q} className="border-b border-slate-100 pb-6">
                <p className="font-semibold text-slate-900 mb-2">{item.q}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  )
}
