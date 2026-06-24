import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminDashboard } from '../../services/api'

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
  const navigate = useNavigate()
  const [model, setModel] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    activeStudents: 0,
    activeFaculty: 0,
    enrollmentRate: 0,
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await getAdminDashboard()
        if (mounted) setModel(data)
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message ?? 'Failed to load dashboard')
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      {error ? <div className="badge badgeDanger" style={{ marginBottom: 14 }}>{error}</div> : null}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        <StatCard title="Total Students" value={model.totalStudents} sub="Registered students" />
        <StatCard title="Total Faculty" value={model.totalFaculty} sub="Registered faculty" />
        <StatCard title="Total Courses" value={model.totalCourses} sub="All courses" />
        <StatCard title="Total Enrollments" value={model.totalEnrollments} sub="Active enrollments" />
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '1.1fr .9fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="badge badgeAccent">System Statistics</div>
          <div style={{ fontWeight: 950, fontSize: 18, marginTop: 10 }}>Overall usage snapshot</div>
          <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6, lineHeight: 1.7 }}>
            Live statistics from the backend dashboard API.
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
            <button type="button" className="btn btnPrimary" onClick={() => navigate('/admin/users/students')}>
              Manage Students
            </button>
            <button type="button" className="btn" onClick={() => navigate('/admin/users/faculty')}>
              Manage Faculty
            </button>
            <button type="button" className="btn" onClick={() => navigate('/admin/courses')}>
              Manage Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
