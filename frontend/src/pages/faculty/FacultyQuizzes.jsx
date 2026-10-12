import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getCoursesByFaculty,
  getQuizzesByCourse,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuestionsByQuiz,
  addQuizQuestion,
  deleteQuizQuestion,
  getAttemptsByQuiz,
  ensureArray,
} from '../../services/api'
import { toast } from 'sonner'

export default function FacultyQuizzes() {
  const { user } = useAuth()
  const facultyId = user?.userId ?? user?.id

  // State
  const [courses, setCourses] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [activeQuizId, setActiveQuizId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form states
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    durationMinutes: 15,
    totalMarks: 10,
    courseId: '',
  })
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    marks: 2,
  })

  const [isEditingQuiz, setIsEditingQuiz] = useState(false)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)

  // Derived active quiz
  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) ?? quizzes[0] ?? null

  // Load data
  useEffect(() => {
    let mounted = true
    async function loadData() {
      if (!facultyId) return
      setLoading(true)
      try {
        const loadedCourses = ensureArray(await getCoursesByFaculty(facultyId))
        if (loadedCourses.length && mounted) {
          setCourses(loadedCourses)
          setQuizForm((prev) => ({ ...prev, courseId: String(loadedCourses[0].id) }))
          
          // Load quizzes
          let allQuizzes = []
          for (const c of loadedCourses) {
            const courseQuizzes = ensureArray(await getQuizzesByCourse(c.id))
            allQuizzes = [...allQuizzes, ...courseQuizzes]
          }
          setQuizzes(allQuizzes)
          if (allQuizzes.length) {
            setActiveQuizId(allQuizzes[0].id)
          }
        }
      } catch {
        toast.error('Failed to load courses or quizzes')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [facultyId])

  // Load questions and attempts for active quiz
  useEffect(() => {
    let mounted = true
    async function loadQuizDetails() {
      if (!activeQuiz?.id) {
        setQuestions([])
        setAttempts([])
        return
      }
      try {
        const qList = ensureArray(await getQuestionsByQuiz(activeQuiz.id))
        const aList = ensureArray(await getAttemptsByQuiz(activeQuiz.id))
        if (mounted) {
          setQuestions(qList)
          setAttempts(aList)
        }
      } catch {
        // ignore
      }
    }
    loadQuizDetails()
    return () => {
      mounted = false
    }
  }, [activeQuiz?.id])

  // Reload quizzes utility
  async function reloadQuizzes() {
    let allQuizzes = []
    for (const c of courses) {
      const courseQuizzes = ensureArray(await getQuizzesByCourse(c.id))
      allQuizzes = [...allQuizzes, ...courseQuizzes]
    }
    setQuizzes(allQuizzes)
    return allQuizzes
  }

  // Quiz CRUD handlers
  async function handleCreateQuiz() {
    if (!courses.length || !quizForm.courseId) return toast.error('Create a course before creating a quiz')
    if (!quizForm.title.trim()) return toast.error('Quiz title is required')
    setError(null)
    try {
      const payload = {
        title: quizForm.title.trim(),
        description: quizForm.description.trim(),
        durationMinutes: Number(quizForm.durationMinutes),
        totalMarks: Number(quizForm.totalMarks),
        courseId: Number(quizForm.courseId),
      }
      const newQuiz = await createQuiz(payload)
      const list = await reloadQuizzes()
      setActiveQuizId(newQuiz.id ?? list[0]?.id ?? null)
      setQuizForm({
        title: '',
        description: '',
        durationMinutes: 15,
        totalMarks: 10,
        courseId: courses[0]?.id ? String(courses[0].id) : '',
      })
      toast.success('Quiz created successfully')
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to create quiz')
    }
  }

  async function handleUpdateQuiz() {
    if (!activeQuiz) return
    if (!quizForm.title.trim()) return toast.error('Quiz title is required')
    setError(null)
    try {
      const payload = {
        title: quizForm.title.trim(),
        description: quizForm.description.trim(),
        durationMinutes: Number(quizForm.durationMinutes),
        totalMarks: Number(quizForm.totalMarks),
        courseId: Number(quizForm.courseId || activeQuiz.courseId),
      }
      await updateQuiz(activeQuiz.id, payload)
      await reloadQuizzes()
      setIsEditingQuiz(false)
      toast.success('Quiz updated successfully')
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to update quiz')
    }
  }

  async function handleDeleteQuiz() {
    if (!activeQuiz) return
    if (!window.confirm('Are you sure you want to delete this quiz?')) return
    setError(null)
    try {
      await deleteQuiz(activeQuiz.id)
      const list = await reloadQuizzes()
      setActiveQuizId(list[0]?.id ?? null)
      setIsEditingQuiz(false)
      toast.success('Quiz deleted successfully')
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to delete quiz')
    }
  }

  // Question CRUD handlers
  async function handleAddQuestion() {
    if (!activeQuiz) return
    if (!questionForm.questionText.trim()) return toast.error('Question text is required')
    if (!questionForm.optionA.trim() || !questionForm.optionB.trim()) {
      return toast.error('At least options A and B are required')
    }

    try {
      await addQuizQuestion(activeQuiz.id, questionForm)
      // Reload questions
      const qList = ensureArray(await getQuestionsByQuiz(activeQuiz.id))
      setQuestions(qList)
      setQuestionForm({
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        marks: 2,
      })
      setIsAddingQuestion(false)
      toast.success('Question added successfully')
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to add question')
    }
  }

  async function handleDeleteQuestion(id) {
    if (!window.confirm('Delete this question?')) return
    try {
      await deleteQuizQuestion(id)
      const qList = ensureArray(await getQuestionsByQuiz(activeQuiz?.id))
      setQuestions(qList)
      toast.success('Question deleted')
    } catch {
      toast.error('Failed to delete question')
    }
  }

  function startEditingQuiz() {
    if (!activeQuiz) return
    setQuizForm({
      title: activeQuiz.title,
      description: activeQuiz.description ?? '',
      durationMinutes: activeQuiz.durationMinutes,
      totalMarks: activeQuiz.totalMarks,
      courseId: String(activeQuiz.courseId),
    })
    setIsEditingQuiz(true)
  }

  if (loading) {
    return <div className="card" style={{ padding: 24, textAlign: 'center' }}>Loading Quiz Builder...</div>
  }

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Faculty Module</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Quiz Builder</h1>
        <p style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>Create quizzes, add multiple choice questions, and view student attempts.</p>
        {error ? <div className="badge badgeDanger" style={{ marginTop: 12 }}>{error}</div> : null}
        {!loading && !courses.length && (
          <div className="badge" style={{ display: 'block', marginTop: 12 }}>
            Quizzes need a course. <Link to="/faculty/courses" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Create one in Manage Courses</Link> first.
          </div>
        )}
      </div>

      <div className="grid" style={{ marginTop: 14, gridTemplateColumns: '0.95fr 1.05fr', gap: 14 }}>
        {/* Left Column: Quiz list and quiz builder form */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Quizzes</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quizzes.length ? (
              quizzes.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className="card"
                  style={{
                    padding: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: q.id === activeQuizId ? 'rgba(124,58,237,.10)' : 'rgba(255,255,255,.02)',
                    border: q.id === activeQuizId ? '1px solid rgba(124,58,237,.45)' : '1px solid transparent',
                  }}
                  onClick={() => {
                    setActiveQuizId(q.id)
                    setIsEditingQuiz(false)
                  }}
                >
                  <div style={{ fontWeight: 950 }}>{q.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Course: {q.courseTitle}</div>
                </button>
              ))
            ) : (
              <div className="badge" style={{ opacity: 0.85 }}>No quizzes created yet. Use the form below to create one.</div>
            )}
          </div>

          <div className="hr" style={{ marginTop: 14 }} />

          <div style={{ fontWeight: 950, fontSize: 18 }}>
            {isEditingQuiz ? 'Edit Active Quiz' : 'Create Quiz'}
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <div>
              <label className="label">Course</label>
              <select
                className="input"
                value={quizForm.courseId}
                onChange={(e) => setQuizForm((prev) => ({ ...prev, courseId: e.target.value }))}
                disabled={!courses.length}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Quiz Title</label>
              <input
                className="input"
                value={quizForm.title}
                onChange={(e) => setQuizForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Mid-Term Quiz"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                style={{ minHeight: 70, resize: 'vertical' }}
                value={quizForm.description}
                onChange={(e) => setQuizForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description or guidelines"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="label">Duration (mins)</label>
                <input
                  className="input"
                  type="number"
                  value={quizForm.durationMinutes}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Total Marks</label>
                <input
                  className="input"
                  type="number"
                  value={quizForm.totalMarks}
                  onChange={(e) => setQuizForm((prev) => ({ ...prev, totalMarks: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              {isEditingQuiz ? (
                <>
                  <button type="button" className="btn btnPrimary" onClick={handleUpdateQuiz}>Save Changes</button>
                  <button type="button" className="btn" onClick={() => setIsEditingQuiz(false)}>Cancel</button>
                </>
              ) : (
                <button type="button" className="btn btnPrimary" onClick={handleCreateQuiz} disabled={!courses.length}>Create Quiz</button>
              )}

              {activeQuiz && !isEditingQuiz && (
                <>
                  <button type="button" className="btn" onClick={startEditingQuiz}>Edit Active</button>
                  <button type="button" className="btn btnDanger" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={handleDeleteQuiz}>Delete Active</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Questions and Student Attempts */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>Quiz Details: {activeQuiz?.title ?? '—'}</div>
            {activeQuiz && (
              <button
                type="button"
                className="btn btnPrimary"
                style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={() => setIsAddingQuestion(!isAddingQuestion)}
              >
                {isAddingQuestion ? 'Show Questions' : 'Add Question'}
              </button>
            )}
          </div>

          <div className="hr" style={{ marginTop: 12 }} />

          {activeQuiz ? (
            <div>
              {/* Add Question Mode */}
              {isAddingQuestion ? (
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                  <div style={{ fontWeight: 800 }}>Add New Question</div>
                  <div>
                    <label className="label">Question Text</label>
                    <textarea
                      className="input"
                      style={{ minHeight: 60, resize: 'vertical' }}
                      value={questionForm.questionText}
                      onChange={(e) => setQuestionForm((prev) => ({ ...prev, questionText: e.target.value }))}
                      placeholder="Enter the question statement"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label">Option A</label>
                      <input
                        className="input"
                        value={questionForm.optionA}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, optionA: e.target.value }))}
                        placeholder="Option A"
                      />
                    </div>
                    <div>
                      <label className="label">Option B</label>
                      <input
                        className="input"
                        value={questionForm.optionB}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, optionB: e.target.value }))}
                        placeholder="Option B"
                      />
                    </div>
                    <div>
                      <label className="label">Option C</label>
                      <input
                        className="input"
                        value={questionForm.optionC}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, optionC: e.target.value }))}
                        placeholder="Option C"
                      />
                    </div>
                    <div>
                      <label className="label">Option D</label>
                      <input
                        className="input"
                        value={questionForm.optionD}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, optionD: e.target.value }))}
                        placeholder="Option D"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="label">Correct Answer</label>
                      <select
                        className="input"
                        value={questionForm.correctOption}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, correctOption: e.target.value }))}
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Marks</label>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        value={questionForm.marks}
                        onChange={(e) => setQuestionForm((prev) => ({ ...prev, marks: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <button type="button" className="btn btnPrimary" onClick={handleAddQuestion}>Add to Quiz</button>
                    <button type="button" className="btn" onClick={() => setIsAddingQuestion(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                /* Question List & Attempts Mode */
                <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
                  <div>
                    <div style={{ fontWeight: 850 }}>Quiz Questions ({questions.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                      {questions.map((q, idx) => (
                        <div key={q.id} className="card" style={{ padding: 10, background: 'rgba(255,255,255,0.01)', fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 800 }}>
                              Q{idx + 1}: {q.questionText} <span style={{ opacity: 0.6 }}>({q.marks} marks)</span>
                            </div>
                            <button
                              type="button"
                              className="btn btnDanger"
                              style={{ padding: '2px 6px', fontSize: 11, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                              onClick={() => handleDeleteQuestion(q.id)}
                            >
                              Delete
                            </button>
                          </div>
                          <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, opacity: 0.8, fontSize: 12 }}>
                            <div>A: {q.optionA}</div>
                            <div>B: {q.optionB}</div>
                            <div>C: {q.optionC}</div>
                            <div>D: {q.optionD}</div>
                          </div>
                          <div style={{ marginTop: 6, fontWeight: 700, color: 'var(--accent)', fontSize: 12 }}>
                            Correct Answer: Option {q.correctOption}
                          </div>
                        </div>
                      ))}
                      {!questions.length && (
                        <div className="badge" style={{ opacity: 0.8 }}>No questions added yet. Click "Add Question" to start.</div>
                      )}
                    </div>
                  </div>

                  <div className="hr" />

                  <div>
                    <div style={{ fontWeight: 850 }}>Student Attempts ({attempts.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                      {attempts.map((a) => (
                        <div key={a.id} className="card" style={{ padding: 12, background: 'rgba(255,255,255,0.01)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 800 }}>{a.studentName}</div>
                            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                              Attempted: {new Date(a.attemptedAt).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ fontWeight: 900, color: 'var(--accent)', fontSize: 15 }}>
                            {a.score} / {a.totalMarks}
                          </div>
                        </div>
                      ))}
                      {!attempts.length && (
                        <div className="badge" style={{ opacity: 0.8 }}>No students have attempted this quiz yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="badge" style={{ opacity: 0.85, marginTop: 12 }}>Select or create a quiz.</div>
          )}
        </div>
      </div>
    </div>
  )
}
