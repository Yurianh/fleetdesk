import React from 'react'

// Catches render/lifecycle crashes so a single broken component shows a
// graceful fallback instead of a white screen. Errors are logged to the console
// (visible in the browser and, for SSR/functions, in Vercel logs). Without a
// dedicated error-tracking service they aren't aggregated centrally — this is
// the graceful-degradation layer, not a reporter.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50 px-6">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-sm font-bold">!</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-red-500">Une erreur est survenue</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-2">Quelque chose s'est mal passé.</h1>
          <p className="text-sm text-zinc-500 leading-relaxed mb-6">
            La page a rencontré un problème inattendu. Rechargez pour reprendre. Si cela persiste, contactez le support.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#0066FF] hover:bg-[#0052D6] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              Recharger la page
            </button>
            <a href="/Dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
              Retour au tableau de bord
            </a>
          </div>
        </div>
      </div>
    )
  }
}
