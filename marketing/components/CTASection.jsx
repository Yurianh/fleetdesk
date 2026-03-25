import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function CTASection() {
  const { t } = useTranslation()
  return (
    <section className="py-24 border-t border-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">

        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4" style={{ textWrap: 'balance' }}>
          {t('marketing.cta.headline')}
        </h2>
        <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10">
          {t('marketing.cta.sub')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
          >
            {t('marketing.cta.startFree')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/contact" className="text-sm font-medium text-zinc-400 hover:text-zinc-700 transition-colors">
            {t('marketing.cta.talkToSales')}
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-400">
          {t('marketing.cta.note')}
        </p>
      </div>
    </section>
  )
}
