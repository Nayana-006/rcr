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

function computeCourseCompletion({ courseId, studentId, assignments }) {
  const courseAssignments = assignments.filter((a) => a.courseId === courseId)
  if (!courseAssignments.length) return 0

  let gradedOrSubmitted = 0
  for (const a of courseAssignments) {
    const sub = (a.submissions || []).find((s) => s.studentId === studentId)
    if (sub?.status === 'SUBMITTED' || sub?.status === 'GRADED') gradedOrSubmitted += 1
  }

  return Math.round((gradedOrSubmitted / courseAssignments.length) * 100)
}


export default function StudentDashboard() {
  const { user } = useAuth()
  const studentId = user?.userId ?? user?.id

  const [model, setModel] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!studentId) return

          let enrollments = await getEnrollmentsByStudent(studentId)
          enrollments = ensureArray(enrollments)
      const enrolledCourses = []
      for (const e of enrollments) {
        const c = await getCourseById(e.courseId)
        if (c) enrolledCourses.push(c)
      }

      const totalEnrolled = enrolledCourses.length

      let attendanceSum = 0
      let attendanceWeight = 0
      const courseProgress = []
      let pendingAssignments = 0

      for (const c of enrolledCourses) {
        const att = await getAttendancePercentByStudentCourse(studentId, c.id)
        attendanceSum += (att.percent || 0) * (att.total || 1)
        attendanceWeight += att.total || 1

        // compute completion by fetching assignments
  let courseAssignments = await getAssignmentsByCourse(c.id)
  courseAssignments = ensureArray(courseAssignments)
        let gradedOrSubmitted = 0
        for (const a of courseAssignments) {
          const sub = (a.submissions || []).find((s) => s.studentId === studentId)
          if (sub?.status === 'SUBMITTED' || sub?.status === 'GRADED') gradedOrSubmitted += 1
          if (!sub || sub.status === 'NOT_SUBMITTED') pendingAssignments += 1
        }
        const completion = courseAssignments.length ? Math.round((gradedOrSubmitted / courseAssignments.length) * 100) : 0

        courseProgress.push({ course: c.title, completion, attendance: att.percent })
      }

      const attendancePercent = attendanceWeight ? Math.round(attendanceSum / attendanceWeight) : 0
  const overallCompletion = totalEnrolled ? Math.round((ensureArray(courseProgress).reduce((acc, p) => acc + (p.completion || 0), 0)) / totalEnrolled) : 0

  let notifications = await getNotificationsForUser(studentId)
  notifications = ensureArray(notifications)
  const recentAnnouncementsRaw = notifications.filter((n) => n.meta?.kind === 'DOUBT_REPLIED' || n.meta?.kind === 'ASSIGNMENT_GRADED').slice(0,2)
      const recentAnnouncements = await Promise.all(recentAnnouncementsRaw.map(async (n) => ({ course: (await getCourseById(n.meta?.courseId))?.title ?? '', text: n.body })))

      let doubts = await getDoubtsByStudent(studentId)
      doubts = ensureArray(doubts)
      const recentReplies = doubts
        .filter((d) => d.status === 'REPLIED')
        .slice(0, 2)
        .map((d) => ({ by: 'Faculty', text: d.reply?.text ?? '' }))

      if (mounted) {
        setModel({ totalEnrolled, attendancePercent, overallCompletion, pendingAssignments, recentAnnouncements, recentReplies, courseProgress })
      }
    }

    load()
    return () => { mounted = false }
  }, [studentId])

  if (!model) return null


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


