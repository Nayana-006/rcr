export default function ForgotPasswordPage() {
  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 30 }}>
      <div className="card" style={{ padding: 18, maxWidth: 760, margin: '0 auto' }}>
        <div className="badge badgeAccent">Forgot Password</div>
        <h1 style={{ fontSize: 32, marginTop: 12 }}>Reset your account</h1>
        <p style={{ opacity: 0.8, marginTop: 10, lineHeight: 1.7 }}>
          UI placeholder. Connect this screen to backend endpoint later.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <input className="input" placeholder="Email" style={{ flex: '1 1 240px' }} />
          <button className="btn btnPrimary">Send reset link</button>
        </div>

        <div className="badge" style={{ marginTop: 14, opacity: 0.85 }}>
          Tip: Use the Login page role dropdown for demo.
        </div>
      </div>
    </div>
  )
}

