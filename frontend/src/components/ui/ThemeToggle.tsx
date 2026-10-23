import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import type { Theme } from '../../app/providers/ThemeContext'
import { useAuth } from '../../hooks/useAuth'

interface ThemeToggleProps {
  className?: string
  compact?: boolean
}

export function ThemeToggle({ className = '', compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const { isAuthenticated, settings, updateSettings } = useAuth()

  const handleSelect = async (newTheme: Theme) => {
    setTheme(newTheme)

    // Synchronize with server if authenticated
    if (isAuthenticated && settings) {
      const backendTheme = newTheme === 'dark' ? 'DARK' : newTheme === 'light' ? 'LIGHT' : 'SYSTEM'
      if (settings.theme !== backendTheme) {
        try {
          await updateSettings({
            ...settings,
            theme: backendTheme,
          })
        } catch {
          // If server sync fails, client still switches theme smoothly
        }
      }
    }
  }

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  if (compact) {
    // Quick cycling toggle for topbars or compact headers: Light -> Dark -> System -> Light
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    const CurrentIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

    const themeLabel =
      theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'
    const nextThemeLabel =
      nextTheme === 'light' ? 'Light' : nextTheme === 'dark' ? 'Dark' : 'System'

    return (
      <button
        type="button"
        onClick={() => handleSelect(nextTheme)}
        className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${className}`}
        aria-label={`Current theme: ${themeLabel}. Click to switch to ${nextThemeLabel} theme.`}
        title={`Theme: ${themeLabel} (switch to ${nextThemeLabel})`}
      >
        <CurrentIcon className="w-4 h-4" aria-hidden="true" />
      </button>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 ${className}`}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const isSelected = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => handleSelect(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
              isSelected
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
