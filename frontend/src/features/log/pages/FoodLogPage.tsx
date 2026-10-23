import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Camera,
  Droplet,
  Scale,
  Edit2,
  Trash2,
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
  Cookie,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { foodLogService } from '../services/foodLogService'
import { CircularProgressRing } from '../../dashboard/components/CircularProgressRing'
import { LinearProgressBar } from '../../dashboard/components/LinearProgressBar'
import { DashboardDateSelector } from '../../dashboard/components/DashboardDateSelector'
import { AddFoodModal } from '../components/AddFoodModal'
import { EditFoodModal } from '../components/EditFoodModal'
import { CameraLogModal } from '../components/CameraLogModal'
import { WaterModal } from '../components/WaterModal'
import { WeightModal } from '../components/WeightModal'
import { Button } from '../../../components/ui/Button'
import { getTodayYmd, isValidYmd } from '../../../lib/date-utils'
import type { DailyLogResponse, FoodEntryResponse, MealType } from '../../../types/api'

interface MealGroupConfig {
  type: MealType
  label: string
  icon: typeof Coffee
  description: string
}

const MEAL_GROUPS: MealGroupConfig[] = [
  { type: 'BREAKFAST', label: 'Breakfast', icon: Coffee, description: 'Start your morning with protein-rich fuel' },
  { type: 'LUNCH', label: 'Lunch', icon: Sun, description: 'Midday nutrition to sustain focus and recovery' },
  { type: 'DINNER', label: 'Dinner', icon: Moon, description: 'Evening nourishment supporting muscle repair' },
  { type: 'SNACK', label: 'Snacks', icon: Cookie, description: 'Between-meal protein boosts' },
]

