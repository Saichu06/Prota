import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../app/providers/AuthProvider'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { FontProvider } from '../app/providers/FontProvider'
import { ToastProvider } from '../app/providers/ToastProvider'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { FoodLogPage } from '../features/log/pages/FoodLogPage'
import { ReportsPage } from '../features/reports/pages/ReportsPage'
import { apiClient } from '../lib/api-client'
import { dashboardService } from '../features/dashboard/services/dashboardService'
import { foodLogService } from '../features/log/services/foodLogService'
import { reportService } from '../features/reports/services/reportService'
import type { UserResponse, SettingsResponse, DailyLogResponse } from '../types/api'

vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number
    fieldErrors: Record<string, string>
    constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
      super(message)
      this.status = status
      this.fieldErrors = fieldErrors
    }
    getFieldError(field: string) {
      return this.fieldErrors[field] || ''
    }
  },
}))

vi.mock('../features/dashboard/services/dashboardService', () => ({
  dashboardService: {
    getDailyLog: vi.fn(),
  },
}))

vi.mock('../features/log/services/foodLogService', () => ({
  foodLogService: {
    getDailyLog: vi.fn(),
    getDailyWeight: vi.fn().mockResolvedValue([]),
    deleteFoodEntry: vi.fn(),
  },
}))

vi.mock('../features/reports/services/reportService', () => ({
  reportService: {
    getPreview: vi.fn(),
    downloadPdf: vi.fn(),
    downloadCsv: vi.fn(),
  },
}))

const mockInitialUser: UserResponse = {
  id: 'user-pref-1',
  fullName: 'Jordan Taylor',
  email: 'jordan@example.com',
  status: 'ACTIVE',
  emailVerifiedAt: null,
  profilePictureUrl: null,
  createdAt: '2026-10-20T00:00:00Z',
}

const mockInitialSettings: SettingsResponse = {
  userId: 'user-pref-1',
  proteinGoalG: 140,
  calorieGoalKcal: 2000,
  waterGoalMl: 2500,
  weightUnit: 'KG',
  timezone: 'UTC',
  theme: 'SYSTEM',
  updatedAt: '2026-10-20T00:00:00Z',
}

const mockTodayDailyLog: DailyLogResponse = {
  id: 'log-today-1',
  logDate: new Date().toISOString().substring(0, 10),
  timezone: 'UTC',
  proteinGoalG: 140,
  calorieGoalKcal: 2000,
  waterGoalMl: 2500,
  consumedProteinG: 65,
  consumedCaloriesKcal: 950,
  consumedCarbohydratesG: 80,
  consumedFatG: 30,
  hasIncompleteCalories: false,
  proteinRemainingG: 75,
  proteinCompletionPercentage: 46.4,
  consumedWaterMl: 1200,
  recordedWeightKg: 78.5,
  foodEntries: [],
}

function renderWithAppProviders(initialRoute: string = '/settings') {
  return render(
    <ThemeProvider>
      <FontProvider>
        <ToastProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[initialRoute]}>
              <Routes>
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/log" element={<FoodLogPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </ToastProvider>
      </FontProvider>
    </ThemeProvider>
  )
}

