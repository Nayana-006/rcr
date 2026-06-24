import { useState, useEffect } from 'react'
import { getUsersByRole, setUserActive, ensureArray } from '../../services/api'

export default function AdminUsersStudents() {
  const [students, setStudents] = useState([])
  const [error, setError] = useState(null)

  async function loadStudents() {
    const users = ensureArray(await getUsersByRole('STUDENT'))
    setStudents(
      users
        .slice()
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .map((u) => ({ id: u.id, name: u.name ?? 'Student', email: u.email, active: !!u.active })),
    )
  }

  useEffect(() => {
    loadStudents().catch((e) => setError(e?.response?.data?.message ?? 'Failed to load students'))
  }, [])

  async function toggleActive(student) {
    setError(null)
    try {
      await setUserActive(student.id, !student.active)
      await loadStudents()
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to update student')
    }
  }

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">User Management</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Manage Students</h1>
        {error ? <div className="badge badgeDanger" style={{ marginTop: 12 }}>{error}</div> : null}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontWeight: 950, fontSize: 18 }}>Students</div>

        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.length ? (
                students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>
                      <span className={s.active ? 'badge badgeSuccess' : 'badge badgeDanger'}>
                        {s.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn" onClick={() => toggleActive(s)}>
                        {s.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="badge" style={{ opacity: 0.8 }}>No students found.</div>
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
