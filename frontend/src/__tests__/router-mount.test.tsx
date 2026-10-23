import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { ToastProvider } from '../app/providers/ToastProvider'
import { AuthProvider } from '../app/providers/AuthProvider'
import { HomePage } from '../features/home/HomePage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { PublicOnlyRoute } from '../app/guards/PublicOnlyRoute'
import { ProtectedRoute } from '../app/guards/ProtectedRoute'
import { AppShell } from '../components/layout/AppShell'

describe('Router Mount on /', () => {
  it('renders HomePage at / without redirecting to login', async () => {
    const testRoutes = [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/login',
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        element: (
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'dashboard',
            element: <div>Dashboard Content</div>,
          },
        ],
      },
    ]

    const testRouter = createMemoryRouter(testRoutes, {
      initialEntries: ['/'],
    })

    render(
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={testRouter} />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    )

    // Should find the hero headline on /
    const headline = await screen.findByText(/Every choice adds up/i)
    expect(headline).toBeDefined()
  })
})
