import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getEnrollmentsByStudent, getMeetingsByCourse, ensureArray } from '../../services/api'
import { Video, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function StudentMeetings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [enrollments, setEnrollments] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  const loadEnrollments = useCallback(async () => {
    try {
      const data = ensureArray(await getEnrollmentsByStudent(user?.userId ?? user?.id))
      setEnrollments(data)
      if (data.length > 0) {
        setSelectedCourseId(data[0].courseId)
      }
    } catch {
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [user])

  const loadMeetings = useCallback(async (courseId) => {
    try {
      const data = await getMeetingsByCourse(courseId)
      setMeetings(ensureArray(data))
    } catch {
      toast.error('Failed to load meetings')
    }
  }, [])

  useEffect(() => {
    // This effect loads the current user's enrolled courses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEnrollments()
  }, [loadEnrollments])

  useEffect(() => {
    // This effect loads meetings for the selected course.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedCourseId) void loadMeetings(selectedCourseId)
  }, [selectedCourseId, loadMeetings])

  if (loading) return <div className="flex-center p-8"><Loader2 className="animate-spin" /></div>

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Live Classes</h1>
        <p className="text-sm text-gray-400 mt-1">Join scheduled live video meetings for your courses</p>
      </div>

      <div className="card p-4 mb-6">
        <label className="label">Select Course</label>
        <select
          className="input max-w-md"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          disabled={!enrollments.length}
        >
          {enrollments.map(e => (
            <option key={e.courseId} value={e.courseId}>{e.courseTitle}</option>
          ))}
        </select>
        {!enrollments.length && (
          <div className="badge" style={{ marginTop: 8, display: 'block' }}>
            Enroll in a course to see its live classes.{' '}
            <Link to="/student/courses" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Browse courses</Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meetings.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-400 border border-dashed border-gray-700 rounded-lg">
            No upcoming live classes for this course.
          </div>
        ) : (
          meetings.map(m => (
            <div key={m.id} className="card p-4 flex flex-col">
              <h3 className="font-bold text-lg">{m.title}</h3>
              <p className="text-sm text-gray-400 mt-1 mb-4">{new Date(m.scheduledStartTime).toLocaleString()}</p>

              {m.description && <p className="text-sm text-gray-300 mb-4">{m.description}</p>}

              <div className="mt-auto flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded ${m.status === 'LIVE' ? 'bg-green-900 text-green-200' : m.status === 'SCHEDULED' ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'}`}>
                  {m.status}
                </span>

                {m.status === 'LIVE' && (
                  <button onClick={() => navigate(`/student/live/${m.id}`)} className="btn btn-primary py-1 px-3 text-sm flex items-center gap-2">
                    <Video size={14} /> Join Class
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
