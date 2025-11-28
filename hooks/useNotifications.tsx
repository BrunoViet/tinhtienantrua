'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'

type NotificationType = 'success' | 'error'

interface Notification {
  id: string
  message: string
  type: NotificationType
  duration: number
}

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

export function useNotifications(defaultDuration = 3000) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({})

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
      delete timersRef.current[id]
    }
  }, [])

  const addNotification = useCallback(
    (message: string, type: NotificationType = 'success', duration = defaultDuration) => {
      const id = createId()
      setNotifications((prev) => [...prev, { id, message, type, duration }])

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => removeNotification(id), duration)
      }

      return id
    },
    [defaultDuration, removeNotification]
  )

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const NotificationContainer = () => (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast-enter pointer-events-auto flex min-w-[240px] max-w-sm items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm text-white transition-transform ${
            notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          <div className="mt-0.5">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-white/80 hover:text-white"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )

  NotificationContainer.displayName = 'NotificationContainer'

  return { addNotification, NotificationContainer, removeNotification }
}


