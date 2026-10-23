import { useState } from 'react'
import type { AnalyticsDailyPoint } from '../../../types/api'

interface ProteinAdherenceChartProps {
  data: AnalyticsDailyPoint[]
}

export function ProteinAdherenceChart({ data }: ProteinAdherenceChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        No daily records available for this period.
      </div>
    )
  }

  // Find max value for scaling (at least 150g or highest intake)
  const maxGoal = Math.max(...data.map((d) => d.proteinGoalG || 0), 140)
  const maxConsumed = Math.max(...data.map((d) => d.proteinG || 0), 0)
  const scaleMax = Math.max(maxGoal, maxConsumed) * 1.15 || 160

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span>Consumed Protein</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-700 dark:border-emerald-400" />
            <span>Target Goal</span>
          </div>
        </div>
        <span className="text-[11px]">Max: {Math.round(scaleMax)}g</span>
      </div>

      <div className="relative pt-4 pb-2">
        {/* SVG Chart */}
        <div className="w-full flex items-end justify-between gap-1 sm:gap-2 h-[180px] px-2 border-b border-slate-200 dark:border-slate-800">
          {data.map((point, idx) => {
            const hasIntake = point.proteinG != null && point.proteinG > 0
            const heightPct = hasIntake ? Math.min(100, ((point.proteinG || 0) / scaleMax) * 100) : 0
            const goalPct = Math.min(100, (point.proteinGoalG / scaleMax) * 100)
            const isHovered = hoveredIndex === idx
            const isGoalMet = hasIntake && (point.proteinG || 0) >= point.proteinGoalG

            return (
              <div
                key={point.date}
                className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Goal reference tick */}
                <div
                  className="absolute w-full border-t border-dashed border-emerald-600/70 dark:border-emerald-400/80 pointer-events-none z-10"
                  style={{ bottom: `${goalPct}%` }}
                />

                {/* Protein Bar */}
                {hasIntake ? (
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                      isGoalMet
                        ? 'bg-emerald-500 group-hover:bg-emerald-400'
                        : 'bg-emerald-300 dark:bg-emerald-700/80 group-hover:bg-emerald-400'
                    } ${isHovered ? 'ring-2 ring-emerald-400' : ''}`}
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
                      <span className="text-slate-400">Consumed:</span>
                      <span className="font-bold text-emerald-400">
                        {hasIntake ? `${point.proteinG}g` : 'No data'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Goal:</span>
                      <span className="font-bold text-slate-300">{point.proteinGoalG}g</span>
                    </div>
                    {hasIntake && (
                      <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-right font-semibold">
                        {isGoalMet ? '✓ Target Met' : `${((point.proteinGoalG - (point.proteinG || 0))).toFixed(1)}g below`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* X-axis date labels */}
        <div className="flex justify-between text-[10px] text-slate-400 px-2 mt-2">
          <span>{data[0]?.date}</span>
          {data.length > 5 && <span>{data[Math.floor(data.length / 2)]?.date}</span>}
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  )
}
