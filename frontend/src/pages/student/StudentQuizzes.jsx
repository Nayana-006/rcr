import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getEnrollmentsByStudent,
  getCourseById,
  getQuizzesByCourse,
  getQuestionsByQuiz,
  submitQuizAttempt,
  getAttemptsByStudent,
  ensureArray,
} from '../../services/api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function StudentQuizzes() {
  const { user } = useAuth()
  const studentId = user?.userId ?? user?.id

  // State
  const [courses, setCourses] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Active quiz attempt state
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({}) // {questionId: option}
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [showResult, setShowResult] = useState(null) // {score, totalMarks}

  // Load data
  useEffect(() => {
    let mounted = true
    async function loadData() {
      if (!studentId) return
      setLoading(true)
      setLoadError('')
      try {
        const enrollments = ensureArray(await getEnrollmentsByStudent(studentId))
        const loadedCourses = []
        let allQuizzes = []

        for (const e of enrollments) {
          const c = await getCourseById(e.courseId)
          if (c) {
            loadedCourses.push(c)
            const courseQuizzes = ensureArray(await getQuizzesByCourse(c.id))
            allQuizzes = [...allQuizzes, ...courseQuizzes]
          }
        }

        const studentAttempts = ensureArray(await getAttemptsByStudent(studentId))

        if (mounted) {
          setCourses(loadedCourses)
          setQuizzes(allQuizzes)
          setAttempts(studentAttempts)
        }
      } catch (error) {
        if (mounted) setLoadError(error?.response?.data?.message ?? 'Could not load quizzes. Please try again.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [studentId, showResult])

  // Start Quiz
  async function startQuiz(quiz) {
    // Check if already attempted
    const alreadyAttempted = attempts.some((a) => String(a.quizId) === String(quiz.id))
    if (alreadyAttempted) {
      toast.error('You have already attempted this quiz!')
      return
    }

    try {
      const qList = ensureArray(await getQuestionsByQuiz(quiz.id))
      if (!qList.length) {
        toast.error('This quiz has no questions yet')
        return
      }
      setActiveQuiz(quiz)
      setQuestions(qList)
      setAnswers({})
      setTimeLeft((quiz.durationMinutes || 10) * 60)
      setShowResult(null)
      toast.success(`Started ${quiz.title}`)
    } catch {
      toast.error('Failed to fetch quiz questions')
    }
  }

  // Handle option select
  function handleSelect(questionId, option) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  // Submit attempt
  const submitAttempt = useCallback(async () => {
    if (!activeQuiz || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      // Map answers object to JSON
      const attemptPayload = {
        answersJson: JSON.stringify(answers),
        studentId,
      }
      const res = await submitQuizAttempt(activeQuiz.id, attemptPayload)
      setShowResult(res)
      setActiveQuiz(null)
      setQuestions([])
      toast.success('Quiz submitted successfully!')
    } catch {
      toast.error('Failed to submit quiz attempt')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [activeQuiz, answers, studentId])

  // Keep this effect after submitAttempt so it never reads an uninitialized handler.
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0) {
      if (activeQuiz && timeLeft === 0) {
        toast.warning("Time's up! Submitting your attempt...")
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void submitAttempt()
      }
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [activeQuiz, timeLeft, submitAttempt])

  // Format timer
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (loading) {
    return <div className="card" style={{ padding: 24, textAlign: 'center' }}>Loading Quizzes...</div>
  }

  // Quiz Taking UI
  if (activeQuiz) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="badge badgeAccent">{activeQuiz.courseTitle}</span>
            <h1 style={{ fontSize: 24, marginTop: 8 }}>{activeQuiz.title}</h1>
            <p style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>{activeQuiz.description}</p>
          </div>
          <div className="card" style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <span style={{ fontSize: 13, opacity: 0.8, display: 'block' }}>Time Remaining</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="hr" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {questions.map((q, idx) => (
            <div key={q.id} className="card" style={{ padding: 16, background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                Question {idx + 1}: {q.questionText}
                <span style={{ marginLeft: 8, opacity: 0.7, fontSize: 12 }}>({q.marks} {q.marks === 1 ? 'mark' : 'marks'})</span>
              </div>
              <div className="grid grid2" style={{ marginTop: 12, gap: 10 }}>
                {[
                  { key: 'A', text: q.optionA },
                  { key: 'B', text: q.optionB },
                  { key: 'C', text: q.optionC },
                  { key: 'D', text: q.optionD },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className="card"
                    style={{
                      padding: 12,
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: answers[q.id] === opt.key ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                      border: answers[q.id] === opt.key ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => handleSelect(q.id, opt.key)}
                  >
                    <span style={{ fontWeight: 900, marginRight: 8 }}>{opt.key}.</span> {opt.text}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            className="btn"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel? Progress will be lost.')) {
                setActiveQuiz(null)
                setQuestions([])
              }
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btnPrimary"
            disabled={submitting}
            onClick={() => {
              if (window.confirm('Submit quiz now?')) submitAttempt()
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    )
  }

  // Quiz Result Summary
  if (showResult) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', maxWidth: 500, margin: '20px auto' }}>
        <div className="badge badgeSuccess" style={{ fontSize: 14, padding: '6px 12px' }}>Quiz Completed</div>
        <h2 style={{ marginTop: 14 }}>{showResult.quizTitle}</h2>
        <div style={{ fontSize: 44, fontWeight: 950, color: 'var(--accent)', marginTop: 16 }}>
          {showResult.score} / {showResult.totalMarks}
        </div>
        <div style={{ opacity: 0.8, fontSize: 14, marginTop: 8 }}>
          Percentage: {Math.round((showResult.score / showResult.totalMarks) * 100)}%
        </div>
        <button
          type="button"
          className="btn btnPrimary"
          style={{ marginTop: 20 }}
          onClick={() => setShowResult(null)}
        >
          Back to Quizzes
        </button>
      </div>
    )
  }

  const filteredQuizzes = selectedCourseId
    ? quizzes.filter((q) => String(q.courseId) === String(selectedCourseId))
    : quizzes

  return (
    <div>
      <div className="card" style={{ padding: 16 }}>
        <div className="badge badgeAccent">Student Module</div>
        <h1 style={{ fontSize: 26, marginTop: 10 }}>Quizzes</h1>
        {loadError && <div className="badge badgeDanger" role="alert" style={{ marginTop: 10 }}>{loadError}</div>}
        {!courses.length && !loadError && <div className="badge" style={{ display: 'flex', marginTop: 10 }}>No enrolled courses yet. <Link to="/student/courses" style={{ color: 'var(--accent)', textDecoration: 'underline', marginLeft: 4 }}>Browse available courses</Link></div>}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: 13, opacity: 0.8 }}>Filter by Course:</label>
          <select
            className="input"
            style={{ width: 'auto', minWidth: 200, padding: '4px 8px' }}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Available Quizzes</div>
          <div className="grid grid2" style={{ marginTop: 12, gap: 12 }}>
            {filteredQuizzes.map((quiz) => {
              const attempt = attempts.find((a) => String(a.quizId) === String(quiz.id))
              return (
                <div key={quiz.id} className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge" style={{ fontSize: 11 }}>{quiz.courseTitle}</span>
                      <h3 style={{ marginTop: 6, fontSize: 16 }}>{quiz.title}</h3>
                      <p style={{ opacity: 0.8, fontSize: 12, marginTop: 4 }}>{quiz.description}</p>
                    </div>
                    {attempt ? (
                      <span className="badge badgeSuccess">Attempted</span>
                    ) : (
                      <span className="badge badgeDanger">Pending</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 12, opacity: 0.8 }}>
                    <span>Duration: {quiz.durationMinutes} mins</span>
                    <span>Total Marks: {quiz.totalMarks}</span>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    {attempt ? (
                      <div className="card" style={{ padding: 8, background: 'rgba(124,58,237,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span>Your Score:</span>
                        <span style={{ fontWeight: 800 }}>{attempt.score} / {attempt.totalMarks} ({Math.round((attempt.score / attempt.totalMarks) * 100)}%)</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btnPrimary"
                        style={{ width: 'full', padding: '6px 12px' }}
                        onClick={() => startQuiz(quiz)}
                      >
                        Start Quiz
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {!filteredQuizzes.length && (
              <div className="badge" style={{ padding: 12 }}>No quizzes available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
