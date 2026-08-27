import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCoursesByFaculty, getEnrollmentsByCourse, getAttendancePercentByStudentCourse, getAssignmentsByCourse, ensureArray } from '../../services/api'

function computeCompletion({ studentId, courseId, assignments }) {
  const courseAssignments = assignments.filter((a) => a.courseId === courseId)
  if (!courseAssignments.length) return 0

  let gradedOrSubmitted = 0
  for (const a of courseAssignments) {
    const sub = (a.submissions || []).find((s) => s.studentId === studentId)
    if (sub?.status === 'SUBMITTED' || sub?.status === 'GRADED') gradedOrSubmitted += 1
  }
  return Math.round((gradedOrSubmitted / courseAssignments.length) * 100)
}

export default function FacultyStudentProgress() {
  const { user } = useAuth()
  const facultyId = user?.userId ?? user?.id

  const [model, setModel] = useState({ rows: [] })

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!facultyId) return
      const courses = ensureArray(await getCoursesByFaculty(facultyId))
      const rows = []
      for (const c of courses) {
        const enrollments = ensureArray(await getEnrollmentsByCourse(c.id))
        const assignments = ensureArray(await getAssignmentsByCourse(c.id))
        for (const e of enrollments) {
          const completion = computeCompletion({ studentId: e.studentId, courseId: c.id, assignments })
          const att = await getAttendancePercentByStudentCourse(e.studentId, c.id)
          const studentName = e.studentId
          rows.push({ studentId: e.studentId, studentName, courseId: c.id, courseTitle: c.title, completion, attendance: att.percent })
        }
      }

      rows.sort((a, b) => {
        const c = String(a.courseTitle).localeCompare(String(b.courseTitle))
        if (c !== 0) return c
        return b.completion - a.completion
      })

      if (mounted) setModel({ rows })
    }
    load()
    return () => { mounted = false }
  }, [facultyId])

  if (!model) return null

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Student Monitoring</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Student Progress Reports</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>Computed completion and attendance per student for your courses.</p>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontWeight: 950, fontSize: 18 }}>Progress Table</div>

        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Completion</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.length ? (
                model.rows.map((r) => (
                  <tr key={`${r.studentId}_${r.courseId}`}>
                    <td>{r.studentName}</td>
                    <td>{r.courseTitle}</td>
                    <td>{r.completion}%</td>
                    <td>{r.attendance}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="badge" style={{ opacity: 0.8 }}>No students enrolled for your courses yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


