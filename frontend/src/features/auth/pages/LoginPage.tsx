import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, AlertCircle, Clock } from 'lucide-react'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { Input } from '../../../components/ui/Input'
import { PasswordInput } from '../../../components/ui/PasswordInput'
import { Button } from '../../../components/ui/Button'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { ApiError } from '../../../lib/api-client'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const { login, isAuthenticated } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect if already authenticated
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
  const isSessionExpired = (location.state as { sessionExpired?: boolean })?.sessionExpired
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validate()) return

    setIsLoading(true)
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      })
      success('Welcome back to Prota!')
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrors({ general: 'Invalid email or password. Please verify your credentials.' })
        } else {
          setErrors({
            general: err.message || 'Login failed. Please try again.',
            email: err.getFieldError('email'),
            password: err.getFieldError('password'),
          })
        }
      } else {
        setErrors({ general: 'Unable to connect to the server. Please check your network.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue tracking your daily targets."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {isSessionExpired && (
          <div
            role="status"
            className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
          >
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              Your session has expired due to inactivity. Please sign in to resume where you left off.
            </div>
          </div>
        )}

        {errors.general && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{errors.general}</div>
          </div>
        )}

        <Input
          label="EMAIL ADDRESS"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
          }}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={isLoading}
        />

        <PasswordInput
          label="PASSWORD"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
          }}
          error={errors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </form>
    </AuthSplitLayout>
  )
}
