import { LogoMark, Wordmark } from '@/components/shared/Logo'

export default function AppLoader({ message = 'Chargement de vos données...' }) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-5 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-2">
        <LogoMark size={40} />
        <Wordmark className="text-[26px]" />
      </div>

      {/* Animated bar */}
      <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#0066FF] rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
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
