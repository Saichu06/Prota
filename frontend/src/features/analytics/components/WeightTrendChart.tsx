import { useState } from 'react'
import type { AnalyticsDailyPoint, WeightUnit } from '../../../types/api'

interface WeightTrendChartProps {
  data: AnalyticsDailyPoint[]
  weightUnit?: WeightUnit
}

export function WeightTrendChart({ data, weightUnit = 'KG' }: WeightTrendChartProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // Filter only points where weight was actually recorded
  const pointsWithWeight = data
    .filter((d) => d.weightKg != null && d.weightKg > 0)
    .map((d) => ({
      date: d.date,
      weight: weightUnit === 'LB' ? (d.weightKg! * 2.20462) : d.weightKg!,
    }))

  if (pointsWithWeight.length < 2) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Insufficient weight records in this time range.
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          Record at least 2 weigh-ins to plot your weight progression curve.
        </p>
      </div>
    )
  }

  const weights = pointsWithWeight.map((p) => p.weight)
  const minWeight = Math.floor(Math.min(...weights) - 1)
  const maxWeight = Math.ceil(Math.max(...weights) + 1)
  const range = maxWeight - minWeight || 1

  const width = 600
  const height = 180
  const paddingX = 40
  const paddingY = 24

  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingY * 2

  // Map each recorded point to an (x, y) coordinate
  const coords = pointsWithWeight.map((p, idx) => {
    const x = paddingX + (idx / (pointsWithWeight.length - 1)) * usableWidth
    const y = height - paddingY - ((p.weight - minWeight) / range) * usableHeight
    return { ...p, x, y }
  })

  // SVG polyline path
  const pathD = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
  }, '')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Recorded Weight ({weightUnit})</span>
        </div>
        <span className="text-[11px]">
          Range: {minWeight} - {maxWeight} {weightUnit}
        </span>
      </div>

      <div className="relative pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[180px] overflow-visible"
        >
          {/* Subtle grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-200 dark:text-slate-800"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* Trend curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#a855f7"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Individual recording points */}
          {coords.map((c) => {
            const isHovered = hoveredDate === c.date
            return (
              <g
                key={c.date}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredDate(c.date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 6 : 4}
                  className="fill-purple-600 dark:fill-purple-400 stroke-white dark:stroke-slate-900 transition-all"
                  strokeWidth="2"
                />

                {isHovered && (
                  <g>
                    <rect
                      x={Math.max(10, Math.min(width - 110, c.x - 50))}
                      y={Math.max(0, c.y - 45)}
                      width="100"
                      height="38"
                      rx="8"
                      className="fill-slate-900 stroke-slate-700"
                    />
                    <text
                      x={Math.max(10, Math.min(width - 110, c.x - 50)) + 50}
                      y={Math.max(0, c.y - 45) + 16}
                      textAnchor="middle"
                      className="fill-slate-300 text-[10px] font-medium"
                    >
                      {c.date}
                    </text>
                    <text
                      x={Math.max(10, Math.min(width - 110, c.x - 50)) + 50}
                      y={Math.max(0, c.y - 45) + 30}
                      textAnchor="middle"
                      className="fill-purple-400 text-xs font-bold"
                    >
                      {c.weight.toFixed(1)} {weightUnit}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        <div className="flex justify-between text-[10px] text-slate-400 px-4 mt-1">
          <span>{pointsWithWeight[0].date}</span>
          <span>{pointsWithWeight[pointsWithWeight.length - 1].date}</span>
        </div>
      </div>
    </div>
  )
}
