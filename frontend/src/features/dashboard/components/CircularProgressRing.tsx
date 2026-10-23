import { useEffect, useState } from 'react'

interface CircularProgressRingProps {
  consumed: number
  goal: number
  size?: number
  strokeWidth?: number
  unit?: string
  label?: string
  className?: string
}

export function CircularProgressRing({
  consumed,
  goal,
  size = 180,
  strokeWidth = 14,
  unit = 'g',
  label = 'Protein',
  className = '',
}: CircularProgressRingProps) {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeGoal = goal > 0 ? goal : 1
  const percentage = Math.max(0, Math.round((consumed / safeGoal) * 100))
  // Cap visual circle fill at 100% to avoid overlap, but show actual percentage in text
  const visualPercentage = Math.min(percentage, 100)
  const offset = circumference - (visualPercentage / 100) * circumference
  const isOverGoal = percentage > 100
  const remaining = Math.max(0, goal - consumed)

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      role="progressbar"
      aria-label={`${label} progress: ${consumed}${unit} of ${goal}${unit} (${percentage}%)`}
      aria-valuenow={consumed}
      aria-valuemin={0}
      aria-valuemax={goal}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-800/80 transition-colors"
          />

          {/* Animated progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`text-emerald-500 dark:text-emerald-400 ${
              reducedMotion ? '' : 'transition-all duration-700 ease-out'
            }`}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
            {label}
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {consumed}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            of {goal} {unit}
          </span>
        </div>
      </div>

      {/* Status Badge below ring */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
            isOverGoal
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60'
              : percentage >= 90
              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          {percentage}% complete
        </span>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          {isOverGoal ? (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              +{consumed - goal}
              {unit} target met
            </span>
          ) : remaining === 0 ? (
            'Target reached'
          ) : (
            `${remaining}${unit} remaining`
          )}
        </span>
      </div>
    </div>
  )
}
