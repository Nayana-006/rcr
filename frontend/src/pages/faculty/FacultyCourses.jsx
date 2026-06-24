import { useMemo, useState, useEffect } from 'react'

import { useAuth } from '../../context/AuthContext'
import { getCoursesByFaculty, getCourseById, ensureArray, createCourse, updateCourse, deleteCourse, addCourseLink } from '../../services/api'



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
  const facultyId = user?.id

  const [myCourses, setMyCourses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbUrl, setThumbUrl] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!facultyId) return
      const courses = ensureArray(await getCoursesByFaculty(facultyId))
      if (mounted) setMyCourses(courses)
    }
    load()
    return () => { mounted = false }
  }, [facultyId])

  useEffect(() => {
    let mounted = true
    async function loadSelected() {
      if (!selectedId) { setSelected(null); return }
      const c = await getCourseById(selectedId)
      if (mounted) {
        setSelected(c)
        setTitle(c?.title ?? '')
        setDescription(c?.description ?? '')
        setThumbUrl(c?.thumbnailUrl ?? '')
      }
    }
    loadSelected()
    return () => { mounted = false }
  }, [selectedId])

  // Local “dirty” state only for active typing
  const [draftTitle, setDraftTitle] = useState(title)
  const [draftDescription, setDraftDescription] = useState(description)
  const [draftThumbUrl, setDraftThumbUrl] = useState(thumbUrl)

  function handleSelectCourse(nextId) {
    setSelectedId(nextId)
    const c = getCourseById(nextId)
    setDraftTitle(c?.title ?? '')
    setDraftDescription(c?.description ?? '')
    setDraftThumbUrl(c?.thumbnailUrl ?? '')
  }







  const [linkLabel, setLinkLabel] = useState('')

  const [linkType, setLinkType] = useState('WEBSITE')
  const [linkUrl, setLinkUrl] = useState('')

  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleCreateCourse() {
    if (!facultyId) return setToast('Cannot determine faculty')
    try {
      const payload = { title: draftTitle, description: draftDescription, thumbnailUrl: draftThumbUrl }
      const created = await createCourse(payload)
      setToast('Course created')
      // refresh list
      const courses = ensureArray(await getCoursesByFaculty(facultyId))
      setMyCourses(courses)
      // clear drafts
      setDraftTitle('')
      setDraftDescription('')
      setDraftThumbUrl('')
    } catch (e) {
      console.error('create course failed', e)
      setToast('Failed to create course')
    }
  }

  async function handleSaveCourse() {
    if (!selected) return setToast('No course selected')
    try {
      const payload = { title: draftTitle, description: draftDescription, thumbnailUrl: draftThumbUrl }
      await updateCourse(selected.id, payload)
      setToast('Course updated')
      const courses = ensureArray(await getCoursesByFaculty(facultyId))
      setMyCourses(courses)
      // refresh selected
      setSelectedId(selected.id)
    } catch (e) {
      console.error('update failed', e)
      setToast('Failed to update course')
    }
  }

  async function handleDeleteCourse() {
    if (!selected) return setToast('No course selected')
    try {
      await deleteCourse(selected.id)
      setToast('Course deleted')
      const courses = ensureArray(await getCoursesByFaculty(facultyId))
      setMyCourses(courses)
      setSelected(null)
      setSelectedId(null)
    } catch (e) {
      console.error('delete failed', e)
      setToast('Failed to delete course')
    }
  }

  async function handleAddLink() {
    if (!selected) return setToast('No course selected')
    if (!linkLabel || !linkUrl) return setToast('Link title and URL required')
    try {
      const payload = { label: linkLabel, type: linkType, url: linkUrl }
      await addCourseLink(selected.id, payload)
      setToast('Link added')
      // refresh selected course data
      const c = await getCourseById(selected.id)
      setSelected(c)
      // clear link form
      setLinkLabel('')
      setLinkUrl('')
    } catch (e) {
      console.error('add link failed', e)
      setToast('Failed to add link')
    }
  }

  const courseLinks = selected?.learningLinks ?? []

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Course Management</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Create, Update, Delete Courses</h1>
        <p style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.7 }}>Courses are stored in the backend and appear for enrolled students.</p>
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Your Courses</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myCourses.length ? (
              myCourses.map((c) => (
                <button
                  key={c.id}
                  className="card"
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: c.id === selectedId ? 'rgba(124,58,237,.10)' : 'rgba(255,255,255,.02)',
                    border: c.id === selectedId ? '1px solid rgba(124,58,237,.45)' : '1px solid transparent',
                  }}
                  onClick={() => handleSelectCourse(c.id)}

                >
                  <div style={{ fontWeight: 950 }}>{c.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{c.description}</div>
                </button>
              ))
            ) : (
              <div className="badge" style={{ opacity: 0.8 }}>
                No courses yet. Create one on the right.
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>{selected ? 'Course Editor' : 'Create Course'}</div>
          <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
            Add/Update course title, description, and learning links.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            <TextInput label="Course Title" value={draftTitle} onChange={setDraftTitle} placeholder="e.g., Data Structures" />
            <TextArea label="Course Description" value={draftDescription} onChange={setDraftDescription} placeholder="Short course overview" />

            <TextInput
              label="Thumbnail URL (optional)"
              value={draftThumbUrl}
              onChange={setDraftThumbUrl}
              placeholder="https://..."
            />


            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn btnPrimary" onClick={selected ? handleSaveCourse : handleCreateCourse}>
                {selected ? 'Save Course' : 'Create Course'}
              </button>
              {selected ? (
                <button className="btn" onClick={handleDeleteCourse}>
                  Delete
                </button>
              ) : null}
            </div>

            <div className="hr" />

            <div style={{ fontWeight: 950, fontSize: 16, marginTop: 4 }}>Learning Links</div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              Add YouTube, Google Drive, PDF, or website URLs. Students will see links immediately.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TextInput label="Link Title" value={linkLabel} onChange={setLinkLabel} placeholder="e.g., Lecture 1" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="label">Type</label>
                <select className="input" value={linkType} onChange={(e) => setLinkType(e.target.value)}>
                  {['YOUTUBE', 'DRIVE', 'PDF', 'WEBSITE'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <TextInput label="URL" value={linkUrl} onChange={setLinkUrl} placeholder="https://..." />

            <button className="btn btnPrimary" disabled={!selected} onClick={handleAddLink}>
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
                <div className="badge" style={{ opacity: 0.8 }}>
                  No learning links yet.
                </div>
              )}
            </div>

            {toast ? <div className="badge badgeAccent" style={{ width: 'fit-content' }}>{toast}</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}


