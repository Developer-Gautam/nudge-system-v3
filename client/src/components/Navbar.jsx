import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
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
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
