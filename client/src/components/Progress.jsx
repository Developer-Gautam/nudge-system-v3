import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Progress.css'

const Progress = () => {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const response = await axios.get('/questions/progress')
      setProgress(response.data)
    } catch (error) {
      console.error('Error fetching progress:', error)
      setError('Failed to load progress')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="progress-container">
        <div className="loading">Loading your progress...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="progress-container">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h1>Your Progress</h1>
        <p>Review your answers and progress</p>
      </div>

      <div className="progress-summary">
        <div className="summary-card">
          <div className="summary-stat">
            <span className="stat-number">{progress?.completed || 0}</span>
            <span className="stat-label">Questions Answered</span>
          </div>
          <div className="summary-stat">
            <span className="stat-number">{progress?.total || 0}</span>
            <span className="stat-label">Total Questions</span>
          </div>
          <div className="summary-stat">
            <span className="stat-number">{progress?.percentage || 0}%</span>
            <span className="stat-label">Completion Rate</span>
          </div>
        </div>
      </div>

      <div className="progress-bar-section">
        <h2>Overall Progress</h2>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress?.percentage || 0}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {progress?.completed} of {progress?.total} questions completed
        </span>
      </div>

      {progress?.answers && progress.answers.length > 0 ? (
        <div className="answers-section">
          <h2>Your Answers</h2>
          <div className="answers-list">
            {progress.answers.map((answer, index) => (
              <div key={answer.questionId} className="answer-card">
                <div className="answer-header">
                  <span className="question-number">Question {answer.questionId}</span>
                  <span className="answer-date">
                    {formatDate(answer.answeredAt)}
                  </span>
                </div>
                <div className="answer-content">
                  <p className="answer-text">{answer.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-answers">
          <h2>No Answers Yet</h2>
          <p>You haven't answered any questions yet. Start your journey!</p>
          <Link to="/questions" className="btn btn-primary">
            Start Answering
          </Link>
        </div>
      )}

      <div className="progress-actions">
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
        {progress?.completed < progress?.total && (
          <Link to="/questions" className="btn btn-primary">
            Continue Questions
          </Link>
        )}
      </div>
    </div>
  )
}

export default Progress
