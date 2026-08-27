import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getDoubtsByFaculty, replyToDoubt, ensureArray } from '../../services/api'

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
      {doubt.reply ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 900, fontSize: 13, opacity: 0.9 }}>Reply</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, opacity: 0.86 }}>{doubt.reply}</div>
        </div>
      ) : null}
    </div>
  )
}

export default function FacultyDoubts() {
  const { user } = useAuth()
  const facultyId = user?.userId ?? user?.id

  const [doubts, setDoubts] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [reply, setReply] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!facultyId) return
    let mounted = true
    async function load() {
      try {
        const ds = ensureArray(await getDoubtsByFaculty(facultyId))
        if (mounted) setDoubts(ds)
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message ?? 'Failed to load doubts')
      }
    }
    load()
    return () => { mounted = false }
  }, [facultyId])

  async function reload() {
    if (!facultyId) return
    const ds = ensureArray(await getDoubtsByFaculty(facultyId))
    setDoubts(ds)
  }

  const active = doubts.find((d) => String(d.id) === String(activeId)) ?? doubts[0] ?? null

  async function sendReply() {
    if (!active || !reply.trim()) return alert('Enter a reply.')
    setError(null)
    try {
      await replyToDoubt(active.id, reply.trim())
      setReply('')
      await reload()
      setActiveId(active.id)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to send reply')
    }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: '0.95fr 1.05fr', gap: 14 }}>
      <div>
        <div className="card" style={{ padding: 16 }}>
          <div className="badge badgeAccent">Doubt Inbox</div>
          <h1 style={{ fontSize: 26, marginTop: 10 }}>Student Doubts</h1>
          {error ? <div className="badge badgeDanger" style={{ marginTop: 12 }}>{error}</div> : null}

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doubts.length ? doubts.map((d) => (
              <button
                key={d.id}
                type="button"
                className="card"
                style={{
                  padding: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: String(d.id) === String(active?.id) ? 'rgba(124,58,237,.10)' : 'rgba(255,255,255,.02)',
                }}
                onClick={() => setActiveId(d.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 950 }}>{d.studentName}</div>
                  <div className="badge">{d.statusLabel}</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>{d.courseTitle}</div>
              </button>
            )) : (
              <div className="badge" style={{ opacity: 0.85 }}>No doubts yet.</div>
            )}
          </div>
        </div>
      </div>

      <div>
        {active ? <DoubtCard doubt={active} /> : <div className="badge" style={{ opacity: 0.85 }}>Select a doubt.</div>}

        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Write a Reply</div>
          <textarea
            className="input"
            style={{ minHeight: 140, marginTop: 12, resize: 'vertical' }}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            disabled={!active || active.status === 'RESOLVED'}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            <button type="button" className="btn btnPrimary" onClick={sendReply} disabled={!active || active.status === 'RESOLVED'}>
              Send Reply
            </button>
            <button type="button" className="btn" onClick={() => setReply('')}>Clear</button>
          </div>
        </div>
      </div>
    </div>
  )
}
