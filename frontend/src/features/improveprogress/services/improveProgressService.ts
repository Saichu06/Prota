import { apiClient } from '../../../lib/api-client'
import type { ProgressImprovementResponse } from '../../../types/api'

export const improveProgressService = {
  analyzeProgress: async (from: string, to: string): Promise<ProgressImprovementResponse> => {
    return apiClient.get<ProgressImprovementResponse>(
      `/progress/improvement?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )
  },
}
