import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { CircularProgress, LinearProgress } from '../../components/charts/ProgressBars'
import {
  getEnrollmentsByStudent,
  getNotificationsForUser,
  getAttendancePercentByStudentCourse,
  getAssignmentsByCourse,
  getDoubtsByStudent,
  getCourseById,
  getSubmissionsByStudent,
  getStudentCourseActivityProgress,
  ensureArray,
} from '../../services/api'


function StatCard({ title, value, sub }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{title}</div>
      <div style={{ fontWeight: 950, fontSize: 26, marginTop: 6 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{sub}</div> : null}
    </div>
  )
}

export default function StudentDashboard() {
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
      const enrolledCourses = (await Promise.all(enrollments.map((enrollment) => getCourseById(enrollment.courseId).catch(() => null)))).filter(Boolean)
      const totalEnrolled = enrolledCourses.length
      const [submissions, attendanceAndProgress] = await Promise.all([
        getSubmissionsByStudent(studentId).then(ensureArray).catch(() => []),
        Promise.all(enrolledCourses.map(async (course) => {
          const [attendance, activities, assignments] = await Promise.all([
            getAttendancePercentByStudentCourse(studentId, course.id).catch(() => ({ percent: 0, total: 0 })),
            getStudentCourseActivityProgress(studentId, course.id).catch(() => ({ progressPercent: 0 })),
            getAssignmentsByCourse(course.id).then(ensureArray).catch(() => []),
          ])
          return { course, attendance, completion: activities.progressPercent ?? 0, assignments }
        })),
      ])
      const attendanceRows = attendanceAndProgress
      const attendanceSum = attendanceRows.reduce((sum, row) => sum + (row.attendance.percent || 0) * (row.attendance.total || 0), 0)
      const attendanceWeight = attendanceRows.reduce((sum, row) => sum + (row.attendance.total || 0), 0)
      const courseProgress = attendanceRows.map(({ course, attendance, completion }) => ({ course: course.title, completion, attendance: attendance.percent ?? 0 }))
      const pendingAssignments = attendanceRows.reduce((count, row) => count + row.assignments.filter((assignment) => !submissions.some((submission) => String(submission.assignmentId) === String(assignment.id))).length, 0)
      const attendancePercent = attendanceWeight ? Math.round(attendanceSum / attendanceWeight) : 0
  const overallCompletion = totalEnrolled ? Math.round((ensureArray(courseProgress).reduce((acc, p) => acc + (p.completion || 0), 0)) / totalEnrolled) : 0

  const notifications = await getNotificationsForUser(studentId).then(ensureArray).catch(() => [])
  const recentAnnouncementsRaw = notifications.filter((n) => n.meta?.kind === 'DOUBT_REPLIED' || n.meta?.kind === 'ASSIGNMENT_GRADED').slice(0,2)
      const recentAnnouncements = await Promise.all(recentAnnouncementsRaw.map(async (n) => ({ course: (await getCourseById(n.meta?.courseId).catch(() => null))?.title ?? '', text: n.body })))

      const doubts = await getDoubtsByStudent(studentId).then(ensureArray).catch(() => [])
      const recentReplies = doubts
        .filter((d) => d.status === 'REPLIED')
        .slice(0, 2)
        .map((d) => ({ by: 'Faculty', text: d.reply?.text ?? '' }))

      if (mounted) {
        setModel({ totalEnrolled, attendancePercent, overallCompletion, pendingAssignments, recentAnnouncements, recentReplies, courseProgress })
      }
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message ?? 'Could not load your dashboard. Please try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [studentId, reloadKey])

  if (loading) return <div className="card" style={{ padding: 24 }}>Loading your dashboard…</div>
  if (error) return <div className="card" role="alert" style={{ padding: 24 }}><p>{error}</p><button className="btn btnPrimary" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></div>
  if (!model) return <div className="card" role="alert" style={{ padding: 24 }}>Sign in again to load your dashboard.</div>


  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        <StatCard title="Total Courses" value={model.totalEnrolled} sub="Enrolled" />
        <StatCard title="Attendance" value={`${model.attendancePercent}%`} sub="This month" />
        <StatCard title="Overall Completion" value={`${model.overallCompletion}%`} sub="All courses" />
        <StatCard title="Pending Assignments" value={model.pendingAssignments} sub="Needs submission" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.1fr .9fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div className="badge badgeAccent" style={{ display: 'inline-flex' }}>
                Progress Overview
              </div>
              <div style={{ fontWeight: 950, fontSize: 18, marginTop: 10 }}>Course completion tracking</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CircularProgress value={model.overallCompletion} label="Overall" />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            {model.courseProgress.map((p) => (
              <div
                key={p.course}
                className="card"
                style={{ padding: 14, background: 'rgba(255,255,255,.02)', marginTop: 12 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div style={{ fontWeight: 900 }}>{p.course}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>Attendance: {p.attendance}%</div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <LinearProgress value={p.completion} label="Completion" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Recent Activity</div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 850, opacity: 0.9 }}>Recent Updates</div>
            {(model.recentAnnouncements || []).map((a, idx) => (
              <div
                key={idx}
                className="card"
                style={{ padding: 12, marginTop: 10, background: 'rgba(255,255,255,.02)' }}
              >
                <div style={{ fontSize: 12, opacity: 0.75 }}>{a.course}</div>
                <div style={{ fontSize: 13, fontWeight: 750, marginTop: 4 }}>{a.text}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 850, opacity: 0.9 }}>Recent Faculty Replies</div>
            {(model.recentReplies || []).map((r, idx) => (
              <div
                key={idx}
                className="card"
                style={{ padding: 12, marginTop: 10, background: 'rgba(255,255,255,.02)' }}
              >
                <div style={{ fontSize: 12, opacity: 0.75 }}>{r.by}</div>
                <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{r.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


