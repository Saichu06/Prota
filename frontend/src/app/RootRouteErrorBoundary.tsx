import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { NotFoundPage } from '../features/notfound/NotFoundPage'
import { Button } from '../components/ui/Button'

export function RootRouteErrorBoundary() {
  const error = useRouteError()

  // If this is a 404 response from a loader or route, show the NotFoundPage
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  const errorMessage =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
      ? `${error.status} ${error.statusText}`
      : 'An unexpected application error occurred.'

  return (
    <div
      id="root-error-boundary"
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
    >
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-2">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {errorMessage}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.reload()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Reload Page
          </Button>

          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Home className="w-4 h-4" />}
              className="w-full"
            >
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
