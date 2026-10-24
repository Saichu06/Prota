import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  LineChart,
  AlertCircle,
  RefreshCw,
  Lightbulb,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { analyticsService } from '../services/analyticsService'
import { ProteinAdherenceChart } from '../components/ProteinAdherenceChart'
import { CalorieTrendChart } from '../components/CalorieTrendChart'
import { HydrationChart } from '../components/HydrationChart'
import { WeightTrendChart } from '../components/WeightTrendChart'
import { Button } from '../../../components/ui/Button'
import { addDaysToYmd, getTodayYmd } from '../../../lib/date-utils'
import type { AnalyticsSummaryResponse } from '../../../types/api'

type RangePreset = '7d' | '30d' | '90d' | 'custom'

export function AnalyticsPage() {
  const { settings } = useAuth()
  const [preset, setPreset] = useState<RangePreset>('30d')
  const [customFrom, setCustomFrom] = useState(() => addDaysToYmd(getTodayYmd(), -30))
  const [customTo, setCustomTo] = useState(() => getTodayYmd())

  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { fromDate, toDate } = useMemo(() => {
    const today = getTodayYmd(settings?.timezone)

    if (preset === '7d') {
      return { fromDate: addDaysToYmd(today, -6), toDate: today }
    } else if (preset === '30d') {
      return { fromDate: addDaysToYmd(today, -29), toDate: today }
    } else if (preset === '90d') {
      return { fromDate: addDaysToYmd(today, -89), toDate: today }
    } else {
      return { fromDate: customFrom, toDate: customTo }
    }
  }, [preset, customFrom, customTo, settings?.timezone])

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await analyticsService.getSummary(fromDate, toDate)
      setSummary(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to calculate analytics summary.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics, settings?.updatedAt])

  const weightUnit = settings?.weightUnit || 'KG'

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── HEADER & CONTROLS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <LineChart className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Trends & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Factual performance insights and long-term nutrition trajectory based on your authentic records.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {(['7d', '30d', '90d', 'custom'] as RangePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  preset === p
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Custom'}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* ─── CORE METRICS SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Average Protein */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Average Protein
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {summary?.averageProteinG != null ? (
              <>
                {summary.averageProteinG}{' '}
                <span className="text-sm font-medium text-slate-400">g/day</span>
              </>
            ) : (
              <span className="text-sm font-medium text-slate-400">—</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Target: {settings?.proteinGoalG ?? 140}g / day
          </p>
        </div>

        {/* Protein Goal Adherence */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Goal Adherence
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {summary?.proteinGoalAdherencePercentage != null ? (
              `${summary.proteinGoalAdherencePercentage}%`
            ) : (
              <span className="text-sm font-medium text-slate-400">—</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Tracked on {summary?.trackedDaysCount ?? 0} of {summary?.totalDaysInRange ?? 0} days
          </p>
        </div>

        {/* Average Calories */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Average Calories
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {summary?.averageCaloriesKcal != null ? (
              <>
                {Math.round(summary.averageCaloriesKcal)}{' '}
                <span className="text-sm font-medium text-slate-400">kcal</span>
              </>
            ) : (
              <span className="text-sm font-medium text-slate-400">—</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Target: {settings?.calorieGoalKcal ?? 2000} kcal
          </p>
        </div>

        {/* Hydration / Weight Shift */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Avg Hydration
          </span>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {summary?.averageWaterMl != null ? (
              <>
                {summary.averageWaterMl.toLocaleString()}{' '}
                <span className="text-sm font-medium text-slate-400">ml</span>
              </>
            ) : (
              <span className="text-sm font-medium text-slate-400">—</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Total: {(summary?.totalWaterMl ?? 0).toLocaleString()} ml
          </p>
        </div>
      </div>

      {/* ─── DATA-DRIVEN FACTUAL INSIGHTS ─── */}
      {summary?.insights && summary.insights.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Performance Insights ({summary.fromDate} to {summary.toDate})
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {summary.insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── CHARTS GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Protein Intake vs Goal */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Protein Intake vs Target
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gram volume consumed each day against your historical goal baseline
            </p>
          </div>
          <ProteinAdherenceChart data={summary?.dailyData || []} />
        </div>

        {/* Chart 2: Daily Calories */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Calorie Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recorded caloric intake vs daily target threshold
            </p>
          </div>
          <CalorieTrendChart data={summary?.dailyData || []} />
        </div>

        {/* Chart 3: Hydration Volume */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Hydration Consistency
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily water intake tracking over time
            </p>
          </div>
          <HydrationChart data={summary?.dailyData || []} />
        </div>

        {/* Chart 4: Body Weight Progression */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Bodyweight Progression Curve
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Actual recorded weigh-ins without synthetic approximations
            </p>
          </div>
          <WeightTrendChart data={summary?.dailyData || []} weightUnit={weightUnit} />
        </div>
      </div>
    </div>
  )
}
