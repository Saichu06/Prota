import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Button } from '../../components/ui/Button'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, serverError, retryAuth } = useAuth()
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

  // If server is waking up from inactivity or temporarily unreachable, allow user to retry without losing route
  if (serverError && !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Connecting to Prota
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          The application service is waking up from inactivity or reconnecting. This usually takes just a few seconds.
        </p>
        <Button
          onClick={() => retryAuth?.()}
          variant="primary"
          size="md"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Retry Connection
        </Button>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location, sessionExpired: true }} replace />
  }

  return <>{children}</>
}
