import React, { useState, useRef } from 'react'
import { FileText, Pencil, Trash2, X, Check, AlertTriangle, CheckCircle2, Clock, Upload, ExternalLink, Loader2 } from 'lucide-react'
import { format, differenceInDays, addYears, differenceInYears } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useDriverDocuments,
  createDriverDocument,
  updateDriverDocument,
  deleteDriverDocument,
} from '@/lib/useFleetData'
import { uploadDriverDoc, deleteDriverDoc } from '@/lib/driverDocumentStorage'

export const DOC_TYPE_CONFIG = {
  aptitude_conduite: {
    label: 'Aptitude à la conduite',
    validityYears: 5,
    validityYearsOver62: 2,
    hint: '5 ans · 2 ans si conducteur +62 ans',
  },
  casier_judiciaire: {
    label: 'Casier judiciaire',
    validityYears: 1,
    hint: '1 an',
  },
  formation_sst_psc1: {
    label: 'Formation SST / PSC1',
    validityYears: 2,
    hint: '2 ans',
  },
  formation_tpmr: {
    label: 'Formation TPMR',
    validityYears: 5,
    hint: '5 ans',
  },
  visite_medecin: {
    label: 'Visite médecin du travail',
    validityYears: null,
    hint: 'Saisir la date d\'expiration manuellement',
  },
  formation_eco_conduite: {
    label: 'Formation éco-conduite',
    validityYears: null,
    hint: 'Saisir la date d\'expiration manuellement',
  },
}

const DOC_TYPES_ORDER = [
  'aptitude_conduite',
  'casier_judiciaire',
  'formation_sst_psc1',
  'formation_tpmr',
  'visite_medecin',
  'formation_eco_conduite',
]

export function calcDocExpiry(type, validationDate, driverBirthDate) {
  if (!validationDate) return ''
  const conf = DOC_TYPE_CONFIG[type]
  if (!conf?.validityYears) return ''
  let years = conf.validityYears
  if (type === 'aptitude_conduite' && driverBirthDate && conf.validityYearsOver62) {
    const ageAtValidation = differenceInYears(new Date(validationDate), new Date(driverBirthDate))
    if (ageAtValidation >= 62) years = conf.validityYearsOver62
  }
  return format(addYears(new Date(validationDate), years), 'yyyy-MM-dd')
}

function DocStatusBadge({ doc }) {
  if (!doc) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
        Manquant
      </span>
    )
  }
  if (!doc.expiry_date) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />Enregistré
      </span>
    )
  }
  const days = differenceInDays(new Date(doc.expiry_date), new Date())
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3" />Expiré
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" />Expire dans {days}j
      </span>
    )
  }
  if (days <= 90) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" />Expire dans {days}j
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" />Valide
    </span>
  )
}

