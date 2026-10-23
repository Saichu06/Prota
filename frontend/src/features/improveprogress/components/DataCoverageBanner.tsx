import { AlertCircle, Calendar } from 'lucide-react'
import type { DataCoverageDto } from '../../../types/api'

interface DataCoverageBannerProps {
  coverage: DataCoverageDto
  fromDate: string
  toDate: string
}

export function DataCoverageBanner({ coverage, fromDate, toDate }: DataCoverageBannerProps) {
  const {
    totalCalendarDays,
    foodTrackedDays,
    waterTrackedDays,
    weightRecordedDays,
    trackingConsistencyPercentage,
    hasSufficientData,
    limitationsNote,
  } = coverage

  const getConfidenceLevel = () => {
    if (trackingConsistencyPercentage >= 75) {
      return {
        label: 'High Confidence',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        dotClass: 'bg-emerald-500',
      }
    }
    if (trackingConsistencyPercentage >= 40) {
      return {
        label: 'Moderate Confidence',
        badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        dotClass: 'bg-amber-500',
      }
    }
    return {
      label: 'Limited Coverage',
      badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
      dotClass: 'bg-rose-500',
    }
  }

  const confidence = getConfidenceLevel()

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Summary */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {fromDate} — {toDate}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${confidence.badgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${confidence.dotClass}`} />
              {confidence.label} ({trackingConsistencyPercentage}%)
            </span>

            {!hasSufficientData && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                Sparse Data: At least 2 logged days recommended
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            {limitationsNote}
          </p>
        </div>

        {/* Right: Metrics Badges */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-xs text-slate-600 dark:text-slate-400 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
          <div>
            <span className="block font-bold text-slate-900 dark:text-white text-base">
              {foodTrackedDays} <span className="text-xs font-normal text-slate-500">/ {totalCalendarDays} days</span>
            </span>
            <span className="text-[11px] text-slate-500">Meals Logged</span>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div>
            <span className="block font-bold text-slate-900 dark:text-white text-base">
              {waterTrackedDays} <span className="text-xs font-normal text-slate-500">days</span>
            </span>
            <span className="text-[11px] text-slate-500">Hydration Logged</span>
          </div>

          <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div>
            <span className="block font-bold text-slate-900 dark:text-white text-base">
              {weightRecordedDays} <span className="text-xs font-normal text-slate-500">entries</span>
            </span>
            <span className="text-[11px] text-slate-500">Weigh-ins</span>
          </div>
        </div>
      </div>
    </div>
  )
}
