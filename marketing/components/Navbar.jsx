import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Truck, Menu, X, LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/AuthContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const { user } = useAuth()

  const links = [
    { label: t('marketing.nav.features'), to: '/features' },
    { label: t('marketing.nav.pricing'),  to: '/pricing' },
    { label: t('marketing.nav.contact'),  to: '/contact' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
            <Truck className="w-[15px] h-[15px] text-white" />
          </div>
          <span className="text-[15px] font-semibold text-zinc-900 tracking-tight">FleetDesk</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3.5 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'text-[#2563EB] bg-blue-50 font-medium'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              to="/Dashboard"
              className="flex items-center gap-2 text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              {t('marketing.nav.dashboard')}
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                {t('marketing.nav.signIn')}
              </Link>
              <Link
                to="/pricing#plans"
                className="text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {t('marketing.nav.getStarted')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 text-sm rounded-lg ${
                  isActive
                    ? 'text-[#2563EB] bg-blue-50 font-medium'
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
            {user ? (
              <Link
                to="/Dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('marketing.nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm text-zinc-600 font-medium py-2 hover:text-zinc-900"
                >
                  {t('marketing.nav.signIn')}
                </Link>
                <Link
                  to="/pricing#plans"
                  onClick={() => setOpen(false)}
                  className="block text-center text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  {t('marketing.nav.getStarted')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
