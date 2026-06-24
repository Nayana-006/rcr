import { useMemo, useState, useEffect } from 'react'
import { getLocalUsers, getCourses, getEnrollmentsByCourse, ensureArray } from '../../services/api'

function StatCard({ title, value, sub }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{title}</div>
      <div style={{ fontWeight: 950, fontSize: 26, marginTop: 6 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{sub}</div> : null}
    </div>
  )
}

export default function AdminDashboard() {
  const [model, setModel] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    activeStudents: 0,
    activeFaculty: 0,
    enrollmentRate: 0,
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      const users = getLocalUsers() ?? []
  const courses = ensureArray(await getCourses())

      const students = users.filter((u) => u.role === 'STUDENT')
      const faculty = users.filter((u) => u.role === 'FACULTY')

      let totalEnrollments = 0
      for (const c of courses) {
        const enrollments = ensureArray(await getEnrollmentsByCourse(c.id))
        totalEnrollments += enrollments.filter((e) => e.status === 'ACTIVE').length
      }

      const activeStudents = students.filter((s) => s.active).length
      const activeFaculty = faculty.filter((f) => f.active).length

      const enrollmentRate = students.length ? Math.round((totalEnrollments / students.length) * 10) / 10 : 0

      const next = {
        totalStudents: students.length,
        totalFaculty: faculty.length,
        totalCourses: (courses || []).length,
        totalEnrollments,
        activeStudents,
        activeFaculty,
        enrollmentRate,
      }

      if (mounted) setModel(next)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
  <StatCard title="Total Students" value={model?.totalStudents ?? 0} sub="Registered students" />
  <StatCard title="Total Faculty" value={model?.totalFaculty ?? 0} sub="Registered faculty" />
  <StatCard title="Total Courses" value={model?.totalCourses ?? 0} sub="All courses" />
  <StatCard title="Total Enrollments" value={model?.totalEnrollments ?? 0} sub="Active enrollments" />
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '1.1fr .9fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="badge badgeAccent">System Statistics</div>
          <div style={{ fontWeight: 950, fontSize: 18, marginTop: 10 }}>Overall usage snapshot</div>
          <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6, lineHeight: 1.7 }}>
            Computed from localStorage data (users, courses, enrollments).
          </div>

          <div style={{ marginTop: 14, overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Active Students</td>
                  <td>{model.activeStudents}</td>
                  <td>
                    <span className={model.activeStudents ? 'badge badgeSuccess' : 'badge badgeDanger'}>
                      {model.activeStudents ? 'Healthy' : 'None'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Active Faculty</td>
                  <td>{model.activeFaculty}</td>
                  <td>
                    <span className={model.activeFaculty ? 'badge badgeSuccess' : 'badge badgeDanger'}>
                      {model.activeFaculty ? 'Active' : 'None'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Enrollment Rate</td>
                  <td>{model.enrollmentRate}x</td>
                  <td>
                    <span className="badge badgeAccent">Computed</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Quick Actions</div>
          <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>Admin modules:</div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btnPrimary" onClick={() => alert('Open manage students (UI placeholder)')}>
              Manage Students
            </button>
            <button className="btn" onClick={() => alert('Open manage faculty (UI placeholder)')}>
              Manage Faculty
            </button>
            <button className="btn" onClick={() => alert('Open manage courses (UI placeholder)')}>
              Manage Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


