import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { notifications, showNudge, hideNudgeNotification, removeNotification } = useNotification()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleNotificationClick = () => {
    if (showNudge) {
      hideNudgeNotification()
    }
    // Toggle dropdown visibility
    setShowDropdown(!showDropdown)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="brand-link">
            <h1>Nudge System</h1>
          </Link>
        </div>

        <div className="navbar-menu">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/questions" className="nav-link">
            Questions
          </Link>
          <Link to="/progress" className="nav-link">
            Progress
          </Link>
        </div>

        <div className="navbar-user">
          <span className="user-name">Hello, {user?.name}</span>
          
          {/* Notification Bell */}
          <div className="notification-container" ref={dropdownRef}>
            <button 
              className={`notification-bell ${showNudge ? 'has-notification' : ''}`}
              onClick={handleNotificationClick}
              title={showNudge ? 'Click to dismiss nudge' : 'No notifications'}
            >
              🔔
              {showNudge && <span className="notification-badge">1</span>}
            </button>
            
            {/* Notification Dropdown */}
            {showDropdown && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {notifications.length > 0 && (
                    <button 
                      className="clear-all-btn"
                      onClick={() => removeNotification(notifications[0]?.id)}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 3).map(notification => (
                      <div key={notification.id} className={`notification-item ${notification.type}`}>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.timestamp).toLocaleTimeString()}</small>
                      </div>
                    ))
                  ) : (
                    <div className="notification-item empty">
                      <p>No notifications yet</p>
                      <small>You'll see nudge reminders here when you're inactive</small>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
