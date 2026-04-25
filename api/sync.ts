import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const KEY = 'weeklyflow:snapshot'

export default async function handler(req: Request): Promise<Response> {
  const secret = req.headers.get('x-sync-secret')
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (req.method === 'GET') {
    const data = await redis.get(KEY)
    return new Response(JSON.stringify({ snapshot: data ?? null }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  if (req.method === 'POST') {
    const body = await req.json()
    if (!body || typeof body !== 'object' || !body.updatedAt) {
      return new Response('Bad payload', { status: 400 })
    }
    await redis.set(KEY, body)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config = { runtime: 'edge' }
