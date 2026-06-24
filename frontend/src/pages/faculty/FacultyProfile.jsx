export default function FacultyProfile() {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="badge badgeAccent">Profile</div>
      <h1 style={{ fontSize: 26, marginTop: 12 }}>Faculty Profile</h1>
      <p style={{ opacity: 0.8, marginTop: 8, lineHeight: 1.7 }}>
        Update profile fields (mock UI). Integrate with backend later.
      </p>

      <div className="grid grid2" style={{ marginTop: 14 }}>
        <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
          <div style={{ fontWeight: 900 }}>Personal Details</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input" defaultValue="Faculty Member" />
            <input className="input" defaultValue="faculty@gmail.com" disabled />
            <input className="input" defaultValue="Department of Computer Science" />
            <button className="btn btnPrimary">Save</button>
          </div>
        </div>

        <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
          <div style={{ fontWeight: 900 }}>Update (mock)</div>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>
            This page will later call backend endpoints to update faculty info.
          </div>
          <div style={{ marginTop: 14 }} className="badge">
            Connected UI foundation
          </div>
        </div>
      </div>
    </div>
  )
}

