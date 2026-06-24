import { useMemo, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { CircularProgress } from '../../components/charts/ProgressBars'
import { getCoursesByFaculty, getEnrollmentsByCourse, getAttendanceByStudent, getAttendancePercentByStudentCourse, getDoubtsByFaculty, getAssignmentsByCourse, getCourseById, ensureArray } from '../../services/api'


function StatCard({ title, value, sub }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{title}</div>
      <div style={{ fontWeight: 950, fontSize: 26, marginTop: 6 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{sub}</div> : null}
    </div>
  )
}

function computeStudentCourseCompletion({ studentId, courseId, assignments }) {
  const courseAssignments = assignments.filter((a) => a.courseId === courseId)
  if (!courseAssignments.length) return 0

  let gradedOrSubmitted = 0
  for (const a of courseAssignments) {
    const sub = (a.submissions || []).find((s) => s.studentId === studentId)
    if (sub?.status === 'SUBMITTED' || sub?.status === 'GRADED') gradedOrSubmitted += 1
  }

  return Math.round((gradedOrSubmitted / courseAssignments.length) * 100)
}

export default function FacultyDashboard() {
  const { user } = useAuth()
  const facultyId = user?.userId ?? user?.id
  const [model, setModel] = useState({ totalCourses: 0, totalStudents: 0, assignmentRate: 0, attendanceAvg: 0, recentDoubts: [], studentProgress: [] })

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!facultyId) return
  let courses = ensureArray(await getCoursesByFaculty(facultyId))
  const courseIds = courses.map((c) => c.id)
      const enrolledStudentsByCourse = []
      const allAssignments = []
      for (const cid of courseIds) {
  const enrollments = ensureArray(await getEnrollmentsByCourse(cid))
  enrolledStudentsByCourse.push({ courseId: cid, studentIds: enrollments.map((e) => e.studentId) })
  const assigns = ensureArray(await getAssignmentsByCourse(cid))
  allAssignments.push(...assigns)
      }

  const allDoubts = ensureArray(await getDoubtsByFaculty(facultyId))

      const totalCourses = courses.length
      const studentSet = new Set(enrolledStudentsByCourse.flatMap((x) => x.studentIds))
      const totalStudents = studentSet.size

      let attendanceSum = 0
      let attendanceWeight = 0
      let completionSum = 0
      let completionWeight = 0
      const studentProgress = []

      for (const c of courses) {
        const enrollments = ensureArray(await getEnrollmentsByCourse(c.id))
        const studentIds = enrollments.map((e) => e.studentId)

        let courseCompletionSum = 0
        let courseCompletionWeight = 0
        for (const sid of studentIds) {
          const att = await getAttendancePercentByStudentCourse(sid, c.id)
          attendanceSum += (att.percent || 0) * (att.total || 1)
          attendanceWeight += att.total || 1

          const completion = computeStudentCourseCompletion({ studentId: sid, courseId: c.id, assignments: allAssignments })
          courseCompletionSum += completion
          courseCompletionWeight += 1
        }

        const courseCompletion = courseCompletionWeight ? Math.round(courseCompletionSum / courseCompletionWeight) : 0
        studentProgress.push({ course: c.title, completion: courseCompletion })
        completionSum += courseCompletion
        completionWeight += 1
      }

      const attendanceAvg = attendanceWeight ? Math.round(attendanceSum / attendanceWeight) : 0
      const assignmentRate = completionWeight ? Math.round(completionSum / completionWeight) : 0

  const recentDoubts = ensureArray(allDoubts).filter((d) => d.status === 'PENDING' || d.status === 'REPLIED').slice(0, 3)
  const recent = await Promise.all(recentDoubts.map(async (d) => ({ student: d.studentId, course: (await getCourseById(d.courseId))?.title ?? 'Course', text: d.question, status: d.status === 'REPLIED' ? 'Replied' : 'Pending', doubtId: d.id })))

      if (mounted) setModel({ totalCourses, totalStudents, assignmentRate, attendanceAvg, recentDoubts: recent, studentProgress })
    }
    load()
    return () => { mounted = false }
  }, [facultyId])

  if (!model) return null
  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        <StatCard title="Total Courses" value={model.totalCourses} sub="Active courses" />
        <StatCard title="Total Students" value={model.totalStudents} sub="Enrolled students" />
        <StatCard title="Attendance Avg" value={`${model.attendanceAvg}%`} sub="Computed from sessions" />
        <StatCard title="Assignment Rate" value={`${model.assignmentRate}%`} sub="Avg completion" />
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '1.1fr .9fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div className="badge badgeAccent">Student Performance</div>
              <div style={{ fontWeight: 950, fontSize: 18, marginTop: 8 }}>Course completion overview</div>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>Track completion computed from submissions.</div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
                <CircularProgress value={model.attendanceAvg} label="Attendance" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ensureArray(model.studentProgress).map((p) => (
              <div key={p.course} className="card" style={{ padding: 12, background: 'rgba(255,255,255,.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 900 }}>{p.course}</div>
                  <div className="badge badgeSuccess">{p.completion}%</div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 10, borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(255,255,255,.03)' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${p.completion}%`,
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, rgba(124,58,237,.95), rgba(34,197,94,.75))',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Recent Doubts</div>
          <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>Reply to student questions to maintain conversation history.</div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ensureArray(model.recentDoubts).length ? (
              ensureArray(model.recentDoubts).map((d, idx) => (
                <div key={idx} className="card" style={{ padding: 12, background: 'rgba(255,255,255,.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>{d.student}</div>
                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>{d.course}</div>
                    </div>
                    <div className={d.status === 'Replied' ? 'badge badgeSuccess' : 'badge badgeAccent'}>{d.status}</div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>{d.text}</div>
                </div>
              ))
            ) : (
              <div className="badge" style={{ opacity: 0.85 }}>No doubts yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


