import React from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export default function FormModal({
  open,
  onClose,
  title,
  onSubmit,
  saving = false,
  submitLabel,
  children,
}) {
  const { t } = useTranslation()
  const label = submitLabel ?? t('common.save')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1 min-w-0">
          {children}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8]"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.saving')}
              </span>
            ) : label}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
