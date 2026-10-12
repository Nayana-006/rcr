import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LinearProgress } from '../../components/charts/ProgressBars'
import { getAttendanceByStudent, ensureArray } from '../../services/api'

export default function StudentAttendance() {
  const { user } = useAuth()
  const studentId = user?.userId ?? user?.id

  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!studentId) return
      setLoading(true)
      setError('')
      try {
        const attendanceSessions = ensureArray(await getAttendanceByStudent(studentId))
        const presentCount = attendanceSessions.filter((session) => session.present).length
        if (mounted) {
          setModel({
            percent: attendanceSessions.length ? Math.round((presentCount / attendanceSessions.length) * 100) : 0,
            courseTitle: 'Overall Attendance',
            sessions: attendanceSessions.slice(0, 8),
            hasAnySessions: attendanceSessions.length > 0,
          })
        }
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message ?? 'Could not load attendance. Please try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [studentId, reloadKey])

  if (loading) return <div className="card" style={{ padding: 24 }}>Loading attendance…</div>
  if (error) return <div className="card" role="alert" style={{ padding: 24 }}><p>{error}</p><button className="btn btnPrimary" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></div>
  if (!model) return <div className="card" role="alert" style={{ padding: 24 }}>Sign in again to load attendance.</div>

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Attendance</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Attendance Records</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>
          View your attendance percentage and recent attendance sessions.
        </p>

        <div className="grid" style={{ gridTemplateColumns: '0.95fr 1.05fr', gap: 14, marginTop: 12 }}>
          <div className="card" style={{ padding: 16, background: 'rgba(255,255,255,.02)' }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Your Attendance</div>
            <div style={{ marginTop: 14 }}>
              <LinearProgress value={model.percent} label={model.courseTitle} />
            </div>
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.78 }}>
              Target: 90%+ recommended for better course outcomes.
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Recent Sessions</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {model.hasAnySessions ? (
                ensureArray(model.sessions).map((s) => (
                  <div
                    key={s.sessionId}
                    className="card"
                    style={{
                      padding: 12,
                      background: 'rgba(255,255,255,.02)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900 }}>{s.sessionDate}</div>
                      <div style={{ fontSize: 12, opacity: 0.72, marginTop: 3 }}>{s.courseTitle}</div>
                    </div>
                    <div className={s.present ? 'badge badgeSuccess' : 'badge badgeDanger'}>
                      {s.present ? 'Present' : 'Absent'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="badge" style={{ opacity: 0.8 }}>
                  No attendance sessions yet. Ask faculty to mark attendance.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
