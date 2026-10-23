import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FontProvider } from '../app/providers/FontProvider'
import { useFont } from '../hooks/useFont'
import { FONT_OPTIONS, DEFAULT_FONT, FONT_STORAGE_KEY, readStoredFont, isFontId } from '../lib/fonts'

function FontPicker() {
  const { font, setFont } = useFont()
  return (
    <fieldset>
      <legend>Font Family</legend>
      {FONT_OPTIONS.map((o) => (
        <label key={o.id}>
          <input type="radio" name="f" checked={font === o.id} onChange={() => setFont(o.id)} />
          {o.label}
        </label>
      ))}
    </fieldset>
  )
}

describe('Font options', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.font
  })

  it('offers exactly the five required fonts with Inter as default', () => {
    expect(FONT_OPTIONS.map((o) => o.label)).toEqual([
      'Inter',
      'Manrope',
      'Plus Jakarta Sans',
      'DM Sans',
      'IBM Plex Sans',
    ])
    expect(DEFAULT_FONT).toBe('inter')
  })

  it('falls back to the default when storage is empty or invalid', () => {
    expect(readStoredFont()).toBe('inter')
    localStorage.setItem(FONT_STORAGE_KEY, 'comic-sans')
    expect(readStoredFont()).toBe('inter')
    expect(isFontId('comic-sans')).toBe(false)
  })

  it('applies the default font to <html> on mount', () => {
    render(
      <FontProvider>
        <FontPicker />
      </FontProvider>
    )
    expect(document.documentElement.dataset.font).toBe('inter')
  })

  it('restores a previously saved font', () => {
    localStorage.setItem(FONT_STORAGE_KEY, 'manrope')
    render(
      <FontProvider>
        <FontPicker />
      </FontProvider>
    )
    expect(document.documentElement.dataset.font).toBe('manrope')
    expect((screen.getByLabelText('Manrope') as HTMLInputElement).checked).toBe(true)
  })

  it('selecting a font updates <html> immediately and persists it', () => {
    render(
      <FontProvider>
        <FontPicker />
      </FontProvider>
    )
    fireEvent.click(screen.getByLabelText('Plus Jakarta Sans'))
    expect(document.documentElement.dataset.font).toBe('plus-jakarta')
    expect(localStorage.getItem(FONT_STORAGE_KEY)).toBe('plus-jakarta')
  })
})
