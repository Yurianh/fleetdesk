import { useState, useEffect } from 'react'

const LINKS = [
  { label: 'Fonctionnalités', href: '/features' },
  { label: 'Tarifs',          href: '/pricing'  },
  { label: 'Contact',         href: '/contact'  },
]

const APP_URL = 'https://app.fleetdesk.fr'

function isLoggedIn() {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('fd_auth=1'))
}

export default function Navbar({ currentPath = '/' }) {
  const [open,       setOpen]       = useState(false)
  const [loggedIn,   setLoggedIn]   = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-zinc-900 tracking-tight">FleetDesk</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(l => (
            <a key={l.href} href={l.href}
              className={`px-3.5 py-2 text-sm rounded-lg transition-colors ${
                currentPath.startsWith(l.href)
                  ? 'text-[#2563EB] bg-blue-50 font-medium'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <>
              <a href={APP_URL}
                className="text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2 rounded-lg transition-colors">
                Accéder au dashboard →
              </a>
            </>
          ) : (
            <>
              <a href={`${APP_URL}/login`}
                className="text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Se connecter
              </a>
              <a href="/pricing#plans"
                className="text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2 rounded-lg transition-colors">
                Commencer
              </a>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-1">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`block px-3 py-2 text-sm rounded-lg ${
                currentPath.startsWith(l.href)
                  ? 'text-[#2563EB] bg-blue-50 font-medium'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}>
              {l.label}
            </a>
          ))}
          <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
            {loggedIn ? (
              <>
                <a href={APP_URL} onClick={() => setOpen(false)}
                  className="block text-center text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2.5 rounded-lg transition-colors">
                  Accéder au dashboard →
                </a>
              </>
            ) : (
              <>
                <a href={`${APP_URL}/login`} onClick={() => setOpen(false)}
                  className="block text-center text-sm text-zinc-600 font-medium py-2 hover:text-zinc-900">
                  Se connecter
                </a>
                <a href="/pricing#plans" onClick={() => setOpen(false)}
                  className="block text-center text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium px-4 py-2.5 rounded-lg transition-colors">
                  Commencer
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
