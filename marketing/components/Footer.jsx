import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  const nav = [
    {
      title: t('marketing.footer.product'),
      links: [
        { label: t('marketing.nav.features'), to: '/features' },
        { label: t('marketing.nav.pricing'),  to: '/pricing' },
      ],
    },
    {
      title: t('marketing.footer.company'),
      links: [
        { label: t('marketing.nav.contact'), to: '/contact' },
      ],
    },
    {
      title: t('marketing.footer.account'),
      links: [
        { label: t('marketing.footer.signIn'),    to: '/login' },
        { label: t('marketing.footer.getStarted'), to: '/login' },
      ],
    },
  ]

  return (
    <footer className="border-t border-zinc-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <Truck className="w-[15px] h-[15px] text-white" />
              </div>
              <span className="text-[15px] font-semibold text-zinc-900 tracking-tight">FleetDesk</span>
            </Link>
            <p className="text-sm leading-relaxed text-zinc-400">
              {t('marketing.footer.tagline')}
            </p>
          </div>

          {/* Nav columns */}
          {nav.map(col => (
            <div key={col.title}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 mb-4">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} FleetDesk. {t('marketing.footer.rights')}
          </p>
          <p className="text-xs text-zinc-400">
            {t('marketing.footer.builtFor')}
          </p>
        </div>
      </div>
    </footer>
  )
}
