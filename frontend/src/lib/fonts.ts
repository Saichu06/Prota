/**
 * Application font options.
 *
 * The actual font stacks live in `styles/fonts.css` (single source of truth),
 * keyed by the `data-font` attribute. JS only selects an id and sets the
 * attribute on <html>; every element inherits via the `--app-font` variable.
 */
export type FontId = 'inter' | 'manrope' | 'plus-jakarta' | 'dm-sans' | 'ibm-plex'

export interface FontOption {
  id: FontId
  label: string
}

export const FONT_OPTIONS: readonly FontOption[] = [
  { id: 'inter', label: 'Inter' },
  { id: 'manrope', label: 'Manrope' },
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans' },
  { id: 'dm-sans', label: 'DM Sans' },
  { id: 'ibm-plex', label: 'IBM Plex Sans' },
] as const

export const DEFAULT_FONT: FontId = 'inter'

/** localStorage key — keep in sync with the inline boot script in index.html. */
export const FONT_STORAGE_KEY = 'prota_font'

export function isFontId(value: unknown): value is FontId {
  return typeof value === 'string' && FONT_OPTIONS.some((o) => o.id === value)
}

export function readStoredFont(): FontId {
  try {
    const saved = localStorage.getItem(FONT_STORAGE_KEY)
    return isFontId(saved) ? saved : DEFAULT_FONT
  } catch {
    return DEFAULT_FONT
  }
}

export function applyFontToDocument(font: FontId): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.font = font
}
