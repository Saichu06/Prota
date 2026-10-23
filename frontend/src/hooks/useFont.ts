import { useContext } from 'react'
import { FontContext, type FontContextValue } from '../app/providers/FontContext'

export function useFont(): FontContextValue {
  const context = useContext(FontContext)
  if (!context) {
    throw new Error('useFont must be used within a FontProvider')
  }
  return context
}
