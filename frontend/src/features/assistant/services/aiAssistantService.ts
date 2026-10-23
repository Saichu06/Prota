import { apiClient } from '../../../lib/api-client'
import type { AiChatRequest, AiChatResponse } from '../../../types/api'

export const aiAssistantService = {
  sendMessage: async (request: AiChatRequest): Promise<AiChatResponse> => {
    return apiClient.post<AiChatResponse>('/ai/chat', request)
  },
}
