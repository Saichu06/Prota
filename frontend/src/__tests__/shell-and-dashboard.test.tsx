import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { TopHeader } from '../components/layout/TopHeader'
import { SidebarProvider } from '../components/layout/SidebarContext'
import { CircularProgressRing } from '../features/dashboard/components/CircularProgressRing'
import { LinearProgressBar } from '../features/dashboard/components/LinearProgressBar'
import { FoodEntriesSection } from '../features/dashboard/components/FoodEntriesSection'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { dashboardService } from '../features/dashboard/services/dashboardService'
import { CalendarPage } from '../features/calendar/pages/CalendarPage'
import { calendarService } from '../features/calendar/services/calendarService'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { AuthContext } from '../app/providers/AuthContext'
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
  timezone: 'America/New_York',
  theme: 'SYSTEM',
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

describe('Refined Application Shell & Navigation', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders Sidebar with strictly primary navigation: Dashboard, Food Log, Calendar, Analytics', () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <AuthContext.Provider value={mockAuthContext}>
            <Sidebar />
          </AuthContext.Provider>
        </SidebarProvider>
      </MemoryRouter>
    )

    // Check brand and required primary navigation items
    expect(screen.getByText(/PROTA/i)).toBeDefined()
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Food Log')).toBeDefined()
    expect(screen.getByText('Calendar')).toBeDefined()
    expect(screen.getByText('Analytics')).toBeDefined()
    expect(screen.getByText('Reports')).toBeDefined()

    // Profile and Settings must NOT appear in sidebar
    expect(screen.queryByText('Settings')).toBeNull()
    expect(screen.queryByText('Profile')).toBeNull()
    expect(screen.queryByText('Theme')).toBeNull()
    expect(screen.queryByText('alex@example.com')).toBeNull()

    // Test toggle collapse button
    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i })
    expect(toggleBtn).toBeDefined()

    fireEvent.click(toggleBtn)
    expect(localStorage.getItem('prota_sidebar_collapsed')).toBe('true')
  })

  it('renders TopHeader with theme cycling button, notifications bell, and user profile dropdown', async () => {
    render(
      <MemoryRouter>
        <SidebarProvider>
          <ThemeProvider>
            <AuthContext.Provider value={mockAuthContext}>
              <TopHeader />
            </AuthContext.Provider>
          </ThemeProvider>
        </SidebarProvider>
      </MemoryRouter>
    )

    // Check compact theme button exists
    const themeBtn = screen.getByRole('button', { name: /current theme/i })
    expect(themeBtn).toBeDefined()

    // Check notification bell icon exists
    const notifBtn = screen.getByRole('button', { name: /notifications/i })
    expect(notifBtn).toBeDefined()

    // Open notifications popover
    fireEvent.click(notifBtn)
    expect(screen.getByRole('dialog', { name: /notification panel/i })).toBeDefined()
    expect(screen.getByText(/You're all caught up!/i)).toBeDefined()

    // Close notifications by clicking bell again
    fireEvent.click(notifBtn)
    expect(screen.queryByRole('dialog', { name: /notification panel/i })).toBeNull()

    // Check user profile button with name and initial
    const profileBtn = screen.getByRole('button', { name: /user menu for Alex Johnson/i })
    expect(profileBtn).toBeDefined()
    expect(screen.getByText('Alex Johnson')).toBeDefined()
    expect(screen.getByText('A')).toBeDefined()

    // Open profile dropdown
    fireEvent.click(profileBtn)
    expect(screen.getByRole('menu')).toBeDefined()
    expect(screen.getByText('alex@example.com')).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /view profile/i })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /view settings/i })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeDefined()

    // Test sign out click
    const signOutBtn = screen.getByRole('menuitem', { name: /sign out/i })
    fireEvent.click(signOutBtn)
    expect(mockAuthContext.logout).toHaveBeenCalledTimes(1)
  })
})

