import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Flame,
  Droplet,
  Utensils,
  Plus,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { useAuth } from '../../../hooks/useAuth'
import { calendarService } from '../services/calendarService'
import { addDaysToYmd, getTodayYmd, formatReadableDate, isValidYmd } from '../../../lib/date-utils'
import type { DailyLogResponse } from '../../../types/api'

type CalendarViewMode = 'month' | 'week' | 'day'

// Helper to format Date to 'YYYY-MM-DD'
function formatYmd(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function CalendarPage() {
  const { settings } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize selected date from URL query param or user's local today
  const todayYmd = getTodayYmd(settings?.timezone)
  const initialDateStr = (() => {
    const fromParam = searchParams.get('date')
    return fromParam && isValidYmd(fromParam) ? fromParam : todayYmd
  })()
  const [selectedDate, setSelectedDate] = useState<string>(initialDateStr)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [currentCursorDate, setCurrentCursorDate] = useState<Date>(() => {
    const [y, m, d] = initialDateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  })

  const [logsMap, setLogsMap] = useState<Map<string, DailyLogResponse>>(new Map())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Sync selected date with URL query param
  useEffect(() => {
    const urlDate = searchParams.get('date')
    if (urlDate && urlDate !== selectedDate && isValidYmd(urlDate)) {
      setSelectedDate(urlDate)
      const [y, m, d] = urlDate.split('-').map(Number)
      setCurrentCursorDate(new Date(y, m - 1, d))
    }
  }, [searchParams, selectedDate])

  // Calculate visible range based on currentCursorDate and viewMode
  const visibleRange = useMemo(() => {
    const year = currentCursorDate.getFullYear()
    const month = currentCursorDate.getMonth()

    if (viewMode === 'month') {
      // First day of month
      const firstDay = new Date(year, month, 1)
      // Last day of month
      const lastDay = new Date(year, month + 1, 0)
      return {
        from: formatYmd(firstDay),
        to: formatYmd(lastDay),
      }
    } else if (viewMode === 'week') {
      // Start of week (Monday)
      const d = new Date(currentCursorDate)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
      const monday = new Date(d.setDate(diff))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return {
        from: formatYmd(monday),
        to: formatYmd(sunday),
      }
    } else {
      const dayStr = formatYmd(currentCursorDate)
      return {
        from: dayStr,
        to: dayStr,
      }
    }
  }, [currentCursorDate, viewMode])

  // Fetch backend daily logs range
  const fetchRangeData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await calendarService.getDailyLogsRange(visibleRange.from, visibleRange.to)
      const map = new Map<string, DailyLogResponse>()
      data.forEach((log) => {
        if (log.logDate) {
          map.set(log.logDate, log)
        }
      })
      setLogsMap(map)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load calendar nutrition records.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [visibleRange.from, visibleRange.to])

  useEffect(() => {
    fetchRangeData()
  }, [fetchRangeData])

  // Navigation: Period Step (month/week/day)
  const handlePrev = () => {
    if (viewMode === 'month') {
      const next = new Date(currentCursorDate)
      next.setMonth(next.getMonth() - 1)
      setCurrentCursorDate(next)
    } else if (viewMode === 'week') {
      const next = new Date(currentCursorDate)
      next.setDate(next.getDate() - 7)
      setCurrentCursorDate(next)
    } else {
      handleDayStep(-1)
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      const next = new Date(currentCursorDate)
      next.setMonth(next.getMonth() + 1)
      setCurrentCursorDate(next)
    } else if (viewMode === 'week') {
      const next = new Date(currentCursorDate)
      next.setDate(next.getDate() + 7)
      setCurrentCursorDate(next)
    } else {
      handleDayStep(1)
    }
  }

  // Day-by-day navigation
  const handleDayStep = (delta: number) => {
    const nextDate = addDaysToYmd(selectedDate, delta)
    setSelectedDate(nextDate)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('date', nextDate)
      return next
    })
    const [y, m, d] = nextDate.split('-').map(Number)
    setCurrentCursorDate(new Date(y, m - 1, d))
  }

  const handleToday = () => {
    const todayStr = getTodayYmd(settings?.timezone)
    const [y, m, d] = todayStr.split('-').map(Number)
    setCurrentCursorDate(new Date(y, m - 1, d))
    setSelectedDate(todayStr)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('date', todayStr)
      return next
    })
  }

  const handleSelectDate = (dateYmd: string) => {
    if (!dateYmd || dateYmd === selectedDate) return
    setSelectedDate(dateYmd)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('date', dateYmd)
      return next
    })
  }

  // Selected date log detail
  const selectedLog = logsMap.get(selectedDate)

  // Title for current header
  const headerTitle = useMemo(() => {
    if (viewMode === 'month') {
      return currentCursorDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    } else if (viewMode === 'week') {
      const fromDate = new Date(visibleRange.from + 'T00:00:00')
      const toDate = new Date(visibleRange.to + 'T00:00:00')
      return `${fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentCursorDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }, [currentCursorDate, viewMode, visibleRange])

  // Days array for month grid
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return []
    const year = currentCursorDate.getFullYear()
    const month = currentCursorDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const totalDays = lastDay.getDate()

    // Day of week for first day (0 = Sunday, 1 = Monday, ... 6 = Saturday)
    // Convert to Monday = 0
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6

    const days: Array<{ ymd: string; dayNum: number; isCurrentMonth: boolean }> = []

    // Padding before 1st of month
    for (let i = startDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i)
      days.push({
        ymd: formatYmd(prevDate),
        dayNum: prevDate.getDate(),
        isCurrentMonth: false,
      })
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const currentDate = new Date(year, month, d)
      days.push({
        ymd: formatYmd(currentDate),
        dayNum: d,
        isCurrentMonth: true,
      })
    }

    // Fill trailing days to complete last week
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({
        ymd: formatYmd(nextDate),
        dayNum: nextDate.getDate(),
        isCurrentMonth: false,
      })
    }

    return days
  }, [currentCursorDate, viewMode])

  // Days array for week view
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return []
    const days: string[] = []
    const start = new Date(visibleRange.from + 'T00:00:00')
    for (let i = 0; i < 7; i++) {
      const cur = new Date(start)
      cur.setDate(start.getDate() + i)
      days.push(formatYmd(cur))
    }
    return days
  }, [visibleRange, viewMode])

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* ─── CALENDAR HEADER & CONTROLS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Nutrition Calendar
            </h1>
            <Badge variant="green">Live History</Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Review past daily logs, protein completion, calories, and historical meal records.
          </p>
        </div>

        {/* View Mode & Period Switchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Previous, Today, Next Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              aria-label={viewMode === 'month' ? 'Previous month' : viewMode === 'week' ? 'Previous week' : 'Previous day'}
              title={viewMode === 'month' ? 'Previous month' : viewMode === 'week' ? 'Previous week' : 'Previous day'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-xs font-semibold px-3"
            >
              Today
            </Button>

            <button
              type="button"
              onClick={handleNext}
              aria-label={viewMode === 'month' ? 'Next month' : viewMode === 'week' ? 'Next week' : 'Next day'}
              title={viewMode === 'month' ? 'Next month' : viewMode === 'week' ? 'Next week' : 'Next day'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/history')}
              className="text-xs font-semibold px-3 ml-1"
            >
              Timeline History
            </Button>
          </div>
        </div>
      </div>

      {/* Period Headline */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>{headerTitle}</span>
        </h2>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            <span>Fetching log data...</span>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 text-xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRangeData}>
            Retry
          </Button>
        </div>
      )}

      {/* ─── MAIN CALENDAR DISPLAY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar Grid / Views (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          {viewMode === 'month' && (
            <Card variant="elevated" padding="none" className="overflow-hidden">
              {/* Day Name Header Row (Mon - Sun) */}
              <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-center py-2.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName) => (
                  <span
                    key={dayName}
                    className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                  >
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 gap-px bg-slate-200/60 dark:bg-slate-800/60">
                {monthDays.map(({ ymd, dayNum, isCurrentMonth }) => {
                  const log = logsMap.get(ymd)
                  const hasData = !!log
                  const isToday = ymd === todayYmd
                  const isSelected = ymd === selectedDate
                  const protein = log?.consumedProteinG ?? 0
                  const proteinGoal = log?.proteinGoalG ?? settings?.proteinGoalG ?? 140
                  const isGoalMet = hasData && protein >= proteinGoal

                  return (
                    <button
                      key={ymd}
                      type="button"
                      onClick={() => handleSelectDate(ymd)}
                      className={`min-h-[92px] sm:min-h-[105px] p-2 flex flex-col justify-between text-left transition-colors relative cursor-pointer ${
                        !isCurrentMonth
                          ? 'bg-slate-50/40 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600'
                          : isSelected
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500 z-10'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {/* Cell Header: Day Number & Today indicator */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                              : isSelected
                              ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                              : ''
                          }`}
                        >
                          {dayNum}
                        </span>

                        {isGoalMet && (
                          <span
                            title="Protein goal achieved"
                            className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                          />
                        )}
                      </div>

                      {/* Cell Body: Nutrition summary pills */}
                      <div className="mt-1 space-y-1 w-full">
                        {hasData ? (
                          <>
                            {/* Protein pill */}
                            <div
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex items-center justify-between truncate ${
                                isGoalMet
                                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="truncate">{Math.round(protein)}g P</span>
                              <span className="text-[9px] opacity-75">
                                {Math.round(log.proteinCompletionPercentage || 0)}%
                              </span>
                            </div>

                            {/* Calories indicator if available */}
                            {log.consumedCaloriesKcal > 0 && (
                              <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                <Flame className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                <span className="truncate">{Math.round(log.consumedCaloriesKcal)} kcal</span>
                              </div>
                            )}
                          </>
                        ) : (
                          // Explicit distinction: No recorded data
                          <div className="text-[10px] text-slate-300 dark:text-slate-700 italic select-none py-1">
                            —
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {weekDays.map((ymd) => {
                const log = logsMap.get(ymd)
                const hasData = !!log
                const dateObj = new Date(ymd + 'T00:00:00')
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                const dayNum = dateObj.getDate()
                const isToday = ymd === todayYmd
                const isSelected = ymd === selectedDate
                const protein = log?.consumedProteinG ?? 0
                const proteinGoal = log?.proteinGoalG ?? settings?.proteinGoalG ?? 140
                const isGoalMet = hasData && protein >= proteinGoal

                return (
                  <button
                    key={ymd}
                    type="button"
                    onClick={() => handleSelectDate(ymd)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between min-h-[170px] transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {dayName}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-lg font-bold ${
                            isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Today
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 w-full">
                      {hasData ? (
                        <>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">Protein</span>
                            <span className={isGoalMet ? 'text-emerald-600 font-bold' : ''}>
                              {Math.round(protein)}g
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isGoalMet ? 'bg-emerald-500' : 'bg-emerald-600'}`}
                              style={{
                                width: `${Math.min(100, Math.round((protein / proteinGoal) * 100))}%`,
                              }}
                            />
                          </div>

                          {log.consumedCaloriesKcal > 0 && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-500" />
                              <span>{Math.round(log.consumedCaloriesKcal)} kcal</span>
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No entries</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Day View */}
          {viewMode === 'day' && (
            <Card variant="elevated" padding="lg" className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {currentCursorDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Full day timeline and logged nutrition entries.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/dashboard?date=${formatYmd(currentCursorDate)}`)}
                  leftIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                >
                  Day Dashboard
                </Button>
              </div>

              {selectedLog && selectedLog.foodEntries?.length > 0 ? (
                <div className="space-y-3">
                  {selectedLog.foodEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {entry.mealType.slice(0, 3)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {entry.foodName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {entry.quantity} {entry.quantityUnit}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {entry.proteinG}g P
                        </span>
                        {entry.caloriesKcal && (
                          <p className="text-[11px] text-slate-400">{entry.caloriesKcal} kcal</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No meals logged for this day
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      Start building your nutrition habit by logging food entries for this date.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/log?date=${formatYmd(currentCursorDate)}`)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Log Food
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column: Selected Date Nutrition Breakdown (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <Card variant="elevated" padding="lg" className="space-y-5">
            {/* Selected Date Header with Day-by-Day Navigation */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Selected Date Details
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {formatReadableDate(selectedDate)}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDayStep(-1)}
                  aria-label="Previous day"
                  title="Previous day"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {selectedDate === todayYmd ? (
                  <Badge variant="blue">Today</Badge>
                ) : (
                  <button
                    type="button"
                    onClick={handleToday}
                    aria-label="Return to Today"
                    title="Return to Today"
                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDayStep(1)}
                  aria-label="Next day"
                  title="Next day"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selected Day Status */}
            {selectedLog ? (
              <div className="space-y-4">
                {/* Protein Goal Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white space-y-2 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>Protein Target</span>
                    <span>
                      {selectedLog.consumedProteinG}g / {selectedLog.proteinGoalG}g
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Number(selectedLog.proteinCompletionPercentage) || 0)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-1">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {selectedLog.proteinCompletionPercentage}% Met
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      {selectedLog.proteinRemainingG}g remaining
                    </span>
                  </div>
                </div>

                {/* Macro summary grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                      <Flame className="w-3.5 h-3.5" />
                      <span>Calories</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                      {Math.round(selectedLog.consumedCaloriesKcal)} <span className="text-xs font-normal text-slate-500">kcal</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-teal-500 font-bold">
                      <Droplet className="w-3.5 h-3.5" />
                      <span>Hydration</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                      {selectedLog.consumedWaterMl ?? 0} <span className="text-xs font-normal text-slate-500">ml</span>
                    </p>
                  </div>
                </div>

                {/* Meal entries count */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Food Entries Logged
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedLog.foodEntries?.length || 0}
                  </span>
                </div>

                {/* Quick actions to navigate */}
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate(`/dashboard?date=${selectedDate}`)}
                    leftIcon={<ArrowUpRight className="w-4 h-4" />}
                  >
                    Open in Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => navigate(`/log?date=${selectedDate}`)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Log Food for this Day
                  </Button>
                </div>
              </div>
            ) : (
              // Empty State for unrecorded day
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No Recorded Nutrition Data
                  </h4>
                  <p className="text-xs text-slate-500 max-w-[220px] mx-auto mt-1 leading-relaxed">
                    No food logs exist for this date in your persistent database history.
                  </p>
                </div>
                <div className="pt-2 space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate(`/log?date=${selectedDate}`)}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Log Food for Date
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => navigate(`/dashboard?date=${selectedDate}`)}
                    leftIcon={<ArrowUpRight className="w-4 h-4" />}
                  >
                    Inspect in Dashboard
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
