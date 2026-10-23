import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FoodLogPage } from '../features/log/pages/FoodLogPage'
import { AddFoodModal } from '../features/log/components/AddFoodModal'
import { CameraLogModal } from '../features/log/components/CameraLogModal'
import { HistoryPage } from '../features/history/pages/HistoryPage'
import { AnalyticsPage } from '../features/analytics/pages/AnalyticsPage'
import { foodLogService } from '../features/log/services/foodLogService'
import { historyService } from '../features/history/services/historyService'
import { analyticsService } from '../features/analytics/services/analyticsService'
import type { DailyLogResponse, AnalyticsSummaryResponse } from '../types/api'

// Mock services
vi.mock('../features/log/services/foodLogService', () => ({
  foodLogService: {
    getDailyLog: vi.fn(),
    addFoodEntry: vi.fn(),
    updateFoodEntry: vi.fn(),
    deleteFoodEntry: vi.fn(),
    getDailyWater: vi.fn(),
    addWater: vi.fn(),
    deleteWater: vi.fn(),
    getDailyWeight: vi.fn(),
    addWeight: vi.fn(),
    deleteWeight: vi.fn(),
    searchSavedFoods: vi.fn(),
    createSavedFood: vi.fn(),
    deleteSavedFood: vi.fn(),
    estimateFromImage: vi.fn(),
  },
}))

vi.mock('../features/history/services/historyService', () => ({
  historyService: {
    getDailyLogsRange: vi.fn(),
  },
}))

vi.mock('../features/analytics/services/analyticsService', () => ({
  analyticsService: {
    getSummary: vi.fn(),
  },
}))

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', fullName: 'Alex Rivera', email: 'alex@example.com' },
    settings: {
      proteinGoalG: 140,
      calorieGoalKcal: 2000,
      waterGoalMl: 2500,
      weightUnit: 'KG',
      timezone: 'UTC',
      theme: 'SYSTEM',
    },
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}))

const mockDailyLog: DailyLogResponse = {
  id: 'log-1',
  logDate: '2026-10-21',
  timezone: 'UTC',
  proteinGoalG: 140,
  calorieGoalKcal: 2000,
  waterGoalMl: 2500,
  consumedProteinG: 45.5,
  consumedCaloriesKcal: 420,
  consumedCarbohydratesG: 30,
  consumedFatG: 10,
  hasIncompleteCalories: false,
  proteinRemainingG: 94.5,
  proteinCompletionPercentage: 32.5,
  consumedWaterMl: 1000,
  recordedWeightKg: 75.5,
  foodEntries: [
    {
      id: 'entry-1',
      dailyLogId: 'log-1',
      foodName: 'Greek Yogurt 0%',
      mealType: 'BREAKFAST',
      quantity: 200,
      quantityUnit: 'g',
      proteinG: 20,
      caloriesKcal: 120,
      carbohydratesG: 8,
      fatG: 0,
      nutritionSource: 'MANUAL',
      createdAt: '2026-10-21T08:00:00Z',
      updatedAt: '2026-10-21T08:00:00Z',
    },
    {
      id: 'entry-2',
      dailyLogId: 'log-1',
      foodName: 'Chicken Salad',
      mealType: 'LUNCH',
      quantity: 250,
      quantityUnit: 'g',
      proteinG: 25.5,
      caloriesKcal: 300,
      carbohydratesG: 22,
      fatG: 10,
      nutritionSource: 'MANUAL',
      createdAt: '2026-10-21T12:30:00Z',
      updatedAt: '2026-10-21T12:30:00Z',
    },
  ],
}

