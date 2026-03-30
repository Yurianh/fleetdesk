import { supabase } from './supabase'

async function getOrgId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.user_metadata?.org_id || user.id
}

export async function uploadInvoice(file, entityType) {
  const orgId = await getOrgId()
  const ext = file.name.split('.').pop().toLowerCase()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${orgId}/${entityType}/${filename}`
  const { error } = await supabase.storage
    .from('invoices')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('invoices').getPublicUrl(path)
  return data.publicUrl
}

export async function deleteInvoice(publicUrl) {
  if (!publicUrl) return
  const marker = '/object/public/invoices/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  await supabase.storage.from('invoices').remove([path])
}
