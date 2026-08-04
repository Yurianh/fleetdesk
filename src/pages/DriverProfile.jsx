import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { updateDriver } from '@/lib/useFleetData'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, IdCard, Check } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import { usePageTitle } from '@/lib/usePageTitle'

// A chauffeur completes their own conducteur record (created pending at invite).
// RLS lets them update only the drivers row linked to their account.
export default function DriverProfile() {
  usePageTitle('Mon profil')
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    supabase.from('drivers').select('*').eq('member_user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!alive) return
        setRecord(data)
        setForm(data ? {
          name: data.name || '', phone: data.phone || '', date_of_birth: data.date_of_birth || '',
          address: data.address || '', dkv_card: data.dkv_card || '', highway_badge: data.highway_badge || '', wash_card: data.wash_card || '',
        } : null)
        setLoading(false)
      })
    return () => { alive = false }
  }, [user.id])

  const save = async () => {
    if (!record || !form.name.trim()) { toast.error('Votre nom est requis.'); return }
    setSaving(true)
    try {
      await updateDriver(record.id, { ...form, date_of_birth: form.date_of_birth || null, pending: false })
      toast.success('Profil enregistré.')
      setRecord(r => ({ ...r, pending: false }))
    } catch (e) { toast.error(e.message || 'Erreur lors de l\'enregistrement.') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>

  if (!record) return (
    <div className="p-5 sm:p-8 max-w-2xl">
      <PageHeader title="Mon profil" description="Aucune fiche conducteur associée à votre compte." />
      <p className="text-sm text-zinc-500">Contactez le responsable de votre flotte.</p>
    </div>
  )

  return (
    <div className="p-5 sm:p-8 max-w-2xl">
      <PageHeader title="Mon profil" description="Complétez vos informations de conducteur." />

      {record.pending && (
        <div className="flex items-start gap-3 rounded-xl bg-[#0066FF]/[0.04] border border-[#0066FF]/15 px-4 py-3 mb-6">
          <IdCard className="w-4 h-4 text-[#0066FF] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-600">Votre profil est incomplet. Renseignez vos informations pour que votre flotte soit à jour.</p>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Nom complet *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jean Dupont" /></div>
          <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 00 00 00 00" /></div>
          <div><Label>Date de naissance</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></div>
          <div><Label>Adresse</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="12 rue de la Paix, 75001 Paris" /></div>
        </div>
        <div className="border-t border-zinc-100 pt-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Cartes & badges</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><Label>Carte DKV</Label><Input value={form.dkv_card} onChange={e => setForm({ ...form, dkv_card: e.target.value })} placeholder="N° carte" /></div>
            <div><Label>Badge autoroute</Label><Input value={form.highway_badge} onChange={e => setForm({ ...form, highway_badge: e.target.value })} placeholder="N° badge" /></div>
            <div><Label>Carte lavage</Label><Input value={form.wash_card} onChange={e => setForm({ ...form, wash_card: e.target.value })} placeholder="N° carte" /></div>
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={saving} className="bg-[#0066FF] hover:bg-[#0052D6]">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : <><Check className="w-4 h-4 mr-1.5" />Enregistrer</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
