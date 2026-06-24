import { useMemo } from 'react'
import { getLocalUsers } from '../../services/api'

export default function AdminUsersFaculty() {
  const model = useMemo(() => {
    const users = getLocalUsers() ?? []
    return users
      .filter((u) => u.role === 'FACULTY')
      .slice()
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map((u) => ({ id: u.id, name: u.name ?? 'Faculty', email: u.email, active: !!u.active }))
  }, [])

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">User Management</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Manage Faculty</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>Activate/Deactivate faculty records from localStorage.</p>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontWeight: 950, fontSize: 18 }}>Faculty List</div>
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
                model.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{f.email}</td>
                    <td>
                      <span className={f.active ? 'badge badgeSuccess' : 'badge badgeDanger'}>
                        {f.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <button className="btn" onClick={() => alert('Toggle faculty activation (UI placeholder)')}>
                        Toggle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="badge" style={{ opacity: 0.8 }}>No faculty found.</div>
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


