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

        {/* Product: a real dashboard fragment, framed as the app */}
        <div className="rounded-xl border border-zinc-200 shadow-2xl shadow-zinc-200/60 overflow-hidden bg-white">
          {/* Browser chrome */}
          <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2.5 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white border border-zinc-200 rounded px-4 py-1 text-[11px] text-zinc-400 flex items-center gap-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                app.fleetdesk.fr/tableau-de-bord
              </div>
            </div>
          </div>

          <div className="flex">
            {/* App sidebar */}
            <aside className="hidden md:flex w-44 flex-shrink-0 flex-col border-r border-zinc-200 bg-white p-3">
              <div className="flex items-center gap-2 px-1.5 mb-4">
                <div className="w-5 h-5 bg-[#0066FF] rounded flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/></svg>
                </div>
                <span className="text-[12px] font-semibold text-zinc-900">FleetDesk</span>
              </div>
              <div className="space-y-0.5">
                {['Tableau de bord', 'Véhicules', 'Conducteurs', 'Affectations'].map((n, i) => (
                  <div key={n} className={`px-2 py-1.5 rounded-md text-[11px] ${i === 0 ? 'bg-[#E5EEFF] text-[#0066FF] font-medium' : 'text-zinc-400'}`}>{n}</div>
                ))}
              </div>
              <p className="px-2 pt-4 pb-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-300">Opérations</p>
              <div className="space-y-0.5">
                {['Kilométrage', 'Maintenance', 'Contrôles', 'Lavages'].map(n => (
                  <div key={n} className="px-2 py-1.5 rounded-md text-[11px] text-zinc-400">{n}</div>
                ))}
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 bg-zinc-50 p-4 sm:p-5 min-w-0">
              <div className="mb-4">
                <p className="text-[11px] text-zinc-400 mb-0.5">Mercredi 20 mai 2026</p>
                <h3 className="font-display text-lg text-zinc-900">Bonjour, Thomas 👋</h3>
              </div>

              {/* Bento grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:auto-rows-[148px]">

          {/* Hero tile: the alert center (compliance is the product's core value) */}
          <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2 rounded-2xl border border-[#0066FF]/15 bg-gradient-to-br from-[#EAF1FF] via-white to-white p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-[11px] font-semibold text-[#0066FF] uppercase tracking-wide">Centre d'alertes</span>
              </div>
              <span className="text-[11px] font-medium text-zinc-400">3 échéances</span>
            </div>

            <p className="font-display text-xl text-zinc-900 mb-3">À surveiller cette semaine</p>

            <div className="space-y-1.5 flex-1">
              {[
                { dot: 'bg-red-500',   pill: 'text-red-600 bg-red-50',       label: 'Contrôle technique', sub: 'Renault Master · AB-123-CD', due: '3 j' },
                { dot: 'bg-amber-500', pill: 'text-amber-600 bg-amber-50',   label: 'Vidange programmée', sub: 'Peugeot Boxer · EF-456-GH',  due: '12 j' },
                { dot: 'bg-amber-500', pill: 'text-amber-600 bg-amber-50',   label: 'Visite médicale',    sub: 'Sophie Renard · conductrice', due: '15 j' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3 bg-white/80 border border-white rounded-lg px-3 py-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-zinc-800 leading-tight">{r.label}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{r.sub}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${r.pill}`}>{r.due}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 text-[12px] text-zinc-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Chaque échéance détectée 30 jours à l'avance.
            </div>
          </div>

          {/* Vehicles tile */}
          <div className="sm:col-span-2 rounded-2xl border border-zinc-200 bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Véhicules</p>
              <p className="text-[11px] text-zinc-400">14 · 12 affectés</p>
            </div>
            <div className="space-y-1 flex-1">
              {[
                { plate: 'AB-123-CD', d: 'Karim T.',  s: 'Actif',    sc: 'bg-emerald-50 text-emerald-600', km: '45 200' },
                { plate: 'EF-456-GH', d: 'Sophie M.', s: 'Révision', sc: 'bg-amber-50 text-amber-600',     km: '31 800' },
                { plate: 'IJ-789-KL', d: 'Ahmed B.',  s: 'Actif',    sc: 'bg-emerald-50 text-emerald-600', km: '78 400' },
              ].map(v => (
                <div key={v.plate} className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-zinc-800 font-medium w-24">{v.plate}</span>
                  <span className="text-[11px] text-zinc-400 flex-1 truncate">{v.d}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.sc}`}>{v.s}</span>
                  <span className="text-[11px] text-zinc-400 w-16 text-right">{v.km} km</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics tile */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 flex flex-col">
            <div className="flex items-baseline justify-between mb-0.5">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Km ce mois</p>
              <span className="text-[10px] font-semibold text-emerald-600">↑ 8%</span>
            </div>
            <p className="text-lg font-bold text-zinc-900">12 450</p>
            <div className="flex items-end gap-1 h-9 mt-auto">
              {[45, 65, 40, 80, 95, 68].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: `rgba(0,102,255,${0.2 + h / 160})` }} />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-zinc-300">
              <span>Déc</span><span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span>
            </div>
          </div>

          {/* Driver docs tile */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Conducteurs</p>
              <p className="text-[11px] text-emerald-600 font-medium">8/9 conformes</p>
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center text-[9px] font-bold text-amber-600 flex-shrink-0">SR</div>
                <span className="text-xs text-zinc-700 flex-1 truncate">Sophie Renard</span>
                <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">15 j</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#E5EEFF] flex items-center justify-center text-[9px] font-bold text-[#0066FF] flex-shrink-0">KA</div>
                <span className="text-xs text-zinc-700 flex-1 truncate">Karim Aïssa</span>
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Conforme</span>
              </div>
            </div>
          </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
