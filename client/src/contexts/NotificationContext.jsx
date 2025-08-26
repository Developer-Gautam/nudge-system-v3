import { createContext, useContext, useState } from 'react'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [showNudge, setShowNudge] = useState(false)

  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const showNudgeNotification = () => {
    setShowNudge(true)
    addNotification('Don\'t forget to answer your question! Take a moment to continue.', 'nudge')
  }

  const hideNudgeNotification = () => {
    setShowNudge(false)
  }

  const value = {
    notifications,
    showNudge,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showNudgeNotification,
    hideNudgeNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
