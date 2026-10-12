import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMeetingById, joinMeeting, updateMeetingStatus } from '../../services/api'
import { Loader2, ArrowLeft, Video } from 'lucide-react'
import { toast } from 'sonner'

export default function LiveClassRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [meeting, setMeeting] = useState(null)
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadMeeting = useCallback(async () => {
    try {
      setMeeting(await getMeetingById(id))
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'You cannot access this class')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    // Load the authorized meeting state without changing its lifecycle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMeeting()
  }, [loadMeeting])

  const handleStatus = async (status) => {
    setActionLoading(true)
    try {
      const updated = await updateMeetingStatus(id, status)
      setMeeting(updated)
      setRoomName('')
      toast.success(status === 'LIVE' ? 'Class started' : status === 'COMPLETED' ? 'Class ended' : 'Class cancelled')
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not update the class status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      const result = await joinMeeting(id)
      setRoomName(result.roomName)
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'You are not allowed to join this class')
      await loadMeeting()
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    )
  }

  if (!meeting) return null

  const isMeetingFaculty = user?.role === 'FACULTY' && String(user?.userId ?? user?.id) === String(meeting.facultyId)
  const mayManageThisMeeting = isAdmin || isMeetingFaculty
  const status = meeting.status

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <div style={{ padding: '12px 20px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: 16, margin: 0 }}>{meeting.title} - {meeting.courseTitle}</h2>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>{status} · {new Date(meeting.scheduledStartTime).toLocaleString()}</div>
          </div>
        </div>
        {mayManageThisMeeting && status === 'LIVE' && (
          <button onClick={() => handleStatus('COMPLETED')} disabled={actionLoading} className="btn" style={{ background: '#ef4444', color: '#fff' }}>
            End class
          </button>
        )}
        {mayManageThisMeeting && (status === 'SCHEDULED' || status === 'LIVE') && (
          <button onClick={() => handleStatus('CANCELLED')} disabled={actionLoading} className="btn" style={{ background: '#5b2020', color: '#fff' }}>
            Cancel class
          </button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 360, display: 'grid', placeItems: 'center', padding: 24 }}>
        {roomName ? (
          <iframe
            src={`https://meet.jit.si/${roomName}`}
            allow="camera; microphone; fullscreen; display-capture"
            style={{ width: '100%', height: '100%', minHeight: '70vh', border: 'none' }}
            title={meeting.title}
          />
        ) : (
          <div className="card" style={{ maxWidth: 520, padding: 24, textAlign: 'center' }}>
            {status === 'SCHEDULED' && mayManageThisMeeting ? (
              <>
                <h3>Class is scheduled</h3>
                <p style={{ opacity: 0.8 }}>Starting the class will let enrolled students join. Opening this page does not start it.</p>
                <button className="btn btn-primary" disabled={actionLoading} onClick={() => handleStatus('LIVE')}>
                  {actionLoading ? 'Starting…' : 'Start class'}
                </button>
              </>
            ) : status === 'SCHEDULED' ? (
              <>
                <h3>Waiting for the faculty member</h3>
                <p style={{ opacity: 0.8 }}>You can join once the class is live.</p>
              </>
            ) : status === 'LIVE' ? (
              <>
                <Video size={28} style={{ margin: '0 auto 10px' }} />
                <h3>Class is live</h3>
                <p style={{ opacity: 0.8 }}>Join the Jitsi classroom when you are ready.</p>
                <button className="btn btn-primary" disabled={actionLoading} onClick={handleJoin}>
                  {actionLoading ? 'Joining…' : 'Join class'}
                </button>
              </>
            ) : (
              <>
                <h3>{status === 'CANCELLED' ? 'Class cancelled' : 'Class completed'}</h3>
                <p style={{ opacity: 0.8 }}>This class is no longer accepting participants.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
