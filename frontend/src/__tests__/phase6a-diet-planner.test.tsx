import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { SidebarProvider } from '../components/layout/SidebarContext'
import { AddOnComingSoonPage } from '../features/addons/pages/AddOnComingSoonPage'
import { DietPlanWizard } from '../features/dietplan/components/DietPlanWizard'

// Mock Lucide icons & logo
vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }))

describe('Phase 6A: Add Ons Navigation & Diet Planner Frontend', () => {
  it('renders Add Ons expandable section in Sidebar with Diet Plan, Workout Plan, and Improve Progress', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SidebarProvider>
          <Sidebar />
        </SidebarProvider>
      </MemoryRouter>
    )

    // Expandable toggle button exists
    const addOnsButtons = screen.getAllByRole('button', { name: /add ons/i })
    expect(addOnsButtons.length).toBeGreaterThan(0)

    // Toggle button should be expandable
    const toggleBtn = addOnsButtons[0]
    expect(toggleBtn).toBeDefined()

    // Click to expand if not expanded
    fireEvent.click(toggleBtn)

    // Verify Add On destinations are rendered
    expect(screen.getAllByText('Diet Plan').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Workout Plan').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Improve My Progress').length).toBeGreaterThan(0)
  })

  it('renders AddOnComingSoonPage with intentional coming-soon communication', () => {
    render(
      <MemoryRouter>
        <AddOnComingSoonPage type="workout-plan" />
      </MemoryRouter>
    )

    expect(screen.getByText('AI Workout Planner')).toBeDefined()
    expect(screen.getByText('Coming Soon — Phase 6B')).toBeDefined()
    expect(screen.getByText(/Personalized training regimens/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /go to ai diet planner/i })).toBeDefined()
  })

  it('renders AddOnComingSoonPage for Improve My Progress', () => {
    render(
      <MemoryRouter>
        <AddOnComingSoonPage type="improve-progress" />
      </MemoryRouter>
    )

    expect(screen.getByText('Improve My Progress')).toBeDefined()
    expect(screen.getByText('Coming Soon — Phase 6C')).toBeDefined()
    expect(screen.getByText(/Actionable metabolic insights/i)).toBeDefined()
  })

  it('renders DietPlanWizard with step 1 and validates required fields', () => {
    const onGenerate = vi.fn()
    render(
      <MemoryRouter>
        <DietPlanWizard
          onGenerate={onGenerate}
          isGenerating={false}
          error={null}
        />
      </MemoryRouter>
    )

    // Step 1: Personal Profile
    expect(screen.getByText('Step 1: Your Biometrics & Activity')).toBeDefined()
    expect(screen.getByLabelText(/Age/i)).toBeDefined()
    expect(screen.getByLabelText(/Biological Sex/i)).toBeDefined()
    expect(screen.getByLabelText(/Height/i)).toBeDefined()
    // Clear age to trigger validation error
    const ageInput = screen.getByLabelText(/Age/i)
    fireEvent.change(ageInput, { target: { value: '' } })

    // Try navigating to next step without required field
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    expect(continueBtn).toBeDefined()
    fireEvent.click(continueBtn)

    // Validation messages should appear
    expect(screen.getByText(/Age must be between 14 and 120/i)).toBeDefined()
    expect(onGenerate).not.toHaveBeenCalled()
  })
})
