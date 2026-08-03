import React from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Confirmation dialog for irreversible deletes — same layout as the
// vehicle/driver delete dialogs so every destructive action feels identical.
export default function ConfirmDeleteDialog({ open, onCancel, onConfirm, title, description, deleting = false }) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Annuler</Button>
          <Button onClick={onConfirm} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
