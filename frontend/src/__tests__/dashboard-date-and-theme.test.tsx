import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DashboardDateSelector } from '../features/dashboard/components/DashboardDateSelector'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { dashboardService } from '../features/dashboard/services/dashboardService'
import { CalendarPage } from '../features/calendar/pages/CalendarPage'
import { calendarService } from '../features/calendar/services/calendarService'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { AuthContext } from '../app/providers/AuthContext'
import { addDaysToYmd, addMonthsToYmd, getTodayYmd, formatReadableDate } from '../lib/date-utils'
import type { UserResponse, SettingsResponse, DailyLogResponse } from '../types/api'

const mockUser: UserResponse = {
  id: 'user-123',
  fullName: 'Alex Johnson',
  email: 'alex@example.com',
  status: 'ACTIVE',
  emailVerifiedAt: null,
  profilePictureUrl: null,
  createdAt: '2026-10-20T00:00:00Z',
}

const mockSettings: SettingsResponse = {
  userId: 'user-123',
  proteinGoalG: 150,
  calorieGoalKcal: 2200,
  waterGoalMl: 3000,
  weightUnit: 'KG',
  timezone: 'UTC',
  theme: 'LIGHT',
  updatedAt: '2026-10-20T00:00:00Z',
}

const mockAuthContext = {
  user: mockUser,
  settings: mockSettings,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
  updateSettings: vi.fn(),
  refreshUser: vi.fn(),
  refreshSettings: vi.fn(),
}

describe('Dashboard Date Navigation & Date Utils', () => {
  it('correctly adds and subtracts days across month, year, and leap boundaries without UTC shifts', () => {
    // Normal day subtraction and addition
    expect(addDaysToYmd('2026-10-21', -1)).toBe('2026-10-20')
    expect(addDaysToYmd('2026-10-21', 1)).toBe('2026-10-22')

    // Month boundary: Nov 1 - 1 day -> Oct 31
    expect(addDaysToYmd('2026-11-01', -1)).toBe('2026-10-31')
    expect(addDaysToYmd('2026-10-31', 1)).toBe('2026-11-01')

    // Year boundary: Jan 1 - 1 day -> Dec 31
    expect(addDaysToYmd('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDaysToYmd('2025-12-31', 1)).toBe('2026-01-01')

    // Leap year boundary: Feb 28 2024 + 1 day -> Feb 29 2024
    expect(addDaysToYmd('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDaysToYmd('2024-02-29', 1)).toBe('2024-03-01')

    // Non-leap year: Feb 28 2025 + 1 day -> Mar 01 2025
    expect(addDaysToYmd('2025-02-28', 1)).toBe('2025-03-01')
  })

  it('correctly adds and subtracts months with day clamping', () => {
    expect(addMonthsToYmd('2026-05-15', 1)).toBe('2026-06-15')
    expect(addMonthsToYmd('2026-05-15', -1)).toBe('2026-04-15')
    // Clamping Jan 31 -> Feb 28 in non-leap year
    expect(addMonthsToYmd('2025-01-31', 1)).toBe('2025-02-28')
  })

  it('formats readable date reliably without timezone shifts', () => {
    const formatted = formatReadableDate('2026-10-21')
    expect(formatted).toContain('Oct 21, 2026')
    expect(formatted).toContain('Wed')
  })

  it('renders DashboardDateSelector and fires single day navigation on chevron clicks', () => {
    const handleDateChange = vi.fn()
    render(
      <DashboardDateSelector
        selectedDate="2026-10-21"
        onDateChange={handleDateChange}
        timezone="UTC"
      />
    )

    // Verify displayed readable date
    expect(screen.getByText(/Oct 21, 2026/)).toBeDefined()

    // Click previous day
    const prevBtn = screen.getByRole('button', { name: /previous day/i })
    fireEvent.click(prevBtn)
    expect(handleDateChange).toHaveBeenCalledWith('2026-10-20')

    // Click next day
    const nextBtn = screen.getByRole('button', { name: /next day/i })
    fireEvent.click(nextBtn)
    expect(handleDateChange).toHaveBeenCalledWith('2026-10-22')
  })

  it('renders Today button when selected date differs from today and updates to current local date', () => {
    const handleDateChange = vi.fn()
    const today = getTodayYmd('UTC')
    const pastDate = addDaysToYmd(today, -5)

    render(
      <DashboardDateSelector
        selectedDate={pastDate}
        onDateChange={handleDateChange}
        timezone="UTC"
      />
    )

    const todayBtn = screen.getByRole('button', { name: /today/i })
    expect(todayBtn).toBeDefined()
    fireEvent.click(todayBtn)
    expect(handleDateChange).toHaveBeenCalledWith(today)
  })
})

describe('Dashboard Light Mode Theme & Live Date Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Dashboard hero card with light mode classes and responsive theme tokens', async () => {
    const mockDailyLog: DailyLogResponse = {
      id: 'log-1',
      logDate: '2026-10-21',
      timezone: 'UTC',
      proteinGoalG: 140,
      calorieGoalKcal: 2000,
      waterGoalMl: 2500,
      consumedProteinG: 95,
      consumedCaloriesKcal: 1600,
      consumedCarbohydratesG: 150,
      consumedFatG: 50,
      consumedWaterMl: 1500,
      recordedWeightKg: 75.0,
      hasIncompleteCalories: false,
      proteinRemainingG: 45,
      proteinCompletionPercentage: 67.9,
      foodEntries: [],
    }

    vi.spyOn(dashboardService, 'getDailyLog').mockResolvedValue(mockDailyLog)

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard?date=2026-10-21']}>
        <ThemeProvider>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </AuthContext.Provider>
        </ThemeProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Daily Nutrition Breakdown')).toBeDefined()
    })

    // Verify the hero panel has light mode background and dark mode variant classes
    const heroPanel = container.querySelector('.rounded-3xl.bg-white')
    expect(heroPanel).toBeDefined()
    expect(heroPanel?.className).toContain('bg-white')
    expect(heroPanel?.className).toContain('dark:bg-[#0B1424]')
    expect(heroPanel?.className).toContain('text-slate-900')
    expect(heroPanel?.className).toContain('dark:text-white')

    // Verify the hero title has appropriate dark/light text classes
    const title = screen.getByText('Daily Nutrition Breakdown')
    expect(title.className).toContain('text-slate-900')
    expect(title.className).toContain('dark:text-white')
  })

  it('updates dashboard data when previous day button is clicked', async () => {
    const getDailyLogSpy = vi.spyOn(dashboardService, 'getDailyLog')
    const logOct21: DailyLogResponse = {
      id: 'log-21',
      logDate: '2026-10-21',
      timezone: 'UTC',
      proteinGoalG: 140,
      calorieGoalKcal: 2000,
      waterGoalMl: 2500,
      consumedProteinG: 100,
      consumedCaloriesKcal: 1800,
      consumedCarbohydratesG: 170,
      consumedFatG: 55,
      consumedWaterMl: 2000,
      recordedWeightKg: 75.0,
      hasIncompleteCalories: false,
      proteinRemainingG: 40,
      proteinCompletionPercentage: 71.4,
      foodEntries: [],
    }
    const logOct20: DailyLogResponse = {
      id: 'log-20',
      logDate: '2026-10-20',
      timezone: 'UTC',
      proteinGoalG: 140,
      calorieGoalKcal: 2000,
      waterGoalMl: 2500,
      consumedProteinG: 130,
      consumedCaloriesKcal: 2100,
      consumedCarbohydratesG: 200,
      consumedFatG: 60,
      consumedWaterMl: 2500,
      recordedWeightKg: 74.8,
      hasIncompleteCalories: false,
      proteinRemainingG: 10,
      proteinCompletionPercentage: 92.9,
      foodEntries: [],
    }

    getDailyLogSpy.mockImplementation(async (date: string) => {
      if (date === '2026-10-20') return logOct20
      return logOct21
    })

    render(
      <MemoryRouter initialEntries={['/dashboard?date=2026-10-21']}>
        <ThemeProvider>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </AuthContext.Provider>
        </ThemeProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Daily Nutrition Breakdown')).toBeDefined()
    })
    expect(getDailyLogSpy).toHaveBeenCalledWith('2026-10-21')

    // Click previous day
    const prevBtn = screen.getByRole('button', { name: /previous day/i })
    fireEvent.click(prevBtn)

    await waitFor(() => {
      expect(getDailyLogSpy).toHaveBeenCalledWith('2026-10-20')
    })
  })
})

