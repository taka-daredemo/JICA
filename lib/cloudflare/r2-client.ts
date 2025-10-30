type UploadBody = Blob | ArrayBuffer | Uint8Array | Buffer | ReadableStream | string

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME

export function getR2PublicUrl(key: string) {
  if (!ACCOUNT_ID || !BUCKET_NAME) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID と CLOUDFLARE_R2_BUCKET_NAME を設定してください')
  }
  const safeKey = key.replace(/^\/+/, '')
  return `https://pub-${ACCOUNT_ID}.r2.dev/${BUCKET_NAME}/${safeKey}`
}

export async function uploadWithPresignedUrl(
  presignedUrl: string,
  body: UploadBody,
  contentType?: string
) {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: contentType ? { 'content-type': contentType } : undefined,
    body: body as any,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`R2 upload failed: ${res.status} ${res.statusText} ${text}`)
  }
  return true
}

export async function fetchObject(key: string) {
  const url = getR2PublicUrl(key)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`R2 fetch failed: ${res.status} ${res.statusText}`)
  }
  return res
}


