import { useState } from 'react'
import { Sparkles, Bookmark, Wand2 } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { DietPlanWizard } from '../components/DietPlanWizard'
import { DietPlanReviewView } from '../components/DietPlanReviewView'
import { SavedDietPlansList } from '../components/SavedDietPlansList'
import { dietPlanService } from '../services/dietPlanService'
import type {
  DietPlanGenerateRequest,
  DietPlanDetailDto,
} from '../../../types/api'

export function DietPlanPage() {
  const { settings } = useAuth()
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generatedPlan, setGeneratedPlan] = useState<DietPlanDetailDto | null>(null)
  
  // Save state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  // Handle plan generation via Gemini & backend service
  const handleGenerate = async (request: DietPlanGenerateRequest) => {
    setIsGenerating(true)
    setGenerationError(null)
    setSaveError(null)
    setSaveSuccessMessage(null)

    try {
      const plan = await dietPlanService.generatePlan(request)
      setGeneratedPlan(plan)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate diet plan. Please try again.'
      setGenerationError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle saving the reviewed & edited plan
  const handleSavePlan = async (reviewedPlan: DietPlanDetailDto) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      await dietPlanService.savePlan({
        title: reviewedPlan.title,
        goal: reviewedPlan.goal,
        dailyCaloriesKcal: reviewedPlan.dailyCaloriesKcal,
        dailyProteinG: reviewedPlan.dailyProteinG,
        dailyCarbohydratesG: reviewedPlan.dailyCarbohydratesG ?? null,
        dailyFatG: reviewedPlan.dailyFatG ?? null,
        planDetail: reviewedPlan,
      })

      setSaveSuccessMessage('Diet plan saved successfully!')
      setGeneratedPlan(null)
      setActiveTab('saved')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save diet plan. Please try again.'
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
    if (window.confirm('Discard this generated plan? Unsaved changes will be lost.')) {
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
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Diet Planner
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized, macro-balanced nutrition plans tailored to your goals, dietary preferences, and schedule.
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
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Active Tab View */}
      {activeTab === 'create' ? (
        generatedPlan ? (
          <DietPlanReviewView
            plan={generatedPlan}
            onSave={handleSavePlan}
            onRegenerate={handleRegenerate}
            onCancel={handleCancelReview}
            isSaving={isSaving}
            saveError={saveError}
          />
        ) : (
          <DietPlanWizard
            initialWeightUnit={settings?.weightUnit === 'LB' ? 'LB' : 'KG'}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            error={generationError}
          />
        )
      ) : (
        <SavedDietPlansList
          onCreateNew={() => {
            setGeneratedPlan(null)
            setActiveTab('create')
          }}
        />
      )}
    </div>
  )
}
