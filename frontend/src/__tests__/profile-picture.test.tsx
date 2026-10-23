import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { AuthContext } from '../app/providers/AuthContext'
import { ToastProvider } from '../app/providers/ToastProvider'
import type { UserResponse, SettingsResponse } from '../types/api'

const mockUser: UserResponse = {
  id: 'user-456',
  fullName: 'Morgan Blake',
  email: 'morgan@example.com',
  status: 'ACTIVE',
  emailVerifiedAt: '2026-10-20T00:00:00Z',
  profilePictureUrl: null,
  createdAt: '2026-10-20T00:00:00Z',
}

const mockSettings: SettingsResponse = {
  userId: 'user-456',
  proteinGoalG: 140,
  calorieGoalKcal: 2000,
  waterGoalMl: 2500,
  weightUnit: 'KG',
  timezone: 'UTC',
  theme: 'SYSTEM',
  updatedAt: '2026-10-20T00:00:00Z',
}

describe('Profile Photo Management on ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders initial fallback when user has no profile photo', () => {
    const mockAuth = {
      user: mockUser,
      settings: mockSettings,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
      updateSettings: vi.fn(),
      refreshUser: vi.fn(),
      refreshSettings: vi.fn(),
    }

    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthContext.Provider value={mockAuth}>
            <ProfilePage />
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    )

    // Checks initials fallback
    expect(screen.getByText('M')).toBeDefined()
    expect(screen.getByRole('button', { name: /upload photo/i })).toBeDefined()
  })

  it('rejects files exceeding 2MB with client-side validation', () => {
    const mockAuth = {
      user: mockUser,
      settings: mockSettings,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
      updateSettings: vi.fn(),
      refreshUser: vi.fn(),
      refreshSettings: vi.fn(),
    }

    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthContext.Provider value={mockAuth}>
            <ProfilePage />
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    )

    const fileInput = screen.getByLabelText(/upload profile picture/i) as HTMLInputElement

    // Create an oversized file (3MB)
    const largeFile = new File(['a'.repeat(3 * 1024 * 1024)], 'large-photo.jpg', {
      type: 'image/jpeg',
    })

    fireEvent.change(fileInput, { target: { files: [largeFile] } })

    expect(screen.getByText(/Image file size must not exceed 2MB/i)).toBeDefined()
  })

  it('renders Remove button when user already has a profile picture configured', async () => {
    const userWithPhoto: UserResponse = {
      ...mockUser,
      profilePictureUrl: '/api/v1/users/avatar/user-456_test.png',
    }

    const removeAvatarMock = vi.fn().mockResolvedValue({
      ...userWithPhoto,
      profilePictureUrl: null,
    })

    const mockAuth = {
      user: userWithPhoto,
      settings: mockSettings,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: removeAvatarMock,
      updateSettings: vi.fn(),
      refreshUser: vi.fn(),
      refreshSettings: vi.fn(),
    }

    render(
      <MemoryRouter>
        <ToastProvider>
          <AuthContext.Provider value={mockAuth}>
            <ProfilePage />
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    )

    const removeBtn = screen.getByRole('button', { name: /remove/i })
    expect(removeBtn).toBeDefined()

    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(removeAvatarMock).toHaveBeenCalledTimes(1)
    })
  })
})
