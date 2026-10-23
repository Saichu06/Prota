import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DataCoverageBanner } from '../features/improveprogress/components/DataCoverageBanner'
import { ProgressOverviewCard } from '../features/improveprogress/components/ProgressOverviewCard'
import { DetectedPatternsSection } from '../features/improveprogress/components/DetectedPatternsSection'
import { AiRecommendationsSection } from '../features/improveprogress/components/AiRecommendationsSection'
import { ImproveProgressPage } from '../features/improveprogress/pages/ImproveProgressPage'
import { improveProgressService } from '../features/improveprogress/services/improveProgressService'
import type { ProgressImprovementResponse } from '../types/api'

vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }))

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', fullName: 'Alex Rivera', email: 'alex@example.com' },
    settings: {
      proteinGoalG: 150,
      calorieGoalKcal: 2200,
      waterGoalMl: 2500,
      weightUnit: 'KG',
      timezone: 'UTC',
    },
  }),
}))

const sampleData: ProgressImprovementResponse = {
  fromDate: '2026-10-14',
  toDate: '2026-10-21',
  totalDaysInRange: 7,
  dataCoverage: {
    totalCalendarDays: 7,
    foodTrackedDays: 5,
    waterTrackedDays: 4,
    weightRecordedDays: 2,
    trackingConsistencyPercentage: 71.4,
    hasSufficientData: true,
    limitationsNote: 'Data coverage: 5 of 7 days had meal records. Missing days are excluded from averages.',
  },
  verifiedMetrics: {
    protein: {
      averageIntakeG: 145.2,
      baselineGoalG: 150.0,
      isHistoricalGoal: true,
      daysMeetingGoal: 3,
      daysBelowGoal: 2,
      daysAboveGoal: 3,
      goalAdherencePercentage: 60.0,
      trendDirection: 'STABLE',
    },
    calories: {
      averageIntakeKcal: 2150,
      baselineGoalKcal: 2200,
      isHistoricalGoal: true,
      daysOnTarget: 4,
      daysBelowGoal: 1,
      daysAboveGoal: 0,
      goalAdherencePercentage: 80.0,
      trendDirection: 'BALANCED',
    },
    hydration: {
      averageWaterMl: 2600,
      baselineGoalMl: 2500,
      isHistoricalGoal: true,
      daysMeetingGoal: 3,
      daysTracked: 4,
      goalAdherencePercentage: 75.0,
      status: 'OPTIMAL',
    },
    weight: {
      measurementCount: 2,
      weightUnit: 'KG',
      startWeight: 75.5,
      latestWeight: 75.0,
      weightChange: -0.5,
      startDate: '2026-10-15',
      latestDate: '2026-10-20',
      hasSufficientMeasurements: true,
      trendDirection: 'DECREASING',
    },
  },
  dailyTrends: [
    {
      date: '2026-10-14',
      proteinG: 140,
      proteinGoalG: 150,
      caloriesKcal: 2100,
      calorieGoalKcal: 2200,
      waterMl: 2400,
      weightKg: 75.5,
      hasData: true,
      foodEntriesCount: 3,
    },
    {
      date: '2026-10-15',
      proteinG: 155,
      proteinGoalG: 150,
      caloriesKcal: 2200,
      calorieGoalKcal: 2200,
      waterMl: 2800,
      weightKg: 75.0,
      hasData: true,
      foodEntriesCount: 4,
    },
  ],
  detectedPatterns: [
    {
      id: 'PATTERN_CALORIES_BALANCED',
      category: 'CALORIES',
      type: 'POSITIVE',
      title: 'Balanced Energy Intake',
      description: 'Average intake of 2,150 kcal is within 10% of your 2,200 kcal goal.',
      dateRange: 'Oct 14 to Oct 21, 2026',
      supportingMetric: '2,150 kcal avg (target: 2,200 kcal)',
      recordedDaysCount: 5,
      limitations: 'Calculated across 5 logged days.',
    },
    {
      id: 'PATTERN_PROTEIN_DEFICIT_FREQUENT',
      category: 'PROTEIN',
      type: 'OPPORTUNITY',
      title: 'Protein Intake Frequently Below Target',
      description: 'Protein intake fell below your target on 2 of 5 tracked days.',
      dateRange: 'Oct 14 to Oct 21, 2026',
      supportingMetric: '145.2g avg vs 150g target (-4.8g)',
      recordedDaysCount: 5,
      limitations: 'Based on 5 tracked days.',
    },
  ],
  aiSummary: {
    status: 'SUCCESS',
    statusMessage: 'AI recommendations successfully generated from verified data.',
    executiveSummary: 'You have shown strong dietary consistency with energy intake closely aligned to your maintenance targets.',
    doingWellHighlights: ['Balanced daily energy intake within 10% of goal', 'Hydration targets met consistently'],
    recommendations: [
      {
        id: 'REC-1',
        title: 'Incorporate High-Protein Midday Snack',
        observation: 'Protein averaged 145.2g compared to your 150g target, missing by less than 5g.',
        practicalAction: 'Add 1 string cheese, 20g almonds, or 100g cottage cheese between lunch and dinner.',
        expectedImprovement: 'Reliably closes the 5g protein gap without excess calories.',
        uncertaintyOrLimitation: 'Based on 5 logged days.',
        category: 'PROTEIN',
      },
    ],
    fitnessContextNote: 'Active 4-Day Upper/Lower Routine',
    safetyDisclaimer: 'General wellness and nutrition guidance only. Not medical diagnosis or treatment.',
  },
}

