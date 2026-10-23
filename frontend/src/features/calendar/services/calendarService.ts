import { apiClient } from '../../../lib/api-client'
import type { DailyLogResponse } from '../../../types/api'

export const calendarService = {
  /**
   * Fetch daily nutrition summaries for a date range from PostgreSQL
   */
  getDailyLogsRange: (from: string, to: string): Promise<DailyLogResponse[]> =>
    apiClient.get<DailyLogResponse[]>(
      `/logs/daily/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    ),

  /**
   * Fetch a single day's log with food entries
   */
  getDailyLog: (date: string): Promise<DailyLogResponse> =>
    apiClient.get<DailyLogResponse>(`/logs/daily?date=${encodeURIComponent(date)}`),
}
