import { google, drive_v3 } from 'googleapis'

type OAuthTokens = {
  access_token?: string
  refresh_token?: string
  scope?: string
  token_type?: string
  expiry_date?: number
}

export function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth 環境変数(GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI)が未設定です')
  }

  const { OAuth2 } = google.auth
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUri)
  return oauth2Client
}

export function getDriveClient(tokens?: OAuthTokens) {
  const oauth2Client = createOAuth2Client()
  if (tokens) oauth2Client.setCredentials(tokens)
  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  return { drive, oauth2Client }
}

export async function uploadFileToDrive(params: {
  name: string
  mimeType: string
  parents?: string[]
  body: any // Readable|Buffer|Uint8Array|string
  tokens?: OAuthTokens
}): Promise<drive_v3.Schema$File> {
  const { name, mimeType, parents, body, tokens } = params
  const { drive } = getDriveClient(tokens)

  const res = await drive.files.create({
    requestBody: {
      name,
      parents,
    },
    media: {
      mimeType,
      body: body as any,
    },
    fields: 'id,name,webViewLink,webContentLink,parents',
  })
  return res.data
}

export async function listFilesInFolder(params: {
  folderId: string
  pageSize?: number
  tokens?: OAuthTokens
}): Promise<drive_v3.Schema$File[]> {
  const { folderId, pageSize = 50, tokens } = params
  const { drive } = getDriveClient(tokens)

  const q = `'${folderId}' in parents and trashed = false`
  const res = await drive.files.list({
    q,
    pageSize,
    fields: 'files(id,name,mimeType,modifiedTime,owners,parents,webViewLink)',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  })
  return res.data.files ?? []
}

export async function getShareLink(params: {
  fileId: string
  tokens?: OAuthTokens
}): Promise<{ webViewLink?: string; webContentLink?: string }> {
  const { fileId, tokens } = params
  const { drive } = getDriveClient(tokens)

  // 公開リンク権限を付与（リンクを知っている全員に閲覧許可）
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
    supportsAllDrives: true,
  })

  const res = await drive.files.get({
    fileId,
    fields: 'webViewLink,webContentLink',
    supportsAllDrives: true,
  })

  return {
    webViewLink: res.data.webViewLink ?? undefined,
    webContentLink: res.data.webContentLink ?? undefined,
  }
}


