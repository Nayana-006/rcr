
import { useEffect, useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import { getNotificationsForUser, markNotificationRead, ensureArray } from '../../services/api'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} mins ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hours ago`
  const days = Math.floor(hrs / 24)
  return `${days} days ago`
}

export default function StudentNotifications() {
  const { user } = useAuth()
  const studentId = user?.userId ?? user?.id

  // notifications loaded from backend API


  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!studentId) return
  const notes = await getNotificationsForUser(studentId)
  if (mounted) setNotifications(ensureArray(notes))
    }
    load()
    return () => { mounted = false }
  }, [studentId])

  async function markRead(id) {
    await markNotificationRead(id)
  const notes = await getNotificationsForUser(studentId)
  setNotifications(ensureArray(notes))
  }


  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Notifications</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Your Updates</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>
          Notifications for assignments, doubts replies, and related updates.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 14, marginTop: 14 }}>
        {notifications.length ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{ padding: 14, background: 'rgba(255,255,255,.02)', opacity: n.read ? 0.8 : 1 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 950 }}>{n.title}</div>
                <div className={n.read ? 'badge' : 'badge badgeAccent'}>{n.read ? 'Read' : 'New'}</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>{n.body}</div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>{timeAgo(n.createdAt)}</div>

              {!n.read && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn" onClick={() => markRead(n.id)}>
                    Mark as read
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="badge" style={{ opacity: 0.8 }}>
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  )
}


