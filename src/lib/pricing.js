// Prix publics, en euros. Mensuel sans engagement, ou annuel payé d'avance
// (jusqu'à 37 % de moins). Mêmes montants que les prix Stripe et la page tarifs.
// L'équivalent mensuel de l'annuel est indicatif : arrondi à l'euro.
export const PRICES = {
  starter:    { monthly: 9,  annual: 70 },
  pro:        { monthly: 29, annual: 220 },
  enterprise: { monthly: 79, annual: 600 },
}

// L'annuel est proposé d'abord : c'est au client de choisir le mensuel.
export const DEFAULT_BILLING = 'annual'

const eur = n => n.toLocaleString('fr-FR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })

// L'annuel s'affiche ramené au mois, le total payé d'avance en petit :
// { amount: '6 €', period: '/mois', hint: 'facturé 70 € par an' } ou { amount: '9 €', period: '/mois', hint: 'sans engagement' }
export function priceLabel(plan, billing) {
  const p = PRICES[plan]
  if (!p) return { amount: '', period: '', hint: '' }
  if (billing === 'annual') {
    return { amount: `${eur(Math.round(p.annual / 12))} €`, period: '/mois', hint: `facturé ${eur(p.annual)} € par an` }
  }
  return { amount: `${eur(p.monthly)} €`, period: '/mois', hint: 'sans engagement' }
}
