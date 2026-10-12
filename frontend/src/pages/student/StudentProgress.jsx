import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { CircularProgress, LinearProgress } from '../../components/charts/ProgressBars'
import { getEnrollmentsByStudent, getCourseById, getAttendancePercentByStudentCourse, getStudentCourseActivityProgress, ensureArray } from '../../services/api'

export default function StudentProgress() {
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
        const enrollments = ensureArray(await getEnrollmentsByStudent(studentId))
        const courses = await Promise.all(enrollments.map(async (enrollment) => {
          const courseId = enrollment.courseId
          const [course, activity, attendance] = await Promise.all([
            getCourseById(courseId),
            getStudentCourseActivityProgress(studentId, courseId).catch(() => ({ progressPercent: 0 })),
            getAttendancePercentByStudentCourse(studentId, courseId).catch(() => ({ percent: 0 })),
          ])
          if (!course) return null
          const completion = activity.progressPercent ?? 0
          return { id: course.id, title: course.title, completion, attendance: attendance?.percent ?? 0, status: completion >= 100 ? 'Completed' : 'Ongoing' }
        }))
        const courseModels = courses.filter(Boolean)
        const completedCount = courseModels.filter((course) => course.completion >= 100).length
        const ongoingCount = courseModels.length - completedCount
        const overall = courseModels.length ? Math.round(courseModels.reduce((acc, course) => acc + course.completion, 0) / courseModels.length) : 0
        if (mounted) setModel({ courseModels, completedCount, ongoingCount, overall })
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message ?? 'Could not load course progress. Please try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [studentId, reloadKey])

  if (loading) return <div className="card" style={{ padding: 24 }}>Loading course progress…</div>
  if (error) return <div className="card" role="alert" style={{ padding: 24 }}><p>{error}</p><button className="btn btnPrimary" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></div>
  if (!model) return <div className="card" role="alert" style={{ padding: 24 }}>Sign in again to load course progress.</div>

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="badge badgeAccent">Progress</div>
            <h1 style={{ fontSize: 26, marginTop: 10 }}>Course Completion Tracking</h1>
            <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>
              Completion counts assignments submitted and quizzes attempted. Attendance is based on sessions marked by faculty.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
              <CircularProgress value={model.overall} label="Overall" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '1.1fr .9fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Ongoing Courses</div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {model.courseModels.map((c) => (
              <div key={c.id} className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 900 }}>{c.title}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="badge" style={{ opacity: 0.9 }}>
                      {c.status}
                    </span>
                    <span className="badge badgeSuccess">{c.completion}%</span>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <LinearProgress value={c.completion} label="Completion" />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.78 }}>Attendance: {c.attendance}%</div>
              </div>
            ))}

            {model.courseModels.length === 0 && (
              <div className="badge" style={{ opacity: 0.8 }}>No enrolled courses yet.</div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Completion Summary</div>

          <div className="grid grid2" style={{ marginTop: 12 }}>
            <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Completed Courses</div>
              <div style={{ fontWeight: 950, fontSize: 26, marginTop: 8 }}>{model.completedCount}</div>
            </div>
            <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Ongoing Courses</div>
              <div style={{ fontWeight: 950, fontSize: 26, marginTop: 8 }}>{model.ongoingCount}</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14, padding: 14, background: 'rgba(255,255,255,.02)' }}>
            <div style={{ fontWeight: 900 }}>How completion is calculated</div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, opacity: 0.8 }}>
              Completion increases as you submit assignments and attempt quizzes. Opening a course link updates your last accessed time only.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


