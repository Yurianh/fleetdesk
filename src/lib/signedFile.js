import { supabase } from './supabase'

// The "invoices" bucket is private. Files are stored as a path (new uploads) or,
// for legacy rows, a public URL. Normalize to a path, then mint a short-lived
// signed URL on demand — never a permanent public link.
function toPath(stored) {
  if (!stored) return null
  const markers = ['/object/public/invoices/', '/object/sign/invoices/', '/invoices/']
  for (const m of markers) {
    const i = stored.indexOf(m)
    if (i !== -1) return stored.slice(i + m.length).split('?')[0]
  }
  return stored // already a bare path
}

export async function getSignedUrl(stored, expiresIn = 3600) {
  const path = toPath(stored)
  if (!path) return null
  const { data, error } = await supabase.storage.from('invoices').createSignedUrl(path, expiresIn)
  if (error) return null
  return data?.signedUrl || null
}

// Open a stored file in a new tab via a fresh signed URL. The tab is opened
// synchronously (inside the click) to dodge popup blockers, then redirected.
export async function openSignedFile(stored) {
  const w = window.open('', '_blank')
  const url = await getSignedUrl(stored)
  if (!w) return
  if (url) w.location.href = url
  else w.close()
}
