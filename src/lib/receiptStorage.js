import { supabase } from './supabase'

// Receipts (gas/fuel invoices attached to a mileage entry) live in the shared
// "invoices" bucket, under the org folder. Public bucket → getPublicUrl.
async function getOrgId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.user_metadata?.org_id || user.id
}

export async function uploadReceipt(file) {
  const orgId = await getOrgId()
  const ext = file.name.split('.').pop().toLowerCase()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${orgId}/receipts/${filename}`
  const { error } = await supabase.storage
    .from('invoices')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  // Bucket is private — store the path; a signed URL is minted at view time.
  return path
}

export async function deleteReceipt(stored) {
  if (!stored) return
  let path = stored
  for (const m of ['/object/public/invoices/', '/object/sign/invoices/', '/invoices/']) {
    const i = stored.indexOf(m)
    if (i !== -1) { path = stored.slice(i + m.length).split('?')[0]; break }
  }
  await supabase.storage.from('invoices').remove([path])
}