describe('Phase 6C: Improve My Progress Frontend', () => {
  it('renders DataCoverageBanner with confidence and recorded days', () => {
    render(
      <DataCoverageBanner
        coverage={sampleData.dataCoverage}
        fromDate={sampleData.fromDate}
        toDate={sampleData.toDate}
      />
    )

    expect(screen.getByText('2026-10-14 — 2026-10-21')).toBeDefined()
    expect(screen.getByText(/Moderate Confidence/)).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText(/Meals Logged/)).toBeDefined()
    expect(screen.getByText('4')).toBeDefined()
    expect(screen.getByText(/Hydration Logged/)).toBeDefined()
  })

  it('renders ProgressOverviewCard with protein, calories, water, and weight metrics', () => {
    render(
      <ProgressOverviewCard
        metrics={sampleData.verifiedMetrics}
        coverage={sampleData.dataCoverage}
      />
    )

    expect(screen.getByText('145.2g')).toBeDefined()
    expect(screen.getByText('/ 150g goal')).toBeDefined()
    expect(screen.getByText('2,150')).toBeDefined()
    expect(screen.getByText('2,600 ml')).toBeDefined()
    expect(screen.getByText('-0.5 KG')).toBeDefined()
    expect(screen.getByText('DECREASING')).toBeDefined()
  })

  it('renders DetectedPatternsSection dividing What is Going Well and Areas to Improve', () => {
    render(<DetectedPatternsSection patterns={sampleData.detectedPatterns} />)

    expect(screen.getByText("What's Going Well (1)")).toBeDefined()
    expect(screen.getByText('Balanced Energy Intake')).toBeDefined()
    expect(screen.getByText("Areas to Improve (1)")).toBeDefined()
    expect(screen.getByText('Protein Intake Frequently Below Target')).toBeDefined()
    expect(screen.getByText(/Metric: 2,150 kcal avg/)).toBeDefined()
  })

  it('renders AiRecommendationsSection with structured grounded advice', () => {
    const onRetry = vi.fn()
    render(<AiRecommendationsSection aiSummary={sampleData.aiSummary} onRetry={onRetry} />)

    expect(screen.getByText('AI Personalized Recommendations')).toBeDefined()
    expect(screen.getByText(/Incorporate High-Protein Midday Snack/)).toBeDefined()
    expect(screen.getByText(/Add 1 string cheese, 20g almonds/)).toBeDefined()
    expect(screen.getByText(/Active 4-Day Upper\/Lower Routine/)).toBeDefined()
    expect(screen.getByText(/General wellness and nutrition guidance only/)).toBeDefined()
  })

  it('handles offline AI gracefully with retry button without inventing fake advice', () => {
    const onRetry = vi.fn()
    const offlineSummary = {
      ...sampleData.aiSummary,
      status: 'UNAVAILABLE' as const,
      statusMessage: 'Gemini AI integration is temporarily unavailable.',
      recommendations: [],
    }

    render(<AiRecommendationsSection aiSummary={offlineSummary} onRetry={onRetry} />)

    expect(screen.getByText('Personalized AI Recommendations Unavailable')).toBeDefined()
    expect(screen.getByText(/Gemini AI integration is temporarily unavailable/)).toBeDefined()
    const retryBtn = screen.getByRole('button', { name: /Retry AI Generation/i })
    expect(retryBtn).toBeDefined()
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders full ImproveProgressPage and fetches analysis data', async () => {
    vi.spyOn(improveProgressService, 'analyzeProgress').mockResolvedValue(sampleData)

    render(
      <MemoryRouter>
        <ImproveProgressPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /Improve My Progress/i })).toBeDefined()

    await waitFor(() => {
      expect(screen.getByText('145.2g')).toBeDefined()
      expect(screen.getByText('Balanced Energy Intake')).toBeDefined()
    })
  })
})
