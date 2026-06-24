import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  enrollStudent,
  getCourses,
  getEnrollmentsByStudent,
  getAssignmentsByCourse,
  getSubmissionsByStudent,
  ensureArray,
} from '../../services/api'

function CourseCard({ course, progress, onEnroll, enrolled }) {
  const primaryUrl = course.primaryUrl

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: 'rgba(124,58,237,.12)',
              border: '1px solid rgba(124,58,237,.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 950,
            }}
          >
            C
          </div>
          <div style={{ fontWeight: 950, fontSize: 16, marginTop: 10 }}>{course.title}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Faculty: {course.facultyName}</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="badge" style={{ opacity: 0.95 }}>
            {progress}% complete
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>Progress</div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 13, opacity: 0.82, lineHeight: 1.55 }}>{course.description}</div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => onEnroll(course.id)} disabled={enrolled}>
          {enrolled ? 'Enrolled' : 'Enroll'}
        </button>
        {enrolled && primaryUrl ? (
          <a className="btn btnPrimary" href={primaryUrl} target="_blank" rel="noreferrer">
            Open Course
          </a>
        ) : (
          <button className="btn btnPrimary" disabled={!enrolled || !primaryUrl}>
            Open Course
          </button>
        )}
      </div>
    </div>
  )
}

function computeCourseCompletion({ courseId, studentId, assignments, submissions }) {
  const courseAssignments = assignments.filter((a) => String(a.courseId) === String(courseId))
  if (!courseAssignments.length) return 0

  let gradedOrSubmitted = 0
  for (const a of courseAssignments) {
    const sub = submissions.find(
      (s) => String(s.assignmentId) === String(a.id) && String(s.studentId) === String(studentId),
    )
    if (sub?.status === 'SUBMITTED' || sub?.status === 'GRADED') gradedOrSubmitted += 1
  }

  return Math.round((gradedOrSubmitted / courseAssignments.length) * 100)
}

export default function StudentCoursesAvailable() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const studentId = user?.userId ?? user?.id

  const [query, setQuery] = useState('')
  const [model, setModel] = useState({ courses: [], enrolledCourseIds: new Set() })
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!studentId) return

      setLoadError(null)

      try {
        let coursesRaw = ensureArray(await getCourses())

        let enrolledCourseIds = new Set()
        try {
          const enrolled = await getEnrollmentsByStudent(studentId)
          enrolledCourseIds = new Set(ensureArray(enrolled).map((e) => String(e.courseId)))
        } catch {
          // non-fatal
        }

        let submissions = []
        try {
          submissions = ensureArray(await getSubmissionsByStudent(studentId))
        } catch {
          submissions = []
        }

        const courses = []
        for (const c of coursesRaw) {
          let assigns = []
          try {
            assigns = ensureArray(await getAssignmentsByCourse(c.id))
          } catch {
            assigns = []
          }

          const completion = computeCourseCompletion({
            courseId: c.id,
            studentId,
            assignments: assigns,
            submissions,
          })

          courses.push({
            id: c.id,
            title: c.title,
            description: c.description,
            facultyName: c.facultyName ?? 'Faculty',
            completion,
            learningLinks: ensureArray(c.learningLinks),
            primaryUrl: ensureArray(c.learningLinks)[0]?.url ?? null,
          })
        }

        if (mounted) setModel({ courses, enrolledCourseIds })
      } catch (err) {
        if (mounted) {
          setLoadError(err?.response?.data?.message ?? err?.message ?? 'Failed to load courses')
          setModel({ courses: [], enrolledCourseIds: new Set() })
        }
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [studentId])

  const visibleCourses = useMemo(() => {
    const q = query.toLowerCase().trim()
    return ensureArray(model.courses).filter((c) => !q || (c.title || '').toLowerCase().includes(q))
  }, [model.courses, query])

  async function handleEnroll(courseId) {
    if (!studentId) return
    await enrollStudent({ studentId, courseId })
    navigate('/student/courses/my')
  }

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div className="badge badgeAccent">Courses</div>
            <h1 style={{ fontSize: 26, marginTop: 10 }}>Available Courses</h1>
            <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>Search and enroll to start learning.</div>
          </div>

          <div style={{ minWidth: 260, flex: '0 1 340px' }}>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              aria-label="search courses"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {loadError ? (
          <div className="badge badgeDanger" style={{ marginTop: 14, display: 'block' }}>
            {loadError}
          </div>
        ) : null}
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
        {visibleCourses.length ? (
          visibleCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={course.completion ?? 0}
              enrolled={model.enrolledCourseIds.has(String(course.id))}
              onEnroll={handleEnroll}
            />
          ))
        ) : (
          <div className="card" style={{ padding: 16, gridColumn: '1 / -1' }}>
            <div className="badge" style={{ opacity: 0.85 }}>
              {loadError ? 'Could not load courses.' : 'No courses available yet. Ask faculty to create a course.'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
