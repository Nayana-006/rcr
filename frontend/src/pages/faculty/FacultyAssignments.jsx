import { useMemo, useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getCoursesByFaculty,
  getAssignmentsByCourse,
  gradeSubmission,
  createAssignment,
  deleteAssignment,
  getSubmissionsByAssignment,
  ensureArray,
} from '../../services/api'

function SubmissionBadge({ status }) {
  const cls = status === 'GRADED' ? 'badge badgeSuccess' : status === 'SUBMITTED' ? 'badge badgeAccent' : 'badge badgeDanger'
  return <span className={cls}>{status}</span>
}

export default function FacultyAssignments() {
  const { user } = useAuth()
  const facultyId = user?.id

  const [model, setModel] = useState({ courses: [], assignments: [] })
  const [activeId, setActiveId] = useState(null)
  const active = model.assignments.find((a) => a.id === activeId) ?? model.assignments[0] ?? null

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!facultyId) return
      const courses = ensureArray(await getCoursesByFaculty(facultyId))
      const assignments = []
      for (const c of courses) {
        const assigns = ensureArray(await getAssignmentsByCourse(c.id))
        for (const a of assigns) assignments.push(a)
      }
      assignments.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      if (mounted) setModel({ courses, assignments })
    }
    load()
    return () => { mounted = false }
  }, [facultyId])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState('')
  const [maxMarks, setMaxMarks] = useState('10')
  const [dueDate, setDueDate] = useState('')

  const [grade, setGrade] = useState('')
  const [submissions, setSubmissions] = useState([])

  useEffect(() => {
    let mounted = true
    async function loadSubmissions() {
      if (!active?.id) {
        if (mounted) setSubmissions([])
        return
      }
      const subs = ensureArray(await getSubmissionsByAssignment(active.id))
      if (mounted) {
        setSubmissions(
          subs.map((s) => ({
            id: s.id,
            studentName: s.studentName ?? 'Student',
            studentId: s.studentId,
            status: s.status,
            text: s.feedback ?? '',
            grade: s.grade,
            feedback: s.feedback,
          })),
        )
      }
    }
    loadSubmissions()
    return () => {
      mounted = false
    }
  }, [active?.id])

  function ensureActiveCourse() {
    const firstCourseId = model.courses[0]?.id
    const nextCourseId = courseId || firstCourseId || ''
    return nextCourseId
  }

  async function reloadAssignments() {
    const courses = ensureArray(await getCoursesByFaculty(facultyId))
    const assignments = []
    for (const c of courses) {
      const assigns = ensureArray(await getAssignmentsByCourse(c.id))
      for (const a of assigns) assignments.push(a)
    }
    assignments.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    setModel({ courses, assignments })
    return assignments
  }

  async function handleCreateAssignment() {
    const cid = ensureActiveCourse()
    if (!cid) return alert('Create a course first.')

    const t = title.trim()
    if (!t) return alert('Assignment title is required.')

    const payload = {
      courseId: Number(cid),
      title: t,
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    }

    await createAssignment(payload)
    const assignments = await reloadAssignments()
    setActiveId(assignments[0]?.id ?? null)
    setTitle('')
    setDescription('')
    setDueDate('')
    setMaxMarks('10')
  }

  async function handleGradeSubmission(submission) {
    if (!submission) return
    const marks = Number(grade)
    if (!Number.isFinite(marks)) return alert('Enter grade number (0-10).')

    await gradeSubmission({
      submissionId: submission.id,
      marks,
      feedback: '',
    })

    setGrade('')
    setActiveId(active.id)
  }

  async function handleDeleteAssignment(id) {
    if (!confirm('Delete this assignment?')) return
    await deleteAssignment(id)
    await reloadAssignments()
    setActiveId(null)
  }

  function courseTitle(courseId) {
    return model.courses.find((c) => String(c.id) === String(courseId))?.title ?? '—'
  }

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Assignments</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Create & Grade Assignments</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>Manage assignments and grade student submissions via the backend API.</p>
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '0.95fr 1.05fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Assignments</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {model.assignments.length ? (
              model.assignments.map((a) => (
                <button
                  key={a.id}
                  className="card"
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: a.id === activeId ? 'rgba(124,58,237,.10)' : 'rgba(255,255,255,.02)',
                    border: a.id === activeId ? '1px solid rgba(124,58,237,.45)' : '1px solid transparent',
                  }}
                  onClick={() => setActiveId(a.id)}
                >
                  <div style={{ fontWeight: 950 }}>{a.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Course: {courseTitle(a.courseId)}</div>
                </button>
              ))
            ) : (
              <div className="badge" style={{ opacity: 0.85 }}>No assignments yet. Create one below.</div>
            )}
          </div>

          <div className="hr" style={{ marginTop: 14 }} />

          <div style={{ fontWeight: 950, fontSize: 18 }}>Create Assignment</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <div>
              <label className="label">Course</label>
              <select className="input" value={courseId || ensureActiveCourse()} onChange={(e) => setCourseId(e.target.value)}>
                {model.courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
                {!model.courses.length && <option value="">No courses</option>}
              </select>
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Assignment 1" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" style={{ minHeight: 90, resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="label">Due date</label>
                <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Max marks</label>
                <input className="input" type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btnPrimary" onClick={handleCreateAssignment}>Create</button>
              {active && (
                <button className="btn" onClick={() => handleDeleteAssignment(active.id)}>Delete Active</button>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Submissions</div>
          <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>{active?.title ?? '—'}</div>

          <div className="hr" style={{ marginTop: 12 }} />

          {active ? (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(submissions || []).length ? (
                submissions.map((s) => (
                  <div key={s.id} className="card" style={{ padding: 12, background: 'rgba(255,255,255,.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 950 }}>{s.studentName}</div>
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>Submission (text-only)</div>
                      </div>
                      <SubmissionBadge status={s.status} />
                    </div>

                    <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>{s.text}</div>

                    {s.status !== 'GRADED' ? (
                      <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          className="input"
                          placeholder={`Grade (0-${active.maxMarks})`}
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          style={{ width: 170 }}
                        />
                        <button className="btn btnPrimary" onClick={() => handleGradeSubmission(s)}>Grade</button>
                      </div>
                    ) : (
                      <div style={{ marginTop: 10, fontSize: 13, opacity: 0.82 }}>
                        Current grade: {s.grade ?? 0}/{active.maxMarks}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="badge" style={{ opacity: 0.85 }}>No submissions yet for this assignment.</div>
              )}
            </div>
          ) : (
            <div className="badge" style={{ opacity: 0.85, marginTop: 12 }}>Select/create an assignment.</div>
          )}
        </div>
      </div>
    </div>
  )
}


