import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './QuestionForm.css'

const QuestionForm = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showNudge, setShowNudge] = useState(false)
  const [progress, setProgress] = useState(null)
  const [completed, setCompleted] = useState(false)
  
  const navigate = useNavigate()
  const inactivityTimer = useRef(null)
  const nudgeTimer = useRef(null)
  const currentQuestionId = useRef(null)

  // Separate useEffect for fetching question (only runs once on mount)
  useEffect(() => {
    fetchCurrentQuestion()
  }, [])

  // Separate useEffect for inactivity detection (runs on mount and when showNudge changes)
  useEffect(() => {
    // Set up inactivity detection
    const resetInactivityTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
      
      // Start 1-minute inactivity timer
      inactivityTimer.current = setTimeout(() => {
        setShowNudge(true)
        scheduleNudge()
      }, 60000) // 1 minute
    }

    // Reset timer on user activity
    const handleActivity = () => {
      if (showNudge) {
        setShowNudge(false)
        if (nudgeTimer.current) {
          clearTimeout(nudgeTimer.current)
        }
      }
      resetInactivityTimer()
    }

    // Add event listeners for user activity
    document.addEventListener('mousemove', handleActivity)
    document.addEventListener('keypress', handleActivity)
    document.addEventListener('click', handleActivity)
    document.addEventListener('scroll', handleActivity)

    // Start initial timer
    resetInactivityTimer()

    return () => {
      // Cleanup
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
      if (nudgeTimer.current) {
        clearTimeout(nudgeTimer.current)
      }
      document.removeEventListener('mousemove', handleActivity)
      document.removeEventListener('keypress', handleActivity)
      document.removeEventListener('click', handleActivity)
      document.removeEventListener('scroll', handleActivity)
    }
  }, [showNudge])

  const fetchCurrentQuestion = async () => {
    try {
      const response = await axios.get('/questions/current')
      
      if (response.data.completed) {
        setCompleted(true)
        setLoading(false)
        return
      }
      
      const newQuestionId = response.data.question.questionId
      
      // Only reset answer if this is a completely new question
      if (currentQuestionId.current !== newQuestionId) {
        setAnswer('')
        currentQuestionId.current = newQuestionId
      }
      
      setCurrentQuestion(response.data.question)
      setProgress(response.data.progress)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching question:', error)
      setError('Failed to load question')
      setLoading(false)
    }
  }

  const scheduleNudge = async () => {
    try {
      await axios.post('/nudges/schedule')
      console.log('Nudge scheduled')
    } catch (error) {
      console.error('Error scheduling nudge:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!answer.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const response = await axios.post('/questions/answer', {
        questionId: currentQuestion.questionId,
        answer: answer.trim()
      })

      if (response.data.completed) {
        setCompleted(true)
      } else {
        setCurrentQuestion(response.data.nextQuestion)
        setProgress(response.data.progress)
        setAnswer('')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      setError(error.response?.data?.error || 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    setShowNudge(false)
    if (nudgeTimer.current) {
      clearTimeout(nudgeTimer.current)
    }
    // Reset inactivity timer
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
      inactivityTimer.current = setTimeout(() => {
        setShowNudge(true)
        scheduleNudge()
      }, 60000)
    }
  }

  if (loading) {
    return (
      <div className="question-container">
        <div className="loading">Loading question...</div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="question-container">
        <div className="completion-message">
          <h1>🎉 Congratulations!</h1>
          <p>You've completed all the questions. Thank you for your responses!</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="question-container">
      {showNudge && (
        <div className="nudge-overlay">
          <div className="nudge-card">
            <h3>👋 Still there?</h3>
            <p>Don't forget to answer your question! Take a moment to continue.</p>
            <div className="nudge-actions">
              <button onClick={handleSkip} className="btn btn-secondary">
                I'm here, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="question-header">
        <div className="progress-info">
          <span>Question {progress?.current} of {progress?.total}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(progress?.current / progress?.total) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="question-card">
        <div className="question-content">
          <h2 className="question-text">{currentQuestion?.text}</h2>
          
          <form onSubmit={handleSubmit} className="answer-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="answer" className="answer-label">
                Your Answer
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows="4"
                required
                className="answer-input"
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting || !answer.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="question-footer">
        <p className="inactivity-notice">
          Tip: If you're inactive for 1 minute, you'll receive a friendly reminder!
        </p>
      </div>
    </div>
  )
}

export default QuestionForm
