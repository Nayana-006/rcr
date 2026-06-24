import { useNavigate } from 'react-router-dom'
import heroImg from '../../assets/hero.png'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="container" style={{ paddingTop: 36 }}>
      <div className="grid" style={{ gridTemplateColumns: '1.15fr 0.85fr', alignItems: 'center' }}>
        <div>
          <div className="badge badgeAccent">Rural learning • Faculty guidance</div>
          <h1 style={{ fontSize: 44, lineHeight: 1.1, marginTop: 14 }}>
            Remote Classroom for Rural Students
          </h1>
          <p style={{ fontSize: 16, opacity: 0.8, maxWidth: 560 }}>
            Enroll in courses, track attendance and completion, submit assignments, and ask doubts—through a clean,
            responsive learning platform built for real students.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
            <button className="btn btnPrimary" onClick={() => navigate('/login')}>
              Get Started
            </button>
            <button className="btn" onClick={() => navigate('/about')}>
              Learn more
            </button>
          </div>

          <div style={{ marginTop: 22 }} className="grid grid2">
            {[
              { title: 'Progress Tracking', desc: 'Completion + attendance percentages in one dashboard.' },
              { title: 'Assignments & Grades', desc: 'Submit text answers and view grading status.' },
              { title: 'Doubt Resolution', desc: 'Ask faculty and view replies as a conversation.' },
              { title: 'Announcements', desc: 'Stay updated with course announcements from faculty.' },
            ].map((f) => (
              <div key={f.title} className="card" style={{ padding: 14 }}>
                <div style={{ fontWeight: 850 }}>{f.title}</div>
                <div style={{ fontSize: 13, opacity: 0.78, marginTop: 8 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>How it works</div>
          <div style={{ marginTop: 12 }} className="grid">

            {[
              { step: 1, t: 'Enroll', d: 'Choose available courses and start learning.' },
              { step: 2, t: 'Learn', d: 'Open learning links: YouTube, Drive, PDFs, websites.' },
              { step: 3, t: 'Track', d: 'Monitor progress, attendance, assignments and grades.' },
              { step: 4, t: 'Clarify', d: 'Send doubts and view faculty replies.' },
            ].map((x) => (
              <div key={x.step} style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: 'rgba(124,58,237,.14)',
                    border: '1px solid rgba(124,58,237,.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                  }}
                >
                  {x.step}
                </div>
                <div>
                  <div style={{ fontWeight: 850 }}>{x.t}</div>
                  <div style={{ fontSize: 13, opacity: 0.78, marginTop: 4 }}>{x.d}</div>
                </div>
              </div>
            ))}
          </div>
          <img
            src={heroImg}
            alt="Hero"
            style={{ width: '100%', marginTop: 18, borderRadius: 14, border: '1px solid var(--border)' }}
          />
        </div>
      </div>
    </div>
  )
}

