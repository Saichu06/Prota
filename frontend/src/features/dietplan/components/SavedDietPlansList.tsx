import { useState, useEffect } from 'react'
import {
  Calendar,
  Sparkles,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
  X,
  ChefHat,
  Droplet,
  ShoppingCart,
  Clock,
  Plus,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { dietPlanService } from '../services/dietPlanService'
import type {
  DietPlanSummaryResponse,
  DietPlanResponse,
} from '../../../types/api'

interface SavedDietPlansListProps {
  onCreateNew: () => void
}

export function SavedDietPlansList({ onCreateNew }: SavedDietPlansListProps) {
  const [plans, setPlans] = useState<DietPlanSummaryResponse[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Detail Modal
  const [selectedPlan, setSelectedPlan] = useState<DietPlanResponse | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPlans = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await dietPlanService.getSavedPlans()
      setPlans(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load saved diet plans.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleViewPlan = async (id: string) => {
    setIsLoadingDetail(true)
    try {
      const data = await dietPlanService.getSavedPlanById(id)
      setSelectedPlan(data)
    } catch {
      setError('Could not load plan details.')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this saved diet plan?')) return

    setDeletingId(id)
    try {
      await dietPlanService.deleteSavedPlan(id)
      setPlans((prev) => prev.filter((p) => p.id !== id))
      if (selectedPlan?.id === id) {
        setSelectedPlan(null)
      }
    } catch {
      setError('Failed to delete diet plan.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Saved Diet Plans
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Access your previously generated and saved nutrition plans.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={onCreateNew} className="text-xs shadow-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Create New Plan
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          Loading saved plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="inline-flex p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No saved plans yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Create your first personalized AI Diet Plan tailored to your targets and preferences.
          </p>
          <Button variant="primary" size="sm" onClick={onCreateNew} className="text-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Generate My First Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  <span>{p.goal.replace('_', ' ')}</span>
                  <span className="text-slate-400 font-normal flex items-center gap-1 lowercase">
                    <Calendar className="w-3 h-3" />
                    {formatDate(p.createdAt)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {p.title}
                </h3>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Calories</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {Math.round(p.dailyCaloriesKcal)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">kcal</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-center">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block uppercase">Protein</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      {Math.round(p.dailyProteinG)}g
                    </span>
                    <span className="text-[10px] text-slate-500 block">target</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewPlan(p.id)}
                  disabled={isLoadingDetail}
                  className="text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View Plan
                </Button>

                <button
                  type="button"
                  onClick={() => handleDeletePlan(p.id)}
                  disabled={deletingId === p.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete saved plan"
                >
                  {deletingId === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── FULL PLAN DETAIL MODAL ─── */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {selectedPlan.goal.replace('_', ' ')}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedPlan.title}
                </h3>
                <span className="text-xs text-slate-400">
                  Saved on {formatDate(selectedPlan.createdAt)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Daily Totals Pill Banner */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase">Calories</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {Math.round(selectedPlan.dailyCaloriesKcal)}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase">Protein</span>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    {Math.round(selectedPlan.dailyProteinG)}g
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase">Carbs</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedPlan.dailyCarbohydratesG != null ? Math.round(selectedPlan.dailyCarbohydratesG) : '--'}g
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase">Fats</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {selectedPlan.dailyFatG != null ? Math.round(selectedPlan.dailyFatG) : '--'}g
                  </span>
                </div>
              </div>

              {/* Meals list */}
              {selectedPlan.planDetail?.meals && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Meal Schedule
                  </h4>

                  {selectedPlan.planDetail.meals.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>{m.mealName} {m.timing ? `(${m.timing})` : ''}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {Math.round(m.totalProteinG)}g P • {Math.round(m.totalCaloriesKcal)} kcal
                        </span>
                      </div>

                      <div className="space-y-1">
                        {m.foods?.map((f, fIdx) => (
                          <div key={fIdx} className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                            <span>
                              {f.name} ({f.quantity} {f.quantityUnit})
                            </span>
                            <span className="text-slate-400">
                              {f.proteinG}g P • {f.caloriesKcal} kcal
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Substitutions & Shopping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedPlan.planDetail?.practicalSubstitutions && (
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-emerald-600" />
                      Substitutions
                    </h4>
                    {selectedPlan.planDetail.practicalSubstitutions.map((sub, sIdx) => (
                      <div key={sIdx} className="text-[11px] text-slate-600 dark:text-slate-300">
                        • {sub.originalFood} ➔ <strong className="text-emerald-600">{sub.alternativeFood}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPlan.planDetail?.shoppingList && (
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                      Shopping Items
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedPlan.planDetail.shoppingList.flatMap((cat) => cat.items).slice(0, 10).map((it, iIdx) => (
                        <span key={iIdx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300">
                          {it}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedPlan.planDetail?.hydrationGuidance && (
                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/60 text-xs text-sky-900 dark:text-sky-200 flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{selectedPlan.planDetail.hydrationGuidance}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedPlan(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
