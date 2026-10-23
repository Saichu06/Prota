import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  syncBackendTheme: (remoteTheme: 'LIGHT' | 'DARK' | 'SYSTEM') => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
