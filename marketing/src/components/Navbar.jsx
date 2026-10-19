import { useState, useEffect } from 'react'
import { Wordmark } from './Logo.jsx'

const LINKS = [
  { label: 'Fonctionnalités', href: '/features'   },
  { label: 'Secteurs',        href: '/secteurs'   },
  { label: 'Conformité',      href: '/conformite' },
  { label: 'Tarifs',          href: '/pricing'    },
  { label: 'Guides',          href: '/guides'     },
]

const APP_URL = 'https://app.fleetdesk.fr'

function isLoggedIn() {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('fd_auth=1'))
}

// L'étincelle du survol : quatre branches, dessinée une fois pour les quatre
// boutons d'appel à l'action.
function Spark() {
  return (
    <svg className="spark" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M12 1.6l1.8 6a2.6 2.6 0 0 0 1.6 1.6l6 1.8-6 1.8a2.6 2.6 0 0 0-1.6 1.6l-1.8 6-1.8-6a2.6 2.6 0 0 0-1.6-1.6l-6-1.8 6-1.8a2.6 2.6 0 0 0 1.6-1.6l1.8-6Z"/>
    </svg>
  )
}

export default function Navbar({ currentPath = '/' }) {
  const [open,     setOpen]     = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  // En haut de page la barre se pose sans ombre : rien ne la sépare encore du
  // contenu. Dès qu'on défile, elle se détache franchement.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    // L'enveloppe reste collante et transparente : elle réserve la place, la
    // barre flotte à l'intérieur et le fond de page passe tout autour.
    <header className="enter-soft sticky top-0 z-50 px-3 sm:px-5 pt-3 sm:pt-4 pb-2">
      <div className={`max-w-6xl mx-auto rounded-2xl border bg-white/80 backdrop-blur-xl
        px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between transition-[box-shadow,border-color] duration-300 ${
        scrolled
          ? 'border-zinc-200/90 shadow-[0_8px_30px_rgba(15,23,42,0.08)]'
          : 'border-zinc-200/60 shadow-[0_1px_2px_rgba(15,23,42,0.03)]'
      }`}>

        {/* Logo */}
        <a href="/" aria-label="FleetDesk, accueil" className="flex items-center flex-shrink-0">
          <Wordmark className="text-[24px]" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(l => (
            <a key={l.href} href={l.href}
              className={`px-3.5 py-2 text-sm rounded-lg transition-colors ${
                currentPath.startsWith(l.href)
                  ? 'text-[#0066FF] bg-[#E5EEFF] font-medium'
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
                className="cta-brand text-sm text-white font-medium px-4 py-2 rounded-xl">
                Accéder au dashboard →<Spark />
              </a>
            </>
          ) : (
            <>
              <a href={`${APP_URL}/login`}
                className="text-sm text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Se connecter
              </a>
              <a href={"/pricing"}
                className="cta-brand text-sm text-white font-medium px-4 py-2 rounded-xl">
                Essayer gratuitement<Spark />
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

      {/* Mobile menu — un second bloc flottant, sous la barre */}
      {open && (
        <div className="md:hidden max-w-6xl mx-auto mt-2 rounded-2xl border border-zinc-200/80 bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] px-3 py-3 space-y-1">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={`block px-3 py-2 text-sm rounded-lg ${
                currentPath.startsWith(l.href)
                  ? 'text-[#0066FF] bg-[#E5EEFF] font-medium'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}>
              {l.label}
            </a>
          ))}
          <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
            {loggedIn ? (
              <>
                <a href={APP_URL} onClick={() => setOpen(false)}
                  className="cta-brand block text-center text-sm text-white font-medium px-4 py-2.5 rounded-xl">
                  Accéder au dashboard →<Spark />
                </a>
              </>
            ) : (
              <>
                <a href={`${APP_URL}/login`} onClick={() => setOpen(false)}
                  className="block text-center text-sm text-zinc-600 font-medium py-2 hover:text-zinc-900">
                  Se connecter
                </a>
                <a href={"/pricing"} onClick={() => setOpen(false)}
                  className="cta-brand block text-center text-sm text-white font-medium px-4 py-2.5 rounded-xl">
                  Essayer gratuitement<Spark />
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
