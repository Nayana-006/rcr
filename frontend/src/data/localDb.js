/*
  Centralized localStorage-backed data layer for the Remote Classroom demo.
  Single source of truth for:
  users, courses, enrollments, assignments, attendance, doubts, notifications

  Notes:
  - Uses JSON serialization.
  - No sample/mock data is created automatically.
  - IDs are simple string IDs; stable per created records.
*/

const LS_KEYS = {
  users: 'rcs_users',
  courses: 'rcs_courses',
  enrollments: 'rcs_enrollments',
  assignments: 'rcs_assignments',
  attendance: 'rcs_attendance',
  doubts: 'rcs_doubts',
  notifications: 'rcs_notifications',
  session: 'rcs_session',
}

const DEFAULT_DB = {
  [LS_KEYS.users]: [],
  [LS_KEYS.courses]: [],
  [LS_KEYS.enrollments]: [],
  [LS_KEYS.assignments]: [],
  [LS_KEYS.attendance]: [],
  [LS_KEYS.doubts]: [],
  [LS_KEYS.notifications]: [],
}

function safeParse(raw, fallback) {
  try {
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function ensureInit() {
  for (const [k, v] of Object.entries(DEFAULT_DB)) {
    if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(v))
  }
}

export function getDb() {
  ensureInit()
  return {
    users: safeParse(localStorage.getItem(LS_KEYS.users), []),
    courses: safeParse(localStorage.getItem(LS_KEYS.courses), []),
    enrollments: safeParse(localStorage.getItem(LS_KEYS.enrollments), []),
    assignments: safeParse(localStorage.getItem(LS_KEYS.assignments), []),
    attendance: safeParse(localStorage.getItem(LS_KEYS.attendance), []),
    doubts: safeParse(localStorage.getItem(LS_KEYS.doubts), []),
    notifications: safeParse(localStorage.getItem(LS_KEYS.notifications), []),
  }
}

function setDbPart(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function write(users, courses, enrollments, assignments, attendance, doubts, notifications) {
  setDbPart(LS_KEYS.users, users)
  setDbPart(LS_KEYS.courses, courses)
  setDbPart(LS_KEYS.enrollments, enrollments)
  setDbPart(LS_KEYS.assignments, assignments)
  setDbPart(LS_KEYS.attendance, attendance)
  setDbPart(LS_KEYS.doubts, doubts)
  setDbPart(LS_KEYS.notifications, notifications)
}

export function resetDb() {
  localStorage.removeItem(LS_KEYS.users)
  localStorage.removeItem(LS_KEYS.courses)
  localStorage.removeItem(LS_KEYS.enrollments)
  localStorage.removeItem(LS_KEYS.assignments)
  localStorage.removeItem(LS_KEYS.attendance)
  localStorage.removeItem(LS_KEYS.doubts)
  localStorage.removeItem(LS_KEYS.notifications)
  ensureInit()
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

/* -------------------- Users -------------------- */

export function upsertUser(user) {
  ensureInit()
  const db = getDb()
  const idx = db.users.findIndex((u) => u.id === user.id)
  if (idx >= 0) db.users[idx] = { ...db.users[idx], ...user }
  else db.users.push(user)

  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return user
}

export function findUserByEmail(email) {
  const db = getDb()
  return db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) ?? null
}

export function setUserActive(userId, active) {
  const db = getDb()
  const u = db.users.find((x) => x.id === userId)
  if (!u) return null
  u.active = !!active
  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return u
}

/* -------------------- Courses -------------------- */

export function createCourse({ facultyId, title, description, isActive = true }) {
  const db = getDb()
  const course = {
    id: uid('course'),
    facultyId,
    title: String(title || '').trim(),
    description: String(description || '').trim(),
    isActive: !!isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // learning links in-course
    learningLinks: [], // [{ id, label, type, url }]
    thumbnailUrl: '',
  }
  db.courses.push(course)
  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return course
}

export function updateCourse(courseId, patch) {
  const db = getDb()
  const c = db.courses.find((x) => x.id === courseId)
  if (!c) return null
  Object.assign(c, patch, { updatedAt: new Date().toISOString() })
  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return c
}

export function deleteCourse(courseId) {
  const db = getDb()
  const before = db.courses.length
  const courses = db.courses.filter((c) => c.id !== courseId)
  if (courses.length === before) return false

  // cascade delete
  const enrollments = db.enrollments.filter((e) => e.courseId !== courseId)
  const assignments = db.assignments.filter((a) => a.courseId !== courseId)
  const attendance = db.attendance.filter((t) => t.courseId !== courseId)
  const doubts = db.doubts.filter((d) => d.courseId !== courseId)
  const notifications = db.notifications.filter((n) => n.meta?.courseId !== courseId)

  write(db.users, courses, enrollments, assignments, attendance, doubts, notifications)
  return true
}

export function addCourseLearningLink(courseId, { label, type, url }) {
  const db = getDb()
  const c = db.courses.find((x) => x.id === courseId)
  if (!c) return null

  const link = {
    id: uid('link'),
    label: String(label || '').trim(),
    type: String(type || 'WEBSITE').toUpperCase(),
    url: String(url || '').trim(),
  }

  c.learningLinks = c.learningLinks ?? []
  c.learningLinks.push(link)

  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return link
}

export function getCourses({ onlyActive = true } = {}) {
  const db = getDb()
  return onlyActive ? db.courses.filter((c) => c.isActive) : db.courses
}

export function getCourseById(courseId) {
  const db = getDb()
  return db.courses.find((c) => c.id === courseId) ?? null
}

export function getCoursesByFaculty(facultyId) {
  const db = getDb()
  return db.courses.filter((c) => c.facultyId === facultyId)
}

/* -------------------- Enrollments -------------------- */

export function enrollStudent({ studentId, courseId }) {
  const db = getDb()
  const course = db.courses.find((c) => c.id === courseId)
  if (!course) throw new Error('Course not found')
  if (!course.isActive) throw new Error('Course is not active')

  const existing = db.enrollments.find((e) => e.studentId === studentId && e.courseId === courseId)
  if (existing) return existing

  const enrollment = {
    id: uid('enroll'),
    studentId,
    courseId,
    status: 'ACTIVE',
    enrolledAt: new Date().toISOString(),
  }

  db.enrollments.push(enrollment)
  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return enrollment
}

export function getEnrollmentsByStudent(studentId) {
  const db = getDb()
  return db.enrollments.filter((e) => e.studentId === studentId && e.status === 'ACTIVE')
}

export function getEnrollmentsByCourse(courseId) {
  const db = getDb()
  return db.enrollments.filter((e) => e.courseId === courseId && e.status === 'ACTIVE')
}

/* -------------------- Assignments & Submissions -------------------- */

export function createAssignment({ facultyId, courseId, title, description, dueDate, maxMarks }) {
  const db = getDb()
  const course = db.courses.find((c) => c.id === courseId)
  if (!course) throw new Error('Course not found')
  if (course.facultyId !== facultyId) throw new Error('Not allowed')

  const assignment = {
    id: uid('assign'),
    courseId,
    facultyId,
    title: String(title || '').trim(),
    description: String(description || '').trim(),
    dueDate: dueDate || null,
    maxMarks: typeof maxMarks === 'number' ? maxMarks : Number(maxMarks ?? 10),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissions: [], // [{ id, studentId, submittedAt, text, status, grade, feedback }]
  }

  db.assignments.push(assignment)
  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return assignment
}

export function updateAssignment(assignmentId, patch) {
  const db = getDb()
  const a = db.assignments.find((x) => x.id === assignmentId)
  if (!a) return null
  Object.assign(a, patch, { updatedAt: new Date().toISOString() })
  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return a
}

export function deleteAssignment(assignmentId) {
  const db = getDb()
  const before = db.assignments.length
  const assignments = db.assignments.filter((x) => x.id !== assignmentId)
  if (assignments.length === before) return false
  write(db.users, db.courses, db.enrollments, assignments, db.attendance, db.doubts, db.notifications)
  return true
}

export function getAssignmentsByCourse(courseId) {
  const db = getDb()
  return db.assignments.filter((a) => a.courseId === courseId)
}

export function submitAssignment({ assignmentId, studentId, text }) {
  const db = getDb()
  const a = db.assignments.find((x) => x.id === assignmentId)
  if (!a) throw new Error('Assignment not found')

  const existing = a.submissions.find((s) => s.studentId === studentId)
  if (existing) {
    existing.text = String(text || '')
    existing.submittedAt = new Date().toISOString()
    existing.status = 'SUBMITTED'
    existing.grade = existing.grade ?? null
  } else {
    a.submissions.push({
      id: uid('sub'),
      studentId,
      submittedAt: new Date().toISOString(),
      text: String(text || ''),
      status: 'SUBMITTED',
      grade: null,
      feedback: '',
    })
  }

  // update notifications for faculty
    const course = db.courses.find((c) => c.id === a.courseId)
    if (course) {
      const facultyId = course.facultyId
      const facultyUser = db.users.find((u) => u.id === facultyId)

      db.notifications.push({
        id: uid('notif'),
        userId: facultyId,
        title: 'New Assignment Submission',
        body: `${facultyUser?.name ?? 'Faculty'}: ${a.title} submitted by student`,
        createdAt: new Date().toISOString(),
        read: false,
        meta: { assignmentId: a.id, courseId: a.courseId, kind: 'ASSIGNMENT_SUBMISSION' },
      })
    }


  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)

  return a.submissions.find((s) => s.studentId === studentId) ?? null
}

export function gradeSubmission({ assignmentId, studentId, marks, feedback }) {
  const db = getDb()
  const a = db.assignments.find((x) => x.id === assignmentId)
  if (!a) throw new Error('Assignment not found')

  const sub = a.submissions.find((s) => s.studentId === studentId)

  if (!sub) throw new Error('Submission not found')

  sub.status = 'GRADED'
  sub.grade = Number(marks)
  sub.feedback = String(feedback || '')

  // notify student
  db.notifications.push({

    id: uid('notif'),
    userId: studentId,
    title: 'Assignment Graded',
    body: `Your submission for "${a.title}" has been graded.`,
    createdAt: new Date().toISOString(),
    read: false,
    meta: { assignmentId: a.id, courseId: a.courseId, kind: 'ASSIGNMENT_GRADED' },
  })

  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return sub
}

/* -------------------- Attendance -------------------- */

export function addAttendanceSession({ facultyId, courseId, sessionDate, notes }) {
  const db = getDb()
  const course = db.courses.find((c) => c.id === courseId)
  if (!course) throw new Error('Course not found')
  if (course.facultyId !== facultyId) throw new Error('Not allowed')

  const session = {
    id: uid('att'),
    courseId,
    facultyId,
    sessionDate: sessionDate || new Date().toISOString().slice(0, 10),
    notes: String(notes || ''),
    createdAt: new Date().toISOString(),
    records: [], // [{ studentId, present }]
  }

  db.attendance.push(session)
  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return session
}

export function setAttendanceForSession({ sessionId, records }) {
  const db = getDb()
  const s = db.attendance.find((x) => x.id === sessionId)
  if (!s) throw new Error('Session not found')

  s.records = (records || []).map((r) => ({
    studentId: r.studentId,
    present: !!r.present,
  }))

  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return s
}

export function getAttendanceByStudent(studentId) {
  const db = getDb()
  const sessions = db.attendance
  const out = []
  for (const s of sessions) {
    const r = s.records.find((x) => x.studentId === studentId)
    if (!r) continue
    out.push({
      sessionId: s.id,
      courseId: s.courseId,
      sessionDate: s.sessionDate,
      present: r.present,
      notes: s.notes,
    })
  }
  out.sort((a, b) => String(b.sessionDate).localeCompare(String(a.sessionDate)))
  return out
}

export function getAttendancePercentByStudentCourse({ studentId, courseId }) {
  const db = getDb()
  const sessions = db.attendance.filter((s) => s.courseId === courseId)
  if (!sessions.length) return { percent: 0, total: 0, presentCount: 0 }

  let total = 0
  let presentCount = 0
  for (const s of sessions) {
    const r = s.records.find((x) => x.studentId === studentId)
    if (!r) continue
    total += 1
    if (r.present) presentCount += 1
  }

  const percent = total ? Math.round((presentCount / total) * 100) : 0
  return { percent, total, presentCount }
}

export function getAttendanceSessionsByCourse(courseId) {
  const db = getDb()
  return db.attendance.filter((s) => s.courseId === courseId)
}

/* -------------------- Doubts -------------------- */

export function createDoubt({ studentId, facultyId, courseId, question }) {
  const db = getDb()
  const doubt = {
    id: uid('doubt'),
    courseId,
    studentId,
    facultyId,
    question: String(question || '').trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    reply: null, // { text, repliedAt }
  }
  if (!doubt.question) throw new Error('Question required')

  db.doubts.push(doubt)

  db.notifications.push({
    id: uid('notif'),
    userId: facultyId,
    title: 'New Doubt Submitted',
    body: `New doubt on your course.`,
    createdAt: new Date().toISOString(),
    read: false,
    meta: { doubtId: doubt.id, courseId: courseId, kind: 'DOUBT_SUBMITTED' },
  })

  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return doubt
}

export function getDoubtsByStudent(studentId) {
  const db = getDb()
  return db.doubts.filter((d) => d.studentId === studentId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export function getDoubtsByFaculty(facultyId) {
  const db = getDb()
  return db.doubts.filter((d) => d.facultyId === facultyId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export function replyToDoubt({ doubtId, facultyId, replyText }) {
  const db = getDb()
  const d = db.doubts.find((x) => x.id === doubtId)
  if (!d) throw new Error('Doubt not found')
  if (d.facultyId !== facultyId) throw new Error('Not allowed')

  d.reply = { text: String(replyText || '').trim(), repliedAt: new Date().toISOString() }
  d.status = 'REPLIED'

  db.notifications.push({
    id: uid('notif'),
    userId: d.studentId,
    title: 'Faculty Replied',
    body: `Your doubt reply is available.`,
    createdAt: new Date().toISOString(),
    read: false,
    meta: { doubtId: doubtId, courseId: d.courseId, kind: 'DOUBT_REPLIED' },
  })

  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return d
}

/* -------------------- Notifications -------------------- */

export function getNotificationsForUser(userId) {
  const db = getDb()
  return db.notifications.filter((n) => n.userId === userId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export function markNotificationRead(notificationId) {
  const db = getDb()
  const n = db.notifications.find((x) => x.id === notificationId)
  if (!n) return null
  n.read = true
  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
  return n
}

export function markAllNotificationsRead(userId) {
  const db = getDb()
  for (const n of db.notifications) {
    if (n.userId === userId) n.read = true
  }
  write(db.users, db.courses, db.enrollments, db.assignments, db.attendance, db.doubts, db.notifications)
}

