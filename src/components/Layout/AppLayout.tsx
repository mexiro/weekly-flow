import type { ReactNode } from 'react'
import { Sidebar } from '../Sidebar/Sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, height: '100%', overflow: 'hidden', background: '#fff' }}>
        {children}
      </main>
    </div>
  )
}
