import React, { useRef } from 'react'
import { Paperclip, X, FileText, ImageIcon, Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

function isImage(fileOrUrl) {
  const name = fileOrUrl instanceof File ? fileOrUrl.name : typeof fileOrUrl === 'string' ? fileOrUrl : ''
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
}

export function InvoiceUpload({ file, existingUrl, amount, onFileChange, onAmountChange, showAmount = true }) {
  const fileRef   = useRef(null)
  const cameraRef = useRef(null)
  const hasFile   = file || existingUrl

  function handleChange(e) {
    const f = e.target.files?.[0] || null
    if (f && f.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 10 Mo)')
      e.target.value = ''
      return
    }
    onFileChange(f)
  }

  function clearFile() {
    onFileChange(null)
    if (fileRef.current)   fileRef.current.value   = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  return (
    <div className="space-y-3 border-t border-slate-100 pt-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Facture <span className="font-normal normal-case text-slate-300">— optionnel</span>
      </p>

      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
          {hasFile
            ? isImage(file || existingUrl)
              ? <ImageIcon className="w-4 h-4 text-slate-400" />
              : <FileText className="w-4 h-4 text-slate-400" />
            : <Paperclip className="w-4 h-4 text-slate-300" />
          }
        </div>

        <div className="flex-1 min-w-0">
          {hasFile ? (
            <>
              <p className="text-sm text-slate-700 truncate">
                {file ? file.name : 'Facture enregistrée'}
              </p>
              {existingUrl && !file && (
                <a href={existingUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#2563EB] hover:underline">
                  Voir la facture →
                </a>
              )}
            </>
          ) : (
            <span className="text-sm text-slate-400">
              Joindre une facture
              <span className="block text-xs text-slate-300 mt-0.5">JPG, PNG ou PDF · max 10 Mo</span>
            </span>
          )}
        </div>

        {hasFile ? (
          <button type="button" onClick={clearFile}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => fileRef.current?.click()}
              title="Choisir un fichier"
              className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => cameraRef.current?.click()}
              title="Prendre une photo"
              className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />

      {showAmount && (
        <div>
          <Label>Montant (€) <span className="text-slate-400 font-normal">(optionnel)</span></Label>
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => onAmountChange(e.target.value)}
            placeholder="0.00"
          />
        </div>
      )}
    </div>
  )
}
