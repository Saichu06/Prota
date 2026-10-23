import { Flame, Droplet, Dumbbell, Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { VerifiedMetricsDto, DataCoverageDto } from '../../../types/api'

interface ProgressOverviewCardProps {
  metrics: VerifiedMetricsDto
  coverage: DataCoverageDto
}

export function ProgressOverviewCard({ metrics, coverage }: ProgressOverviewCardProps) {
  const { protein, calories, hydration, weight } = metrics

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
      case 'INCREASING':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
      case 'DECLINING':
      case 'DECREASING':
        return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
      case 'STABLE':
      case 'BALANCED':
        return <Minus className="w-3.5 h-3.5 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Protein Card */}
      <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Dumbbell className="w-5 h-5" />
          </div>
          {protein.trendDirection && protein.trendDirection !== 'INSUFFICIENT_DATA' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {renderTrendIcon(protein.trendDirection)}
              {protein.trendDirection}
            </span>
          )}
        </div>

        <div className="mt-4">
          <span className="text-xs font-medium text-slate-500">Average Protein</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {protein.averageIntakeG != null ? `${protein.averageIntakeG}g` : '—'}
            </span>
            <span className="text-xs text-slate-500">/ {protein.baselineGoalG}g goal</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Adherence:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {protein.goalAdherencePercentage != null ? `${protein.goalAdherencePercentage}%` : 'No food data'}
            {protein.daysMeetingGoal > 0 && (
              <span className="text-[11px] text-slate-500 font-normal ml-1">
                ({protein.daysMeetingGoal}/{coverage.foodTrackedDays} days)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 2. Calories Card */}
      <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          {calories.trendDirection && calories.trendDirection !== 'INSUFFICIENT_DATA' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {renderTrendIcon(calories.trendDirection)}
              {calories.trendDirection}
            </span>
          )}
        </div>

        <div className="mt-4">
          <span className="text-xs font-medium text-slate-500">Average Energy</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {calories.averageIntakeKcal != null ? `${calories.averageIntakeKcal.toLocaleString()}` : '—'}
            </span>
            <span className="text-xs text-slate-500">
              {calories.baselineGoalKcal ? `/ ${calories.baselineGoalKcal.toLocaleString()} kcal` : 'kcal'}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>On Target Days:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {calories.daysOnTarget} of {coverage.foodTrackedDays} days
          </span>
        </div>
      </div>

      {/* 3. Hydration Card */}
      <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            hydration.status === 'OPTIMAL'
              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {hydration.status === 'OPTIMAL' ? 'Optimal' : hydration.status === 'DEFICIT' ? 'Below Goal' : 'Sparse'}
          </span>
        </div>

        <div className="mt-4">
          <span className="text-xs font-medium text-slate-500">Average Hydration</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {hydration.averageWaterMl != null ? `${hydration.averageWaterMl.toLocaleString()} ml` : '—'}
            </span>
            <span className="text-xs text-slate-500">/ {hydration.baselineGoalMl.toLocaleString()} ml</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Tracked Days:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {hydration.daysTracked} days
          </span>
        </div>
      </div>

      {/* 4. Weight Card */}
      <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          {weight.hasSufficientMeasurements && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {renderTrendIcon(weight.trendDirection)}
              {weight.trendDirection}
            </span>
          )}
        </div>

        <div className="mt-4">
          <span className="text-xs font-medium text-slate-500">Weight Trend</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            {weight.hasSufficientMeasurements && weight.weightChange != null ? (
              <>
                <span className={`text-2xl font-bold ${
                  weight.weightChange < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : weight.weightChange > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {weight.weightChange > 0 ? `+${weight.weightChange}` : weight.weightChange} {weight.weightUnit}
                </span>
                <span className="text-xs text-slate-500">delta</span>
              </>
            ) : weight.measurementCount === 1 ? (
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {weight.latestWeight} {weight.weightUnit}
                <span className="text-xs font-normal text-slate-500 ml-1.5">(1 entry)</span>
              </span>
            ) : (
              <span className="text-sm font-medium text-slate-400">No weigh-ins</span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Measurements:</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {weight.measurementCount} recorded
          </span>
        </div>
      </div>
    </div>
  )
}
