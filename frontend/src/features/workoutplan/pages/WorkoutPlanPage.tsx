import { useState } from 'react'
import { Dumbbell, Bookmark, Wand2 } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { WorkoutPlanWizard } from '../components/WorkoutPlanWizard'
import { WorkoutPlanReviewView } from '../components/WorkoutPlanReviewView'
import { SavedWorkoutPlansList } from '../components/SavedWorkoutPlansList'
import { workoutPlanService } from '../services/workoutPlanService'
import type {
  WorkoutPlanGenerateRequest,
  WorkoutPlanDetailDto,
} from '../../../types/api'

export function WorkoutPlanPage() {
  const { settings } = useAuth()
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlanDetailDto | null>(null)

  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  // Handle plan generation via Gemini & backend service
  const handleGenerate = async (request: WorkoutPlanGenerateRequest) => {
    setIsGenerating(true)
    setGenerationError(null)
    setSaveError(null)
    setSaveSuccessMessage(null)

    try {
      const plan = await workoutPlanService.generatePlan(request)
      setGeneratedPlan(plan)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate workout plan. Please try again.'
      setGenerationError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle saving the reviewed & edited plan
  const handleSavePlan = async (reviewedPlan: WorkoutPlanDetailDto) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      await workoutPlanService.savePlan({
        title: reviewedPlan.title,
        primaryGoal: reviewedPlan.primaryGoal,
        trainingLocation: reviewedPlan.trainingLocation,
        splitType: reviewedPlan.splitType,
        daysPerWeek: reviewedPlan.daysPerWeek,
        sessionDurationMins: reviewedPlan.sessionDurationMins,
        experienceLevel: reviewedPlan.experienceLevel,
        planDetail: reviewedPlan,
      })

      setSaveSuccessMessage('Workout plan saved successfully!')
      setGeneratedPlan(null)
      setActiveTab('saved')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save workout plan. Please try again.'
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerate = () => {
    setGeneratedPlan(null)
    setSaveError(null)
    setGenerationError(null)
  }

  const handleCancelReview = () => {
    if (window.confirm('Discard this generated workout routine? Unsaved adjustments will be lost.')) {
      setGeneratedPlan(null)
      setSaveError(null)
      setGenerationError(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Workout Planner
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized, equipment-aware training programs structured for your split, schedule, and recovery goals.
          </p>
        </div>

        {/* Tab Switcher */}
        {!generatedPlan && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create')
                setSaveSuccessMessage(null)
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              New Plan
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('saved')
                setSaveSuccessMessage(null)
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'saved'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved Plans
            </button>
          </div>
        )}
      </div>

      {/* Success Banner */}
      {saveSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <Dumbbell className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Active Tab View */}
      {activeTab === 'create' ? (
        generatedPlan ? (
          <WorkoutPlanReviewView
            plan={generatedPlan}
            onSave={handleSavePlan}
            onRegenerate={handleRegenerate}
            onCancel={handleCancelReview}
            isSaving={isSaving}
            saveError={saveError}
          />
        ) : (
          <WorkoutPlanWizard
            initialWeightUnit={settings?.weightUnit === 'LB' ? 'LB' : 'KG'}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            error={generationError}
          />
        )
      ) : (
        <SavedWorkoutPlansList
          onCreateNew={() => {
            setGeneratedPlan(null)
            setActiveTab('create')
          }}
        />
      )}
    </div>
  )
}
