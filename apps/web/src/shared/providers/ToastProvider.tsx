import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

/**
 * Toast Types
 */
type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

/**
 * Toast Context Type
 */
interface ToastContextType {
  toasts: Toast[]
  showToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

/**
 * Toast Context
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * Toast Provider Component
 *
 * Manages global toast notifications across the application.
 * Automatically removes toasts after 5 seconds.
 *
 * TODO: Replace with a proper toast library like sonner or react-hot-toast
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7)
    const toast: Toast = { id, message, type }

    setToasts((prev) => [...prev, toast])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ removeToast, showToast, toasts }}>
      {children}
      {/* Toast Container */}
      <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-end gap-2 p-4">
        {toasts.map((toast) => (
          <button
            className={`pointer-events-auto min-w-[300px] rounded-lg p-4 text-sm shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-900 dark:bg-green-900 dark:text-green-50'
                : toast.type === 'error'
                  ? 'bg-red-50 text-red-900 dark:bg-red-900 dark:text-red-50'
                  : toast.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-50'
                    : 'bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-50'
            }`}
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            type="button"
          >
            <p>{toast.message}</p>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/**
 * useToast Hook
 *
 * Access toast context from any component.
 *
 * @throws {Error} If used outside ToastProvider
 *
 * @example
 * ```tsx
 * const { showToast } = useToast()
 * showToast('success', 'Operation completed!')
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
