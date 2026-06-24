import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { roleOptions, register, loading } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [error, setError] = useState(null)

  const canSubmit = useMemo(() => {
    return email.trim().includes('@') && name.trim().length >= 2 && password.length >= 6 && role
  }, [email, name, password, role])

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!canSubmit) {
      setError('Enter a valid name, email, and password (min 6 characters).')
      return
    }

    try {
      const u = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      })
      if (u.role === 'STUDENT') return navigate('/student')
      if (u.role === 'FACULTY') return navigate('/faculty')
      return navigate('/admin')
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Registration failed. Please try again.'
      setError(msg)
    }
  }

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 30 }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
        <div>
          <div className="badge badgeAccent">Register</div>
          <h1 style={{ fontSize: 34, marginTop: 12 }}>Create your account</h1>
          <p style={{ opacity: 0.8, lineHeight: 1.7, marginTop: 10 }}>
            Register with the backend API. You will be logged in automatically after registration.
          </p>

          {error ? (
            <div className="badge badgeDanger" style={{ marginTop: 14, display: 'block' }}>
              {error}
            </div>
          ) : null}

          <div className="card" style={{ padding: 14, marginTop: 18, background: 'rgba(255,255,255,.02)' }}>
            <div style={{ fontWeight: 900 }}>Role-based experience</div>
            <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6, marginTop: 8 }}>
              Select your role when registering. Faculty can create courses; students can enroll.
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <form onSubmit={onSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
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
              <div>
                <label className="label">Role</label>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  {roleOptions.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn btnPrimary" disabled={!canSubmit || loading}>
                {loading ? 'Creating...' : 'Register'}
              </button>

              <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.6 }}>
                Already have an account?
                <a href="/login" style={{ marginLeft: 8, textDecoration: 'underline' }}>
                  Login
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
