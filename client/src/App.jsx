import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import QuestionForm from './components/QuestionForm'
import Progress from './components/Progress'
import Navbar from './components/Navbar'
import './App.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

// Main App Component
function AppContent() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  return (
    <div className={`app ${location.pathname === '/questions' ? 'fullscreen' : ''}`}>
      {isAuthenticated && <Navbar />}
      {location.pathname === '/questions' ? (
        <Routes>
          <Route path="/questions" element={
            <ProtectedRoute>
              <QuestionForm />
            </ProtectedRoute>
          } />
        </Routes>
      ) : (
        <main className="main-content">
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/progress" element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>
      )}
    </div>
  )
}

// Root App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
