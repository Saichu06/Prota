import { createContext } from 'react'
import type { FontId } from '../../lib/fonts'

export interface FontContextValue {
  font: FontId
  setFont: (font: FontId) => void
}

export const FontContext = createContext<FontContextValue | undefined>(undefined)
