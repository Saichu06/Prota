import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { addDaysToYmd, getTodayYmd, formatReadableDate } from '../../../lib/date-utils'

interface DashboardDateSelectorProps {
  selectedDate: string // YYYY-MM-DD
  onDateChange: (newDate: string) => void
  timezone?: string
}

export function DashboardDateSelector({
  selectedDate,
  onDateChange,
  timezone = 'UTC',
}: DashboardDateSelectorProps) {
  const todayStr = getTodayYmd(timezone)
  const isToday = selectedDate === todayStr

  const handlePrevDay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDateChange(addDaysToYmd(selectedDate, -1))
  }

  const handleNextDay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDateChange(addDaysToYmd(selectedDate, 1))
  }

  const handleToday = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDateChange(todayStr)
  }

  const readableDate = formatReadableDate(selectedDate)

  return (
    <div
      role="region"
      aria-label="Date navigation controls"
      className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/80 dark:bg-slate-900/60 p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xs shadow-xs"
    >
      <button
        type="button"
        onClick={handlePrevDay}
        aria-label="View previous day"
        title="Previous day"
        className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Date Display and Picker */}
      <div className="relative flex items-center gap-2 px-2">
        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 pointer-events-none" aria-hidden="true" />
        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 min-w-[130px] text-center pointer-events-none">
          {readableDate}
        </span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) onDateChange(e.target.value)
          }}
          aria-label="Select custom date"
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        />
      </div>

      <button
        type="button"
        onClick={handleNextDay}
        aria-label="View next day"
        title="Next day"
        className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>

      {!isToday && (
        <button
          type="button"
          onClick={handleToday}
          className="ml-auto px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
        >
          Today
        </button>
      )}
    </div>
  )
}
