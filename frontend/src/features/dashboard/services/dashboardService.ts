import { apiClient } from '../../../lib/api-client'
import type { DailyLogResponse } from '../../../types/api'

export const dashboardService = {
  getDailyLog: (dateStr: string): Promise<DailyLogResponse> => {
    return apiClient.get<DailyLogResponse>(`/logs/daily?date=${dateStr}`)
  },
}
