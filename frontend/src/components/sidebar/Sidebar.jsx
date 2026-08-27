import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, CalendarDays, MessageCircle, Bell, User, Pencil, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../../context/useAuth'

const baseItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid transparent',
}

export default function Sidebar({ onLogout }) {
  const { user } = useAuth()
  const role = user?.role

  const studentItems = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/profile', label: 'Profile', icon: User },
    { to: '/student/courses', label: 'Available Courses', icon: BookOpen },
    { to: '/student/courses/my', label: 'My Courses', icon: BookOpen },
    { to: '/student/assignments', label: 'Assignments', icon: Pencil },
    { to: '/student/quizzes', label: 'Quizzes', icon: ClipboardCheck },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarDays },
    { to: '/student/progress', label: 'Course Progress', icon: BookOpen },
    { to: '/student/doubts', label: 'Doubts & Replies', icon: MessageCircle },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
  ]

  const facultyItems = [
    { to: '/faculty', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/faculty/profile', label: 'Profile', icon: User },
    { to: '/faculty/courses', label: 'Manage Courses', icon: BookOpen },
    { to: '/faculty/assignments', label: 'Manage Assignments', icon: Pencil },
    { to: '/faculty/quizzes', label: 'Manage Quizzes', icon: ClipboardCheck },
    { to: '/faculty/attendance', label: 'Attendance Management', icon: CalendarDays },
    { to: '/faculty/student-progress', label: 'Student Progress', icon: BookOpen },
    { to: '/faculty/doubts', label: 'Doubts Management', icon: MessageCircle },
  ]


  const adminItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users/students', label: 'Manage Students', icon: Users },
    { to: '/admin/users/faculty', label: 'Manage Faculty', icon: Users },
    { to: '/admin/courses', label: 'Manage Courses', icon: BookOpen },
    { to: '/admin/dashboard', label: 'System Statistics', icon: CalendarDays },
  ]

  const items = role === 'STUDENT' ? studentItems : role === 'FACULTY' ? facultyItems : adminItems

  return (
    <div style={{ position: 'sticky', top: 0, padding: 16 }}>
      <div className="card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, letterSpacing: -0.3 }}>
          Remote Classroom
        </div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
          {user?.name ?? '—'} · {role ?? '—'}
        </div>
      </div>

      <nav className="card" style={{ padding: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((it) => {
            const Icon = it.icon
            if (it.disabled) {
              return (
                <div key={it.label} style={{ ...baseItemStyle, opacity: 0.5 }}>
                  <Icon size={18} />
                  <span>{it.label}</span>
                </div>
              )
            }
            return (
              <NavLink
                key={it.to + it.label}
                to={it.to}
                style={({ isActive }) => ({
                  ...baseItemStyle,
                  background: isActive ? 'rgba(124,58,237,.12)' : 'transparent',
                  borderColor: isActive ? 'rgba(124,58,237,.4)' : 'transparent',
                })}
              >
                <Icon size={18} />
                <span style={{ fontWeight: 650, fontSize: 14 }}>{it.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      <div style={{ marginTop: 12 }}>
        <button className="btn btnDanger" style={{ width: '100%' }} onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

