import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { FontProvider } from '../app/providers/FontProvider'
import { ToastProvider } from '../app/providers/ToastProvider'
import { AuthProvider } from '../app/providers/AuthProvider'
import { router } from '../app/router'
import { apiClient } from '../lib/api-client'
import type { UserResponse, SettingsResponse } from '../types/api'

// Mock API client
vi.mock('../lib/api-client', async () => {
  const actual = await vi.importActual<typeof import('../lib/api-client')>('../lib/api-client')
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      postForm: vi.fn(),
      put: vi.fn(),
    },
  }
})

const mockUser: UserResponse = {
  id: 'user-route-1',
  fullName: 'Morgan Hayes',
  email: 'morgan@example.com',
  status: 'ACTIVE',
  emailVerifiedAt: null,
  profilePictureUrl: null,
  createdAt: '2026-10-24T00:00:00Z',
}

const mockSettings: SettingsResponse = {
  userId: 'user-route-1',
  proteinGoalG: 160,
  calorieGoalKcal: 2200,
  waterGoalMl: 3000,
  weightUnit: 'KG',
  timezone: 'UTC',
  theme: 'SYSTEM',
  updatedAt: '2026-10-24T00:00:00Z',
}

function renderRouteWithProviders(initialRoute: string) {
  const memoryRouter = createMemoryRouter(router.routes, {
    initialEntries: [initialRoute],
  })

  return render(
    <ThemeProvider>
      <FontProvider>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={memoryRouter} />
          </AuthProvider>
        </ToastProvider>
      </FontProvider>
    </ThemeProvider>
  )
}

describe('Routing, Session Expiration, and Cold-Start Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Renders HomePage on direct root navigation /', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Unauthenticated'))

    renderRouteWithProviders('/')

    await waitFor(() => {
      expect(screen.getByText(/Every choice adds up/i)).toBeDefined()
    })
  })

  it('2. Direct navigation to dynamic blog route /blogs/:slug renders the story without 404', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Unauthenticated'))

    renderRouteWithProviders('/blogs/starting-small')

    await waitFor(() => {
      expect(screen.getByText(/I Didn’t Need a Perfect Plan/i)).toBeDefined()
    })
  })

  it('3. Unknown route /nonexistent-path renders dedicated NotFoundPage with 404 badge', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Unauthenticated'))

    renderRouteWithProviders('/nonexistent-path')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Page Not Found/i })).toBeDefined()
      expect(screen.getByText(/Error 404/i)).toBeDefined()
      expect(screen.getByText(/\/nonexistent-path/i)).toBeDefined()
    })
  })

  it('4. Deep-link protected route /dashboard renders when user session is active', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/auth/me') return mockUser
      if (url === '/settings') return mockSettings
      return {}
    })

    renderRouteWithProviders('/dashboard')

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Morgan Hayes/i)).toBeDefined()
    })
  })

  it('5. Session expiration: redirects unauthenticated user from protected route to /login with session-expired banner', async () => {
    // Session expired: /auth/me returns 401
    const { ApiError } = await import('../lib/api-client')
    vi.mocked(apiClient.get).mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'Session expired'))

    renderRouteWithProviders('/dashboard')

    await waitFor(() => {
      expect(screen.getByText(/Your session has expired due to inactivity/i)).toBeDefined()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined()
    })
  })

  it('6. Backend waking from inactivity: renders connecting recovery screen with retry action instead of 404', async () => {
    // 504 Gateway timeout during cold start
    const { ApiError } = await import('../lib/api-client')
    vi.mocked(apiClient.get).mockRejectedValue(new ApiError(504, 'GATEWAY_TIMEOUT', 'Gateway timeout'))

    renderRouteWithProviders('/dashboard')

    await waitFor(() => {
      expect(screen.getByText(/Connecting to Prota/i)).toBeDefined()
      expect(screen.getByRole('button', { name: /Retry Connection/i })).toBeDefined()
    })

    // Now server wakes up and returns active session
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/auth/me') return mockUser
      if (url === '/settings') return mockSettings
      return {}
    })

    const retryBtn = screen.getByRole('button', { name: /Retry Connection/i })
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Morgan Hayes/i)).toBeDefined()
    })
  })
})
