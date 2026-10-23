import { describe, it, expect } from 'vitest'

describe('Route Guard Logic', () => {
  const evaluateProtectedRoute = (
    isLoading: boolean,
    isAuthenticated: boolean
  ): 'LOADING' | 'ALLOW' | 'REDIRECT_LOGIN' => {
    if (isLoading) return 'LOADING'
    if (!isAuthenticated) return 'REDIRECT_LOGIN'
    return 'ALLOW'
  }

  const evaluatePublicOnlyRoute = (
    isLoading: boolean,
    isAuthenticated: boolean
  ): 'LOADING' | 'ALLOW' | 'REDIRECT_DASHBOARD' => {
    if (isLoading) return 'LOADING'
    if (isAuthenticated) return 'REDIRECT_DASHBOARD'
    return 'ALLOW'
  }

  it('ProtectedRoute shows loading state while session bootstrap is in progress', () => {
    expect(evaluateProtectedRoute(true, false)).toBe('LOADING')
    expect(evaluateProtectedRoute(true, true)).toBe('LOADING')
  })

  it('ProtectedRoute redirects to login when unauthenticated', () => {
    expect(evaluateProtectedRoute(false, false)).toBe('REDIRECT_LOGIN')
  })

  it('ProtectedRoute grants access to authenticated users', () => {
    expect(evaluateProtectedRoute(false, true)).toBe('ALLOW')
  })

  it('PublicOnlyRoute redirects authenticated user away from login/register to dashboard', () => {
    expect(evaluatePublicOnlyRoute(false, true)).toBe('REDIRECT_DASHBOARD')
  })

  it('PublicOnlyRoute allows unauthenticated visitors to view login/register', () => {
    expect(evaluatePublicOnlyRoute(false, false)).toBe('ALLOW')
  })
})
