import { ensureCsrfToken, getCsrfToken } from './csrf'
import type { ErrorResponse, FieldErrorDetail } from '../types/api'

export class ApiError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly fieldErrors?: FieldErrorDetail[]
  public readonly details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, fieldErrors?: FieldErrorDetail[], details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.details = details
  }

  public getFieldError(fieldName: string): string | undefined {
    return this.fieldErrors?.find((f) => f.field === fieldName)?.message
  }
}

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1'

interface RequestOptions extends RequestInit {
  skipCsrf?: boolean
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
  const method = (options.method || 'GET').toUpperCase()

  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach CSRF token on state-changing requests unless explicitly skipped
  if (!options.skipCsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    let token = getCsrfToken()
    if (!token) {
      token = await ensureCsrfToken(API_BASE_URL)
    }
    if (token) {
      headers.set('X-XSRF-TOKEN', token)
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include', // Mandatory for server-managed session cookies
  })

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T
  }

  const contentType = response.headers.get('content-type')
  const isJson = contentType && contentType.includes('application/json')

  if (!response.ok) {
    let errorData: ErrorResponse | null = null
    if (isJson) {
      try {
        errorData = (await response.json()) as ErrorResponse
      } catch {
        // Fallback below
      }
    }

    const status = response.status
    const code = errorData?.code || (status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'API_ERROR')
    const message = errorData?.message || (status === 401 ? 'Session expired or not authenticated. Please log in.' : status === 403 ? 'Access forbidden or CSRF validation failed.' : `Request failed with status ${status}`)

    throw new ApiError(status, code, message, errorData?.fieldErrors, errorData?.details)
  }

  if (isJson) {
    return (await response.json()) as T
  }

  return (await response.text()) as unknown as T
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  postForm: <T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}
