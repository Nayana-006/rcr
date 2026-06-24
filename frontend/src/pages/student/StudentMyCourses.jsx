import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LinearProgress } from '../../components/charts/ProgressBars'
import {
  getEnrollmentsByStudent,
  getCourseById,
  getAssignmentsByCourse,
  getSubmissionsByStudent,
  getAttendancePercentByStudentCourse,
  ensureArray,
} from '../../services/api'

function MaterialLink({ id, label, href }) {
  return (
    <a className="card" style={{ padding: 12, textDecoration: 'none' }} href={href} target="_blank" rel="noreferrer">
      <div style={{ fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{href}</div>
    </a>
  )
}

function computeCourseCompletion({ courseId, studentId, assignments, submissions }) {
  const courseAssignments = assignments.filter((a) => String(a.courseId) === String(courseId))
  if (!courseAssignments.length) return 0

  let gradedOrSubmitted = 0
  for (const a of courseAssignments) {
    const sub = submissions.find(
      (s) => String(s.assignmentId) === String(a.id) && String(s.studentId) === String(studentId),
    )
    if (sub?.status === 'SUBMITTED' || sub?.status === 'GRADED') gradedOrSubmitted += 1
  }
  return Math.round((gradedOrSubmitted / courseAssignments.length) * 100)
}

export default function StudentMyCourses() {
  const { user } = useAuth()
  const studentId = user?.userId ?? user?.id

  const [activeId, setActiveId] = useState(null)
  const [model, setModel] = useState({ courses: [], active: null })
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!studentId) return
      setError(null)
      try {
        const enrollments = ensureArray(await getEnrollmentsByStudent(studentId))
        const submissions = ensureArray(await getSubmissionsByStudent(studentId))
        const courses = []

        for (const e of enrollments) {
          const c = await getCourseById(e.courseId)
          if (!c) continue
          const assignments = ensureArray(await getAssignmentsByCourse(e.courseId))
          const completion = computeCourseCompletion({
            courseId: e.courseId,
            studentId,
            assignments,
            submissions,
          })
          const att = await getAttendancePercentByStudentCourse(studentId, e.courseId)
          const materials = ensureArray(c.learningLinks).map((l) => ({
            id: l.id,
            label: l.label,
            href: l.url,
            type: l.type,
          }))
          courses.push({
            id: c.id,
            title: c.title,
            faculty: c.facultyName ?? 'Faculty',
            completion,
            attendance: att.percent,
            materials,
            primaryUrl: materials[0]?.href ?? null,
          })
        }

        const active = courses.find((c) => String(c.id) === String(activeId)) ?? courses[0] ?? null
        if (mounted) setModel({ courses, active })
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message ?? 'Failed to load courses')
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [studentId, activeId])

  const active = model.active

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="badge badgeAccent">My Courses</div>
            <h1 style={{ fontSize: 26, marginTop: 10 }}>Enrolled Courses</h1>
            <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>Open study materials uploaded by faculty.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {ensureArray(model.courses).map((c) => (
              <button
                key={c.id}
                type="button"
                className="btn"
                style={{
                  background: String(c.id) === String(active?.id) ? 'rgba(124,58,237,.14)' : undefined,
                  borderColor: String(c.id) === String(active?.id) ? 'rgba(124,58,237,.55)' : undefined,
                }}
                onClick={() => setActiveId(c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
        {error ? <div className="badge badgeDanger" style={{ marginTop: 12 }}>{error}</div> : null}
      </div>

      {!model.courses.length ? (
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div className="badge" style={{ opacity: 0.85 }}>You are not enrolled in any courses yet.</div>
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '0.95fr 1.05fr', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>{active?.title ?? 'No enrolled courses'}</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>Faculty: {active?.faculty ?? '-'}</div>

            {active?.primaryUrl ? (
              <div style={{ marginTop: 14 }}>
                <a className="btn btnPrimary" href={active.primaryUrl} target="_blank" rel="noreferrer">
                  Open Course
                </a>
              </div>
            ) : active ? (
              <div className="badge" style={{ marginTop: 14, opacity: 0.8 }}>No learning materials yet.</div>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
                <LinearProgress value={active?.completion ?? 0} label="Course Completion" />
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.85 }}>
                  <span>Attendance</span>
                  <span>{active?.attendance ?? 0}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, marginTop: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,.03)' }}>
                  <div style={{ height: '100%', width: `${active?.attendance ?? 0}%`, borderRadius: 999, background: 'linear-gradient(90deg, rgba(34,197,94,.85), rgba(124,58,237,.65))' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Study Materials</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>Click to open external learning links.</div>
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {(active?.materials || []).map((m) => (
                <MaterialLink key={m.id ?? m.href} id={m.id} label={m.label} href={m.href} />
              ))}
              {active && (!active.materials || active.materials.length === 0) && (
                <div className="badge" style={{ opacity: 0.75 }}>Faculty has not added learning links yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
