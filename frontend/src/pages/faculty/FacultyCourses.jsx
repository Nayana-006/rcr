import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getCoursesByFaculty,
  getCourseById,
  ensureArray,
  createCourse,
  updateCourse,
  deleteCourse,
  addCourseLink,
} from '../../services/api'

function TextInput({ label, value, onChange, placeholder, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} {...rest} />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, ...rest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="label">{label}</label>
      <textarea
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: 120 }}
        {...rest}
      />
    </div>
  )
}

export default function FacultyCourses() {
  const { user } = useAuth()
  const facultyId = user?.userId ?? user?.id

  const [myCourses, setMyCourses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)

  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftThumbUrl, setDraftThumbUrl] = useState('')

  const [linkLabel, setLinkLabel] = useState('')
  const [linkType, setLinkType] = useState('YOUTUBE')
  const [linkUrl, setLinkUrl] = useState('')

  const [toast, setToast] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function refreshCourses() {
    if (!facultyId) return []
    const courses = ensureArray(await getCoursesByFaculty(facultyId))
    setMyCourses(courses)
    return courses
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!facultyId) return
      const courses = ensureArray(await getCoursesByFaculty(facultyId))
      if (mounted) setMyCourses(courses)
    }
    load()
    return () => {
      mounted = false
    }
  }, [facultyId])

  useEffect(() => {
    let mounted = true
    async function loadSelected() {
      if (!selectedId) {
        setSelected(null)
        return
      }
      try {
        const c = await getCourseById(selectedId)
        if (mounted) {
          setSelected(c)
          setDraftTitle(c?.title ?? '')
          setDraftDescription(c?.description ?? '')
          setDraftThumbUrl(c?.thumbnailUrl ?? '')
        }
      } catch (e) {
        if (mounted) setError(e?.response?.data?.message ?? 'Failed to load course')
      }
    }
    loadSelected()
    return () => {
      mounted = false
    }
  }, [selectedId])

  function handleSelectCourse(nextId) {
    setError(null)
    setSelectedId(nextId)
  }

  function handleNewCourse() {
    setSelectedId(null)
    setSelected(null)
    setDraftTitle('')
    setDraftDescription('')
    setDraftThumbUrl('')
    setLinkLabel('')
    setLinkUrl('')
    setError(null)
  }

  async function handleCreateCourse() {
    if (!facultyId) return setError('Cannot determine faculty')
    if (!draftTitle.trim()) return setError('Course title is required')
    setError(null)
    try {
      const payload = { title: draftTitle.trim(), description: draftDescription.trim(), thumbnailUrl: draftThumbUrl.trim() || null }
      const created = await createCourse(payload)
      await refreshCourses()
      setSelectedId(created.id)
      setToast('Course created — you can now add learning links')
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to create course')
    }
  }

  async function handleSaveCourse() {
    if (!selected) return setError('No course selected')
    setError(null)
    try {
      const payload = { title: draftTitle.trim(), description: draftDescription.trim(), thumbnailUrl: draftThumbUrl.trim() || null }
      await updateCourse(selected.id, payload)
      await refreshCourses()
      setSelectedId(selected.id)
      setToast('Course updated')
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to update course')
    }
  }

  async function handleDeleteCourse() {
    if (!selected) return setError('No course selected')
    if (!confirm('Delete this course?')) return
    setError(null)
    try {
      await deleteCourse(selected.id)
      await refreshCourses()
      handleNewCourse()
      setToast('Course deleted')
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to delete course')
    }
  }

  async function handleAddLink() {
    const courseId = selected?.id ?? selectedId
    if (!courseId) return setError('Select or create a course first')
    if (!linkLabel.trim() || !linkUrl.trim()) return setError('Link title and URL are required')
    setError(null)
    try {
      const payload = { label: linkLabel.trim(), type: linkType, url: linkUrl.trim() }
      await addCourseLink(courseId, payload)
      const c = await getCourseById(courseId)
      setSelected(c)
      setSelectedId(courseId)
      await refreshCourses()
      setLinkLabel('')
      setLinkUrl('')
      setToast('Learning link added successfully')
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to add learning link')
    }
  }

  const courseLinks = ensureArray(selected?.learningLinks)
  const canAddLinks = Boolean(selected?.id ?? selectedId)

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Course Management</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Create, Update, Delete Courses</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>
          Create a course, select it from the list, then add learning links below.
        </p>
      </div>

      {(toast || error) && (
        <div style={{ marginTop: 14 }}>
          {toast ? <div className="badge badgeSuccess">{toast}</div> : null}
          {error ? <div className="badge badgeDanger" style={{ marginTop: toast ? 8 : 0 }}>{error}</div> : null}
        </div>
      )}

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Your Courses</div>
            <button className="btn" type="button" onClick={handleNewCourse}>New</button>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myCourses.length ? (
              myCourses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="card"
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: String(c.id) === String(selectedId) ? 'rgba(124,58,237,.10)' : 'rgba(255,255,255,.02)',
                    border: String(c.id) === String(selectedId) ? '1px solid rgba(124,58,237,.45)' : '1px solid transparent',
                  }}
                  onClick={() => handleSelectCourse(c.id)}
                >
                  <div style={{ fontWeight: 950 }}>{c.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{c.description}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                    {ensureArray(c.learningLinks).length} link(s)
                  </div>
                </button>
              ))
            ) : (
              <div className="badge" style={{ opacity: 0.8 }}>No courses yet. Create one on the right.</div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>{selected ? 'Course Editor' : 'Create Course'}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            <TextInput label="Course Title" value={draftTitle} onChange={setDraftTitle} placeholder="e.g., Data Structures" />
            <TextArea label="Course Description" value={draftDescription} onChange={setDraftDescription} placeholder="Short course overview" />
            <TextInput label="Thumbnail URL (optional)" value={draftThumbUrl} onChange={setDraftThumbUrl} placeholder="https://..." />

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="btn btnPrimary" onClick={selected ? handleSaveCourse : handleCreateCourse}>
                {selected ? 'Save Course' : 'Create Course'}
              </button>
              {selected ? (
                <button type="button" className="btn" onClick={handleDeleteCourse}>Delete</button>
              ) : null}
            </div>

            <div className="hr" />

            <div style={{ fontWeight: 950, fontSize: 16 }}>Learning Links</div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              {canAddLinks
                ? 'Add YouTube, Google Drive, PDF, or website URLs.'
                : 'Create and select a course first to add links.'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextInput label="Link Title" value={linkLabel} onChange={setLinkLabel} placeholder="e.g., Lecture 1" disabled={!canAddLinks} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="label">Type</label>
                <select className="input" value={linkType} onChange={(e) => setLinkType(e.target.value)} disabled={!canAddLinks}>
                  {['YOUTUBE', 'DRIVE', 'PDF', 'WEBSITE'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <TextInput label="URL" value={linkUrl} onChange={setLinkUrl} placeholder="https://..." disabled={!canAddLinks} />

            <button type="button" className="btn btnPrimary" disabled={!canAddLinks} onClick={handleAddLink}>
              Add Learning Link
            </button>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Existing Links</div>
              {courseLinks.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {courseLinks.map((l) => (
                    <a
                      key={l.id}
                      className="card"
                      style={{ padding: 12, textDecoration: 'none', background: 'rgba(255,255,255,.02)' }}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div style={{ fontWeight: 950 }}>{l.label}</div>
                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{l.type}</div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="badge" style={{ opacity: 0.8 }}>No learning links yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
