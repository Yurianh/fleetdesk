// Identité FleetDesk : le mot « Fleet » appuyé, « Desk » léger, et le symbole
// (un trait épais, un trait fin) qui reprend ce contraste de graisse.
export const BRAND_BLUE = '#0052D6'

export function LogoMark({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`flex-shrink-0 ${className}`} aria-hidden="true">
      <rect width="32" height="32" rx="7.4" fill={BRAND_BLUE} />
      <rect x="7.7" y="11" width="16.6" height="5.4" rx="1.6" fill="#fff" />
      <rect x="7.7" y="19" width="12" height="1.9" rx="0.95" fill="#fff" />
    </svg>
  )
}

export function Wordmark({ className = '', light = false }) {
  return (
    <span className={`tracking-[-0.04em] leading-none ${light ? 'text-white' : 'text-[#0052D6]'} ${className}`}>
      <span className="font-extrabold">Fleet</span><span className="font-light">Desk</span>
    </span>
  )
}

// Symbole + mot, pour les écrans d'accueil (connexion, bienvenue, paiement).
export default function Logo({ size = 32, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`} aria-label="FleetDesk">
      <LogoMark size={size} />
      <Wordmark className="text-[21px]" />
    </span>
  )
}