describe('Global Preferences Synchronization Across Prota', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default API mocks for authenticated session
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/auth/me') return mockInitialUser
      if (url === '/settings') return mockInitialSettings
      return {}
    })

    vi.mocked(dashboardService.getDailyLog).mockResolvedValue(mockTodayDailyLog)
    vi.mocked(foodLogService.getDailyLog).mockResolvedValue(mockTodayDailyLog)
    vi.mocked(reportService.getPreview).mockResolvedValue({
      reportType: 'DAILY_NUTRITION',
      startDate: mockTodayDailyLog.logDate,
      endDate: mockTodayDailyLog.logDate,
      totalDays: 1,
      recordedDays: 1,
      totalFoodEntries: 0,
      averageDailyProteinG: 65,
      averageDailyCaloriesKcal: 950,
      totalHydrationMl: 1200,
      weightMeasurementsCount: 1,
      weightTrendNote: 'Steady',
      canGenerate: true,
      summaryMessage: 'Report ready',
      availableDietPlans: [],
      availableWorkoutPlans: [],
    })
  })

  it('1. Loads persisted preferences on initial bootstrap', async () => {
    renderWithAppProviders('/settings')

    await waitFor(() => {
      expect(screen.getByDisplayValue('140')).toBeDefined()
    })
    expect(screen.getByDisplayValue('2000')).toBeDefined()
    expect(screen.getByDisplayValue('2500')).toBeDefined()
  })

  it('2. Successfully saves new preferences and calls backend PATCH /settings', async () => {
    const updatedSettings: SettingsResponse = {
      ...mockInitialSettings,
      proteinGoalG: 185,
      calorieGoalKcal: 2400,
      waterGoalMl: 3200,
      weightUnit: 'LB',
      updatedAt: '2026-10-24T12:00:00Z',
    }
    vi.mocked(apiClient.patch).mockResolvedValueOnce(updatedSettings)

    renderWithAppProviders('/settings')

    // Wait for form to load initial values
    const proteinInput = await screen.findByDisplayValue('140')
    const calorieInput = screen.getByDisplayValue('2000')
    const waterInput = screen.getByDisplayValue('2500')

    // Modify values
    fireEvent.change(proteinInput, { target: { value: '185' } })
    fireEvent.change(calorieInput, { target: { value: '2400' } })
    fireEvent.change(waterInput, { target: { value: '3200' } })

    // Click Pounds (LB) unit button
    const lbButton = screen.getByRole('button', { name: /pounds/i })
    fireEvent.click(lbButton)

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save preferences/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/settings',
        expect.objectContaining({
          proteinGoalG: 185,
          calorieGoalKcal: 2400,
          waterGoalMl: 3200,
          weightUnit: 'LB',
        })
      )
    })

    // Success toast shown
    await waitFor(() => {
      expect(screen.getByText(/goals and preferences updated successfully/i)).toBeDefined()
    })
  })

  it('3. Synchronizes updated preferences across DashboardPage immediately', async () => {
    // Start with updated settings in the mock API
    const activeSettings: SettingsResponse = {
      ...mockInitialSettings,
      proteinGoalG: 190,
      calorieGoalKcal: 2600,
      waterGoalMl: 3500,
    }
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/auth/me') return mockInitialUser
      if (url === '/settings') return activeSettings
      return {}
    })

    renderWithAppProviders('/dashboard')

    await waitFor(() => {
      // Dashboard greeting rendered
      expect(screen.getByText(/welcome back, jordan taylor/i)).toBeDefined()
    })

    // Goal indicators on DashboardPage reflect the authoritative user preference
    await waitFor(() => {
      expect(screen.getByText(/of 190 g/i)).toBeDefined()
      expect(screen.getByText(/2600 kcal/i)).toBeDefined()
      expect(screen.getByText(/3500 ml/i)).toBeDefined()
    })
  })

  it('4. Synchronizes updated preferences across FoodLogPage immediately', async () => {
    const activeSettings: SettingsResponse = {
      ...mockInitialSettings,
      proteinGoalG: 175,
      calorieGoalKcal: 2350,
      waterGoalMl: 2800,
    }
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/auth/me') return mockInitialUser
      if (url === '/settings') return activeSettings
      return {}
    })

    renderWithAppProviders('/log')

    await waitFor(() => {
      expect(screen.getByText(/175g goal/i)).toBeDefined()
    })
    expect(screen.getByText(/2,800 ml/i)).toBeDefined()
  })

  it('5. Synchronizes weight unit preference in ReportsPage', async () => {
    const lbSettings: SettingsResponse = {
      ...mockInitialSettings,
      weightUnit: 'LB',
    }
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/auth/me') return mockInitialUser
      if (url === '/settings') return lbSettings
      return {}
    })

    renderWithAppProviders('/reports')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /downloadable reports/i })).toBeDefined()
    })

    // Switch report type to Weight Progress
    const weightTab = screen.getByRole('button', { name: /weight progress/i })
    fireEvent.click(weightTab)

    // Verify Pounds (lbs) is active
    await waitFor(() => {
      const lbsBtn = screen.getByRole('button', { name: /pounds \(lbs\)/i })
      expect(lbsBtn.className).toContain('bg-emerald-600')
    })
  })

  it('6. Handles save failure gracefully without leaving corrupted state', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('Database connectivity issue'))

    renderWithAppProviders('/settings')

    const proteinInput = await screen.findByDisplayValue('140')
    fireEvent.change(proteinInput, { target: { value: '250' } })

    const saveButton = screen.getByRole('button', { name: /save preferences/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/network error saving settings/i)).toBeDefined()
    })
  })
})
