import { Link } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'

const PLAN_LABEL = { pro: 'Pro', enterprise: 'Enterprise' }

/**
 * Upsell shown when a feature sits above the org's current plan.
 *
 * Props:
 *  - requiredPlan: 'pro' | 'enterprise'
 *  - title:        headline (what's locked)
 *  - description:  one line on the value
 *  - variant:      'panel' (default, full block) | 'overlay' (absolute, covers content)
 */
export default function UpgradePrompt({ requiredPlan = 'enterprise', title, description, variant = 'panel' }) {
  const label = PLAN_LABEL[requiredPlan] ?? 'Pro'

  const inner = (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#0066FF]/10">
          <Lock className="w-4 h-4 text-[#0066FF]" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-[#0066FF]">
          Formule {label}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 tracking-tight mb-1.5">{title}</h3>
      {description && <p className="text-sm text-zinc-500 leading-relaxed mb-5">{description}</p>}
      <Link
        to="/Settings?section=plan"
        className="inline-flex items-center gap-1.5 bg-[#0066FF] hover:bg-[#0052D6] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
      >
        Passer à {label}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">{inner}</div>
      </div>
    )
  }

  return (
    <div className="border border-zinc-200 rounded-xl p-6 bg-white">{inner}</div>
  )
}