describe('Food Log Page & Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(foodLogService.getDailyLog).mockResolvedValue(mockDailyLog)
  })

  it('renders FoodLogPage with meals grouped by Breakfast, Lunch, Dinner, Snack', async () => {
    render(
      <MemoryRouter initialEntries={['/log?date=2026-10-21']}>
        <FoodLogPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Daily Food Log/i)).toBeDefined()
      expect(screen.getByText('Breakfast')).toBeDefined()
      expect(screen.getByText('Lunch')).toBeDefined()
      expect(screen.getByText('Dinner')).toBeDefined()
      expect(screen.getByText('Snacks')).toBeDefined()
      expect(screen.getByText('Greek Yogurt 0%')).toBeDefined()
      expect(screen.getByText('Chicken Salad')).toBeDefined()
    })
  })

  it('validates manual food entry in AddFoodModal and blocks non-positive quantities', async () => {
    const handleClose = vi.fn()
    const handleSuccess = vi.fn()

    render(
      <AddFoodModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        defaultDate="2026-10-21"
        defaultMealType="BREAKFAST"
      />
    )

    expect(screen.getByText('Add Food Entry')).toBeDefined()

    // Leave name empty and submit
    const submitBtn = screen.getByRole('button', { name: /Log Food/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Food name is required')).toBeDefined()
    })

    expect(foodLogService.addFoodEntry).not.toHaveBeenCalled()
  })

  it('handles unconfigured Gemini boundary in CameraLogModal gracefully', async () => {
    vi.mocked(foodLogService.estimateFromImage).mockResolvedValue({
      status: 'UNAVAILABLE',
      errorCode: 'AI_NOT_CONFIGURED',
      message: 'AI nutrition estimation is currently unavailable because the server Gemini API key is not configured.',
      items: [],
    })

    const handleClose = vi.fn()
    const handleSuccess = vi.fn()
    const handleSwitch = vi.fn()

    render(
      <CameraLogModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        defaultDate="2026-10-21"
        onSwitchToManual={handleSwitch}
      />
    )

    expect(screen.getByText(/Camera \/ Photo Assist/i)).toBeDefined()

    // Trigger upload
    const file = new File(['dummy-image-content'], 'dish.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/Upload Food Image/i)
    fireEvent.change(input, { target: { files: [file] } })

    // Click Analyze Food
    const analyzeBtn = await screen.findByRole('button', { name: /Analyze Food/i })
    fireEvent.click(analyzeBtn)

    await waitFor(() => {
      expect(screen.getByText(/Integration Notice/i)).toBeDefined()
      expect(screen.getByText(/Log Manually Instead/i)).toBeDefined()
    })

    fireEvent.click(screen.getByText(/Log Manually Instead/i))
    expect(handleSwitch).toHaveBeenCalled()
  })
})

describe('History Page', () => {
  it('renders history records with range filtering and deep link', async () => {
    vi.mocked(historyService.getDailyLogsRange).mockResolvedValue([mockDailyLog])

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Nutrition History/i)).toBeDefined()
      expect(screen.getByText(/Last 7 Days/i)).toBeDefined()
      expect(screen.getByText(/Last 30 Days/i)).toBeDefined()
    })
  })
})

describe('Analytics Page', () => {
  it('renders core metric cards, factual insights, and charts', async () => {
    const mockSummary: AnalyticsSummaryResponse = {
      fromDate: '2026-10-14',
      toDate: '2026-10-21',
      totalDaysInRange: 7,
      trackedDaysCount: 5,
      averageProteinG: 142.5,
      averageCaloriesKcal: 1980,
      proteinGoalAdherencePercentage: 80.0,
      calorieGoalAdherencePercentage: 100.0,
      totalWaterMl: 12500,
      averageWaterMl: 2500,
      startWeightKg: 76.0,
      latestWeightKg: 75.5,
      weightChangeKg: -0.5,
      dailyData: [
        {
          date: '2026-10-21',
          proteinG: 145.0,
          proteinGoalG: 140,
          caloriesKcal: 1950,
          calorieGoalKcal: 2000,
          waterMl: 2500,
          weightKg: 75.5,
          hasData: true,
          foodEntriesCount: 3,
        },
      ],
      insights: [
        'You logged nutrition on 5 of 7 days (71%).',
        'Protein goal was achieved on 4 of 5 tracked days (80.0%).',
      ],
    }

    vi.mocked(analyticsService.getSummary).mockResolvedValue(mockSummary)

    render(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Trends & Analytics/i)).toBeDefined()
      expect(screen.getByText(/Average Protein/i)).toBeDefined()
      expect(screen.getByText(/142.5/i)).toBeDefined()
      expect(screen.getByText(/80%/i)).toBeDefined()
      expect(screen.getByText(/You logged nutrition on 5 of 7 days/i)).toBeDefined()
    })
  })
})
