import { useEffect, useState } from 'react'

import {
  getCourses,
  getEnrollmentsByCourse,
  ensureArray,
  updateCourse,
} from '../../services/api'

export default function AdminCourses() {

  const [model, setModel] = useState([])
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)

  async function loadCourses() {
    const courses = ensureArray(await getCourses())
    const rows = []
    for (const c of courses) {
      const enrollments = ensureArray(await getEnrollmentsByCourse(c.id))
      const studentCount = enrollments.filter((e) => e.status === 'ACTIVE').length
      const learningLinksCount = (c.learningLinks || []).length
      rows.push({ id: c.id, title: c.title, facultyName: c.facultyId ?? 'Faculty', studentCount, learningLinksCount, isActive: c.isActive })
    }
    setModel(rows)
  }

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        if (!mounted) return
        setError(null)
        await loadCourses()
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message ?? 'Failed to load courses')
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  async function handleToggleActive(course) {
    if (!course?.id) return
    setError(null)
    setSavingId(course.id)
    try {
      // Best-effort: backend course update endpoint likely accepts an `active` field.
      await updateCourse(course.id, { active: !course.isActive })
      await loadCourses()
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to update course')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>


      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Course Management</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Manage Courses</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>View all courses from the backend.</p>
      </div>

      {error ? (
        <div className="badge badgeDanger" style={{ marginBottom: 14 }}>{error}</div>
      ) : null}

      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontWeight: 950, fontSize: 18 }}>All Courses</div>

        <div style={{ overflowX: 'auto', marginTop: 12 }}>

          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Faculty</th>
                <th>Students</th>
                <th>Learning Links</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {model.length ? (
                model.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 850 }}>
                      {c.title}{' '}
                      <span className={c.isActive ? 'badge badgeSuccess' : 'badge badgeDanger'} style={{ marginLeft: 8 }}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{c.facultyName}</td>
                    <td>{c.studentCount}</td>
                    <td>{c.learningLinksCount}</td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        disabled={String(savingId) === String(c.id)}
                        onClick={() => handleToggleActive(c)}
                      >
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (

                <tr>
                  <td colSpan={5}>
                    <div className="badge" style={{ opacity: 0.8 }}>No courses found.</div>
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


