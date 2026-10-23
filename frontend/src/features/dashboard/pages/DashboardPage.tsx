import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Flame,
  Droplet,
  Scale,
  RefreshCw,
  AlertCircle,
  PieChart,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { dashboardService } from '../services/dashboardService'
import { CircularProgressRing } from '../components/CircularProgressRing'
import { LinearProgressBar } from '../components/LinearProgressBar'
import { DashboardDateSelector } from '../components/DashboardDateSelector'
import { FoodEntriesSection } from '../components/FoodEntriesSection'
import { Button } from '../../../components/ui/Button'
import { getTodayYmd, isValidYmd } from '../../../lib/date-utils'
import type { DailyLogResponse } from '../../../types/api'

export function DashboardPage() {
  const { user, settings } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialDate = (() => {
    const param = searchParams.get('date')
    return param && isValidYmd(param) ? param : getTodayYmd(settings?.timezone)
  })()
  const [selectedDate, setSelectedDate] = useState<string>(initialDate)
  const [dailyLog, setDailyLog] = useState<DailyLogResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Sync with search params
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
      const data = await dashboardService.getDailyLog(date)
      setDailyLog(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load nutrition data for this day.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDailyLog(selectedDate)
  }, [selectedDate, fetchDailyLog])

  // Fallbacks from authenticated settings if daily log not yet saved in database
  const proteinGoal = dailyLog?.proteinGoalG ?? settings?.proteinGoalG ?? 140
  const calorieGoal = dailyLog?.calorieGoalKcal ?? settings?.calorieGoalKcal ?? 2000
  const waterGoal = dailyLog?.waterGoalMl ?? settings?.waterGoalMl ?? 2500
  const weightUnit = settings?.weightUnit || 'KG'

  const consumedProtein = dailyLog?.consumedProteinG ?? 0
  const consumedCalories = dailyLog?.consumedCaloriesKcal ?? 0
  const consumedCarbs = dailyLog?.consumedCarbohydratesG ?? 0
  const consumedFat = dailyLog?.consumedFatG ?? 0
  const foodEntries = dailyLog?.foodEntries ?? []

  // Calculate macronutrient calorie ratio
  const proteinKcal = consumedProtein * 4
  const carbsKcal = consumedCarbs * 4
  const fatKcal = consumedFat * 9
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal

  const proteinPct = totalMacroKcal > 0 ? Math.round((proteinKcal / totalMacroKcal) * 100) : 0
  const carbsPct = totalMacroKcal > 0 ? Math.round((carbsKcal / totalMacroKcal) * 100) : 0
  const fatPct = totalMacroKcal > 0 ? Math.round((fatKcal / totalMacroKcal) * 100) : 0

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── DASHBOARD HEADER & DATE SELECTION ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {user?.fullName || 'there'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track your protein intake, calories, and hydration against your daily goals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DashboardDateSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            timezone={settings?.timezone}
          />
          <Link
            to={`/calendar?date=${selectedDate}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
          >
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">View in Calendar</span>
            <span className="sm:hidden">Calendar</span>
          </Link>
        </div>
      </div>

      {/* ─── ERROR STATE ─── */}
      {error && !isLoading && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
              Unable to load daily log
            </h3>
            <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchDailyLog(selectedDate)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* ─── LOADING SKELETON ─── */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-64 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
            <div className="h-32 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
            <div className="h-32 rounded-3xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {/* ─── NUTRITION PROGRESS OVERVIEW HERO CARD ─── */}
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0B1424] text-slate-900 dark:text-white p-6 sm:p-8 lg:p-10 shadow-sm sm:shadow-md dark:shadow-xl border border-slate-200/90 dark:border-slate-800 transition-colors">
            {/* Ambient emerald radial glow */}
            <div className="absolute inset-0 bg-radial from-emerald-500/5 dark:from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Primary Circular Protein Goal Ring */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60 backdrop-blur-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
                  Core Metric
                </span>
                <CircularProgressRing
                  consumed={consumedProtein}
                  goal={proteinGoal}
                  unit="g"
                  label="Protein"
                  size={190}
                />
              </div>

              {/* Right Column: Calories, Hydration, Weight Cards */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Daily Nutrition Breakdown
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Live tally of today’s fuel, energy, and hydration targets.
                  </p>
                </div>

                {/* Calorie Bar */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Calories
                    </span>
                  </div>
                  <LinearProgressBar
                    label="Calorie Target"
                    consumed={consumedCalories}
                    goal={calorieGoal}
                    unit="kcal"
                    barColor="bg-amber-500"
                    trackColor="bg-slate-200/80 dark:bg-slate-900"
                  />
                </div>

                {/* Hydration Bar */}
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Hydration
                      </span>
                    </div>
                    <Link
                      to={`/log?date=${selectedDate}`}
                      className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Log Water</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <LinearProgressBar
                    label="Water Intake"
                    consumed={dailyLog?.consumedWaterMl ?? 0}
                    goal={waterGoal}
                    unit="ml"
                    barColor="bg-teal-500"
                    trackColor="bg-slate-200/80 dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── MACRONUTRIENT & METRIC INSIGHTS CARDS ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Macro Breakdown */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Macro Distribution
                </h3>
              </div>

              {totalMacroKcal > 0 ? (
                <div className="space-y-3">
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                    <div
                      style={{ width: `${proteinPct}%` }}
                      className="h-full bg-emerald-500"
                      title={`Protein: ${proteinPct}%`}
                    />
                    <div
                      style={{ width: `${carbsPct}%` }}
                      className="h-full bg-indigo-500"
                      title={`Carbs: ${carbsPct}%`}
                    />
                    <div
                      style={{ width: `${fatPct}%` }}
                      className="h-full bg-amber-500"
                      title={`Fat: ${fatPct}%`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                        Protein
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {proteinPct}% ({consumedProtein}g)
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                        Carbs
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {carbsPct}% ({consumedCarbs}g)
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                        Fat
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {fatPct}% ({consumedFat}g)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  <p>No macronutrients recorded for this date.</p>
                </div>
              )}
            </div>

            {/* Hydration Summary */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Hydration Target
                  </h3>
                </div>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                  {waterGoal}ml goal
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
                {dailyLog?.consumedWaterMl != null && dailyLog.consumedWaterMl > 0
                  ? `Recorded ${dailyLog.consumedWaterMl}ml intake for this date (${Math.round((dailyLog.consumedWaterMl / waterGoal) * 100)}% of daily goal).`
                  : 'No water entries recorded for this date. Hydration supports protein synthesis and digestion.'}
              </p>
              <Link to={`/log?date=${selectedDate}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Quick Hydration Log
                </Button>
              </Link>
            </div>

            {/* Weight Status */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Body Weight
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Unit: {weightUnit}
                </span>
              </div>
              {dailyLog?.recordedWeightKg != null ? (
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {dailyLog.recordedWeightKg} <span className="text-xs font-normal text-slate-500">{weightUnit}</span>
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 mb-4">
                    Recorded entry for {selectedDate}
                  </p>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-4">
                  No weigh-in recorded for this date. Track bodyweight trends to correlate with intake.
                </p>
              )}
              <Link to={`/log?date=${selectedDate}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Record Weight
                </Button>
              </Link>
            </div>
          </div>

          {/* ─── TODAY'S FOOD ENTRIES ─── */}
          <FoodEntriesSection
            entries={foodEntries}
            selectedDate={selectedDate}
            timezone={settings?.timezone}
          />
        </>
      )}
    </div>
  )
}