describe('Calendar Navigation Semantics & Day Details', () => {
  it('provides dedicated day navigation in Selected Date panel separately from month navigation', async () => {
    const mockCalendarRange: DailyLogResponse[] = [
      {
        id: 'log-21',
        logDate: '2026-10-21',
        timezone: 'UTC',
        proteinGoalG: 140,
        calorieGoalKcal: 2000,
        waterGoalMl: 2500,
        consumedProteinG: 120,
        consumedCaloriesKcal: 1900,
        consumedCarbohydratesG: 180,
        consumedFatG: 50,
        consumedWaterMl: 2200,
        recordedWeightKg: 75.0,
        hasIncompleteCalories: false,
        proteinRemainingG: 20,
        proteinCompletionPercentage: 85.7,
        foodEntries: [],
      },
    ]

    vi.spyOn(calendarService, 'getDailyLogsRange').mockResolvedValue(mockCalendarRange)

    render(
      <MemoryRouter initialEntries={['/calendar?date=2026-10-21']}>
        <ThemeProvider>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/calendar" element={<CalendarPage />} />
            </Routes>
          </AuthContext.Provider>
        </ThemeProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Nutrition Calendar')).toBeDefined()
    })

    // Header has month navigation
    expect(screen.getByRole('button', { name: /previous month/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /next month/i })).toBeDefined()

    // Selected Date Details section has day-by-day navigation
    expect(screen.getByText('Selected Date Details')).toBeDefined()
    const dayPrevBtn = screen.getByRole('button', { name: /previous day/i })
    expect(dayPrevBtn).toBeDefined()

    // Click day-by-day previous day
    fireEvent.click(dayPrevBtn)

    await waitFor(() => {
      expect(screen.getByText(/Oct 20, 2026/)).toBeDefined()
    })
  })
})
