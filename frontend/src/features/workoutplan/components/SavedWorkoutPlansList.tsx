import { useState, useEffect } from 'react'
import {
  Calendar,
  Dumbbell,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
  X,
  Plus,
  Sparkles,
  Building2,
  Home,
  Flame,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { workoutPlanService } from '../services/workoutPlanService'
import type {
  WorkoutPlanSummaryResponse,
  WorkoutPlanResponse,
} from '../../../types/api'

interface SavedWorkoutPlansListProps {
  onCreateNew: () => void
}

export function SavedWorkoutPlansList({ onCreateNew }: SavedWorkoutPlansListProps) {
  const [plans, setPlans] = useState<WorkoutPlanSummaryResponse[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Detail Modal
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlanResponse | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPlans = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await workoutPlanService.getSavedPlans()
      setPlans(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load saved workout plans.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleOpenDetail = async (id: string) => {
    setIsLoadingDetail(true)
    try {
      const plan = await workoutPlanService.getSavedPlanById(id)
      setSelectedPlan(plan)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve plan details.'
      alert(msg)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    try {
      await workoutPlanService.deleteSavedPlan(id)
      setPlans((prev) => prev.filter((p) => p.id !== id))
      if (selectedPlan?.id === id) {
        setSelectedPlan(null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete workout plan.'
      alert(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Saved Workout Plans
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access your personalized weekly routines and training splits anytime.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onCreateNew}
          className="text-xs bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Create New Plan
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs font-medium">Loading saved workout programs...</p>
        </div>
      ) : plans.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Workout Plans Saved Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Use the AI Workout Planner to generate tailored routines based on your equipment, experience level, and target muscle groups.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onCreateNew}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Generate My First Workout Plan
          </Button>
        </div>
      ) : (
        /* Grid of Plans */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col justify-between space-y-4 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {p.primaryGoal}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    {p.trainingLocation === 'HOME' ? (
                      <>
                        <Home className="w-3 h-3" /> Home
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3 h-3" /> Gym
                      </>
                    )}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {p.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  Saved on {new Date(p.createdAt).toLocaleDateString()}
                </p>

                {/* Split & Duration Specs */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 mt-3 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Split</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                      {p.splitType}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Frequency</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {p.daysPerWeek}d / wk
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Duration</span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {p.sessionDurationMins}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDetail(p.id)}
                  disabled={isLoadingDetail}
                  className="text-xs"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View Routine
                </Button>

                <button
                  type="button"
                  onClick={() => handleDelete(p.id, p.title)}
                  disabled={deletingId === p.id}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Delete workout plan"
                >
                  {deletingId === p.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── DETAIL VIEWER MODAL ─── */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {selectedPlan.primaryGoal} • {selectedPlan.splitType}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {selectedPlan.trainingLocation} • {selectedPlan.daysPerWeek} Days/Wk
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedPlan.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Sessions Accordion / List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Weekly Training Schedule
                </h4>
                {selectedPlan.planDetail?.sessions?.map((sess, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/50 dark:border-slate-700/50 pb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {sess.dayName} — {sess.sessionTitle}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sess.muscleGroupsEmphasized?.map((m) => (
                          <span
                            key={m}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-600"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {sess.warmupGuidance && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                        <span>Warmup: {sess.warmupGuidance}</span>
                      </div>
                    )}

                    {/* Exercises Table */}
                    <div className="space-y-2">
                      {sess.exercises?.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {exIdx + 1}. {ex.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Target: {ex.primaryTarget} • Gear: {ex.equipment}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                            <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                              {ex.sets} sets × {ex.repsOrDuration}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {ex.restSeconds}s rest
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progression & Deload Tips */}
              {selectedPlan.planDetail?.progressionTips && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 text-xs space-y-1.5">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                    Progression Strategy
                  </span>
                  <ul className="list-disc pl-4 text-emerald-800 dark:text-emerald-400 space-y-1">
                    {selectedPlan.planDetail.progressionTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlan(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
