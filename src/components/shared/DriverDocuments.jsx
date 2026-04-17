import React, { useState, useRef } from 'react'
import { FileText, Pencil, Trash2, X, Check, AlertTriangle, CheckCircle2, Clock, Upload, ExternalLink, Loader2, ChevronDown, ChevronUp, Plus } from 'lucide-react'
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
  const [validExpanded, setValidExpanded] = useState(false)
  const fileRef = useRef(null)

  const docsByType = {}
  for (const d of documents) {
    docsByType[d.type] = d
  }

  const [showHelp, setShowHelp] = useState(false)

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

  // Categorise documents by urgency
  const expiredTypes = []       // days < 0 → critical
  const expiringSoonTypes = []  // 0 ≤ days ≤ 60 → warning
  const missingTypes = []       // no doc at all
  const validTypes = []         // days > 60 or no expiry set

  for (const type of DOC_TYPES_ORDER) {
    const doc = docsByType[type]
    if (!doc) {
      missingTypes.push(type)
    } else if (!doc.expiry_date) {
      validTypes.push(type)
    } else {
      const days = differenceInDays(new Date(doc.expiry_date), new Date())
      if (days < 0) expiredTypes.push(type)
      else if (days <= 60) expiringSoonTypes.push(type)
      else validTypes.push(type)
    }
  }

  const completedCount = validTypes.length
  const totalCount = DOC_TYPES_ORDER.length
  const progressPct = Math.round((completedCount / totalCount) * 100)
  const overallStatus = expiredTypes.length > 0 ? 'expired'
    : expiringSoonTypes.length > 0 ? 'expiring'
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
            {completedCount}/{totalCount} en règle
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

      {/* ── Expirés ── */}
      {expiredTypes.length > 0 && (
        <div>
          <div className="px-5 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">
              Expirés · {expiredTypes.length}
            </span>
          </div>
          <div className="divide-y divide-red-50">
            {expiredTypes.map(type => {
              const doc = docsByType[type]
              const days = Math.abs(differenceInDays(new Date(doc.expiry_date), new Date()))
              return (
                <div key={type} className="flex items-center gap-3 px-5 py-3.5 bg-red-50/30 hover:bg-red-50/60 transition-colors border-l-2 border-red-400">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">{DOC_TYPE_CONFIG[type].label}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />Expiré il y a {days}j
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {doc.expiry_date && (
                        <span className="text-xs text-slate-400">
                          Expiré le {format(new Date(doc.expiry_date), 'd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline">
                          <ExternalLink className="w-3 h-3" />PDF
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openEdit(doc)}
                      className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                      Mettre à jour
                    </button>
                    <button onClick={() => setDeleteTarget(doc)}
                      className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Expire bientôt ── */}
      {expiringSoonTypes.length > 0 && (
        <div className={expiredTypes.length > 0 ? 'border-t border-slate-100' : ''}>
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">
              Expire bientôt · {expiringSoonTypes.length}
            </span>
          </div>
          <div className="divide-y divide-amber-50/60">
            {expiringSoonTypes.map(type => {
              const doc = docsByType[type]
              const days = differenceInDays(new Date(doc.expiry_date), new Date())
              return (
                <div key={type} className="flex items-center gap-3 px-5 py-3.5 bg-amber-50/20 hover:bg-amber-50/50 transition-colors border-l-2 border-amber-400">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">{DOC_TYPE_CONFIG[type].label}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />Expire dans {days}j
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {doc.expiry_date && (
                        <span className="text-xs text-slate-400">
                          Expire le {format(new Date(doc.expiry_date), 'd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline">
                          <ExternalLink className="w-3 h-3" />PDF
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openEdit(doc)}
                      className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
                      Renouveler
                    </button>
                    <button onClick={() => setDeleteTarget(doc)}
                      className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── À compléter ── */}
      {missingTypes.length > 0 && (
        <div className={(expiredTypes.length > 0 || expiringSoonTypes.length > 0) ? 'border-t border-slate-100' : ''}>
          <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              À compléter · {missingTypes.length}
            </span>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {missingTypes.map(type => (
                <button
                  key={type}
                  onClick={() => openAdd(type)}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-200 hover:border-[#2563EB] hover:bg-[#2563EB]/5 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-[#2563EB]/10 flex items-center justify-center shrink-0 transition-colors">
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 leading-tight transition-colors">
                      {DOC_TYPE_CONFIG[type].label}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-[#2563EB] shrink-0 transition-colors">
                    Ajouter →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── En règle (collapsible) ── */}
      {validTypes.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setValidExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50/80 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">
                En règle · {validTypes.length}
              </span>
            </div>
            {validExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-300" />
              : <ChevronDown className="w-4 h-4 text-slate-300" />
            }
          </button>
          {validExpanded && (
            <div className="divide-y divide-slate-50">
              {validTypes.map(type => {
                const doc = docsByType[type]
                return (
                  <div key={type} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors group">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{DOC_TYPE_CONFIG[type].label}</p>
                      {doc && (
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-400">
                            Validé le {format(new Date(doc.validation_date), 'd MMM yyyy', { locale: fr })}
                          </span>
                          {doc.expiry_date && (
                            <span className="text-xs text-slate-400">
                              · Expire le {format(new Date(doc.expiry_date), 'd MMM yyyy', { locale: fr })}
                            </span>
                          )}
                          {doc.notes && <span className="text-xs text-slate-400 italic">· {doc.notes}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc?.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => openEdit(doc)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(doc)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
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
  </>
  )
}
