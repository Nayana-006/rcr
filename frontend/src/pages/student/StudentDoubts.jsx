import { useMemo, useState, useEffect } from 'react'

import { useAuth } from '../../context/AuthContext'
import { createDoubt, getEnrollmentsByStudent, getCourseById, getDoubtsByStudent } from '../../services/api'
import { ensureArray } from '../../services/api'

function ThreadCard({ q, reply }) {
  return (
    <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
      <div style={{ fontWeight: 950, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span>{q.course}</span>
        <span className="badge">{q.status}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>{q.question}</div>
      {reply ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 900, opacity: 0.9, fontSize: 13 }}>Faculty Reply</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>{reply}</div>
        </div>
      ) : null}
    </div>
  )
}

export default function StudentDoubts() {
  const { user } = useAuth()
  const studentId = user?.id

  const [coursesForStudent, setCoursesForStudent] = useState([])
  const [threads, setThreads] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!studentId) return
      const enrollments = await getEnrollmentsByStudent(studentId)
        const courseIds = ensureArray(enrollments).map((e) => e.courseId)
      const courseList = []
      for (const cid of courseIds) {
        const c = await getCourseById(cid)
        if (c) courseList.push(c)
      }

      const doubts = await getDoubtsByStudent(studentId)
        const mappedThreads = ensureArray(doubts).map((d) => ({
        id: d.id,
        course: (getCourseById(d.courseId)?.title) ?? 'Course',
        status: d.status === 'REPLIED' ? 'Replied' : 'Pending',
        question: d.question,
        reply: d.reply?.text ?? null,
      }))

      if (mounted) {
        setCoursesForStudent(courseList)
        setThreads(mappedThreads)
      }
    }
    load()
    return () => { mounted = false }
  }, [studentId])

  const [courseId, setCourseId] = useState(null)
  const [question, setQuestion] = useState('')




  async function submit() {
    if (!studentId) return
    if (!courseId) return
    if (!question.trim()) return alert('Please type your doubt.')

    const course = await getCourseById(courseId)
    if (!course) return

    await createDoubt({ studentId, facultyId: course.facultyId, courseId, question })
    setQuestion('')
    // refresh threads
    const doubts = await getDoubtsByStudent(studentId)
    const mapped = (doubts || []).map((d) => ({ id: d.id, course: (getCourseById(d.courseId)?.title) ?? 'Course', status: d.status === 'REPLIED' ? 'Replied' : 'Pending', question: d.question, reply: d.reply?.text ?? null }))
    setThreads(mapped)
  }

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="badge badgeAccent">Doubt Resolution</div>
          <h1 style={{ fontSize: 26, marginTop: 10 }}>Send Doubts to Faculty</h1>
          <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13, lineHeight: 1.7 }}>
            Ask course-related questions. Faculty replies will appear in your history.
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="label">Course</label>
              <select className="input" value={courseId ?? ''} onChange={(e) => setCourseId(e.target.value)} disabled={!coursesForStudent.length}>
                {coursesForStudent.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Your Question</label>
              <textarea
                className="input"
                style={{ minHeight: 140, resize: 'vertical' }}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your doubt..."
              />
            </div>

            <button className="btn btnPrimary" onClick={submit}>
              Send Doubt
            </button>

            <div className="badge" style={{ opacity: 0.8 }}>
              Your doubt is stored in localStorage.
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Doubt History</div>
          <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>Conversation threads between you and faculty.</div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {threads.length ? (
              threads.map((t) => <ThreadCard key={t.id} q={t} reply={t.reply} />)
            ) : (
              <div className="badge" style={{ opacity: 0.8 }}>
                No doubts yet. Ask your first question.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


