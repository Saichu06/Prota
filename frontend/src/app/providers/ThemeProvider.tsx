import React, { useEffect, useState, useCallback } from 'react'
import { ThemeContext, type Theme, type ResolvedTheme } from './ThemeContext'

const STORAGE_KEY = 'prota_theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved
  }
  return 'system'
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function applyDomTheme(effective: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (effective === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.style.colorScheme = effective
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initial = getInitialTheme()
    const resolved = initial === 'system' ? getSystemTheme() : initial
    applyDomTheme(resolved)
    return resolved
  })

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // Ignored
    }
    const effective = newTheme === 'system' ? getSystemTheme() : newTheme
    applyDomTheme(effective)
    setResolvedTheme(effective)
  }, [])

  const syncBackendTheme = useCallback(
    (remoteTheme: 'LIGHT' | 'DARK' | 'SYSTEM') => {
      const mapped: Theme = remoteTheme === 'DARK' ? 'dark' : remoteTheme === 'LIGHT' ? 'light' : 'system'
      setTheme(mapped)
    },
    [setTheme]
  )

  useEffect(() => {
    const effective = theme === 'system' ? getSystemTheme() : theme
    applyDomTheme(effective)

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e: MediaQueryListEvent) => {
          if (theme === 'system') {
            const nextEffective = e.matches ? 'dark' : 'light'
            applyDomTheme(nextEffective)
            setResolvedTheme(nextEffective)
          }
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      } catch {
        // Ignored
      }
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, syncBackendTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
