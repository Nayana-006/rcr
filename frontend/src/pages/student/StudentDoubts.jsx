import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createDoubt, getEnrollmentsByStudent, getDoubtsByStudent, ensureArray } from '../../services/api'

function ThreadCard({ thread }) {
  return (
    <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
      <div style={{ fontWeight: 950, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span>{thread.courseTitle}</span>
        <span className="badge">{thread.statusLabel}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>{thread.question}</div>
      {thread.reply ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 900, opacity: 0.9, fontSize: 13 }}>Faculty Reply</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>{thread.reply}</div>
        </div>
      ) : null}
    </div>
  )
}

export default function StudentDoubts() {
  const { user } = useAuth()
  const studentId = user?.userId ?? user?.id

  const [coursesForStudent, setCoursesForStudent] = useState([])
  const [threads, setThreads] = useState([])
  const [courseId, setCourseId] = useState('')
  const [question, setQuestion] = useState('')
  const [error, setError] = useState(null)

  async function loadThreads() {
    if (!studentId) return
    const doubts = ensureArray(await getDoubtsByStudent(studentId))
    setThreads(doubts)
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!studentId) return
      try {
        const enrollments = ensureArray(await getEnrollmentsByStudent(studentId))
        const courseList = enrollments.map((e) => ({
          id: e.courseId,
          title: e.courseTitle ?? `Course ${e.courseId}`,
        }))
        const doubts = ensureArray(await getDoubtsByStudent(studentId))
        if (mounted) {
          setCoursesForStudent(courseList)
          setThreads(doubts)
          if (courseList.length && !courseId) setCourseId(String(courseList[0].id))
        }
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message ?? 'Failed to load doubts')
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [studentId, courseId])

  async function submit() {
    if (!studentId || !courseId || !question.trim()) return alert('Please select a course and type your doubt.')
    setError(null)
    try {
      await createDoubt({ studentId, courseId: Number(courseId), question: question.trim() })
      setQuestion('')
      await loadThreads()
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to send doubt')
    }
  }

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="badge badgeAccent">Doubt Resolution</div>
          <h1 style={{ fontSize: 26, marginTop: 10 }}>Send Doubts to Faculty</h1>
          {error ? <div className="badge badgeDanger" style={{ marginTop: 12 }}>{error}</div> : null}

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="label">Course</label>
              <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={!coursesForStudent.length}>
                {coursesForStudent.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
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
            <button type="button" className="btn btnPrimary" onClick={submit}>Send Doubt</button>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Doubt History</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {threads.length ? (
              threads.map((t) => <ThreadCard key={t.id} thread={t} />)
            ) : (
              <div className="badge" style={{ opacity: 0.8 }}>No doubts yet. Ask your first question.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
