import { apiClient } from '../../../lib/api-client'
import type {
  WorkoutPlanGenerateRequest,
  WorkoutPlanDetailDto,
  SaveWorkoutPlanRequest,
  WorkoutPlanSummaryResponse,
  WorkoutPlanResponse,
} from '../../../types/api'

export const workoutPlanService = {
  generatePlan: async (request: WorkoutPlanGenerateRequest): Promise<WorkoutPlanDetailDto> => {
    return apiClient.post<WorkoutPlanDetailDto>('/workout-plans/generate', request)
  },

  savePlan: async (request: SaveWorkoutPlanRequest): Promise<WorkoutPlanResponse> => {
    return apiClient.post<WorkoutPlanResponse>('/workout-plans', request)
  },

  getSavedPlans: async (): Promise<WorkoutPlanSummaryResponse[]> => {
    return apiClient.get<WorkoutPlanSummaryResponse[]>('/workout-plans')
  },

  getSavedPlanById: async (id: string): Promise<WorkoutPlanResponse> => {
    return apiClient.get<WorkoutPlanResponse>(`/workout-plans/${encodeURIComponent(id)}`)
  },

  updateSavedPlan: async (id: string, request: SaveWorkoutPlanRequest): Promise<WorkoutPlanResponse> => {
    return apiClient.put<WorkoutPlanResponse>(`/workout-plans/${encodeURIComponent(id)}`, request)
  },

  deleteSavedPlan: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/workout-plans/${encodeURIComponent(id)}`)
  },
}
