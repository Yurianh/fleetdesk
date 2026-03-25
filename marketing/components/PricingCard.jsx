import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function PricingCard({ plan, planId, price, period = '/month', description, features, cta = 'Get started', highlighted = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  function handleCTA() {
    if (user) {
      navigate('/Dashboard')
      return
    }
    if (planId) sessionStorage.setItem('selected_plan', planId)
    navigate('/login')
  }

  return (
    <div className={`relative flex flex-col rounded-xl p-7 ${
      highlighted
        ? 'border-2 border-[#2563EB] bg-white shadow-lg shadow-[#2563EB]/10'
        : 'bg-white border border-zinc-200'
    }`}>

      {highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-[#2563EB] text-white text-xs font-semibold px-3 py-1 rounded-full">
            Plus populaire
          </span>
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm font-semibold mb-1 text-[#2563EB]">{plan}</p>
        <div className="flex items-end gap-1 mb-3">
          <span className="text-4xl font-bold tracking-tight text-zinc-900">{price}</span>
          {period && <span className="text-sm mb-1.5 text-zinc-400">{period}</span>}
        </div>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#2563EB]" />
            <span className="text-sm text-zinc-600">{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleCTA}
        className={`block w-full text-center text-sm font-semibold px-5 py-3 rounded-lg transition-colors cursor-pointer ${
          highlighted
            ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
            : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
        }`}
      >
        {cta}
      </button>
    </div>
  )
}
