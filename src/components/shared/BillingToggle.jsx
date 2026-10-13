// Sélecteur Annuel / Mensuel. L'annuel est à gauche et sélectionné par défaut.
export default function BillingToggle({ value, onChange, className = '' }) {
  const opt = (v, label, extra) => (
    <button
      type="button"
      onClick={() => onChange(v)}
      aria-pressed={value === v}
      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
        value === v ? 'bg-[#E5EEFF] text-[#0052D6]' : 'text-zinc-500 hover:text-zinc-800'
      }`}
    >
      {label}{extra}
    </button>
  )
  return (
    <div className={`inline-flex bg-white border border-zinc-200 rounded-full p-0.5 ${className}`} role="group" aria-label="Facturation">
      {opt('annual', 'Annuel', <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">jusqu'à −37 %</span>)}
      {opt('monthly', 'Mensuel')}
    </div>
  )
}
