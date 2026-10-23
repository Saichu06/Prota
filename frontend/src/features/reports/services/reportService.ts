import { apiClient, API_BASE_URL } from '../../../lib/api-client'

export type ReportType =
  | 'DAILY_NUTRITION'
  | 'WEEKLY_NUTRITION'
  | 'MONTHLY_NUTRITION'
  | 'CUSTOM_RANGE'
  | 'WEIGHT_PROGRESS'
  | 'SAVED_DIET_PLAN'
  | 'SAVED_WORKOUT_PLAN'

export type CsvExportType = 'FOOD_ENTRIES' | 'DAILY_SUMMARIES' | 'HYDRATION' | 'WEIGHT'

export interface PlanSummaryItem {
  id: string
  title: string
  createdAt: string
  details: string
}

export interface ReportPreviewResponse {
  reportType: ReportType
  startDate: string
  endDate: string
  totalDays: number
  recordedDays: number
  totalFoodEntries: number
  averageDailyProteinG: number
  averageDailyCaloriesKcal: number
  totalHydrationMl: number
  weightMeasurementsCount: number
  weightChangeKg?: number
  weightTrendNote: string
  canGenerate: boolean
  summaryMessage: string
  availableDietPlans: PlanSummaryItem[]
  availableWorkoutPlans: PlanSummaryItem[]
}

export const reportService = {
  getPreview: async (params: {
    type?: ReportType
    from?: string
    to?: string
    planId?: string
  }): Promise<ReportPreviewResponse> => {
    const query = new URLSearchParams()
    if (params.type) query.set('type', params.type)
    if (params.from) query.set('from', params.from)
    if (params.to) query.set('to', params.to)
    if (params.planId) query.set('planId', params.planId)

    return apiClient.get<ReportPreviewResponse>(`/reports/preview?${query.toString()}`)
  },

  downloadPdf: async (params: {
    type: ReportType
    from?: string
    to?: string
    planId?: string
    weightUnit?: 'KG' | 'LBS'
    includeDetails?: boolean
  }): Promise<void> => {
    const query = new URLSearchParams()
    query.set('type', params.type)
    if (params.from) query.set('from', params.from)
    if (params.to) query.set('to', params.to)
    if (params.planId) query.set('planId', params.planId)
    if (params.weightUnit) query.set('weightUnit', params.weightUnit)
    if (params.includeDetails !== undefined) query.set('includeDetails', String(params.includeDetails))

    const url = `${API_BASE_URL}/reports/pdf?${query.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      throw new Error(err?.message || `PDF export failed with status ${response.status}`)
    }

    const blob = await response.blob()
    let filename = `prota_${params.type.toLowerCase()}_report.pdf`
    const disposition = response.headers.get('Content-Disposition')
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/)
      if (match?.[1]) filename = match[1]
    }

    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(downloadUrl)
  },

  downloadCsv: async (params: {
    type: CsvExportType
    from?: string
    to?: string
  }): Promise<void> => {
    const query = new URLSearchParams()
    query.set('type', params.type)
    if (params.from) query.set('from', params.from)
    if (params.to) query.set('to', params.to)

    const url = `${API_BASE_URL}/reports/csv?${query.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      throw new Error(err?.message || `CSV export failed with status ${response.status}`)
    }

    const blob = await response.blob()
    let filename = `prota_${params.type.toLowerCase()}_export.csv`
    const disposition = response.headers.get('Content-Disposition')
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/)
      if (match?.[1]) filename = match[1]
    }

    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(downloadUrl)
  },
}
