import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('rcs_user')
    if (!raw) return config
    const user = JSON.parse(raw)
    if (user?.token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${user.token}`
    }
  } catch {
    // ignore
  }
  return config
})

// Auth
export async function login({ email, password }) {
  const resp = await api.post('/auth/login', { email, password })
  return resp.data
}

export async function register(payload) {
  const resp = await api.post('/auth/register', payload)
  return resp.data
}

function normalizeArrayPayload(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  return payload.data ?? payload.content ?? []
}

export function ensureArray(payload) {
  return normalizeArrayPayload(payload)
}

function normalizeObjectPayload(payload, defaultObj = {}) {
  if (!payload) return { ...defaultObj }
  const candidate = payload.data ?? payload.content ?? payload
  if (typeof candidate !== 'object') return { ...defaultObj }
  return { ...defaultObj, ...candidate }
}

// Courses
export async function getCourses() {
  const resp = await api.get('/courses')
  return normalizeArrayPayload(resp.data)
}

export async function getCourseById(id) {
  const resp = await api.get(`/courses/${id}`)
  return resp.data
}

export async function createCourse(payload) {
  const resp = await api.post('/courses', payload)
  return resp.data
}

export async function updateCourse(courseId, payload) {
  const resp = await api.put(`/courses/${courseId}`, payload)
  return resp.data
}

export async function deleteCourse(courseId) {
  const resp = await api.delete(`/courses/${courseId}`)
  return resp.data
}

export async function addCourseLink(courseId, payload) {
  const resp = await api.post(`/courses/${courseId}/links`, payload)
  return resp.data
}

export async function getCoursesByFaculty(facultyId) {
  const resp = await api.get(`/courses/faculty/${facultyId}`)
  return normalizeArrayPayload(resp.data)
}

// Enrollments
export async function enrollStudent(payload) {
  const resp = await api.post('/enrollments', payload)
  return resp.data
}

export async function getEnrollmentsByStudent(studentId) {
  const resp = await api.get(`/enrollments/student/${studentId}`)
  return normalizeArrayPayload(resp.data)
}

export async function getEnrollmentsByCourse(courseId) {
  const resp = await api.get(`/enrollments/course/${courseId}`)
  return normalizeArrayPayload(resp.data)
}

// Assignments & Submissions
export async function getAssignmentsByCourse(courseId) {
  const resp = await api.get(`/assignments/course/${courseId}`)
  return normalizeArrayPayload(resp.data)
}

export async function createAssignment(payload) {
  const resp = await api.post('/assignments', payload)
  return resp.data
}

export async function deleteAssignment(id) {
  const resp = await api.delete(`/assignments/${id}`)
  return resp.data
}

export async function submitAssignment(payload) {
  const resp = await api.post('/submissions', {
    assignmentId: payload.assignmentId,
    studentId: payload.studentId,
    feedback: payload.text ?? payload.feedback ?? '',
  })
  return resp.data
}

export async function getSubmissionsByAssignment(assignmentId) {
  const resp = await api.get(`/submissions/assignment/${assignmentId}`)
  return normalizeArrayPayload(resp.data)
}

export async function getSubmissionsByStudent(studentId) {
  const resp = await api.get(`/submissions/student/${studentId}`)
  return normalizeArrayPayload(resp.data)
}

export async function gradeSubmission({ submissionId, marks, feedback }) {
  const resp = await api.put(`/submissions/${submissionId}/grade`, null, {
    params: { grade: marks, feedback: feedback ?? '' },
  })
  return resp.data
}

// Attendance
export async function markAttendance(payload) {
  const resp = await api.post('/attendance', payload)
  return resp.data
}

export async function getAttendanceByStudent(studentId) {
  const resp = await api.get(`/attendance/student/${studentId}`)
  const records = normalizeArrayPayload(resp.data)
  return records.map((r) => ({
    ...r,
    sessionId: r.id,
    sessionDate: r.date,
  }))
}

export async function getAttendancePercentByStudentCourse(studentId, courseId) {
  const records = normalizeArrayPayload(await getAttendanceByStudent(studentId))
  const courseRecords = records.filter((r) => String(r.courseId) === String(courseId))
  if (courseRecords.length) {
    const presentCount = courseRecords.filter((r) => r.present).length
    return {
      percent: Math.round((presentCount / courseRecords.length) * 100),
      total: courseRecords.length,
      presentCount,
    }
  }

  const resp = await api.get(`/attendance/student/${studentId}/percentage`)
  const overall = typeof resp.data === 'number' ? resp.data : 0
  return { percent: Math.round(overall), total: 0, presentCount: 0 }
}

export async function getAttendanceByCourse(courseId) {
  const resp = await api.get(`/attendance/course/${courseId}`)
  return normalizeArrayPayload(resp.data)
}

// Doubts
export async function createDoubt(payload) {
  const resp = await api.post('/doubts', {
    title: payload.title ?? payload.question ?? 'Doubt',
    message: payload.message ?? payload.question ?? '',
    studentId: payload.studentId,
    courseId: payload.courseId,
  })
  return resp.data
}

export async function replyToDoubt(id, message) {
  const resp = await api.put(`/doubts/${id}/reply`, null, { params: { message } })
  return resp.data
}

export async function resolveDoubt(id) {
  const resp = await api.put(`/doubts/${id}/resolve`)
  return resp.data
}

export async function getDoubtsByStudent(studentId) {
  const resp = await api.get(`/doubts/student/${studentId}`)
  return normalizeArrayPayload(resp.data)
}

export async function getDoubtsByFaculty(facultyId) {
  const resp = await api.get(`/doubts/faculty/${facultyId}`)
  return normalizeArrayPayload(resp.data)
}

export async function getDoubtsByCourse(courseId) {
  const resp = await api.get(`/doubts/course/${courseId}`)
  return normalizeArrayPayload(resp.data)
}

// Notifications
export async function getNotificationsForUser(userId) {
  const resp = await api.get(`/notifications/user/${userId}`)
  return normalizeArrayPayload(resp.data)
}

export async function markNotificationRead(id) {
  const resp = await api.put(`/notifications/${id}/read`)
  return resp.data
}

export async function createNotification(payload) {
  const resp = await api.post('/notifications', payload)
  return resp.data
}

// Dashboard
export async function getStudentDashboard(studentId) {
  const resp = await api.get(`/dashboard/student/${studentId}`)
  return normalizeObjectPayload(resp.data, {
    totalEnrolled: 0,
    attendancePercent: 0,
    overallCompletion: 0,
    pendingAssignments: 0,
    courseProgress: [],
    recentAnnouncements: [],
    recentReplies: [],
  })
}

export async function getFacultyDashboard(facultyId) {
  const resp = await api.get(`/dashboard/faculty/${facultyId}`)
  return normalizeObjectPayload(resp.data, {
    totalCourses: 0,
    totalStudents: 0,
    attendanceAvg: 0,
    assignmentRate: 0,
    studentProgress: [],
    recentDoubts: [],
  })
}

export async function getAdminDashboard() {
  const resp = await api.get('/dashboard/admin')
  return normalizeObjectPayload(resp.data, {
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    activeStudents: 0,
    activeFaculty: 0,
    enrollmentRate: 0,
  })
}

export default api

// Legacy local user list — admin pages still read from localStorage until user API exists
export function getLocalUsers() {
  try {
    const raw = localStorage.getItem('rcs_users')
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}
