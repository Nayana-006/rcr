import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCoursesByFaculty, getEnrollmentsByCourse, markAttendance, getAttendancePercentByStudentCourse, ensureArray } from '../../services/api'

export default function FacultyAttendance() {
  const { user } = useAuth()
  const facultyId = user?.id

  const [model, setModel] = useState({ courses: [], courseStudents: [], percentByStudent: [] })

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!facultyId) return
  const courses = ensureArray(await getCoursesByFaculty(facultyId))
  if (mounted) setModel({ courses, courseStudents: [], percentByStudent: [] })
    }
    load()
    return () => { mounted = false }
  }, [facultyId])

  const [courseId, setCourseId] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [notes, setNotes] = useState('')

  const [students, setStudents] = useState([])
  useEffect(() => {
    let mounted = true
    async function loadStudents() {
      if (!courseId) { setStudents([]); return }
  const enrollment = ensureArray(await getEnrollmentsByCourse(courseId))
  // enrollment contains studentIds; fetch minimal student objects via course API not available — use ids only
  const studs = enrollment.map((e) => ({ id: e.studentId, name: e.studentId }))
      if (mounted) setStudents(studs)
    }
    loadStudents()
    return () => { mounted = false }
  }, [courseId])

  const [presentIds, setPresentIds] = useState(new Set())

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
    const total = students.length
    const presentCount = presentIds.size
    return Math.round((presentCount / total) * 100)
  }, [students, presentIds])

  async function handleSave() {
    if (!facultyId) return
    if (!courseId) return alert('Select course')
    if (!students.length) return alert('No enrolled students for this course')

    const payload = {
      facultyId,
      courseId,
      sessionDate: sessionDate || new Date().toISOString().slice(0, 10),
      notes,
      records: students.map((s) => ({ studentId: s.id, present: presentIds.has(s.id) })),
    }
    await markAttendance(payload)

    // reset
    setNotes('')
    setSessionDate('')
    setPresentIds(new Set())
  }

  const [percentByStudent, setPercentByStudent] = useState([])
  useEffect(() => {
    let mounted = true
    async function load() {
      if (!courseId || !students.length) { setPercentByStudent([]); return }
      const list = []
      for (const s of students) {
        const pct = await getAttendancePercentByStudentCourse(s.id, courseId)
        list.push({ studentId: s.id, name: s.name, ...pct })
      }
      if (mounted) setPercentByStudent(list)
    }
    load()
    return () => { mounted = false }
  }, [courseId, students])

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Attendance</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Mark & Update Attendance</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>Attendance is stored in localStorage and reflected in student dashboards.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Attendance Session</div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <div>
              <label className="label">Course</label>
              <select className="input" value={courseId || (model.courses[0]?.id ?? '')} onChange={(e) => setCourseId(e.target.value)}>
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
                <label className="label">Attendance % (session)</label>
                <div style={{ marginTop: 24 }} className="badge badgeSuccess">{attendancePercent}%</div>
              </div>
            </div>

            <div>
              <label className="label">Notes (optional)</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Chapter revision" />
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {students.length ? (
              students.map((s) => {
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
                      gap: 12,
                      cursor: 'pointer',
                      border: isPresent ? '1px solid rgba(34,197,94,.5)' : '1px solid transparent',
                    }}
                    onClick={() => togglePresent(s.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 900 }}>{s.name}</div>
                    </div>
                    <div className={isPresent ? 'badge badgeSuccess' : 'badge badgeDanger'}>
                      {isPresent ? 'Present' : 'Absent'}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="badge" style={{ opacity: 0.85 }}>No students enrolled for this course.</div>
            )}
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btnPrimary" onClick={handleSave} disabled={!students.length}>
              Save Attendance
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Attendance Overview</div>
          <p style={{ opacity: 0.8, marginTop: 8, lineHeight: 1.7, fontSize: 13 }}>Per-student attendance percentage computed from attendance sessions.</p>

          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            {percentByStudent.length ? (
              percentByStudent.map((s) => (
                <div key={s.studentId} className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
                  <div style={{ fontWeight: 900 }}>{s.name}</div>
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.82 }}>
                    {s.percent}% present (out of {s.total} sessions)
                  </div>
                </div>
              ))
            ) : (
              <div className="badge" style={{ opacity: 0.85 }}>Mark attendance to see percentages.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


