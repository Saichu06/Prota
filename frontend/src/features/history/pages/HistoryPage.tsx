import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  ChevronRight,
  ChevronDown,
  Droplet,
  Scale,
  UtensilsCrossed,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { historyService } from '../services/historyService'
import { Button } from '../../../components/ui/Button'
import { addDaysToYmd, getTodayYmd, formatReadableDate } from '../../../lib/date-utils'
import type { DailyLogResponse } from '../../../types/api'

type RangePreset = '7d' | '30d' | '90d' | 'custom'

export function HistoryPage() {
  const { settings } = useAuth()
  const navigate = useNavigate()

  const [preset, setPreset] = useState<RangePreset>('30d')
  const [customFrom, setCustomFrom] = useState(() => addDaysToYmd(getTodayYmd(), -30))
  const [customTo, setCustomTo] = useState(() => getTodayYmd())

  const [logs, setLogs] = useState<DailyLogResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  // Compute active date range
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

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await historyService.getDailyLogsRange(fromDate, toDate)
      setLogs(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load historical nutrition records.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Map of logs indexed by date string
  const logsByDate = useMemo(() => {
    const map = new Map<string, DailyLogResponse>()
    logs.forEach((log) => {
      if (log.logDate) {
        map.set(log.logDate, log)
      }
    })
    return map
  }, [logs])

  // Generate array of all dates in reverse chronological order (newest first)
  const allDates = useMemo(() => {
    const dates: string[] = []
    let cur = toDate
    while (cur >= fromDate) {
      dates.push(cur)
      cur = addDaysToYmd(cur, -1)
    }
    return dates
  }, [fromDate, toDate])

  const toggleExpand = (date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date))
  }

  const weightUnit = settings?.weightUnit || 'KG'

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* ─── HEADER & RANGE CONTROLS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Nutrition History
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Review your authentic daily records, food logs, and historical macro snapshots.
          </p>
        </div>

        {/* View switcher & Calendar link */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/calendar')}
            className="text-xs"
          >
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Monthly Calendar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/analytics')}
            className="text-xs"
          >
            View Trends & Analytics
          </Button>
        </div>
      </div>

      {/* ─── FILTER TOOLBAR ─── */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Date Range:
          </span>
          {(['7d', '30d', '90d', 'custom'] as RangePreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                preset === p
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : p === '90d' ? 'Last 90 Days' : 'Custom'}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* ─── HISTORICAL TIMELINE LIST ─── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading historical nutrition records...
          </div>
        ) : allDates.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No dates found in the selected range.
          </div>
        ) : (
          allDates.map((dateStr) => {
            const log = logsByDate.get(dateStr)
            const hasData = Boolean(log && (log.foodEntries?.length > 0 || log.consumedProteinG > 0 || (log.consumedWaterMl && log.consumedWaterMl > 0) || log.recordedWeightKg != null))
            const isZeroIntake = Boolean(log && log.consumedProteinG === 0 && log.foodEntries?.length === 0)
            const isExpanded = expandedDate === dateStr

            const dateDisplay = formatReadableDate(dateStr)

            return (
              <div
                key={dateStr}
                className={`rounded-3xl border transition-all overflow-hidden ${
                  hasData
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                    : 'bg-slate-50/40 dark:bg-slate-900/30 border-dashed border-slate-200/60 dark:border-slate-800/60 opacity-80'
                }`}
              >
                {/* Summary Row */}
                <div
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  onClick={() => toggleExpand(dateStr)}
                >
                  {/* Left: Date & Status */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Expand day details"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {dateDisplay}
                        </span>
                        {!hasData && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                            No records
                          </span>
                        )}
                        {hasData && isZeroIntake && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            0g recorded intake
                          </span>
                        )}
                        {hasData && log?.consumedProteinG != null && log.proteinGoalG != null && log.consumedProteinG >= log.proteinGoalG && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Goal Met
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {hasData ? (
                          <span>
                            {log?.foodEntries?.length || 0} food items recorded
                            {log?.timezone ? ` • ${log.timezone}` : ''}
                          </span>
                        ) : (
                          <span>No nutrition, water, or weight entries saved for this date.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Metrics pill summary */}
                  {hasData && log ? (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Protein */}
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/50">
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                          Protein
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {log.consumedProteinG.toFixed(1)}g{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            / {log.proteinGoalG}g
                          </span>
                        </span>
                      </div>

                      {/* Calories */}
                      {log.consumedCaloriesKcal > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/50">
                          <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                            Calories
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {Math.round(log.consumedCaloriesKcal)}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">
                              kcal
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Hydration */}
                      {log.consumedWaterMl != null && log.consumedWaterMl > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50 flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {log.consumedWaterMl.toLocaleString()} ml
                          </span>
                        </div>
                      )}

                      {/* Weight */}
                      {log.recordedWeightKg != null && (
                        <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/50 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {weightUnit === 'LB'
                              ? (log.recordedWeightKg * 2.20462).toFixed(1)
                              : log.recordedWeightKg.toFixed(1)}{' '}
                            {weightUnit}
                          </span>
                        </div>
                      )}

                      {/* Deep Link to Daily Log */}
                      <Link
                        to={`/log?date=${dateStr}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Open in Food Log"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to={`/log?date=${dateStr}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      Log nutrition for this day
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-4 animate-in fade-in-50 duration-150">
                    {hasData && log?.foodEntries && log.foodEntries.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Logged Foods
                        </div>
                        <div className="divide-y divide-slate-200/60 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800">
                          {log.foodEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="py-2.5 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {entry.foodName}
                                </span>
                                <span className="ml-2 text-slate-400">
                                  ({entry.mealType.toLowerCase()}) • {entry.quantity} {entry.quantityUnit}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {entry.proteinG}g protein
                                </span>
                                {entry.caloriesKcal != null && (
                                  <span className="ml-2 text-slate-400">
                                    {Math.round(entry.caloriesKcal)} kcal
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        No food entries to show for this date.
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/log?date=${dateStr}`)}
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5" />
                        Open Day in Food Log
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/dashboard?date=${dateStr}`)}
                      >
                        View Full Dashboard
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
