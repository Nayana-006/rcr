import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getCoursesByFaculty,
  getEnrollmentsByCourse,
  markAttendanceBulk,
  getAttendancePercentByStudentCourse,
  ensureArray,
} from '../../services/api'

export default function FacultyAttendance() {
  const { user } = useAuth()
  const facultyId = user?.userId ?? user?.id

  const [model, setModel] = useState({ courses: [] })
  const [courseId, setCourseId] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [students, setStudents] = useState([])
  const [presentIds, setPresentIds] = useState(new Set())
  const [percentByStudent, setPercentByStudent] = useState([])
  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!facultyId) return
      const courses = ensureArray(await getCoursesByFaculty(facultyId))
      if (mounted) {
        setModel({ courses })
        setCourseId((current) => current || String(courses[0]?.id ?? ''))
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [facultyId])

  useEffect(() => {
    let mounted = true
    async function loadStudents() {
      if (!courseId) {
        setStudents([])
        return
      }
      const enrollment = ensureArray(await getEnrollmentsByCourse(courseId))
      const studs = enrollment.map((e) => ({ id: e.studentId, name: e.studentName ?? `Student ${e.studentId}` }))
      if (mounted) setStudents(studs)
    }
    loadStudents()
    return () => {
      mounted = false
    }
  }, [courseId])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!courseId || !students.length) {
        if (mounted) setPercentByStudent([])
        return
      }
      const list = []
      for (const s of students) {
        const pct = await getAttendancePercentByStudentCourse(s.id, courseId)
        list.push({ studentId: s.id, name: s.name, ...pct })
      }
      if (mounted) setPercentByStudent(list)
    }
    load()
    return () => {
      mounted = false
    }
  }, [courseId, students])

  function togglePresent(studentId) {
    setPresentIds((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const attendancePercent = useMemo(() => {
    if (!students.length) return 0
    return Math.round((presentIds.size / students.length) * 100)
  }, [students, presentIds])

  async function handleSave() {
    if (!facultyId || !courseId || !students.length) return
    setSaving(true)
    setError(null)
    try {
      const date = sessionDate || new Date().toISOString().slice(0, 10)
      await markAttendanceBulk({
        facultyId,
        courseId: Number(courseId),
        date,
        records: students.map((s) => ({
          studentId: s.id,
          present: presentIds.has(s.id),
        })),
      })
      setToast('Attendance saved')
      setPresentIds(new Set())
      setSessionDate('')
      const refreshed = []
      for (const s of students) {
        const pct = await getAttendancePercentByStudentCourse(s.id, courseId)
        refreshed.push({ studentId: s.id, name: s.name, ...pct })
      }
      setPercentByStudent(refreshed)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Attendance</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Mark & Update Attendance</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>Attendance is saved per student via the backend API.</p>
        {toast ? <div className="badge badgeSuccess" style={{ marginTop: 12 }}>{toast}</div> : null}
        {error ? <div className="badge badgeDanger" style={{ marginTop: 12 }}>{error}</div> : null}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Attendance Session</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <div>
              <label className="label">Course</label>
              <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                {model.courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
                {!model.courses.length && <option value="">No courses</option>}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Session %</label>
                <div style={{ marginTop: 24 }} className="badge badgeSuccess">{attendancePercent}%</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {students.length ? students.map((s) => {
              const isPresent = presentIds.has(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  className="card"
                  style={{
                    padding: 12,
                    background: 'rgba(255,255,255,.02)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    border: isPresent ? '1px solid rgba(34,197,94,.5)' : '1px solid transparent',
                  }}
                  onClick={() => togglePresent(s.id)}
                >
                  <div style={{ fontWeight: 900 }}>{s.name}</div>
                  <div className={isPresent ? 'badge badgeSuccess' : 'badge badgeDanger'}>
                    {isPresent ? 'Present' : 'Absent'}
                  </div>
                </button>
              )
            }) : (
              <div className="badge" style={{ opacity: 0.85 }}>No students enrolled for this course.</div>
            )}
          </div>

          <div style={{ marginTop: 14 }}>
            <button type="button" className="btn btnPrimary" onClick={handleSave} disabled={!students.length || saving}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Attendance Overview</div>
          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            {percentByStudent.length ? percentByStudent.map((s) => (
              <div key={s.studentId} className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
                <div style={{ fontWeight: 900 }}>{s.name}</div>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.82 }}>
                  {s.percent}% present ({s.presentCount}/{s.total} sessions)
                </div>
              </div>
            )) : (
              <div className="badge" style={{ opacity: 0.85 }}>Mark attendance to see percentages.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
