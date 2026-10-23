import { useState } from 'react'
import {
  Sparkles,
  Info,
  Clock,
  Dumbbell,
  Save,
  RotateCcw,
  X,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  Flame,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type {
  WorkoutPlanDetailDto,
  WorkoutSessionDto,
  WorkoutExerciseDto,
} from '../../../types/api'

interface WorkoutPlanReviewViewProps {
  plan: WorkoutPlanDetailDto
  onSave: (reviewedPlan: WorkoutPlanDetailDto) => Promise<void>
  onRegenerate: () => void
  onCancel: () => void
  isSaving: boolean
  saveError?: string | null
}

export function WorkoutPlanReviewView({
  plan,
  onSave,
  onRegenerate,
  onCancel,
  isSaving,
  saveError,
}: WorkoutPlanReviewViewProps) {
  const [title, setTitle] = useState<string>(plan.title)
  const [sessions, setSessions] = useState<WorkoutSessionDto[]>(plan.sessions || [])
  const [activeSessionIndex, setActiveSessionIndex] = useState<number>(0)

  // Swap exercise with alternative
  const handleSwapAlternative = (sessionIdx: number, exerciseIdx: number) => {
    setSessions((prev) => {
      const copy = [...prev]
      const sess = { ...copy[sessionIdx] }
      const exList = [...sess.exercises]
      const ex = { ...exList[exerciseIdx] }

      if (ex.alternativeExercise && ex.alternativeExercise.trim()) {
        const oldName = ex.name
        ex.name = ex.alternativeExercise
        ex.alternativeExercise = oldName
        exList[exerciseIdx] = ex
        sess.exercises = exList
        copy[sessionIdx] = sess
      }
      return copy
    })
  }

  // Edit exercise field
  const handleUpdateExercise = (
    sessionIdx: number,
    exerciseIdx: number,
    field: keyof WorkoutExerciseDto,
    val: string | number
  ) => {
    setSessions((prev) => {
      const copy = [...prev]
      const sess = { ...copy[sessionIdx] }
      const exList = [...sess.exercises]
      exList[exerciseIdx] = { ...exList[exerciseIdx], [field]: val }
      sess.exercises = exList
      copy[sessionIdx] = sess
      return copy
    })
  }

  // Remove an exercise
  const handleRemoveExercise = (sessionIdx: number, exerciseIdx: number) => {
    setSessions((prev) => {
      const copy = [...prev]
      const sess = { ...copy[sessionIdx] }
      sess.exercises = sess.exercises.filter((_, idx) => idx !== exerciseIdx)
      copy[sessionIdx] = sess
      return copy
    })
  }

  // Add a blank custom exercise
  const handleAddExercise = (sessionIdx: number) => {
    setSessions((prev) => {
      const copy = [...prev]
      const sess = { ...copy[sessionIdx] }
      sess.exercises = [
        ...sess.exercises,
        {
          name: 'New Custom Exercise',
          primaryTarget: 'Target Muscle',
          secondaryTargets: [],
          sets: 3,
          repsOrDuration: '10-12 reps',
          restSeconds: 60,
          equipment: 'Dumbbells / Bodyweight',
          instructions: 'Maintain proper tempo and control.',
          alternativeExercise: '',
        },
      ]
      copy[sessionIdx] = sess
      return copy
    })
  }

  const handleSaveClick = async () => {
    const reviewedPlan: WorkoutPlanDetailDto = {
      ...plan,
      title: title.trim() || plan.title,
      sessions,
    }
    await onSave(reviewedPlan)
  }

  const activeSession = sessions[activeSessionIndex] || sessions[0]

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* ─── BANNER: REVIEW ESTIMATED ROUTINE ─── */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
          <p className="font-bold">AI-Estimated Workout Routine — Review & Customize</p>
          <p className="text-emerald-700 dark:text-emerald-300 text-[11px]">
            This program was synthesized according to your selected equipment, frequency, and goals. You can adjust sets, reps, swap exercises with their suggested alternatives, or edit titles before saving.
          </p>
        </div>
      </div>

      {/* Save Error */}
      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ─── HEADER: TITLE & TOP ACTIONS ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              {plan.splitType} • {plan.daysPerWeek} Days/Wk
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {plan.trainingLocation}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {plan.experienceLevel}
            </span>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-hidden w-full transition-colors"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Goal: <strong className="text-slate-700 dark:text-slate-300">{plan.primaryGoal}</strong> • Approx. <strong className="text-slate-700 dark:text-slate-300">{plan.sessionDurationMins} mins/session</strong>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isSaving}
            className="text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Regenerate
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="text-xs text-slate-500"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Discard
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="text-xs shadow-xs bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Plan to My Account
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── WEEKLY SCHEDULE TABS ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sessions.map((sess, idx) => (
          <button
            key={sess.dayNumber || idx}
            type="button"
            onClick={() => setActiveSessionIndex(idx)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
              activeSessionIndex === idx
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <span>{sess.dayName || `Day ${idx + 1}`}</span>
            {sess.isRestDay && (
              <span className="ml-1.5 text-[10px] opacity-75 font-normal">(Rest)</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── ACTIVE SESSION CARD ─── */}
      {activeSession && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeSession.sessionTitle || activeSession.dayName}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {activeSession.muscleGroupsEmphasized?.map((m) => (
                  <span
                    key={m}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddExercise(activeSessionIndex)}
              className="text-xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Exercise
            </Button>
          </div>

          {/* Warmup Guidance */}
          {activeSession.warmupGuidance && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[11px] uppercase tracking-wider">Dynamic Warm-Up Guidance</strong>
                <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">{activeSession.warmupGuidance}</p>
              </div>
            </div>
          )}

          {/* Exercises List */}
          <div className="space-y-3">
            {activeSession.exercises.map((ex, exIdx) => (
              <div
                key={exIdx}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {exIdx + 1}
                    </div>
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) =>
                        handleUpdateExercise(activeSessionIndex, exIdx, 'name', e.target.value)
                      }
                      className="font-bold text-sm text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-hidden w-full transition-colors"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {ex.alternativeExercise && (
                      <button
                        type="button"
                        onClick={() => handleSwapAlternative(activeSessionIndex, exIdx)}
                        title={`Swap with: ${ex.alternativeExercise}`}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Swap to Alt</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(activeSessionIndex, exIdx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                      title="Remove exercise"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Target & Equipment Pills */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Primary: {ex.primaryTarget}
                  </span>
                  <span>•</span>
                  <span>Equipment: {ex.equipment}</span>
                </div>

                {/* Sets / Reps / Rest Inputs */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Sets
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={ex.sets}
                      onChange={(e) =>
                        handleUpdateExercise(
                          activeSessionIndex,
                          exIdx,
                          'sets',
                          parseInt(e.target.value, 10) || 1
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Reps / Duration
                    </label>
                    <input
                      type="text"
                      value={ex.repsOrDuration}
                      onChange={(e) =>
                        handleUpdateExercise(activeSessionIndex, exIdx, 'repsOrDuration', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Rest Interval
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="15"
                        max="300"
                        step="15"
                        value={ex.restSeconds}
                        onChange={(e) =>
                          handleUpdateExercise(
                            activeSessionIndex,
                            exIdx,
                            'restSeconds',
                            parseInt(e.target.value, 10) || 60
                          )
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
                      />
                      <span className="text-[11px] text-slate-400">sec</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                {ex.instructions && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                    💡 Form cue: {ex.instructions}
                  </p>
                )}

                {/* Alternative */}
                {ex.alternativeExercise && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    🔄 Alternative: <span className="font-semibold text-slate-700 dark:text-slate-300">{ex.alternativeExercise}</span>
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Cooldown Guidance */}
          {activeSession.cooldownGuidance && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Cooldown: {activeSession.cooldownGuidance}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── PROGRESSION & RECOVERY GUIDANCE ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plan.progressionTips && plan.progressionTips.length > 0 && (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Progressive Overload Strategy
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
              {plan.progressionTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {plan.recoveryAndDeloadTips && plan.recoveryAndDeloadTips.length > 0 && (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-600" />
              Recovery & Deload Protocols
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
              {plan.recoveryAndDeloadTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Medical Safety Disclaimer Footer */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-700 dark:text-slate-300">Medical Safety Notice: </strong>
          {plan.disclaimer ||
            'This plan is an automated wellness recommendation. Always consult a physician or licensed physiotherapist before undertaking strenuous physical exercise.'}
        </div>
      </div>
    </div>
  )
}