export default function DriverDocuments({ driverId, driver }) {
  const { data: documents = [] } = useDriverDocuments(driverId)
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDoc, setEditDoc] = useState(null)
  const [form, setForm] = useState({ type: '', validation_date: '', expiry_date: '', notes: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const fileRef = useRef(null)

  const docsByType = {}
  for (const d of documents) {
    docsByType[d.type] = d
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['driverDocuments', driverId] })
    queryClient.invalidateQueries({ queryKey: ['allDriverDocuments'] })
  }

  const openAdd = (type) => {
    setEditDoc(null)
    setFile(null)
    setForm({ type, validation_date: '', expiry_date: '', notes: '' })
    setDialogOpen(true)
  }

  const openEdit = (doc) => {
    setEditDoc(doc)
    setFile(null)
    setForm({
      type: doc.type,
      validation_date: doc.validation_date || '',
      expiry_date: doc.expiry_date || '',
      notes: doc.notes || '',
    })
    setDialogOpen(true)
  }

  const handleValidationDateChange = (date) => {
    const expiry = calcDocExpiry(form.type, date, driver?.date_of_birth)
    setForm(f => ({ ...f, validation_date: date, expiry_date: expiry || f.expiry_date }))
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null
    if (f && f.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10 Mo)')
      e.target.value = ''
      return
    }
    if (f && f.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés')
      e.target.value = ''
      return
    }
    setFile(f)
  }

  const handleSave = async () => {
    if (!form.validation_date) {
      toast.error('La date de validation est requise')
      return
    }
    setSaving(true)
    try {
      let fileUrl = editDoc?.file_url || null
      if (file) {
        if (editDoc?.file_url) await deleteDriverDoc(editDoc.file_url)
        fileUrl = await uploadDriverDoc(file)
      }
      const docData = {
        driver_id: driverId,
        type: form.type,
        validation_date: form.validation_date,
        expiry_date: form.expiry_date || null,
        notes: form.notes || null,
        file_url: fileUrl,
      }
      if (editDoc) {
        await updateDriverDocument(editDoc.id, docData)
        toast.success('Document mis à jour')
      } else {
        await createDriverDocument(docData)
        toast.success('Document enregistré')
      }
      invalidate()
      setDialogOpen(false)
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.file_url) await deleteDriverDoc(deleteTarget.file_url)
      await deleteDriverDocument(deleteTarget.id)
      invalidate()
      toast.success('Document supprimé')
      setDeleteTarget(null)
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const conf = DOC_TYPE_CONFIG[form.type]

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900 text-sm">Documents réglementaires</h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Habilitations et formations obligatoires</p>
      </div>

      <div className="divide-y divide-slate-100">
        {DOC_TYPES_ORDER.map(type => {
          const typeConf = DOC_TYPE_CONFIG[type]
          const doc = docsByType[type]
          return (
            <div key={type} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-900">{typeConf.label}</p>
                  <DocStatusBadge doc={doc} />
                </div>
                {doc ? (
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <p className="text-xs text-slate-400">
                      Validé le {format(new Date(doc.validation_date), 'd MMM yyyy', { locale: fr })}
                    </p>
                    {doc.expiry_date && (
                      <p className="text-xs text-slate-400">
                        · Expire le {format(new Date(doc.expiry_date), 'd MMM yyyy', { locale: fr })}
                      </p>
                    )}
                    {doc.notes && <p className="text-xs text-slate-400 italic">· {doc.notes}</p>}
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />PDF
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 mt-0.5">{typeConf.hint}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {doc ? (
                  <>
                    <button
                      onClick={() => openEdit(doc)}
                      className="p-1.5 text-slate-400 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openAdd(type)}
                    className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] bg-[#2563EB]/5 hover:bg-[#2563EB]/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Ajouter
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) { setDialogOpen(false); setFile(null) } }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editDoc ? 'Modifier le document' : 'Ajouter un document'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{conf?.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{conf?.hint}</p>
            </div>

            <div>
              <Label>Date de validation *</Label>
              <Input
                type="date"
                value={form.validation_date}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => handleValidationDateChange(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Date d'expiration
                {conf?.validityYears && (
                  <span className="text-slate-400 font-normal ml-1">(calculée automatiquement)</span>
                )}
              </Label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
              />
            </div>

            <div>
              <Label>Notes <span className="text-slate-400 font-normal">(optionnel)</span></Label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="N° de certification, organisme..."
              />
            </div>

            {/* PDF upload */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Document PDF <span className="font-normal normal-case">— optionnel</span>
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                  <FileText className={`w-4 h-4 ${file || editDoc?.file_url ? 'text-slate-600' : 'text-slate-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  {file ? (
                    <p className="text-sm text-slate-700 truncate">{file.name}</p>
                  ) : editDoc?.file_url ? (
                    <>
                      <p className="text-sm text-slate-700">Document enregistré</p>
                      <a
                        href={editDoc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#2563EB] hover:underline"
                      >
                        Voir le PDF →
                      </a>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400">
                      Joindre un PDF
                      <span className="block text-xs text-slate-300 mt-0.5">PDF uniquement · max 10 Mo</span>
                    </span>
                  )}
                </div>
                {file ? (
                  <button
                    type="button"
                    onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors shrink-0"
                    title="Choisir un PDF"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !form.validation_date}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8]"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</>
                : <><Check className="w-4 h-4 mr-1.5" />Enregistrer</>
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader><DialogTitle>Supprimer ce document</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600 mt-1">
            Le document et le fichier PDF associé seront définitivement supprimés.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1">Annuler</Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Supprimer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
