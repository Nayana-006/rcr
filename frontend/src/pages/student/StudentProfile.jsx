export default function StudentProfile() {
  return (
    <div>
      <div className="card" style={{ padding: 18 }}>
        <div className="badge badgeAccent">Profile</div>
        <h1 style={{ fontSize: 26, marginTop: 12 }}>Student Profile</h1>
        <p style={{ opacity: 0.8, marginTop: 8, lineHeight: 1.7 }}>
          Edit profile fields and change password (UI placeholder). Connect to backend later.
        </p>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
            <div style={{ fontWeight: 900 }}>Personal Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <input className="input" defaultValue="Rural Student" aria-label="name" />
              <input className="input" defaultValue="student@gmail.com" aria-label="email" disabled />
              <input className="input" defaultValue="+91 98xxxxxx" aria-label="phone" />
              <input className="input" defaultValue="Government College" aria-label="college" />
              <button className="btn btnPrimary">Save Changes</button>
            </div>
          </div>

          <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
            <div style={{ fontWeight: 900 }}>Change Password</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <input type="password" className="input" placeholder="Current password" />
              <input type="password" className="input" placeholder="New password" />
              <input type="password" className="input" placeholder="Confirm new password" />
              <button className="btn">Update Password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

