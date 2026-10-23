import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input, type InputProps } from './Input'

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const [showPassword, setShowPassword] = useState(false)

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const tooltipText = showPassword ? 'There it is!' : 'Let me see!'
  const ariaLabel = showPassword ? 'Hide password' : 'Show password'

  return (
    <div className="relative w-full">
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <div className="flex items-center gap-1.5">
            {showPassword && (
              <span
                className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 select-none hidden sm:inline transition-opacity duration-150"
                aria-live="polite"
              >
                There it is!
              </span>
            )}
            <button
              type="button"
              onClick={toggleVisibility}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-colors cursor-pointer"
              aria-label={ariaLabel}
              title={tooltipText}
              tabIndex={0}
            >
              {showPassword ? (
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
        }
        className={showPassword ? 'pr-24 sm:pr-28' : 'pr-10'}
        {...props}
      />
    </div>
  )
})

PasswordInput.displayName = 'PasswordInput'
