export default function AppLoader({ message = 'Chargement de vos données...' }) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-5 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">FleetDesk</span>
      </div>

      {/* Animated bar */}
      <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#2563EB] rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
      </div>

      <p className="text-sm text-slate-400">{message}</p>

      <style>{`
        @keyframes loading {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}
