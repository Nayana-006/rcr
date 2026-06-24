export default function AboutPage() {
  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 30 }}>
      <div className="card" style={{ padding: 18 }}>
        <div className="badge badgeAccent">About</div>
        <h1 style={{ fontSize: 34, marginTop: 12 }}>Remote Classroom for Rural Students</h1>
        <p style={{ opacity: 0.82, maxWidth: 760, marginTop: 10, lineHeight: 1.6 }}>
          This platform helps rural students learn online using course content provided by faculty.
          Students can enroll in courses, track progress and attendance, submit assignments (text-only),
          and ask doubts to teachers.
        </p>

        <div className="hr" />

        <div className="grid grid2">
          {[
            {
              title: 'Simple & Responsive',
              body: 'Designed for mobile, tablet, and desktop with a clean educational theme.',
            },
            {
              title: 'Role-based Experience',
              body: 'Students, faculty, and admin have separate dashboards and navigation.',
            },
            {
              title: 'Progress Analytics',
              body: 'Course completion tracking and attendance percentages with progress indicators.',
            },
            {
              title: 'Doubts & Replies',
              body: 'Maintain a conversation history between students and faculty.',
            },
          ].map((x) => (
            <div key={x.title} className="card" style={{ padding: 14, background: 'rgba(255,255,255,.02)' }}>
              <div style={{ fontWeight: 900 }}>{x.title}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8, lineHeight: 1.6 }}>{x.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

