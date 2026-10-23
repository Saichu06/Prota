import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { WorkoutPlanWizard } from '../features/workoutplan/components/WorkoutPlanWizard'
import { WorkoutPlanReviewView } from '../features/workoutplan/components/WorkoutPlanReviewView'
import type { WorkoutPlanDetailDto } from '../types/api'

// Mock icons & logo
vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }))

describe('Phase 6B: AI Workout Planner Frontend', () => {
  const samplePlan: WorkoutPlanDetailDto = {
    title: 'Hypertrophy Upper/Lower Routine',
    primaryGoal: 'MUSCLE_HYPERTROPHY',
    trainingLocation: 'GYM',
    experienceLevel: 'INTERMEDIATE',
    splitType: 'UPPER_LOWER',
    daysPerWeek: 4,
    sessionDurationMins: 60,
    creationDate: '2026-10-21',
    userAssumptions: { location: 'GYM', daysPerWeek: 4 },
    sessions: [
      {
        dayNumber: 1,
        dayName: 'Day 1 - Upper Power',
        sessionTitle: 'Chest & Back Heavy',
        isRestDay: false,
        muscleGroupsEmphasized: ['Chest', 'Back'],
        warmupGuidance: 'Dynamic shoulder band dislocates',
        cooldownGuidance: 'Doorway pectoral stretch',
        exercises: [
          {
            name: 'Barbell Bench Press',
            primaryTarget: 'Chest',
            secondaryTargets: ['Triceps', 'Front Delts'],
            sets: 4,
            repsOrDuration: '8-10 reps',
            restSeconds: 90,
            equipment: 'Barbell, Flat Bench',
            instructions: 'Arch upper back, retract scapulae, drive through heels.',
            alternativeExercise: 'Dumbbell Flat Press',
          },
        ],
      },
      {
        dayNumber: 2,
        dayName: 'Day 2 - Lower Quad Focus',
        sessionTitle: 'Squats & Calves',
        isRestDay: false,
        muscleGroupsEmphasized: ['Quads', 'Glutes', 'Calves'],
        warmupGuidance: 'Leg swings and bodyweight squats',
        cooldownGuidance: 'Kneeling hip flexor stretch',
        exercises: [
          {
            name: 'Barbell Back Squat',
            primaryTarget: 'Quadriceps',
            secondaryTargets: ['Glutes'],
            sets: 4,
            repsOrDuration: '8-10 reps',
            restSeconds: 120,
            equipment: 'Squat Rack, Barbell',
            instructions: 'Descend to parallel with braced core.',
            alternativeExercise: 'Leg Press',
          },
        ],
      },
    ],
    progressionTips: ['Add 2.5kg when all sets hit 10 reps.'],
    recoveryAndDeloadTips: ['Deload every 6th week by cutting sets in half.'],
    safetyNotes: ['Never compromise spinal alignment for extra weight.'],
    disclaimer: 'This routine is a general fitness guide. Discontinue if sharp pain occurs.',
  }

  it('renders WorkoutPlanWizard Step 1 and navigates through the multi-step form', async () => {
    const onGenerate = vi.fn()
    render(
      <MemoryRouter>
        <WorkoutPlanWizard
          onGenerate={onGenerate}
          isGenerating={false}
          error={null}
        />
      </MemoryRouter>
    )

    // Step 1: Fitness Profile & Target Goals
    expect(screen.getByText(/Step 1: Fitness Profile & Target Goals/i)).toBeDefined()
    expect(screen.getByLabelText(/Age/i)).toBeDefined()
    expect(screen.getByLabelText(/Current Weight/i)).toBeDefined()
    expect(screen.getAllByText(/Muscle Hypertrophy/i).length).toBeGreaterThan(0)

    // Step 1 Continue
    const continueBtn1 = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueBtn1)

    // Step 2: Location & Gear
    await waitFor(() => {
      expect(screen.getByText(/Step 2: Training Location & Available Equipment/i)).toBeDefined()
    })
    expect(screen.getAllByText(/Commercial Gym/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Home Workout/i)).toBeDefined()

    // Step 2 Continue
    const continueBtn2 = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueBtn2)

    // Step 3: Schedule & Split
    await waitFor(() => {
      expect(screen.getByText(/Step 3: Training Schedule & Split Structure/i)).toBeDefined()
    })
    expect(screen.getAllByText(/Split Structure/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Upper \/ Lower/i)).toBeDefined()

    // Step 3 Continue
    const continueBtn3 = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueBtn3)

    // Step 4: Safety & Limits
    await waitFor(() => {
      expect(screen.getByText(/Step 4: Safety Considerations & Restrictions/i)).toBeDefined()
    })
    expect(screen.getByText(/Medical Safety Advisory/i)).toBeDefined()

    // Step 4 Continue
    const continueBtn4 = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueBtn4)

    // Step 5: Review & Build
    await waitFor(() => {
      expect(screen.getByText(/Step 5: Review Selections & Generate Plan/i)).toBeDefined()
    })
    const generateBtn = screen.getByRole('button', { name: /generate ai workout plan/i })
    expect(generateBtn).toBeDefined()

    fireEvent.click(generateBtn)
    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('renders WorkoutPlanReviewView with weekly session details and allows swapping alternative exercise', () => {
    const onSave = vi.fn()
    const onRegenerate = vi.fn()
    const onCancel = vi.fn()

    render(
      <MemoryRouter>
        <WorkoutPlanReviewView
          plan={samplePlan}
          onSave={onSave}
          onRegenerate={onRegenerate}
          onCancel={onCancel}
          isSaving={false}
        />
      </MemoryRouter>
    )

    // Review banner
    expect(screen.getByText(/AI-Estimated Workout Routine — Review & Customize/i)).toBeDefined()

    // Active session exercises
    expect(screen.getByText(/Day 1 - Upper Power/i)).toBeDefined()
    expect(screen.getByDisplayValue('Barbell Bench Press')).toBeDefined()

    // Swap to alternative exercise button
    const swapBtn = screen.getByRole('button', { name: /swap to alt/i })
    expect(swapBtn).toBeDefined()
    fireEvent.click(swapBtn)

    // Now exercise name is swapped to alternative
    expect(screen.getByDisplayValue('Dumbbell Flat Press')).toBeDefined()

    // Save button
    const saveBtn = screen.getByRole('button', { name: /save plan to my account/i })
    fireEvent.click(saveBtn)
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
