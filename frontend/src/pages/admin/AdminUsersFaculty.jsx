import { useState, useEffect } from 'react'
import { getUsersByRole, setUserActive, ensureArray } from '../../services/api'

export default function AdminUsersFaculty() {
  const [faculty, setFaculty] = useState([])
  const [error, setError] = useState(null)

  async function loadFaculty() {
    const users = ensureArray(await getUsersByRole('FACULTY'))
    setFaculty(
      users
        .slice()
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .map((u) => ({ id: u.id, name: u.name ?? 'Faculty', email: u.email, active: !!u.active })),
    )
  }

  useEffect(() => {
    loadFaculty().catch((e) => setError(e?.response?.data?.message ?? 'Failed to load faculty'))
  }, [])

  async function toggleActive(member) {
    setError(null)
    try {
      await setUserActive(member.id, !member.active)
      await loadFaculty()
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to update faculty')
    }
  }

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">User Management</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Manage Faculty</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>Activate or deactivate faculty accounts via the backend API.</p>
        {error ? <div className="badge badgeDanger" style={{ marginTop: 12 }}>{error}</div> : null}
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
              {faculty.length ? (
                faculty.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{f.email}</td>
                    <td>
                      <span className={f.active ? 'badge badgeSuccess' : 'badge badgeDanger'}>
                        {f.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn" onClick={() => toggleActive(f)}>
                        {f.active ? 'Deactivate' : 'Activate'}
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
