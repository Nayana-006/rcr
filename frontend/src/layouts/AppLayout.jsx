import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Sidebar from '../components/sidebar/Sidebar'
import Topbar from '../components/topbar/Topbar'
import ChatbotWidget from '../components/ChatbotWidget'


export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const showSidebar = location.pathname.startsWith('/student') ||
    location.pathname.startsWith('/faculty') ||
    location.pathname.startsWith('/admin')

  return (
    <div style={{ minHeight: '100svh', display: 'flex', background: 'transparent' }}>
      {showSidebar && (
        <aside style={{ width: 260, flex: '0 0 auto' }}>
          <Sidebar onLogout={() => {
            logout()
            navigate('/login')
          }} />
        </aside>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {showSidebar && <Topbar />}

        <main className="container" style={{ paddingTop: showSidebar ? 18 : 24, paddingBottom: 40 }}>
          {user ? (
            <div style={{ display: 'none' }} />
          ) : null}
          <Outlet />
        </main>

        <ChatbotWidget />

        <footer style={{ padding: '18px 16px', opacity: 0.75 }}>
          <div className="container" style={{ padding: 0, maxWidth: 1200 }}>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, fontSize: 13 }}>
              © {new Date().getFullYear()} Remote Classroom for Rural Students
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

