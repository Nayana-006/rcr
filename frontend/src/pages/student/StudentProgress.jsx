import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { CircularProgress, LinearProgress } from '../../components/charts/ProgressBars'
import { getEnrollmentsByStudent, getCourseById, getAttendancePercentByStudentCourse, getProgressByStudent, ensureArray } from '../../services/api'

export default function StudentProgress() {
  const { user } = useAuth()
  const studentId = user?.userId ?? user?.id

  const [model, setModel] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!studentId) return
      const enrollments = ensureArray(await getEnrollmentsByStudent(studentId))
      const progressRecords = ensureArray(await getProgressByStudent(studentId))
      const courseIds = (enrollments || []).map((e) => e.courseId)
      const courses = []
      for (const cid of courseIds) {
        const c = await getCourseById(cid)
        if (!c) continue
        const progress = progressRecords.find((p) => String(p.courseId) === String(cid))
        const completion = progress?.progressPercent ?? 0
        const att = await getAttendancePercentByStudentCourse(studentId, cid)
        const attendancePercent = att?.percent ?? 0
        courses.push({ id: c.id, title: c.title, completion, attendance: attendancePercent, status: completion >= 100 ? 'Completed' : 'Ongoing' })
      }

      const completedCount = courses.filter((c) => c.completion >= 100).length
      const ongoingCount = courses.length - completedCount
      const overall = courses.length ? Math.round(courses.reduce((acc, c) => acc + c.completion, 0) / courses.length) : 0
      if (mounted) setModel({ courseModels: courses, completedCount, ongoingCount, overall })
    }
    load()
    return () => { mounted = false }
  }, [studentId])

  if (!model) return null

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
              Computed from your submissions (completion) and attendance sessions (attendance %).
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
              Completion reaches 100% after you open a course learning link for the first time.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


