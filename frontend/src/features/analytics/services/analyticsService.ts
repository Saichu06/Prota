import { apiClient } from '../../../lib/api-client'
import type { AnalyticsSummaryResponse } from '../../../types/api'

export const analyticsService = {
  getSummary: async (from: string, to: string): Promise<AnalyticsSummaryResponse> => {
    return apiClient.get<AnalyticsSummaryResponse>(
      `/analytics/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )
  },
}
