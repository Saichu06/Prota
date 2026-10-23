import { useState, useCallback } from 'react'
import { aiAssistantService } from '../services/aiAssistantService'
import type { ChatMessage } from '../components/ChatMessageBubble'
import type { AiChatMessage } from '../../../types/api'

export function useAiChat(initialContextDate?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contextDate, setContextDate] = useState<string>(
    initialContextDate || new Date().toISOString().split('T')[0]
  )
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [lastUserPrompt, setLastUserPrompt] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const prompt = (textToSend || inputValue).trim()
      if (!prompt || isLoading) return

      const userMsgId = `user-${Date.now()}`
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      }

      setLastUserPrompt(prompt)
      setMessages((prev) => [...prev, userMessage])
      setInputValue('')
      setIsLoading(true)

      // Convert previous messages to DTO history format
      const conversationHistory: AiChatMessage[] = messages
        .filter((m) => m.status !== 'ERROR')
        .slice(-8)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        }))

      try {
        const response = await aiAssistantService.sendMessage({
          message: prompt,
          contextDate,
          conversationHistory,
        })

        const assistantMsgId = `assistant-${Date.now()}`
        const isSuccess = response.status === 'SUCCESS'

        const assistantMessage: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: isSuccess
            ? response.reply || 'No response content returned.'
            : response.message || 'The AI assistant was unable to process this request.',
          timestamp: response.timestamp || new Date().toISOString(),
          status: response.status,
          groundedSummary: response.groundedSummary,
          disclaimer: response.disclaimer,
        }

        setMessages((prev) => [...prev, assistantMessage])

        if (response.suggestions && response.suggestions.length > 0) {
          setSuggestions(response.suggestions)
        }
      } catch (err: any) {
        const errorMsgId = `err-${Date.now()}`
        const errorText =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to reach the AI assistant. Please check your connection and retry.'

        const errorMessage: ChatMessage = {
          id: errorMsgId,
          role: 'assistant',
          content: errorText,
          timestamp: new Date().toISOString(),
          status: 'ERROR',
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [inputValue, isLoading, messages, contextDate]
  )

  const retryLastMessage = useCallback(() => {
    if (lastUserPrompt) {
      sendMessage(lastUserPrompt)
    }
  }, [lastUserPrompt, sendMessage])

  const startNewChat = useCallback(() => {
    setMessages([])
    setInputValue('')
    setLastUserPrompt(null)
  }, [])

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    contextDate,
    setContextDate,
    suggestions,
    sendMessage,
    retryLastMessage,
    startNewChat,
  }
}