describe('Nutrition Dashboard Components & Page', () => {
  it('renders CircularProgressRing with correct percentage and handles over 100% gracefully', () => {
    const { rerender } = render(
      <CircularProgressRing consumed={75} goal={150} label="Protein" unit="g" />
    )

    expect(screen.getByText('75')).toBeDefined()
    expect(screen.getByText(/of 150 g/i)).toBeDefined()
    expect(screen.getByText('50% complete')).toBeDefined()
    expect(screen.getByText('75g remaining')).toBeDefined()

    // Value > 100%
    rerender(<CircularProgressRing consumed={180} goal={150} label="Protein" unit="g" />)
    expect(screen.getByText('120% complete')).toBeDefined()
    expect(screen.getByText('+30g target met')).toBeDefined()
  })

  it('renders LinearProgressBar with correct calculation and unit', () => {
    render(
      <LinearProgressBar label="Calories" consumed={1600} goal={2000} unit="kcal" />
    )

    expect(screen.getByText('Calories')).toBeDefined()
    expect(screen.getByText('1600')).toBeDefined()
    expect(screen.getByText('80% of daily target')).toBeDefined()
    expect(screen.getByText('400 kcal remaining')).toBeDefined()
  })

  it('renders FoodEntriesSection empty state when no items exist', () => {
    render(
      <MemoryRouter>
        <FoodEntriesSection entries={[]} selectedDate="2026-10-21" />
      </MemoryRouter>
    )

    expect(screen.getByText(/No food entries recorded for this day/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /record first meal/i })).toBeDefined()
  })

  it('renders populated DashboardPage with real backend data, calendar link, and macro calculations', async () => {
    const mockDailyLog: DailyLogResponse = {
      id: 'log-1',
      logDate: '2026-10-21',
      timezone: 'America/New_York',
      proteinGoalG: 150,
      calorieGoalKcal: 2200,
      waterGoalMl: 3000,
      consumedProteinG: 110,
      consumedCaloriesKcal: 1750,
      consumedCarbohydratesG: 180,
      consumedFatG: 55,
      consumedWaterMl: 1800,
      recordedWeightKg: 78.4,
      hasIncompleteCalories: false,
      proteinRemainingG: 40,
      proteinCompletionPercentage: 73.3,
      foodEntries: [
        {
          id: 'entry-1',
          dailyLogId: 'log-1',
          foodName: 'Grilled Chicken & Quinoa',
          mealType: 'LUNCH',
          category: 'Poultry',
          quantity: 250,
          quantityUnit: 'g',
          proteinG: 45,
          caloriesKcal: 520,
          carbohydratesG: 40,
          fatG: 12,
          nutritionSource: 'MANUAL',
          notes: 'Prepped with olive oil',
          consumedAt: '2026-10-21T12:30:00Z',
          createdAt: '2026-10-21T12:30:00Z',
          updatedAt: '2026-10-21T12:30:00Z',
        },
      ],
    }

    vi.spyOn(dashboardService, 'getDailyLog').mockResolvedValue(mockDailyLog)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
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
      expect(screen.getByText(/Welcome back, Alex Johnson/i)).toBeDefined()
    })

    expect(screen.getByText('Grilled Chicken & Quinoa')).toBeDefined()
    expect(screen.getByText(/Daily Nutrition Breakdown/i)).toBeDefined()
    expect(screen.getByText(/View in Calendar/i)).toBeDefined()
    expect(screen.getByText('78.4')).toBeDefined()
  })
})

describe('Nutrition Calendar Page', () => {
  it('renders CalendarPage with Month, Week, Day controls and renders fetched data', async () => {
    const mockRangeData: DailyLogResponse[] = [
      {
        id: 'log-1',
        logDate: '2026-10-21',
        timezone: 'America/New_York',
        proteinGoalG: 150,
        calorieGoalKcal: 2200,
        waterGoalMl: 3000,
        consumedProteinG: 155,
        consumedCaloriesKcal: 2100,
        consumedCarbohydratesG: 200,
        consumedFatG: 60,
        consumedWaterMl: 2800,
        recordedWeightKg: 78.5,
        hasIncompleteCalories: false,
        proteinRemainingG: 0,
        proteinCompletionPercentage: 103.3,
        foodEntries: [
          {
            id: 'entry-1',
            dailyLogId: 'log-1',
            foodName: 'Salmon Bowl',
            mealType: 'DINNER',
            quantity: 300,
            quantityUnit: 'g',
            proteinG: 48,
            caloriesKcal: 600,
            nutritionSource: 'MANUAL',
            createdAt: '2026-10-21T18:00:00Z',
            updatedAt: '2026-10-21T18:00:00Z',
          },
        ],
      },
    ]

    vi.spyOn(calendarService, 'getDailyLogsRange').mockResolvedValue(mockRangeData)

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
      expect(screen.getByText(/Nutrition Calendar/i)).toBeDefined()
    })

    // Check Month, Week, Day switcher buttons
    expect(screen.getByRole('button', { name: /^MONTH$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^WEEK$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^DAY$/i })).toBeDefined()

    // Check that Day 21 displays 155g P
    expect(screen.getByText(/155g P/i)).toBeDefined()
    expect(screen.getByText(/Open in Dashboard/i)).toBeDefined()
  })
})
