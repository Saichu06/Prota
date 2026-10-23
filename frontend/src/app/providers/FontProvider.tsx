import React, { useCallback, useState } from 'react'
import { FontContext } from './FontContext'
import { FONT_STORAGE_KEY, applyFontToDocument, readStoredFont, type FontId } from '../../lib/fonts'

/**
 * Holds the selected application font. The preference is stored per-device in
 * localStorage because the backend user_settings schema has no font column yet
 * (see frontend/README.md → Known Limitations).
 */
export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<FontId>(() => {
    const initial = readStoredFont()
    applyFontToDocument(initial)
    return initial
  })

  const setFont = useCallback((next: FontId) => {
    setFontState(next)
    applyFontToDocument(next)
    try {
      localStorage.setItem(FONT_STORAGE_KEY, next)
    } catch {
      // Storage unavailable (private mode / quota): font still applies for this session.
    }
  }, [])

  return <FontContext.Provider value={{ font, setFont }}>{children}</FontContext.Provider>
}
