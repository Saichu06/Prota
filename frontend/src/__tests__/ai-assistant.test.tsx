import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssistantPage } from '../features/assistant/pages/AssistantPage'
import { aiAssistantService } from '../features/assistant/services/aiAssistantService'

vi.mock('../features/assistant/services/aiAssistantService', () => ({
  aiAssistantService: {
    sendMessage: vi.fn(),
  },
}))

describe('Prota AI Nutrition Assistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('renders initial empty state with verified prompt suggestions', () => {
    render(<AssistantPage />)

    expect(screen.getByText('Prota AI Nutrition Assistant')).toBeDefined()
    expect(screen.getByText(/Grounded directly in your personal daily logs/i)).toBeDefined()
    expect(screen.getByText('How much protein have I consumed today?')).toBeDefined()
    expect(screen.getByText('What could I eat to reach my protein goal?')).toBeDefined()
    expect(screen.getByText('Summarize my nutrition over the last seven days.')).toBeDefined()
    expect(screen.getByText('What does my hydration history show?')).toBeDefined()
  })

  it('sends message when clicking a suggested prompt and renders grounded response', async () => {
    vi.mocked(aiAssistantService.sendMessage).mockResolvedValueOnce({
      reply: 'You have consumed 45.0g of protein today out of your 140g target.',
      status: 'SUCCESS',
      groundedSummary: {
        date: '2026-10-21',
        proteinGoalG: 140,
        calorieGoalKcal: 2000,
        waterGoalMl: 2500,
        weightUnit: 'KG',
        consumedProteinG: 45.0,
        consumedCaloriesKcal: 320.0,
        consumedWaterMl: 500,
        recordedWeightKg: 78.5,
        proteinRemainingG: 95,
        proteinCompletionPercentage: 32.1,
        loggedFoodItems: ['Grilled Chicken Salad (LUNCH): 200g, 45g protein, 320 kcal'],
        hasRecords: true,
      },
      suggestions: ['What could I eat for dinner to get 95g more protein?'],
      disclaimer: 'General nutrition guidance only. Not medical advice.',
      timestamp: new Date().toISOString(),
    })

    render(<AssistantPage />)

    const suggestionBtn = screen.getByText('How much protein have I consumed today?')
    fireEvent.click(suggestionBtn)

    await waitFor(() => {
      expect(aiAssistantService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'How much protein have I consumed today?',
        })
      )
    })

    await waitFor(() => {
      expect(
        screen.getByText('You have consumed 45.0g of protein today out of your 140g target.')
      ).toBeDefined()
    })

    // Verified PostgreSQL Context card should appear
    expect(screen.getByText(/Verified PostgreSQL Nutrition Context/i)).toBeDefined()
    expect(screen.getByText('45g / 140g')).toBeDefined()
    expect(screen.getByText('95g remaining')).toBeDefined()
  })

  it('handles service unconfigured status gracefully without crashing', async () => {
    vi.mocked(aiAssistantService.sendMessage).mockResolvedValueOnce({
      status: 'UNAVAILABLE',
      errorCode: 'AI_NOT_CONFIGURED',
      message:
        'The AI Nutrition Assistant is currently unconfigured because no GEMINI_API_KEY environment variable is set on the server.',
      groundedSummary: null,
      timestamp: new Date().toISOString(),
    })

    render(<AssistantPage />)

    const textarea = screen.getByPlaceholderText(/Ask about your nutrition/i)
    fireEvent.change(textarea, { target: { value: 'Can you help me?' } })

    const sendBtn = screen.getByRole('button', { name: /Send message/i })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/The AI Nutrition Assistant is currently unconfigured/i)
      ).toBeDefined()
    })

    expect(screen.getByText('Service unconfigured')).toBeDefined()
    expect(screen.getByRole('button', { name: /Retry/i })).toBeDefined()
  })

  it('allows starting a new conversation and resets the chat history', async () => {
    vi.mocked(aiAssistantService.sendMessage).mockResolvedValueOnce({
      reply: 'Here is your summary.',
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    })

    render(<AssistantPage />)

    const textarea = screen.getByPlaceholderText(/Ask about your nutrition/i)
    fireEvent.change(textarea, { target: { value: 'Summarize today' } })
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }))

    await waitFor(() => {
      expect(screen.getByText('Here is your summary.')).toBeDefined()
    })

    // Reset conversation
    const resetBtn = screen.getByRole('button', { name: /Start a new conversation/i })
    fireEvent.click(resetBtn)

    // Should return to empty state
    expect(screen.getByText('Prota AI Nutrition Assistant')).toBeDefined()
    expect(screen.queryByText('Here is your summary.')).toBeNull()
  })
})
