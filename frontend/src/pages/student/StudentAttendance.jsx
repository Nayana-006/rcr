import { useMemo, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LinearProgress } from '../../components/charts/ProgressBars'
import { getEnrollmentsByStudent, getAttendanceByStudent, getAttendancePercentByStudentCourse, getCourseById } from '../../services/api'
import { ensureArray } from '../../services/api'

export default function StudentAttendance() {
  const { user } = useAuth()
  const studentId = user?.id

  const [model, setModel] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!studentId) return
      const enrollments = await getEnrollmentsByStudent(studentId)
      const courseIds = ensureArray(enrollments).map((e) => e.courseId)

      const attendanceSessions = await getAttendanceByStudent(studentId)
      const firstCourseId = courseIds[0] ?? null
      const percentModel = firstCourseId ? await getAttendancePercentByStudentCourse(studentId, firstCourseId) : { percent: 0, total: 0, presentCount: 0 }

      if (mounted) {
        setModel({
          percent: percentModel.percent,
          courseTitle: firstCourseId ? (await getCourseById(firstCourseId))?.title ?? 'Course' : '—',
          sessions: (attendanceSessions || []).slice(0, 8),
          hasAnySessions: (attendanceSessions || []).length > 0,
          attendanceCount: (attendanceSessions || []).length,
        })
      }
    }
    load()
    return () => { mounted = false }
  }, [studentId])

  if (!model) return null

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
              <LinearProgress value={model.percent} label={`${model.courseTitle}`} />
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
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{s.sessionDate}</div>
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


