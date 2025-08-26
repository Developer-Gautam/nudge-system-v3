import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your progress...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  const isCompleted = progress?.total > 0 && progress?.completed === progress?.total

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Let's continue with your questions</p>
      </div>

      <div className="progress-section">
        <div className="progress-card">
          <h2>Your Progress</h2>
          <div className="progress-stats">
            <div className="stat">
              <span className="stat-number">{progress?.completed || 0}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat">
              <span className="stat-number">{progress?.total || 0}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat">
              <span className="stat-number">{progress?.percentage || 0}%</span>
              <span className="stat-label">Progress</span>
            </div>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress?.percentage || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="action-section">
        {progress?.total === 0 ? (
          <div className="action-card">
            <h2>No Questions Available</h2>
            <p>Please contact the administrator to set up questions.</p>
          </div>
        ) : isCompleted ? (
          <div className="completion-card">
            <h2>🎉 Congratulations!</h2>
            <p>You've completed all the questions. Great job!</p>
            <Link to="/progress" className="btn btn-primary">
              View Your Answers
            </Link>
          </div>
        ) : (
          <div className="action-card">
            <h2>Ready to Continue?</h2>
            <p>You have {progress?.total - progress?.completed} questions remaining</p>
            <Link to="/questions" className="btn btn-primary">
              Continue Questions
            </Link>
          </div>
        )}
      </div>

      <div className="quick-actions">
        <Link to="/progress" className="quick-action-card">
          <h3>📊 View Progress</h3>
          <p>See all your answers and progress</p>
        </Link>
        
        <Link to="/questions" className="quick-action-card">
          <h3>❓ Answer Questions</h3>
          <p>Continue with your questionnaire</p>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