export function FoodLogPage() {
  const { settings } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialDate = (() => {
    const param = searchParams.get('date')
    return param && isValidYmd(param) ? param : getTodayYmd(settings?.timezone)
  })()
  const [selectedDate, setSelectedDate] = useState<string>(initialDate)
  const [dailyLog, setDailyLog] = useState<DailyLogResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addMealType, setAddMealType] = useState<MealType>('BREAKFAST')
  const [editingEntry, setEditingEntry] = useState<FoodEntryResponse | null>(null)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false)
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)

  // Deletion confirmation state
  const [entryToDelete, setEntryToDelete] = useState<FoodEntryResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Sync date with URL params
  useEffect(() => {
    const urlDate = searchParams.get('date')
    if (urlDate && urlDate !== selectedDate && isValidYmd(urlDate)) {
      setSelectedDate(urlDate)
    }
  }, [searchParams, selectedDate])

  const handleDateChange = (newDate: string) => {
    if (!newDate || newDate === selectedDate) return
    setSelectedDate(newDate)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('date', newDate)
      return next
    })
  }

  const fetchDailyLog = useCallback(async (date: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await foodLogService.getDailyLog(date)
      setDailyLog(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load nutrition log for this day.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDailyLog(selectedDate)
  }, [selectedDate, fetchDailyLog])

  const handleDeleteFoodEntry = async () => {
    if (!entryToDelete || isDeleting) return
    setIsDeleting(true)
    try {
      await foodLogService.deleteFoodEntry(entryToDelete.id)
      setEntryToDelete(null)
      await fetchDailyLog(selectedDate)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete food entry.'
      setError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  // Goals & Totals
  const proteinGoal = dailyLog?.proteinGoalG ?? settings?.proteinGoalG ?? 140
  const calorieGoal = dailyLog?.calorieGoalKcal ?? settings?.calorieGoalKcal ?? 2000
  const waterGoal = dailyLog?.waterGoalMl ?? settings?.waterGoalMl ?? 2500
  const weightUnit = settings?.weightUnit || 'KG'

  const consumedProtein = dailyLog?.consumedProteinG ?? 0
  const consumedCalories = dailyLog?.consumedCaloriesKcal ?? 0
  const consumedCarbs = dailyLog?.consumedCarbohydratesG ?? 0
  const consumedFat = dailyLog?.consumedFatG ?? 0
  const consumedWater = dailyLog?.consumedWaterMl ?? 0
  const recordedWeight = dailyLog?.recordedWeightKg ?? null
  const foodEntries = dailyLog?.foodEntries ?? []

  const openAddFoodForMeal = (meal: MealType) => {
    setAddMealType(meal)
    setIsAddModalOpen(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── HEADER & CONTROLS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <UtensilsCrossed className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Daily Food Log
            {isLoading && (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Record meals, track protein portions, hydration, and daily weigh-ins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DashboardDateSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            timezone={settings?.timezone || 'UTC'}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCameraModalOpen(true)}
            className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Camera className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Camera Assist</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => openAddFoodForMeal('BREAKFAST')}
            className="shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Log Food
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchDailyLog(selectedDate)}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* ─── NUTRITION PROGRESS OVERVIEW ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Protein Target Ring */}
        <div className="md:col-span-1 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Protein Target
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {proteinGoal}g goal
            </span>
          </div>
          <CircularProgressRing
            consumed={consumedProtein}
            goal={proteinGoal}
            unit="g"
            label="Protein"
            size={160}
            strokeWidth={14}
          />
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {consumedProtein >= proteinGoal ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Goal Achieved!</span>
            ) : (
              <span>{(proteinGoal - consumedProtein).toFixed(1)}g remaining</span>
            )}
          </div>
        </div>

        {/* Calories & Macro Breakdown */}
        <div className="md:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daily Calories
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {Math.round(consumedCalories)} / {Math.round(calorieGoal)} kcal
              </span>
            </div>
            <LinearProgressBar
              consumed={consumedCalories}
              goal={calorieGoal}
              unit=" kcal"
              label="Calories"
              barColor="bg-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Carbohydrates</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {consumedCarbs.toFixed(1)} <span className="text-xs text-slate-500">g</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Fats</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {consumedFat.toFixed(1)} <span className="text-xs text-slate-500">g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Water & Weight Widgets */}
        <div className="md:col-span-1 space-y-4">
          {/* Water widget */}
          <button
            type="button"
            onClick={() => setIsWaterModalOpen(true)}
            className="w-full text-left p-4 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 hover:border-blue-500/60 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                <Droplet className="w-3.5 h-3.5" />
                Water
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {consumedWater.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ {waterGoal.toLocaleString()} ml</span>
              </div>
            </div>
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </span>
          </button>

          {/* Weight widget */}
          <button
            type="button"
            onClick={() => setIsWeightModalOpen(true)}
            className="w-full text-left p-4 rounded-3xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 hover:border-purple-500/60 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400">
                <Scale className="w-3.5 h-3.5" />
                Weight
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {recordedWeight != null ? (
                  <>
                    {(weightUnit === 'LB' ? (recordedWeight * 2.20462).toFixed(1) : recordedWeight.toFixed(1))}
                    <span className="text-xs text-slate-500 font-normal"> {weightUnit}</span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate-400">Not recorded</span>
                )}
              </div>
            </div>
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>

      {/* ─── MEALS LIST GROUPED BY MEAL TYPE ─── */}
      <div className="space-y-6">
        {MEAL_GROUPS.map(({ type, label, icon: MealIcon, description }) => {
          const mealEntries = foodEntries.filter((e) => e.mealType === type)
          const mealProtein = mealEntries.reduce((acc, curr) => acc + (curr.proteinG || 0), 0)
          const mealCalories = mealEntries.reduce((acc, curr) => acc + (curr.caloriesKcal || 0), 0)

          return (
            <div
              key={type}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
            >
              {/* Meal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <MealIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {label}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {mealEntries.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-xl font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        {mealProtein.toFixed(1)}g protein
                      </span>
                      {mealCalories > 0 && (
                        <span className="px-2.5 py-1 rounded-xl font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {Math.round(mealCalories)} kcal
                        </span>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddFoodForMeal(type)}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Meal Entries or Empty State */}
              {mealEntries.length === 0 ? (
                <div className="py-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-850/40">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    No items recorded for {label.toLowerCase()} yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddFoodForMeal(type)}
                    className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    + Add a food item
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mealEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 -mx-2 rounded-xl transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {entry.foodName}
                          </span>
                          {entry.category && (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {entry.category}
                            </span>
                          )}
                          {entry.nutritionSource === 'AI_GEMINI_MULTIMODAL' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center gap-1 font-semibold border border-purple-200/50 dark:border-purple-800/50">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI Verified
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>
                            {entry.quantity} {entry.quantityUnit}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {entry.proteinG}g protein
                          </span>
                          {entry.caloriesKcal != null && (
                            <>
                              <span>•</span>
                              <span>{Math.round(entry.caloriesKcal)} kcal</span>
                            </>
                          )}
                          {entry.carbohydratesG != null && (
                            <>
                              <span>•</span>
                              <span>{entry.carbohydratesG}g carbs</span>
                            </>
                          )}
                          {entry.fatG != null && (
                            <>
                              <span>•</span>
                              <span>{entry.fatG}g fat</span>
                            </>
                          )}
                          {entry.notes && (
                            <span className="italic text-slate-400">
                              ({entry.notes})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setEditingEntry(entry)}
                          aria-label={`Edit ${entry.foodName}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEntryToDelete(entry)}
                          aria-label={`Delete ${entry.foodName}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── MODALS ─── */}
      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchDailyLog(selectedDate)}
        defaultDate={selectedDate}
        defaultMealType={addMealType}
      />

      <EditFoodModal
        isOpen={Boolean(editingEntry)}
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSuccess={() => fetchDailyLog(selectedDate)}
      />

      <CameraLogModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onSuccess={() => fetchDailyLog(selectedDate)}
        defaultDate={selectedDate}
        onSwitchToManual={() => {
          setIsAddModalOpen(true)
        }}
      />

      <WaterModal
        isOpen={isWaterModalOpen}
        onClose={() => setIsWaterModalOpen(false)}
        onSuccess={() => fetchDailyLog(selectedDate)}
        date={selectedDate}
        waterGoalMl={waterGoal}
      />

      <WeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onSuccess={() => fetchDailyLog(selectedDate)}
        date={selectedDate}
        weightUnit={weightUnit}
        currentWeightKg={recordedWeight}
      />

      {/* Delete Food Entry Confirmation Modal */}
      {entryToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-entry-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 id="delete-entry-title" className="text-base font-bold text-slate-900 dark:text-white">
              Delete Food Entry?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove <strong>{entryToDelete.foodName}</strong> ({entryToDelete.quantity} {entryToDelete.quantityUnit}) from your {entryToDelete.mealType.toLowerCase()} log?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEntryToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteFoodEntry}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Entry'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
