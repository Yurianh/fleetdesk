import React, { useState, useRef } from 'react'
import { FileText, Pencil, Trash2, X, Check, AlertTriangle, CheckCircle2, Clock, Upload, ExternalLink, Loader2, Plus } from 'lucide-react'
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
import { compressImage } from '@/lib/compressImage'

export const DOC_TYPE_CONFIG = {
  permis_conduire: {
    label: 'Permis de conduire',
    category: 'conduite',
    validityYears: null,
    hint: 'Valable selon la catégorie',
  },
  aptitude_conduite: {
    label: 'Aptitude à la conduite',
    category: 'conduite',
    validityYears: 5,
    validityYearsOver62: 2,
    hint: 'Valable 5 ans · 2 ans si +62 ans',
  },
  casier_judiciaire: {
    label: 'Casier judiciaire',
    category: 'conduite',
    validityYears: 1,
    hint: 'Valable 1 an',
  },
  formation_sst_psc1: {
    label: 'Formation SST / PSC1',
    category: 'formations',
    validityYears: 2,
    hint: 'Valable 2 ans',
  },
  formation_tpmr: {
    label: 'Formation TPMR',
    category: 'formations',
    validityYears: 5,
    hint: 'Valable 5 ans',
  },
  formation_eco_conduite: {
    label: 'Formation éco-conduite',
    category: 'formations',
    validityYears: null,
    hint: 'Échéance à saisir manuellement',
  },
  visite_medecin: {
    label: 'Visite médecin du travail',
    category: 'medical',
    validityYears: null,
    hint: 'Échéance à saisir manuellement',
  },
}

const DOC_TYPES_ORDER = [
  'permis_conduire',
  'aptitude_conduite',
  'casier_judiciaire',
  'formation_sst_psc1',
  'formation_tpmr',
  'formation_eco_conduite',
  'visite_medecin',
]

// Category grouping for the documents card.
const CATEGORIES = [
  { id: 'conduite',   label: 'Identité & conduite' },
  { id: 'formations', label: 'Formations' },
  { id: 'medical',    label: 'Médical' },
  { id: 'autre',      label: 'Autres documents' },
]

// Row-level state, worst-first, used to sort within a category and pick the action.
function docState(doc) {
  if (!doc) return 'missing'
  if (!doc.expiry_date) return 'valid'
  const days = differenceInDays(new Date(doc.expiry_date), new Date())
  if (days < 0) return 'expired'
  if (days <= 60) return 'expiring'
  return 'valid'
}
const STATE_RANK = { expired: 0, expiring: 1, missing: 2, valid: 3 }

