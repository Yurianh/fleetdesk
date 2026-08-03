import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Renders a retryable error banner when any of the given react-query results
// is in error state. Renders nothing otherwise — safe to leave always mounted.
// Usage: const vehiclesQ = useVehicles() … <DataError queries={[vehiclesQ]} />
export default function DataError({ queries = [] }) {
  const { t } = useTranslation()
  const failed = queries.filter(q => q?.isError)
  if (failed.length === 0) return null

  return (
    <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-700">{t('common.dataError')}</p>
          <p className="text-xs text-red-600">{t('common.dataErrorDesc')}</p>
        </div>
      </div>
      <button
        onClick={() => failed.forEach(q => q.refetch())}
        className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-white hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {t('common.retry')}
      </button>
    </div>
  )
}
