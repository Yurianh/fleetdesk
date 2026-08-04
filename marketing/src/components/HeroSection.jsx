const APP_URL = 'https://app.fleetdesk.fr'

export default function HeroSection() {
  return (
    <section className="bg-white overflow-hidden border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 lg:pt-24 pb-16 lg:pb-20">

        {/* Copy */}
        <div className="max-w-2xl mb-12 lg:mb-14">
          <div className="inline-flex items-center gap-2 bg-[#E5EEFF] text-[#0066FF] text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            </svg>
            Pour les flottes de 2 à 50 véhicules
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-zinc-900 tracking-tight leading-[1.05] mb-6">
            Zéro contrôle raté.<br />
            Zéro document expiré.<br />
            <span className="text-[#0066FF]">Zéro panne surprise.</span>
          </h1>

          <p className="text-lg text-zinc-500 leading-relaxed mb-8">
            FleetDesk surveille chaque véhicule et chaque conducteur à votre place, et vous alerte avant l'échéance. Toute votre flotte, dans un seul outil.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <a href={`${APP_URL}/login?plan=pro`}
              className="inline-flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0052D6] text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-[#0066FF]/25">
              Essayer gratuitement
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
            <a href="#how"
              className="inline-flex items-center justify-center gap-2 border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900 font-medium text-sm px-8 py-3.5 rounded-xl transition-all">
              Comment ça marche
            </a>
          </div>

          <div className="flex items-center gap-x-5 gap-y-2 text-sm text-zinc-500 flex-wrap">
            {['14 jours d\'essai', 'Sans carte bancaire', 'Hébergé en France'].map((item, i) => (
              <div key={item} className="flex items-center gap-2">
                {i > 0 && <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-300 -ml-2.5" />}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Bento grid — the product's value in tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:auto-rows-[178px]">

          {/* Hero tile: compliance alert (what FleetDesk catches for you) */}
          <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-2xl border border-[#0066FF]/20 bg-gradient-to-br from-[#EAF1FF] to-white p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-semibold text-[#0066FF] uppercase tracking-wide">Alerte conformité</span>
            </div>
            <div className="flex-1">
              <p className="font-display text-2xl sm:text-3xl font-semibold text-zinc-900 leading-tight mb-2">
                Contrôle technique<br />dans 3 jours
              </p>
              <p className="text-sm text-zinc-500">Renault Master · AB-123-CD · Karim T.</p>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-white/80 border border-zinc-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-sm font-medium text-zinc-700">Détecté par FleetDesk, 30 j avant</span>
              </div>
            </div>
          </div>

          {/* Vehicles tile */}
          <div className="sm:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Véhicules</p>
              <p className="text-xs text-zinc-400">14 · 12 affectés</p>
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center bg-zinc-50 rounded-lg px-3 py-2">
                <span className="text-xs text-zinc-700 flex-1">AB-123-CD</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Actif</span>
                <span className="text-xs text-zinc-400 w-20 text-right">45 200 km</span>
              </div>
              <div className="flex items-center bg-zinc-50 rounded-lg px-3 py-2">
                <span className="text-xs text-zinc-700 flex-1">EF-456-GH</span>
                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Révision</span>
                <span className="text-xs text-zinc-400 w-20 text-right">31 800 km</span>
              </div>
            </div>
          </div>

          {/* Analytics tile */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Km ce mois</p>
            <p className="text-xl font-bold text-zinc-900 mb-auto">12 450</p>
            <div className="flex items-end gap-1 h-10 mt-3">
              <div className="flex-1 bg-[#0066FF]/15 rounded-sm" style={{ height: '45%' }} />
              <div className="flex-1 bg-[#0066FF]/25 rounded-sm" style={{ height: '65%' }} />
              <div className="flex-1 bg-[#0066FF]/40 rounded-sm" style={{ height: '40%' }} />
              <div className="flex-1 bg-[#0066FF]/60 rounded-sm" style={{ height: '80%' }} />
              <div className="flex-1 bg-[#0066FF] rounded-sm" style={{ height: '95%' }} />
              <div className="flex-1 bg-[#0066FF]/70 rounded-sm" style={{ height: '68%' }} />
            </div>
          </div>

          {/* Driver doc tile */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Documents</p>
            <div className="flex items-center gap-2.5 mb-auto">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-600 flex-shrink-0">SR</div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-800 truncate">Sophie Renard</p>
                <p className="text-[11px] text-zinc-400">Visite médicale</p>
              </div>
            </div>
            <span className="mt-3 inline-flex self-start items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Expire dans 15 j</span>
          </div>

        </div>
      </div>
    </section>
  )
}
