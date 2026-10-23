import { useEffect, useState } from 'react'

interface LinearProgressBarProps {
  label: string
  consumed: number
  goal: number
  unit: string
  barColor?: string
  trackColor?: string
  showRemaining?: boolean
  className?: string
}

export function LinearProgressBar({
  label,
  consumed,
  goal,
  unit,
  barColor = 'bg-amber-500',
  trackColor = 'bg-slate-100 dark:bg-slate-800',
  showRemaining = true,
  className = '',
}: LinearProgressBarProps) {
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

  const safeGoal = goal > 0 ? goal : 1
  const percentage = Math.max(0, Math.round((consumed / safeGoal) * 100))
  const visualWidth = Math.min(percentage, 100)
  const remaining = Math.max(0, goal - consumed)
  const isOver = percentage > 100

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <div className="flex items-baseline gap-1 text-slate-900 dark:text-slate-100 tabular-nums">
          <span className="font-bold">{consumed}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500 dark:text-slate-400">
            {goal} {unit}
          </span>
        </div>
      </div>

      {/* Track & Filled Bar */}
      <div
        className={`w-full h-2.5 rounded-full overflow-hidden ${trackColor}`}
        role="progressbar"
        aria-label={`${label} progress: ${consumed} of ${goal} ${unit}`}
        aria-valuenow={consumed}
        aria-valuemin={0}
        aria-valuemax={goal}
      >
        <div
          className={`h-full rounded-full ${barColor} ${
            reducedMotion ? '' : 'transition-all duration-500 ease-out'
          }`}
          style={{ width: `${visualWidth}%` }}
        />
      </div>

      {showRemaining && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
          <span>{percentage}% of daily target</span>
          <span>
            {isOver ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                +{consumed - goal} {unit} exceeded
              </span>
            ) : remaining === 0 ? (
              'Target achieved'
            ) : (
              `${remaining} ${unit} remaining`
            )}
          </span>
        </div>
      )}
    </div>
  )
}
