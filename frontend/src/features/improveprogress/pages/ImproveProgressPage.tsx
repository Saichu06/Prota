import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { improveProgressService } from '../services/improveProgressService'
import { DataCoverageBanner } from '../components/DataCoverageBanner'
import { ProgressOverviewCard } from '../components/ProgressOverviewCard'
import { DetectedPatternsSection } from '../components/DetectedPatternsSection'
import { AiRecommendationsSection } from '../components/AiRecommendationsSection'
import { NutritionTrendsSection } from '../components/NutritionTrendsSection'
import { Button } from '../../../components/ui/Button'
import { addDaysToYmd, getTodayYmd } from '../../../lib/date-utils'
import type { ProgressImprovementResponse, WeightUnit } from '../../../types/api'

type RangePreset = '7d' | '30d' | '90d' | 'custom'

export function ImproveProgressPage() {
  const { settings } = useAuth()
  const [preset, setPreset] = useState<RangePreset>('30d')
  const [customFrom, setCustomFrom] = useState(() => addDaysToYmd(getTodayYmd(), -30))
  const [customTo, setCustomTo] = useState(() => getTodayYmd())

  const [data, setData] = useState<ProgressImprovementResponse | null>(null)
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

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await improveProgressService.analyzeProgress(fromDate, toDate)
      setData(response)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze progress records.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const weightUnit = (settings?.weightUnit as WeightUnit) || 'KG'

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200 max-w-7xl mx-auto pb-12">
      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Improve My Progress</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  AI Powered
                </span>
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Evidence-based pattern detection and grounded AI action steps to accelerate your health goals.
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
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
                {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : p === '90d' ? 'Last 90 Days' : 'Custom'}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {preset === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-transparent border-0 text-slate-800 dark:text-slate-200 text-xs focus:ring-0 p-1"
                aria-label="Start date"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={getTodayYmd(settings?.timezone)}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-transparent border-0 text-slate-800 dark:text-slate-200 text-xs focus:ring-0 p-1"
                aria-label="End date"
              />
            </div>
          )}

          {/* Refresh Action */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalysis}
            disabled={isLoading}
            className="rounded-xl px-3 text-xs gap-1.5"
            aria-label="Refresh analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ─── ERROR STATE ─── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalysis} className="text-xs">
            Try Again
          </Button>
        </div>
      )}

      {/* ─── LOADING SKELETON ─── */}
      {isLoading && !data && (
        <div className="space-y-6 animate-pulse">
          <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      )}

      {/* ─── DATA CONTENT ─── */}
      {data && (
        <div className="space-y-8">
          {/* 1. Data Coverage & Confidence Banner */}
          <DataCoverageBanner
            coverage={data.dataCoverage}
            fromDate={data.fromDate}
            toDate={data.toDate}
          />

          {/* 2. Progress Overview (Factual Metrics) */}
          <ProgressOverviewCard
            metrics={data.verifiedMetrics}
            coverage={data.dataCoverage}
          />

          {/* 3. Evidence-Based Pattern Detection */}
          <DetectedPatternsSection
            patterns={data.detectedPatterns}
          />

          {/* 4. AI-Powered Grounded Recommendations */}
          <AiRecommendationsSection
            aiSummary={data.aiSummary}
            onRetry={fetchAnalysis}
            isLoading={isLoading}
          />

          {/* 5. Reusable Nutrition & Weight Trends */}
          <NutritionTrendsSection
            dailyTrends={data.dailyTrends}
            weightUnit={weightUnit}
          />
        </div>
      )}
    </div>
  )
}
