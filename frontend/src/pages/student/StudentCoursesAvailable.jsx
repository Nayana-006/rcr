import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { enrollStudent, getCourses, getEnrollmentsByStudent, getAssignmentsByCourse, ensureArray } from '../../services/api'


function CourseCard({ course, progress, onEnroll, enrolled }) {
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
        <button className="btn btnPrimary" disabled>
          View course
        </button>
      </div>
    </div>
  )
}

function computeCourseCompletion({ courseId, studentId, assignments }) {
  const courseAssignments = assignments.filter((a) => a.courseId === courseId)
  if (!courseAssignments.length) return 0

  let gradedOrSubmitted = 0
  for (const a of courseAssignments) {
    const sub = (a.submissions || []).find((s) => s.studentId === studentId)
    if (sub?.status === 'SUBMITTED' || sub?.status === 'GRADED') gradedOrSubmitted += 1
  }

  return Math.round((gradedOrSubmitted / courseAssignments.length) * 100)
}

export default function StudentCoursesAvailable() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const studentId = user?.id

  const [query, setQuery] = useState('')

  const [model, setModel] = useState({ courses: [], enrolledCourseIds: new Set() })

  useEffect(() => {
    let mounted = true
  
    async function load() {
      console.log("USER", user)
      console.log("STUDENT ID", studentId)
  
      if (!studentId) return
  const enrolled = await getEnrollmentsByStudent(studentId)
  const enrolledCourseIds = new Set(ensureArray(enrolled).map((e) => e.courseId))

  let coursesRaw = await getCourses()
  coursesRaw = ensureArray(coursesRaw)
  console.log("coursesRaw", coursesRaw)
      const courses = []
      for (const c of coursesRaw) {
        // compute completion by fetching assignments for course
        const assigns = await getAssignmentsByCourse(c.id)

const completion = computeCourseCompletion({
  courseId: c.id,
  studentId,
  assignments: assigns
})

courses.push({
  id: c.id,
  title: c.title,
  description: c.description,
  facultyName: c.facultyName ?? 'Faculty',
  completion
})
      }

  const filtered = ensureArray(courses).filter((c) => (c.title || '').toLowerCase().includes(query.toLowerCase().trim()))
  console.log("FINAL COURSES", filtered)
  if (mounted) setModel({ courses: filtered, enrolledCourseIds })
    }
    load()
    return () => { mounted = false }
  }, [studentId, query])

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
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
  {ensureArray(model.courses).map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progress={course.completion ?? 0}
            enrolled={model.enrolledCourseIds.has(course.id)}
            onEnroll={handleEnroll}
          />
        ))}
      </div>
    </div>
  )
}



