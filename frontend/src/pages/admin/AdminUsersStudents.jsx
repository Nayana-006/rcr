import { useMemo } from 'react'
import { getLocalUsers } from '../../services/api'

export default function AdminUsersStudents() {
  const model = useMemo(() => {
    const users = getLocalUsers() ?? []
    return users
      .filter((u) => u.role === 'STUDENT')
      .slice()
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map((u) => ({ id: u.id, name: u.name ?? 'Student', email: u.email, active: !!u.active }))
  }, [])

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">User Management</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Manage Students</h1>
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
              {model.length ? (
                model.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>
                      <span className={s.active ? 'badge badgeSuccess' : 'badge badgeDanger'}>
                        {s.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <button className="btn" onClick={() => alert('Toggle student activation (UI placeholder)')}>
                        Toggle
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


