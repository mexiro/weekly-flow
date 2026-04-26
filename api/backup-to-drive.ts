import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { google } from 'googleapis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Read snapshot from KV
    const snapshot = await redis.get<string>('weeklyflow:snapshot')
    if (!snapshot) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'no snapshot in KV' })
    }

    // 2. Authenticate with Google via service account
    const keyJson = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!, 'base64').toString()
    )
    const auth = new google.auth.GoogleAuth({
      credentials: keyJson,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })
    const drive = google.drive({ version: 'v3', auth })

    const folderId = process.env.GDRIVE_BACKUP_FOLDER_ID!
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const fileName = `weeklyflow-${today}.json`

    // 3. Check if today's file already exists (idempotent)
    const existing = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
    })
    if (existing.data.files && existing.data.files.length > 0) {
      return res.status(200).json({ ok: true, skipped: true, reason: 'already backed up today' })
    }

    // 4. Upload snapshot as JSON file
    const content = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot)
    const { Readable } = await import('stream')
    const stream = Readable.from([content])

    const uploaded = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/json',
      },
      media: {
        mimeType: 'application/json',
        body: stream,
      },
      fields: 'id,size',
    })

    const fileId = uploaded.data.id!
    const fileSize = Number(uploaded.data.size ?? 0)

    // 5. Prune files older than 30 days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    const old = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and createdTime < '${cutoff.toISOString()}'`,
      fields: 'files(id,name)',
    })
    const pruned: string[] = []
    for (const f of old.data.files ?? []) {
      if (f.id) {
        await drive.files.delete({ fileId: f.id })
        pruned.push(f.name ?? f.id)
      }
    }

    // 6. Write backup log entry to KV
    await redis.set('weeklyflow:backup-log', {
      date: today,
      fileId,
      fileSize,
      pruned,
      updatedAt: new Date().toISOString(),
    })

    return res.status(200).json({ ok: true, fileName, fileId, fileSize, pruned })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[backup-to-drive]', message)
    return res.status(500).json({ ok: false, error: message })
  }
}
