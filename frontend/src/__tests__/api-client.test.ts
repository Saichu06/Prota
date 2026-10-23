import { describe, it, expect, beforeEach } from 'vitest'
import { ApiError } from '../lib/api-client'
import { getCookie, getCsrfToken } from '../lib/csrf'

describe('ApiError RFC 9457 Parsing', () => {
  it('correctly constructs ApiError from status, code, and message', () => {
    const error = new ApiError(401, 'UNAUTHORIZED', 'Unauthorized access')
    expect(error.status).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.message).toBe('Unauthorized access')
    expect(error.fieldErrors).toBeUndefined()
  })

  it('correctly parses ProblemDetail response with field validation errors', () => {
    const fieldErrors = [
      { field: 'email', message: 'Email already exists' },
      { field: 'password', message: 'Password must be at least 8 characters' },
    ]

    const error = new ApiError(
      400,
      'VALIDATION_FAILED',
      'Validation failed for request fields',
      fieldErrors
    )

    expect(error.status).toBe(400)
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.message).toBe('Validation failed for request fields')
    expect(error.getFieldError('email')).toBe('Email already exists')
    expect(error.getFieldError('password')).toBe('Password must be at least 8 characters')
    expect(error.getFieldError('unknownField')).toBeUndefined()
  })
})

describe('CSRF Cookie Extraction', () => {
  beforeEach(() => {
    // Reset document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    })
  })

  it('returns null when cookie is empty or not found', () => {
    document.cookie = 'OTHER_COOKIE=xyz123'
    expect(getCookie('XSRF-TOKEN')).toBeNull()
  })

  it('extracts XSRF-TOKEN when present', () => {
    document.cookie = 'PROTASESSIONID=sess-123; XSRF-TOKEN=test-csrf-token-abc; other=val'
    expect(getCsrfToken()).toBe('test-csrf-token-abc')
  })

  it('handles URL-encoded CSRF cookie values', () => {
    document.cookie = 'XSRF-TOKEN=token%2Bwith%2Bspecial%2Fchars'
    expect(getCsrfToken()).toBe('token+with+special/chars')
  })
})
