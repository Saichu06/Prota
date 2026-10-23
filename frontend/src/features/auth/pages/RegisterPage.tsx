import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User as UserIcon, Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { Input } from '../../../components/ui/Input'
import { PasswordInput } from '../../../components/ui/PasswordInput'
import { Button } from '../../../components/ui/Button'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { ApiError } from '../../../lib/api-client'

export function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    general?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  const { register, isAuthenticated } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Get trimmed display name for greetings
  const displayName = fullName.trim() || 'friend'
  const firstName = fullName.trim().split(' ')[0] || displayName

  const validateStep1 = (): boolean => {
    const trimmed = fullName.trim()
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, fullName: 'Please tell us your name' }))
      return false
    }
    if (trimmed.length > 100) {
      setErrors((prev) => ({ ...prev, fullName: 'Name must not exceed 100 characters' }))
      return false
    }
    setErrors((prev) => ({ ...prev, fullName: undefined }))
    return true
  }

  const validateStep2 = (): boolean => {
    const trimmed = email.trim()
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, email: 'Email address is required' }))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }))
      return false
    }
    if (trimmed.length > 254) {
      setErrors((prev) => ({ ...prev, email: 'Email must not exceed 254 characters' }))
      return false
    }
    setErrors((prev) => ({ ...prev, email: undefined }))
    return true
  }

  const validateStep3 = (): boolean => {
    const newErrors: typeof errors = {}
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    } else if (password.length > 100) {
      newErrors.password = 'Password must not exceed 100 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors((prev) => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validateStep1()) {
      setStep(1)
      return
    }
    if (!validateStep2()) {
      setStep(2)
      return
    }
    if (!validateStep3()) {
      return
    }

    setIsLoading(true)
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      // Clear sensitive password state
      setPassword('')
      setConfirmPassword('')
      success('Welcome to Prota! Your daily goals have been initialized.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === 'DUPLICATE_RESOURCE' || err.message?.toLowerCase().includes('email')) {
          setErrors({
            email: 'An account with this email already exists. Try signing in instead.',
            general: 'Email is already registered. Please go back to Step 2 to use another email.',
          })
        } else {
          setErrors({
            general: err.message || 'Registration failed. Please try again.',
            fullName: err.getFieldError('fullName'),
            email: err.getFieldError('email'),
            password: err.getFieldError('password'),
          })
          if (err.getFieldError('email')) {
            setStep(2)
          } else if (err.getFieldError('fullName')) {
            setStep(1)
          }
        }
      } else {
        setErrors({ general: 'Unable to connect to the server. Please check your network connection.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthSplitLayout>
      <div className="space-y-6">
        {/* Step Indicator & Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Step {step} of 3</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {step === 1 ? 'Your Profile' : step === 2 ? 'Your Login Email' : 'Account Security'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out ${
                step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'
              }`}
            />
          </div>
        </div>

        {/* Global Error Banner */}
        {errors.general && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              {errors.general}
              {errors.email && step === 3 && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="block mt-1 font-bold text-emerald-600 dark:text-emerald-400 underline hover:no-underline cursor-pointer"
                >
                  Click here to change email in Step 2 &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 1: NAME ─── */}
        {step === 1 && (
          <form onSubmit={handleNextFromStep1} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                First things first — what should we call you?
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Let's make your Prota experience feel a little more personal.
              </p>
            </div>

            <Input
              label="YOUR NAME"
              type="text"
              placeholder="e.g. Sai Charan"
              autoComplete="name"
              autoFocus
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }))
              }}
              error={errors.fullName}
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          </form>
        )}

        {/* ─── STEP 2: EMAIL ─── */}
        {step === 2 && (
          <form onSubmit={handleNextFromStep2} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Hi, {firstName}!
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Which email should we connect to your account?
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Note:</span> This is the email you'll use to log in, so make sure it's correct.
            </div>

            <Input
              label="EMAIL ADDRESS"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="w-1/3"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-2/3"
              >
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* ─── STEP 3: PASSWORD ─── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Almost there, {firstName}!
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Create a password to keep your nutrition journey yours.
              </p>
            </div>

            <PasswordInput
              label="PASSWORD"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              autoFocus
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

            <PasswordInput
              label="CONFIRM PASSWORD"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
              }}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              disabled={isLoading}
            />

            <div className="py-1 text-slate-500 dark:text-slate-400 text-[11px] space-y-1">
              <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Default 140g protein & 2,000 kcal goals created automatically
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(2)}
                disabled={isLoading}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="w-1/3"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-2/3"
              >
                Create My Account
              </Button>
            </div>
          </form>
        )}

        {/* Link back to Login */}
        <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
