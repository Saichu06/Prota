import { useState } from 'react'
import type { AnalyticsDailyPoint } from '../../../types/api'

interface HydrationChartProps {
  data: AnalyticsDailyPoint[]
}

export function HydrationChart({ data }: HydrationChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxWater = Math.max(...data.map((d) => d.waterMl || 0), 2500)
  const scaleMax = maxWater * 1.15 || 3000

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-blue-500" />
          <span>Hydration (ml)</span>
        </div>
        <span className="text-[11px]">Max: {Math.round(scaleMax).toLocaleString()} ml</span>
      </div>

      <div className="relative pt-4 pb-2">
        <div className="w-full flex items-end justify-between gap-1 sm:gap-2 h-[180px] px-2 border-b border-slate-200 dark:border-slate-800">
          {data.map((point, idx) => {
            const hasWater = point.waterMl != null && point.waterMl > 0
            const heightPct = hasWater ? Math.min(100, ((point.waterMl || 0) / scaleMax) * 100) : 0
            const isHovered = hoveredIndex === idx

            return (
              <div
                key={point.date}
                className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {hasWater ? (
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg bg-blue-500/80 group-hover:bg-blue-400 transition-all duration-300 ${
                      isHovered ? 'ring-2 ring-blue-400' : ''
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  <div className="w-full max-w-[28px] h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                )}

                {isHovered && (
                  <div className="absolute bottom-[calc(100%+8px)] z-30 min-w-[130px] p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-700 pointer-events-none animate-in fade-in-50 zoom-in-95 duration-100">
                    <div className="font-bold text-slate-200">{point.date}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-slate-400">Intake:</span>
                      <span className="font-bold text-blue-400">
                        {hasWater ? `${point.waterMl?.toLocaleString()} ml` : 'No data'}
                      </span>
                    </div>
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
