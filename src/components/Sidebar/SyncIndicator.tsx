import { useEffect, useState } from 'react'
import { isSyncConfigured } from '../../sync/cloudSync'

type SyncStatus = 'local-only' | 'idle' | 'syncing' | 'synced' | 'offline'

export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>(
    isSyncConfigured() ? 'idle' : 'local-only'
  )
  const [lastPushed, setLastPushed] = useState<Date | null>(null)

  useEffect(() => {
    if (!isSyncConfigured()) return

    function onStart() { setStatus('syncing') }
    function onDone() { setLastPushed(new Date()); setStatus('synced') }
    function onFail() { setStatus('offline') }

    window.addEventListener('sync:push-start', onStart)
    window.addEventListener('sync:push-done', onDone)
    window.addEventListener('sync:push-fail', onFail)

    return () => {
      window.removeEventListener('sync:push-start', onStart)
      window.removeEventListener('sync:push-done', onDone)
      window.removeEventListener('sync:push-fail', onFail)
    }
  }, [])

  function label() {
    if (status === 'local-only') return 'Local · no sync'
    if (status === 'idle') return 'Cloud sync on'
    if (status === 'syncing') return 'Syncing\u2026'
    if (status === 'offline') return 'Sync offline'
    if (status === 'synced' && lastPushed) {
      const sec = Math.floor((Date.now() - lastPushed.getTime()) / 1000)
      if (sec < 10) return 'Synced · just now'
      const min = Math.floor(sec / 60)
      if (min < 60) return `Synced · ${min}m ago`
    }
    return 'Synced'
  }

  return <span>{label()}</span>
}
