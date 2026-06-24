import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getDoubtsByFaculty, getCourseById, replyToDoubt } from '../../services/api'
import { ensureArray } from '../../services/api'

function DoubtCard({ doubt }) {
  return (
    <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 950 }}>{doubt.studentName}</div>
          <div style={{ opacity: 0.75, fontSize: 12, marginTop: 3 }}>{doubt.courseTitle}</div>
        </div>
        <div className="badge badgeAccent">{doubt.statusLabel}</div>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, opacity: 0.88 }}>{doubt.question}</div>

      {doubt.replyText ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 900, fontSize: 13, opacity: 0.9 }}>Reply</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, opacity: 0.86 }}>{doubt.replyText}</div>
        </div>
      ) : null}
    </div>
  )
}

export default function FacultyDoubts() {
  const { user } = useAuth()
  const facultyId = user?.id

  const [doubts, setDoubts] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [reply, setReply] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!facultyId) return
      const ds = await getDoubtsByFaculty(facultyId)
      const enriched = await Promise.all(
        ensureArray(ds).map(async (d) => ({
          id: d.id,
          studentName: d.studentId,
          courseTitle: (await getCourseById(d.courseId))?.title ?? 'Course',
          question: d.question,
          status: d.status,
          statusLabel: d.status === 'REPLIED' ? 'Replied' : 'Pending',
          replyText: d.reply?.text ?? '',
          studentId: d.studentId,
          courseId: d.courseId,
        }))
      )
      if (mounted) setDoubts(enriched)
    }
    load()
    return () => { mounted = false }
  }, [facultyId])

  const active = doubts.find((d) => d.id === activeId) ?? doubts[0] ?? null

  async function sendReply() {
    if (!active) return
    if (!reply.trim()) return alert('Enter a reply.')
    await replyToDoubt(active.id, reply)
    setReply('')
    // refresh
    const ds = await getDoubtsByFaculty(facultyId)
    const enriched = await Promise.all(
      ensureArray(ds).map(async (d) => ({
        id: d.id,
        studentName: d.studentId,
        courseTitle: (await getCourseById(d.courseId))?.title ?? 'Course',
        question: d.question,
        status: d.status,
        statusLabel: d.status === 'REPLIED' ? 'Replied' : 'Pending',
        replyText: d.reply?.text ?? '',
        studentId: d.studentId,
        courseId: d.courseId,
      }))
    )
    setDoubts(enriched)
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '0.95fr 1.05fr', gap: 14 }}>
      <div>
        <div className="card" style={{ padding: 16 }}>
          <div className="badge badgeAccent">Doubt Inbox</div>
          <h1 style={{ fontSize: 26, marginTop: 10 }}>Student Doubts</h1>
          <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>Select a doubt and reply (localStorage-backed).</p>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doubts.length ? (
              doubts.map((d) => (
                <button
                  key={d.id}
                  className="card"
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: d.id === activeId ? 'rgba(124,58,237,.10)' : 'rgba(255,255,255,.02)',
                  }}
                  onClick={() => setActiveId(d.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontWeight: 950 }}>{d.studentName}</div>
                    <div className="badge" style={{ opacity: 0.85 }}>{d.statusLabel}</div>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>{d.courseTitle}</div>
                </button>
              ))
            ) : (
              <div className="badge" style={{ opacity: 0.85 }}>No doubts yet.</div>
            )}
          </div>
        </div>
      </div>

      <div>
        {active ? <DoubtCard doubt={active} /> : <div className="badge" style={{ opacity: 0.85 }}>Select a doubt.</div>}

        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Write a Reply</div>
          <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>Faculty reply will appear in the student’s thread and create a notification.</div>

          <textarea
            className="input"
            style={{ minHeight: 140, marginTop: 12, resize: 'vertical' }}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            disabled={!active || active.status === 'REPLIED'}
          />

          <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btnPrimary" onClick={sendReply} disabled={!active || active.status === 'REPLIED'}>
              Send Reply
            </button>
            <button className="btn" onClick={() => setReply('')}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


