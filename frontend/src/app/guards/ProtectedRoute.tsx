import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-emerald-600 flex items-center justify-center p-2 mb-4 shadow-md">
          <img src="/logo.png" alt="Prota Logo" className="w-full h-full object-contain" />
        </div>
        <LoadingSpinner size="lg" text="Verifying session with Prota..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
