interface EmptyProjectsStateProps {
  onAdd: () => void
}

export function EmptyProjectsState({ onAdd }: EmptyProjectsStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 32px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
      <p style={{
        fontFamily: "'Inter', system-ui, sans-serif", fontSize: 16,
        fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px',
      }}>
        No projects yet
      </p>
      <p style={{
        fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14,
        color: 'var(--text-secondary)', margin: '0 0 24px', maxWidth: 280,
      }}>
        Projects are ongoing initiatives that span multiple weeks. Add up to 5 at a time.
      </p>
      <button
        onClick={onAdd}
        style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500,
          fontFamily: "'Inter', system-ui, sans-serif", cursor: 'pointer',
        }}
      >
        + New Project
      </button>
    </div>
  )
}
