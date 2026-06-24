import { useMemo, useState, useEffect } from 'react'

import { useAuth } from '../../context/AuthContext'
import { getEnrollmentsByStudent, getCourseById, getAssignmentsByCourse, submitAssignment, ensureArray } from '../../services/api'

function GradeBadge({ status }) {
  const map = {
    NOT_SUBMITTED: { text: 'Not submitted', cls: 'badge badgeDanger' },
    SUBMITTED: { text: 'Submitted', cls: 'badge badgeAccent' },
    GRADED: { text: 'Graded', cls: 'badge badgeSuccess' },
  }
  const v = map[status] ?? { text: status, cls: 'badge' }
  return <span className={v.cls}>{v.text}</span>
}

export default function StudentAssignments() {
  const { user } = useAuth()
  const studentId = user?.id

  const [activeId, setActiveId] = useState(null)
  const [answer, setAnswer] = useState('')

  const [model, setModel] = useState({ items: [], active: null })

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!studentId) return
      const enrollments = await getEnrollmentsByStudent(studentId)
      const enrolledCourseIds = new Set(ensureArray(enrollments).map((e) => e.courseId))

      // fetch assignments by calling course endpoints
      const allItems = []
      // naive: fetch all courses assignments
      for (const cid of enrolledCourseIds) {
        const assigns = await getAssignmentsByCourse(cid)
        for (const a of assigns) {
          const course = await getCourseById(a.courseId)
          const sub = (a.submissions || []).find((s) => s.studentId === studentId)
          const status = sub?.status ?? 'NOT_SUBMITTED'
          allItems.push({
            id: a.id,
            courseTitle: course?.title ?? 'Course',
            title: a.title,
            due: a.dueDate ?? '—',
            status,
            grade: sub?.grade ?? null,
            max: a.maxMarks,
            submissionText: sub?.text ?? '',
            assignment: a,
          })
        }
      }
      allItems.sort((a, b) => String(b.due).localeCompare(String(a.due)))
      const active = allItems.find((x) => x.id === activeId) ?? allItems[0] ?? null
      if (mounted) setModel({ items: allItems, active })
    }
    load()
    return () => { mounted = false }
  }, [studentId, activeId])





  async function submit() {
    if (!model.active) return
    if (!studentId) return
    if (!answer.trim()) return
    await submitAssignment({ assignmentId: model.active.id, studentId, text: answer })
    // refresh
    setActiveId(model.active.id)
  }

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="badge badgeAccent">Assignments</div>
            <h1 style={{ fontSize: 26, marginTop: 10 }}>Submit Assignments</h1>
            <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>Text-only submissions. Data is saved to localStorage.</div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '0.95fr 1.05fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Assignment List</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ensureArray(model.items).map((a) => (
              <button
                key={a.id}
                className="card"
                style={{
                  padding: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: a.id === model.active?.id ? 'rgba(124,58,237,.10)' : 'rgba(255,255,255,.02)',
                  border: a.id === model.active?.id ? '1px solid rgba(124,58,237,.45)' : '1px solid transparent',
                }}
                onClick={() => setActiveId(a.id)}
              >
                <div style={{ fontWeight: 900 }}>{a.title}</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                  {a.courseTitle} · Due {a.due}
                </div>
                <div style={{ marginTop: 8 }}>
                  <GradeBadge status={a.status} />
                </div>
              </button>
            ))}
            {model.items.length === 0 && (
              <div className="badge" style={{ opacity: 0.8 }}>
                No assignments available. Enroll a course first.
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>{model.active?.title ?? 'Select an assignment'}</div>
          <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>
            Course: {model.active?.courseTitle ?? '—'}
          </div>
          <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>Due: {model.active?.due ?? '—'}</div>

          <div className="hr" />

          <div style={{ fontWeight: 850 }}>Your Answer (Text Only)</div>
          <textarea
            className="input"
            style={{ minHeight: 180, marginTop: 10, resize: 'vertical' }}
            placeholder="Type your solution here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={!model.active}
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn btnPrimary" disabled={!answer.trim().length || !model.active} onClick={submit}>
              Submit
            </button>
            <div className="badge" style={{ opacity: 0.8 }}>
              {model.active?.status === 'GRADED'
                ? `Current grade: ${model.active.grade}/${model.active.max}`
                : `Status: ${model.active?.status ?? '—'}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


