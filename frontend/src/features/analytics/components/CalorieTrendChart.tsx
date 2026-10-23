import { useState } from 'react'
import type { AnalyticsDailyPoint } from '../../../types/api'

interface CalorieTrendChartProps {
  data: AnalyticsDailyPoint[]
}

export function CalorieTrendChart({ data }: CalorieTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        No daily records available for this period.
      </div>
    )
  }

  const maxGoal = Math.max(...data.map((d) => d.calorieGoalKcal || 0), 2000)
  const maxConsumed = Math.max(...data.map((d) => d.caloriesKcal || 0), 0)
  const scaleMax = Math.max(maxGoal, maxConsumed) * 1.15 || 2500

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500" />
            <span>Calories (kcal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-600 dark:border-amber-400" />
            <span>Calorie Target</span>
          </div>
        </div>
        <span className="text-[11px]">Max: {Math.round(scaleMax)} kcal</span>
      </div>

      <div className="relative pt-4 pb-2">
        <div className="w-full flex items-end justify-between gap-1 sm:gap-2 h-[180px] px-2 border-b border-slate-200 dark:border-slate-800">
          {data.map((point, idx) => {
            const hasIntake = point.caloriesKcal != null && point.caloriesKcal > 0
            const heightPct = hasIntake ? Math.min(100, ((point.caloriesKcal || 0) / scaleMax) * 100) : 0
            const goalPct = point.calorieGoalKcal ? Math.min(100, (point.calorieGoalKcal / scaleMax) * 100) : null
            const isHovered = hoveredIndex === idx

            return (
              <div
                key={point.date}
                className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Goal reference tick */}
                {goalPct != null && (
                  <div
                    className="absolute w-full border-t border-dashed border-amber-600/60 dark:border-amber-400/70 pointer-events-none z-10"
                    style={{ bottom: `${goalPct}%` }}
                  />
                )}

                {/* Calorie Bar */}
                {hasIntake ? (
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg bg-amber-500/80 group-hover:bg-amber-400 transition-all duration-300 ${
                      isHovered ? 'ring-2 ring-amber-400' : ''
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  <div className="w-full max-w-[28px] h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                )}

                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-[calc(100%+8px)] z-30 min-w-[140px] p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-700 pointer-events-none animate-in fade-in-50 zoom-in-95 duration-100">
                    <div className="font-bold text-slate-200">{point.date}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-slate-400">Calories:</span>
                      <span className="font-bold text-amber-400">
                        {hasIntake ? `${Math.round(point.caloriesKcal || 0)} kcal` : 'No data'}
                      </span>
                    </div>
                    {point.calorieGoalKcal && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Target:</span>
                        <span className="font-bold text-slate-300">{Math.round(point.calorieGoalKcal)} kcal</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 px-2 mt-2">
          <span>{data[0]?.date}</span>
          {data.length > 5 && <span>{data[Math.floor(data.length / 2)]?.date}</span>}
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  )
}
