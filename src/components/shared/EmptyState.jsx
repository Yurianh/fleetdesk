import React from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <p className="font-semibold text-slate-600 mb-1">{title ?? t('common.noData')}</p>
      {description && (
        <p className="text-sm text-slate-400 max-w-xs mb-4 leading-relaxed">{description}</p>
      )}
      {action && action.onClick && (
        <Button size="sm" variant="outline" onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  )
}
