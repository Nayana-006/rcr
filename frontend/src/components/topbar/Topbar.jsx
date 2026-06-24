import { Bell, Search, User } from 'lucide-react'

export default function Topbar() {
  return (
    <div
      className="card"
      style={{
        margin: '0 16px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        position: 'sticky',
        top: 12,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: 'rgba(124,58,237,.15)',
            border: '1px solid rgba(124,58,237,.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontWeight: 900, color: 'var(--text)' }}>R</span>
        </div>
        <div>
          <div style={{ fontWeight: 900, letterSpacing: -0.2 }}>Dashboard</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Remote Classroom</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, opacity: 0.7 }} />
          <input
            className="input"
            style={{ paddingLeft: 38, width: 260 }}
            placeholder="Search courses, assignments..."
          />
        </div>
        <button className="btn" style={{ padding: 10 }} aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 6 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={18} />
          </div>
        </div>
      </div>
    </div>
  )
}

