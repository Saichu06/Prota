import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ReportsPage } from '../features/reports/pages/ReportsPage'
import { reportService, type ReportPreviewResponse } from '../features/reports/services/reportService'
import { ThemeProvider } from '../app/providers/ThemeProvider'
import { AuthProvider } from '../app/providers/AuthProvider'

vi.mock('../features/reports/services/reportService', () => ({
  reportService: {
    getPreview: vi.fn(),
    downloadPdf: vi.fn(),
    downloadCsv: vi.fn(),
  },
}))

const mockPreviewData: ReportPreviewResponse = {
  reportType: 'DAILY_NUTRITION',
  startDate: '2026-10-22',
  endDate: '2026-10-22',
  totalDays: 1,
  recordedDays: 1,
  totalFoodEntries: 4,
  averageDailyProteinG: 145.5,
  averageDailyCaloriesKcal: 2150,
  totalHydrationMl: 2600,
  weightMeasurementsCount: 2,
  weightChangeKg: -0.8,
  weightTrendNote: '-0.8 kg net change over 2 measurements.',
  canGenerate: true,
  summaryMessage: 'Found 4 food entries across 1 logged days.',
  availableDietPlans: [
    {
      id: 'diet-plan-1',
      title: 'High Protein Cutting Protocol',
      createdAt: '2026-10-20',
      details: '1900 kcal, 160g protein',
    },
  ],
  availableWorkoutPlans: [
    {
      id: 'workout-plan-1',
      title: '4-Day Hypertrophy Split',
      createdAt: '2026-10-20',
      details: 'UPPER_LOWER (4 days/wk)',
    },
  ],
}

describe('Reports & Data Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(reportService.getPreview).mockResolvedValue(mockPreviewData)
    vi.mocked(reportService.downloadPdf).mockResolvedValue(undefined)
    vi.mocked(reportService.downloadCsv).mockResolvedValue(undefined)
  })

  const renderReportsPage = () => {
    const router = createMemoryRouter(
      [
        {
          path: '/reports',
          element: <ReportsPage />,
        },
      ],
      { initialEntries: ['/reports'] }
    )

    return render(
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    )
  }

  it('renders report types, live content preview, and export actions', async () => {
    renderReportsPage()

    // Header verification
    expect(screen.getByText(/Downloadable Reports/i)).toBeDefined()
    expect(screen.getByText(/Documentation & Data Export/i)).toBeDefined()

    // Report types list verification
    expect(screen.getByText('Daily Nutrition')).toBeDefined()
    expect(screen.getByText('Weekly Nutrition')).toBeDefined()
    expect(screen.getByText('Monthly Nutrition')).toBeDefined()
    expect(screen.getByText('Custom Date-Range')).toBeDefined()
    expect(screen.getByText('Weight Progress')).toBeDefined()
    expect(screen.getByText('Saved Diet Plan')).toBeDefined()
    expect(screen.getByText('Saved Workout Plan')).toBeDefined()

    // Wait for preview load
    await waitFor(() => {
      expect(reportService.getPreview).toHaveBeenCalled()
    })

    // Content summary card metrics
    expect(screen.getByText(/Found 4 food entries across 1 logged days/i)).toBeDefined()
    expect(screen.getByText('145.5 g')).toBeDefined()
    expect(screen.getByText('2600 ml')).toBeDefined()

    // Action buttons
    expect(screen.getByText(/Download PDF Report/i)).toBeDefined()
    expect(screen.getByText(/Export Raw CSV/i)).toBeDefined()
  })

  it('triggers PDF generation when Download PDF button is clicked', async () => {
    renderReportsPage()

    await waitFor(() => {
      expect(reportService.getPreview).toHaveBeenCalled()
    })

    const downloadPdfBtn = screen.getByRole('button', { name: /Download PDF Report/i })
    fireEvent.click(downloadPdfBtn)

    await waitFor(() => {
      expect(reportService.downloadPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DAILY_NUTRITION',
        })
      )
    })
  })

  it('switches report type and displays appropriate parameters', async () => {
    renderReportsPage()

    await waitFor(() => {
      expect(reportService.getPreview).toHaveBeenCalled()
    })

    // Switch to Weight Progress
    const weightBtn = screen.getByText('Weight Progress')
    fireEvent.click(weightBtn)

    await waitFor(() => {
      expect(reportService.getPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'WEIGHT_PROGRESS',
        })
      )
    })

    // Unit toggle buttons appear
    expect(screen.getByText(/Kilograms \(kg\)/i)).toBeDefined()
    expect(screen.getByText(/Pounds \(lbs\)/i)).toBeDefined()
  })

  it('triggers CSV download when CSV dataset is selected', async () => {
    renderReportsPage()

    await waitFor(() => {
      expect(reportService.getPreview).toHaveBeenCalled()
    })

    // Open CSV menu
    const csvDropdownBtn = screen.getByRole('button', { name: /Export Raw CSV/i })
    fireEvent.click(csvDropdownBtn)

    const foodEntriesCsvOption = screen.getByText(/Itemized Food Entries/i)
    fireEvent.click(foodEntriesCsvOption)

    await waitFor(() => {
      expect(reportService.downloadCsv).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'FOOD_ENTRIES',
        })
      )
    })
  })
})
