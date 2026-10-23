import { apiClient } from '../../../lib/api-client'
import type {
  DietPlanGenerateRequest,
  DietPlanDetailDto,
  SaveDietPlanRequest,
  DietPlanSummaryResponse,
  DietPlanResponse,
} from '../../../types/api'

export const dietPlanService = {
  generatePlan: async (request: DietPlanGenerateRequest): Promise<DietPlanDetailDto> => {
    return apiClient.post<DietPlanDetailDto>('/diet-plans/generate', request)
  },

  savePlan: async (request: SaveDietPlanRequest): Promise<DietPlanResponse> => {
    return apiClient.post<DietPlanResponse>('/diet-plans', request)
  },

  getSavedPlans: async (): Promise<DietPlanSummaryResponse[]> => {
    return apiClient.get<DietPlanSummaryResponse[]>('/diet-plans')
  },

  getSavedPlanById: async (id: string): Promise<DietPlanResponse> => {
    return apiClient.get<DietPlanResponse>(`/diet-plans/${encodeURIComponent(id)}`)
  },

  deleteSavedPlan: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/diet-plans/${encodeURIComponent(id)}`)
  },
}
