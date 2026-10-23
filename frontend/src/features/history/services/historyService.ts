import { apiClient } from '../../../lib/api-client'
import type { DailyLogResponse } from '../../../types/api'

export const historyService = {
  getDailyLogsRange: async (from: string, to: string): Promise<DailyLogResponse[]> => {
    return apiClient.get<DailyLogResponse[]>(
      `/logs/daily/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    )
  },
}
