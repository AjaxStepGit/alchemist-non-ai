'use client'

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
} from 'react'
import Toast, { ToastData, ToastType } from './Toast'

interface ToastContextType {
    showToast: (type: ToastType, message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([])

    const showToast = useCallback(
        (type: ToastType, message: string, duration = 3000) => {
            const id = crypto.randomUUID()
            setToasts((prev) => [...prev, { id, type, message, duration }])
        },
        []
    )

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50">
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToastContext() {
    const context = useContext(ToastContext)
    if (!context)
        throw new Error('useToastContext must be used within ToastProvider')
    return context
}
