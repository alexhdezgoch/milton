import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

export function Toast({ message, type = 'success', onDismiss, duration = 4000 }) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!message) return

    setVisible(true)
    setExiting(false)

    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)

    return () => clearTimeout(timer)
  }, [message, duration])

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, 200)
  }

  if (!message || !visible) return null

  const isSuccess = type === 'success'
  const bgColor = isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500'
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800'
  const Icon = isSuccess ? CheckCircle : AlertCircle

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 transition-all duration-200 ${
        exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className={`${bgColor} border rounded-xl shadow-lg p-4`}>
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
          <p className={`text-sm font-medium ${textColor} flex-1`}>{message}</p>
          <button
            onClick={handleDismiss}
            className={`p-1.5 rounded-lg hover:bg-black/5 transition-colors ${iconColor}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast
