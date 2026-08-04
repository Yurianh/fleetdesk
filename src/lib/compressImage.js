// Downscale + re-encode images before upload so document photos (a permis shot
// on a phone can be 3–8 Mo) stay small and don't eat into Supabase storage.
// PDFs and non-images pass through untouched.
const MAX_DIM = 1600   // longest edge, px — plenty to read a scanned document
const QUALITY = 0.8    // JPEG quality

export async function compressImage(file) {
  if (!file || !file.type?.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', QUALITY))
    // Keep the original if compression didn't actually shrink it.
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.\w+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified })
  } catch {
    // Some formats (e.g. HEIC on Chrome) can't be decoded to a canvas — fall
    // back to the original; the 10 Mo cap still guards against huge files.
    return file
  }
}
