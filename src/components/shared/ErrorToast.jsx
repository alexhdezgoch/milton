import { useState, useEffect } from 'react'
import { X, AlertCircle, RefreshCw } from 'lucide-react'

export function ErrorToast({ message, onDismiss, onRetry, duration = 5000 }) {
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

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 transition-all duration-200 ${
        exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="bg-red-50 border border-red-200 rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-1">{message}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-red-500"
                title="Retry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for managing error toast state
export function useErrorToast() {
  const [error, setError] = useState(null)
  const [retryFn, setRetryFn] = useState(null)

  const showError = (message, onRetry = null) => {
    setError(message)
    setRetryFn(() => onRetry)
  }

  const clearError = () => {
    setError(null)
    setRetryFn(null)
  }

  const handleRetry = () => {
    if (retryFn) {
      clearError()
      retryFn()
    }
  }

  return {
    error,
    showError,
    clearError,
    handleRetry,
    ErrorToastComponent: error ? (
      <ErrorToast
        message={error}
        onDismiss={clearError}
        onRetry={retryFn ? handleRetry : null}
      />
    ) : null
  }
}

export default ErrorToast
