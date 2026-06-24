import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const canSubmit = useMemo(() => {
    return email.trim().includes('@') && password.length >= 6
  }, [email, password])

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError('Please enter a valid email and password (min 6 characters).')
      return
    }

    try {
      const u = await login({ email: email.trim(), password })

      if (u.role === 'STUDENT') return navigate('/student')
      if (u.role === 'FACULTY') return navigate('/faculty')
      return navigate('/admin')
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Login failed. Please try again.'
      setError(msg)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 30 }}>
      <div className="grid" style={{ gridTemplateColumns: '1.05fr .95fr', gap: 18, alignItems: 'start' }}>
        <div>
          <div className="badge badgeAccent">Remote Classroom</div>
          <h1 style={{ fontSize: 34, marginTop: 12 }}>Login</h1>
          <p style={{ opacity: 0.8, lineHeight: 1.7, marginTop: 10 }}>
            Sign in with your registered email and password. Your role is determined by your account.
          </p>

          {error ? (
            <div className="badge badgeDanger" style={{ marginTop: 14, display: 'block' }}>
              {error}
            </div>
          ) : null}

          <div className="grid grid2" style={{ marginTop: 18 }}>
            {[
              { t: 'Student', d: 'Track courses, attendance, assignments and replies.' },
              { t: 'Faculty', d: 'Manage courses, grade assignments, mark attendance.' },
              { t: 'Admin', d: 'Manage users and view system statistics.' },
            ].map((x) => (
              <div key={x.t} className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
                <div style={{ fontWeight: 900 }}>{x.t}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8, lineHeight: 1.6 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18, position: 'sticky', top: 20 }}>
          <form onSubmit={onSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>

              <button className="btn btnPrimary" disabled={!canSubmit || loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.6 }}>
                <div>
                  Forgot password? (UI placeholder)
                  <a href="/forgot" style={{ marginLeft: 8, textDecoration: 'underline' }}>
                    Reset
                  </a>
                </div>
                <div style={{ marginTop: 8 }}>
                  New here?
                  <a href="/register" style={{ marginLeft: 8, textDecoration: 'underline' }}>
                    Register
                  </a>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
