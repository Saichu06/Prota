import type { CsrfResponse } from '../types/api'

let cachedCsrfToken: string | null = null

/**
 * Extracts a cookie value by name from document.cookie.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
  return match ? decodeURIComponent(match[3]) : null
}

/**
 * Gets the current CSRF token:
 * 1. Checks document.cookie for 'XSRF-TOKEN' (standard Spring Security cookie name)
 * 2. Falls back to in-memory cached token
 */
export function getCsrfToken(): string | null {
  const cookieToken = getCookie('XSRF-TOKEN')
  if (cookieToken) {
    cachedCsrfToken = cookieToken
    return cookieToken
  }
  return cachedCsrfToken
}

/**
 * Fetches fresh CSRF token from the backend /api/v1/auth/csrf endpoint
 * if not present in cookies.
 */
export async function ensureCsrfToken(baseUrl: string): Promise<string | null> {
  const existing = getCsrfToken()
  if (existing) return existing

  try {
    const res = await fetch(`${baseUrl}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    })

    if (res.ok) {
      const data: CsrfResponse = await res.json()
      if (data && data.token) {
        cachedCsrfToken = data.token
        return data.token
      }
    }
  } catch {
    // If fetching fails, return whatever is in cookie or null
  }

  return getCsrfToken()
}
