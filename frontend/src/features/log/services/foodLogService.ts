import { apiClient } from '../../../lib/api-client'
import type {
  DailyLogResponse,
  FoodEntryResponse,
  CreateFoodEntryRequest,
  UpdateFoodEntryRequest,
  WaterEntryResponse,
  CreateWaterEntryRequest,
  WeightEntryResponse,
  CreateWeightEntryRequest,
  SavedFoodResponse,
  CreateSavedFoodRequest,
  AiFoodEstimateResponse,
} from '../../../types/api'

export const foodLogService = {
  getDailyLog: async (date: string): Promise<DailyLogResponse> => {
    return apiClient.get<DailyLogResponse>(`/logs/daily?date=${encodeURIComponent(date)}`)
  },

  addFoodEntry: async (date: string, request: CreateFoodEntryRequest): Promise<FoodEntryResponse> => {
    return apiClient.post<FoodEntryResponse>(`/logs/daily/${encodeURIComponent(date)}/entries`, request)
  },

  updateFoodEntry: async (id: string, request: UpdateFoodEntryRequest): Promise<FoodEntryResponse> => {
    return apiClient.put<FoodEntryResponse>(`/logs/daily/entries/${encodeURIComponent(id)}`, request)
  },

  deleteFoodEntry: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/logs/daily/entries/${encodeURIComponent(id)}`)
  },

  // Water entries
  getDailyWater: async (date: string): Promise<WaterEntryResponse[]> => {
    return apiClient.get<WaterEntryResponse[]>(`/water/daily?date=${encodeURIComponent(date)}`)
  },

  addWater: async (request: CreateWaterEntryRequest): Promise<WaterEntryResponse> => {
    return apiClient.post<WaterEntryResponse>('/water', request)
  },

  deleteWater: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/water/${encodeURIComponent(id)}`)
  },

  // Weight entries
  getDailyWeight: async (date: string): Promise<WeightEntryResponse[]> => {
    return apiClient.get<WeightEntryResponse[]>(`/weight/daily?date=${encodeURIComponent(date)}`)
  },

  addWeight: async (request: CreateWeightEntryRequest): Promise<WeightEntryResponse> => {
    return apiClient.post<WeightEntryResponse>('/weight', request)
  },

  deleteWeight: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/weight/${encodeURIComponent(id)}`)
  },

  // Saved foods
  searchSavedFoods: async (query?: string): Promise<SavedFoodResponse[]> => {
    const q = query ? `?query=${encodeURIComponent(query)}` : ''
    return apiClient.get<SavedFoodResponse[]>(`/saved-foods${q}`)
  },

  createSavedFood: async (request: CreateSavedFoodRequest): Promise<SavedFoodResponse> => {
    return apiClient.post<SavedFoodResponse>('/saved-foods', request)
  },

  deleteSavedFood: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/saved-foods/${encodeURIComponent(id)}`)
  },

  // AI camera estimate
  estimateFromImage: async (file: File): Promise<AiFoodEstimateResponse> => {
    const formData = new FormData()
    formData.append('image', file)
    return apiClient.postForm<AiFoodEstimateResponse>('/ai/estimate/image', formData)
  },

  // AI text / natural language estimate
  estimateFromText: async (request: { description: string; mealType?: string; date?: string }): Promise<AiFoodEstimateResponse> => {
    return apiClient.post<AiFoodEstimateResponse>('/ai/estimate/text', request)
  },

  // Batch confirmed food entries
  addBatchFoodEntries: async (date: string, requests: CreateFoodEntryRequest[]): Promise<DailyLogResponse> => {
    return apiClient.post<DailyLogResponse>(`/logs/daily/${encodeURIComponent(date)}/entries/batch`, requests)
  },
}
