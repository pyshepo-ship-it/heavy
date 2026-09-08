import { useState, useCallback } from 'react'

export interface Notification {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  timestamp: number
}

let notificationId = 0

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((type: Notification['type'], title: string, message: string) => {
    const id = ++notificationId
    setNotifications(prev => [...prev, { id, type, title, message, timestamp: Date.now() }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const notify = {
    success: (title: string, message: string) => addNotification('success', title, message),
    error: (title: string, message: string) => addNotification('error', title, message),
    info: (title: string, message: string) => addNotification('info', title, message),
    warning: (title: string, message: string) => addNotification('warning', title, message)
  }

  return { notifications, notify, removeNotification }
}
