import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Compass, Home, ArrowLeft, LayoutDashboard, ShieldAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

export function NotFoundPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.title = '404 — Page Not Found | Prota'
  }, [])

  return (
    <div
      id="not-found-page"
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/20"
    >
      <div className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Background ambient radial aura */}
        <div className="absolute inset-0 bg-radial from-emerald-500/5 dark:from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs mb-2">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Error 404
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Page Not Found
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            The page <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{location.pathname}</code> does not exist, may have been moved, or the link might be broken.
          </p>
        </div>

        <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>

          {isAuthenticated ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                leftIcon={<LayoutDashboard className="w-4 h-4" />}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Home className="w-4 h-4" />}
                className="w-full"
              >
                Back to Home
              </Button>
            </Link>
          )}
        </div>

        <div className="relative z-10 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>If you believe this is an error, please verify the URL or revisit the homepage.</span>
        </div>
      </div>
    </div>
  )
}
