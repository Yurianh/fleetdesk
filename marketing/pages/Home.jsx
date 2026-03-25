import { Link } from 'react-router-dom'
import { Truck, Users, Wrench, BarChart3, ArrowRight } from 'lucide-react'
import HeroSection from '@marketing/components/HeroSection'
import FeatureCard from '@marketing/components/FeatureCard'
import CTASection from '@marketing/components/CTASection'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()

  const stats = [
    { value: t('marketing.home.stat1Value'), label: t('marketing.home.stat1Label') },
    { value: t('marketing.home.stat2Value'), label: t('marketing.home.stat2Label') },
    { value: t('marketing.home.stat3Value'), label: t('marketing.home.stat3Label') },
  ]

  const highlights = [
    { icon: Truck,    color: 'brand',   title: t('marketing.home.feature1Title'), description: t('marketing.home.feature1Desc') },
    { icon: Users,    color: 'violet',  title: t('marketing.home.feature2Title'), description: t('marketing.home.feature2Desc') },
    { icon: Wrench,   color: 'amber',   title: t('marketing.home.feature3Title'), description: t('marketing.home.feature3Desc') },
    { icon: BarChart3,color: 'emerald', title: t('marketing.home.feature4Title'), description: t('marketing.home.feature4Desc') },
  ]

  return (
    <>
      <HeroSection />

      {/* Stats */}
      <section className="border-y border-zinc-100 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
            {stats.map(s => (
              <div key={s.label} className="py-6 sm:py-0 sm:px-10 first:pl-0 last:pr-0">
                <p className="text-3xl font-bold text-zinc-900 tracking-tight mb-1">{s.value}</p>
                <p className="text-sm text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-14 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
              {t('marketing.home.highlightsTitle')}
            </h2>
            <p className="text-lg text-zinc-500">{t('marketing.home.highlightsSub')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map(h => (
              <FeatureCard key={h.title} icon={h.icon} color={h.color} title={h.title} description={h.description} />
            ))}
          </div>

          <div className="mt-10">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
            >
              {t('marketing.home.viewAllFeatures')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  )
}
