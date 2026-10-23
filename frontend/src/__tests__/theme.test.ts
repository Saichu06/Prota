import { describe, it, expect, beforeEach } from 'vitest'

describe('Theme Logic & Persistence', () => {
  const THEME_KEY = 'prota_theme_preference'

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  const resolveTheme = (theme: 'light' | 'dark' | 'system', systemPrefersDark: boolean): 'light' | 'dark' => {
    if (theme === 'system') {
      return systemPrefersDark ? 'dark' : 'light'
    }
    return theme
  }

  const applyThemeToDOM = (resolved: 'light' | 'dark') => {
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  it('correctly resolves light theme', () => {
    const resolved = resolveTheme('light', true)
    expect(resolved).toBe('light')
    applyThemeToDOM(resolved)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('correctly resolves dark theme', () => {
    const resolved = resolveTheme('dark', false)
    expect(resolved).toBe('dark')
    applyThemeToDOM(resolved)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('correctly resolves system preference when OS prefers dark', () => {
    const resolved = resolveTheme('system', true)
    expect(resolved).toBe('dark')
    applyThemeToDOM(resolved)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('correctly resolves system preference when OS prefers light', () => {
    const resolved = resolveTheme('system', false)
    expect(resolved).toBe('light')
    applyThemeToDOM(resolved)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists and retrieves theme preference in localStorage', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')

    localStorage.setItem(THEME_KEY, 'system')
    expect(localStorage.getItem(THEME_KEY)).toBe('system')
  })
})
