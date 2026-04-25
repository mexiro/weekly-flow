import { useWeekStore } from '../store/weekStore'
import { useProjectStore } from '../store/projectStore'
import { useUIStore } from '../store/uiStore'

const SECRET = import.meta.env.VITE_SYNC_SECRET as string | undefined
const ENDPOINT = (import.meta.env.VITE_SYNC_ENDPOINT as string | undefined) ?? '/api/sync'

export interface Snapshot {
  version: 1
  updatedAt: string
  pages: Record<string, any>
  projects: Record<string, any>
  ui: any
}

export function isSyncConfigured(): boolean {
  return typeof SECRET === 'string' && SECRET.length > 0
}

let hadSuccessfulPull = false

export async function pullSnapshot(): Promise<Snapshot | null> {
  if (!isSyncConfigured()) return null
  const res = await fetch(ENDPOINT, { headers: { 'x-sync-secret': SECRET! } })
  if (!res.ok) {
    console.warn('[sync] pull failed:', res.status)
    return null
  }
  const json = await res.json()
  hadSuccessfulPull = true
  return json.snapshot as Snapshot | null
}

export async function pushSnapshot(snapshot: Snapshot): Promise<boolean> {
  if (!isSyncConfigured()) return false
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-sync-secret': SECRET! },
    body: JSON.stringify(snapshot),
  })
  return res.ok
}

export function buildSnapshot(): Snapshot {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    pages: useWeekStore.getState().pages,
    projects: useProjectStore.getState().projects,
    ui: useUIStore.getState(),
  }
}

export function applySnapshot(snapshot: Snapshot) {
  useWeekStore.setState({ pages: snapshot.pages ?? {} })
  useProjectStore.setState({ projects: snapshot.projects ?? {} })
  if (snapshot.ui) useUIStore.setState(snapshot.ui)
}

let pushTimer: ReturnType<typeof setTimeout> | null = null

export function schedulePush() {
  if (!isSyncConfigured()) return
  if (!hadSuccessfulPull) {
    console.warn('[sync] skipping push — no successful pull yet')
    return
  }
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    window.dispatchEvent(new Event('sync:push-start'))
    const snap = buildSnapshot()
    const ok = await pushSnapshot(snap)
    if (ok) {
      window.dispatchEvent(new Event('sync:push-done'))
    } else {
      console.warn('[sync] push failed')
      window.dispatchEvent(new Event('sync:push-fail'))
    }
  }, 3000)
}
