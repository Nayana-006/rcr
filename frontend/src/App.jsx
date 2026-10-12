import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/public/LandingPage'
import AboutPage from './pages/public/AboutPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'

import ProtectedRoute from './routes/ProtectedRoute'
import { useAuth } from './context/useAuth'

// Student
import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfile from './pages/student/StudentProfile'
import StudentCourses from './pages/student/StudentCoursesAvailable'
import StudentMyCourses from './pages/student/StudentMyCourses'
import StudentAssignments from './pages/student/StudentAssignments'
import StudentAttendance from './pages/student/StudentAttendance'
import StudentProgress from './pages/student/StudentProgress'
import StudentDoubts from './pages/student/StudentDoubts'
import StudentNotifications from './pages/student/StudentNotifications'
import StudentQuizzes from './pages/student/StudentQuizzes'
import StudentMeetings from './pages/meetings/StudentMeetings'
import LiveClassRoom from './pages/meetings/LiveClassRoom'
// Faculty
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import FacultyProfile from './pages/faculty/FacultyProfile'
import FacultyCourses from './pages/faculty/FacultyCourses'
import FacultyAssignments from './pages/faculty/FacultyAssignments'
import FacultyAttendance from './pages/faculty/FacultyAttendance'
import FacultyStudentProgress from './pages/faculty/FacultyStudentProgress'
import FacultyDoubts from './pages/faculty/FacultyDoubts'
import FacultyQuizzes from './pages/faculty/FacultyQuizzes'
import FacultyMeetings from './pages/meetings/FacultyMeetings'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersStudents from './pages/admin/AdminUsersStudents'
import AdminUsersFaculty from './pages/admin/AdminUsersFaculty'
import AdminCourses from './pages/admin/AdminCourses'

function DashboardRedirectByRole() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  switch (user.role) {
    case 'STUDENT':
      return <Navigate to="/student/dashboard" replace />
    case 'FACULTY':
      return <Navigate to="/faculty/dashboard" replace />
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />

      <Routes>
        <Route element={<AppLayout />}>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot" element={<Navigate to="/login" replace />} />

          <Route path="/role" element={<DashboardRedirectByRole />} />

          {/* Student */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="" element={<Navigate to="dashboard" replace />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="courses" element={<StudentCourses />} />
                  <Route path="courses/available" element={<Navigate to="/student/courses" replace />} />
                  <Route path="courses/my" element={<StudentMyCourses />} />
                  <Route path="assignments" element={<StudentAssignments />} />
                  <Route path="quizzes" element={<StudentQuizzes />} />
                  <Route path="attendance" element={<StudentAttendance />} />
                  <Route path="progress" element={<StudentProgress />} />
                  <Route path="doubts" element={<StudentDoubts />} />
                  <Route path="notifications" element={<StudentNotifications />} />
                  <Route path="meetings" element={<StudentMeetings />} />
                  <Route path="live/:id" element={<LiveClassRoom />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Faculty */}
          <Route
            path="/faculty/*"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <Routes>
                  <Route path="dashboard" element={<FacultyDashboard />} />
                  <Route path="" element={<Navigate to="dashboard" replace />} />
                  <Route path="profile" element={<FacultyProfile />} />
                  <Route path="courses" element={<FacultyCourses />} />
                  <Route path="assignments" element={<FacultyAssignments />} />
                  <Route path="quizzes" element={<FacultyQuizzes />} />
                  <Route path="attendance" element={<FacultyAttendance />} />
                  <Route path="student-progress" element={<FacultyStudentProgress />} />
                  <Route path="doubts" element={<FacultyDoubts />} />
                  <Route path="meetings" element={<FacultyMeetings />} />
                  <Route path="live/:id" element={<LiveClassRoom />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="" element={<Navigate to="dashboard" replace />} />
                  <Route path="users/students" element={<AdminUsersStudents />} />
                  <Route path="users/faculty" element={<AdminUsersFaculty />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="statistics" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Not found */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App


