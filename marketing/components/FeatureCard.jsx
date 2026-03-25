import { useState } from 'react'

export default function FeatureCard({ icon: Icon, title, description, preview }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="group relative bg-white border border-zinc-100 rounded-xl p-6 hover:border-zinc-200 hover:shadow-sm transition-all duration-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Floating preview */}
      {preview && (
        <div
          className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 z-50 w-72 bg-white rounded-2xl border border-zinc-100 shadow-xl shadow-zinc-200/50 pointer-events-none"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(-50%) translateY(0px)' : 'translateX(-50%) translateY(6px)',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}
        >
          {/* Arrow */}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r border-b border-zinc-100 rotate-45" />
          <div className="p-4">{preview}</div>
        </div>
      )}

      <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center mb-4 group-hover:bg-[#2563EB]/[0.08] transition-colors">
        <Icon className="w-4 h-4 text-zinc-500 group-hover:text-[#2563EB] transition-colors" />
      </div>
      <h3 className="text-[15px] font-semibold text-zinc-900 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </div>
  )
}
