/**
 * Date utilities for reliable, timezone-safe calendar and day navigation.
 */

/**
 * Validates whether a string matches strict YYYY-MM-DD format.
 */
export function isValidYmd(ymd?: string | null): ymd is string {
  if (!ymd || typeof ymd !== 'string') return false
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!match) return false
  const y = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const d = parseInt(match[3], 10)
  if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return false
  return true
}

/**
 * Adds or subtracts calendar days from a 'YYYY-MM-DD' string without any local timezone shift.
 * Uses Date.UTC with UTC getters to guarantee deterministic day arithmetic across all timezones,
 * leap years, and month/year boundaries.
 */
export function addDaysToYmd(ymd: string, days: number): string {
  if (!isValidYmd(ymd)) {
    return getTodayYmd()
  }
  const [yStr, mStr, dStr] = ymd.split('-')
  const year = parseInt(yStr, 10)
  const month = parseInt(mStr, 10) - 1
  const day = parseInt(dStr, 10)

  const utc = new Date(Date.UTC(year, month, day + days))
  const resY = utc.getUTCFullYear()
  const resM = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const resD = String(utc.getUTCDate()).padStart(2, '0')
  return `${resY}-${resM}-${resD}`
}

/**
 * Adds or subtracts calendar months from a 'YYYY-MM-DD' string.
 */
export function addMonthsToYmd(ymd: string, months: number): string {
  if (!isValidYmd(ymd)) {
    return getTodayYmd()
  }
  const [yStr, mStr, dStr] = ymd.split('-')
  const year = parseInt(yStr, 10)
  const month = parseInt(mStr, 10) - 1
  const day = parseInt(dStr, 10)

  // Use UTC
  const utc = new Date(Date.UTC(year, month + months, 1))
  const resY = utc.getUTCFullYear()
  const resM = String(utc.getUTCMonth() + 1).padStart(2, '0')
  // Check days in target month to clamp day if needed (e.g. Jan 31 -> Feb 28)
  const daysInMonth = new Date(Date.UTC(resY, utc.getUTCMonth() + 1, 0)).getUTCDate()
  const clampedDay = Math.min(day, daysInMonth)
  const resD = String(clampedDay).padStart(2, '0')
  return `${resY}-${resM}-${resD}`
}

/**
 * Returns today's date formatted as 'YYYY-MM-DD' respecting the user's timezone if specified.
 */
export function getTodayYmd(timezone?: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date())
  } catch {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
}

/**
 * Formats a 'YYYY-MM-DD' string into a friendly localized display string (e.g., 'Wed, Oct 21, 2026').
 * Avoids any timezone shift by formatting noon UTC.
 */
export function formatReadableDate(ymd: string): string {
  if (!isValidYmd(ymd)) return ymd || '—'
  try {
    const [y, m, d] = ymd.split('-').map((v) => parseInt(v, 10))
    const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(utcNoon)
  } catch {
    return ymd
  }
}

/**
 * Legacy formatter for ISO timestamps (e.g., '2026-10-21T08:30:00Z').
 */
export function formatDate(isoString?: string | null): string {
  if (!isoString) return '—'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return isoString
  }
}

/**
 * Returns a list of standard IANA timezones for dropdown selection.
 */
export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
]