// Free-form "Autre document" types are stored as `autre:<titre libre>` so an
// admin can add arbitrary documents without a schema change or a fixed enum.
export const CUSTOM_PREFIX = 'autre:'
export const isCustomType = (type) => typeof type === 'string' && type.startsWith(CUSTOM_PREFIX)
export const docLabel = (type) =>
  DOC_TYPE_CONFIG[type]?.label || (isCustomType(type) ? type.slice(CUSTOM_PREFIX.length) : type)

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
  const [customLabel, setCustomLabel] = useState('')
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
    setCustomLabel('')
    setForm({ type, validation_date: '', expiry_date: '', notes: '' })
    setDialogOpen(true)
  }

  // Add a free-form "Autre document" — the type is resolved from the title on save.
  const openAddCustom = () => {
    setEditDoc(null)
    setFile(null)
    setCustomLabel('')
    setForm({ type: CUSTOM_PREFIX, validation_date: '', expiry_date: '', notes: '' })
    setDialogOpen(true)
  }

  const openEdit = (doc) => {
    setEditDoc(doc)
    setFile(null)
    setCustomLabel(isCustomType(doc.type) ? doc.type.slice(CUSTOM_PREFIX.length) : '')
    setForm({
      type: doc.type,
      validation_date: doc.validation_date || '',
      expiry_date: doc.expiry_date || '',
      notes: doc.notes || '',
    })
    setDialogOpen(true)
  }

  const isCustomForm = form.type === CUSTOM_PREFIX || isCustomType(form.type)

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
    const isAllowed = f && (f.type === 'application/pdf' || f.type.startsWith('image/'))
    if (f && !isAllowed) {
      toast.error('Formats acceptés : PDF ou image')
      e.target.value = ''
      return
    }
    setFile(f)
  }

  const handleSave = async () => {
    const label = customLabel.trim()
    if (isCustomForm && !label) {
      toast.error('Donnez un titre au document')
      return
    }
    const resolvedType = isCustomForm ? CUSTOM_PREFIX + label : form.type
    const autoExpiry = !!DOC_TYPE_CONFIG[resolvedType]?.validityYears
    // Auto-expiry types need the validation date to compute expiry. Others
    // (permis, autre, manual types) only need at least one date.
    if (autoExpiry && !form.validation_date) {
      toast.error('La date de validation est requise')
      return
    }
    if (!autoExpiry && !form.validation_date && !form.expiry_date) {
      toast.error('Renseignez une date de validation ou d\'expiration')
      return
    }
    setSaving(true)
    try {
      let fileUrl = editDoc?.file_url || null
      if (file) {
        if (editDoc?.file_url) await deleteDriverDoc(editDoc.file_url)
        // Images are compressed client-side before upload; PDFs pass through.
        const toUpload = await compressImage(file)
        fileUrl = await uploadDriverDoc(toUpload)
      }
      const docData = {
        driver_id: driverId,
        type: resolvedType,
        validation_date: form.validation_date || null,
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
    } catch (err) {
      console.error('handleSave error:', err)
      toast.error(err?.message || "Erreur lors de l'enregistrement")
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
  const dialogLabel = isCustomForm ? (customLabel.trim() || 'Autre document') : conf?.label
  const dialogHint = isCustomForm ? 'Document libre — ajoutez une date d\'expiration pour être alerté avant échéance' : conf?.hint

  // Build the list of entries to display: the fixed regulatory types (which may
  // be missing), plus any free-form "autre:" documents (always present).
  const entries = [
    ...DOC_TYPES_ORDER.map(type => ({ type, doc: docsByType[type], custom: false })),
    ...documents
      .filter(d => isCustomType(d.type))
      .map(d => ({ type: d.type, doc: d, custom: true })),
  ]

  // Group entries into ordered categories; within a category the worst status
  // (expired → expiring → missing → valid) rises to the top so risk stays visible.
  const entryCategory = (e) => e.custom ? 'autre' : (DOC_TYPE_CONFIG[e.type]?.category || 'autre')
  const sections = CATEGORIES
    .map(cat => ({
      ...cat,
      rows: entries
        .filter(e => entryCategory(e) === cat.id)
        .sort((a, b) => STATE_RANK[docState(a.doc)] - STATE_RANK[docState(b.doc)]),
    }))
    .filter(s => s.rows.length > 0)

  // Compliance meter reflects the fixed regulatory set only (custom docs are extra).
  const completedCount = entries.filter(e => !e.custom && docState(e.doc) === 'valid').length
  const expiredCount = entries.filter(e => docState(e.doc) === 'expired').length
  const expiringCount = entries.filter(e => docState(e.doc) === 'expiring').length
  const totalCount = DOC_TYPES_ORDER.length
  const progressPct = Math.round((completedCount / totalCount) * 100)
  const overallStatus = expiredCount > 0 ? 'expired'
    : expiringCount > 0 ? 'expiring'
    : completedCount === totalCount ? 'complete'
    : 'incomplete'

  const progressColor = overallStatus === 'expired' ? 'bg-red-400'
    : overallStatus === 'expiring' ? 'bg-amber-400'
    : overallStatus === 'complete' ? 'bg-emerald-400'
    : 'bg-slate-300'

  const badgeStyle = overallStatus === 'expired' ? 'text-red-700 bg-red-100'
    : overallStatus === 'expiring' ? 'text-amber-700 bg-amber-100'
    : overallStatus === 'complete' ? 'text-emerald-700 bg-emerald-100'
    : 'text-slate-500 bg-slate-100'

  // One row, unified across states. Grouped by category, so the leading dot +
  // status pill carry the urgency the old urgency-buckets used to.
  const dotColor = { expired: 'bg-red-500', expiring: 'bg-amber-500', valid: 'bg-emerald-500', missing: 'bg-slate-300' }
  const renderRow = (entry) => {
    const { type, doc } = entry
    const st = docState(doc)
    const conf = DOC_TYPE_CONFIG[type]
    return (
      <div key={type} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors group">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor[st]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-800">{docLabel(type)}</p>
            <DocStatusBadge doc={doc} />
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-400">
            {st === 'missing' && <span>{conf?.hint || 'Non renseigné'}</span>}
            {doc?.expiry_date && (
              <span>{st === 'expired' ? 'Expiré le' : 'Expire le'} {format(new Date(doc.expiry_date), 'd MMM yyyy', { locale: fr })}</span>
            )}
            {doc && !doc.expiry_date && doc.validation_date && (
              <span>Validé le {format(new Date(doc.validation_date), 'd MMM yyyy', { locale: fr })}</span>
            )}
            {doc?.notes && <span className="italic">· {doc.notes}</span>}
            {doc?.file_url && (
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#0066FF] hover:underline">
                <ExternalLink className="w-3 h-3" />Voir
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {st === 'missing' && (
            <button onClick={() => openAdd(type)}
              className="text-xs font-semibold text-[#0066FF] bg-[#0066FF]/5 hover:bg-[#0066FF]/10 px-3 py-1.5 rounded-lg transition-colors">
              Ajouter
            </button>
          )}
          {st === 'expired' && (
            <button onClick={() => openEdit(doc)}
              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
              Mettre à jour
            </button>
          )}
          {st === 'expiring' && (
            <button onClick={() => openEdit(doc)}
              className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
              Renouveler
            </button>
          )}
          {st === 'valid' && doc && (
            <button onClick={() => openEdit(doc)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {doc && (
            <button onClick={() => setDeleteTarget(doc)}
              className={`p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ${st === 'valid' ? 'opacity-0 group-hover:opacity-100' : ''}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
  <>
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 text-sm">Documents réglementaires</h2>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle}`}>
            {completedCount}/{totalCount} conformes
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {overallStatus !== 'complete' && (
          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
            Certains documents sont requis pour la conformité légale. Mettez-les à jour pour éviter tout risque en cas de contrôle.
          </p>
        )}
      </div>

      {/* ── Risk summary strip (only when something needs attention) ── */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-2 bg-amber-50/40">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-700">
            {expiredCount > 0 && `${expiredCount} document${expiredCount > 1 ? 's' : ''} expiré${expiredCount > 1 ? 's' : ''}`}
            {expiredCount > 0 && expiringCount > 0 && ' · '}
            {expiringCount > 0 && `${expiringCount} à renouveler bientôt`}
          </span>
        </div>
      )}

      {/* ── Category sections ── */}
      {sections.map((section, si) => (
        <div key={section.id} className={si > 0 ? 'border-t border-slate-100' : ''}>
          <div className="px-5 pt-3.5 pb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {section.label}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {section.rows.map(renderRow)}
          </div>
        </div>
      ))}

      {/* ── Add another (free-form) document ── */}
      <div className="border-t border-slate-100 px-5 py-3">
        <button
          onClick={openAddCustom}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0066FF] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter un autre document
        </button>
      </div>
    </div>

    {/* Add / Edit dialog */}
    <Dialog open={dialogOpen} onOpenChange={open => { if (!open) { setDialogOpen(false); setFile(null) } }}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editDoc ? 'Modifier le document' : 'Ajouter un document'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {isCustomForm ? (
            <div>
              <Label>Titre du document *</Label>
              <Input
                value={customLabel}
                onChange={e => setCustomLabel(e.target.value)}
                placeholder="Ex : Attestation employeur, RIB, contrat..."
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1">{dialogHint}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-900">{dialogLabel}</p>
              <p className="text-xs text-slate-400 mt-0.5">{dialogHint}</p>
            </div>
          )}

          <div>
            <Label>Date de validation{DOC_TYPE_CONFIG[form.type]?.validityYears ? ' *' : ''}</Label>
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

          {/* File upload (PDF or image) */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Document <span className="font-normal normal-case">— optionnel</span>
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
                      className="text-xs text-[#0066FF] hover:underline"
                    >
                      Voir le document →
                    </a>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">
                    Joindre un fichier
                    <span className="block text-xs text-slate-300 mt-0.5">PDF ou image · max 10 Mo · les photos sont compressées</span>
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
                  title="Choisir un fichier"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={
              saving ||
              (isCustomForm && !customLabel.trim()) ||
              (!form.validation_date && !form.expiry_date)
            }
            className="w-full bg-[#0066FF] hover:bg-[#0052D6]"
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
  </>
  )
}
