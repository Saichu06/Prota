import { useState } from 'react'
import { Dumbbell, Flame, Droplet, Scale, LineChart } from 'lucide-react'
import type { AnalyticsDailyPoint, WeightUnit } from '../../../types/api'
import { ProteinAdherenceChart } from '../../analytics/components/ProteinAdherenceChart'
import { CalorieTrendChart } from '../../analytics/components/CalorieTrendChart'
import { HydrationChart } from '../../analytics/components/HydrationChart'
import { WeightTrendChart } from '../../analytics/components/WeightTrendChart'

interface NutritionTrendsSectionProps {
  dailyTrends: AnalyticsDailyPoint[]
  weightUnit?: WeightUnit
}

type TrendTab = 'protein' | 'calories' | 'hydration' | 'weight'

export function NutritionTrendsSection({ dailyTrends, weightUnit = 'KG' }: NutritionTrendsSectionProps) {
  const [activeTab, setActiveTab] = useState<TrendTab>('protein')

  const hasWeightPoints = dailyTrends.some((d) => d.weightKg != null && d.weightKg > 0)

  const tabs = [
    { id: 'protein', label: 'Protein Adherence', icon: Dumbbell, color: 'text-emerald-500' },
    { id: 'calories', label: 'Calorie Intake', icon: Flame, color: 'text-amber-500' },
    { id: 'hydration', label: 'Hydration', icon: Droplet, color: 'text-sky-500' },
    ...(hasWeightPoints ? [{ id: 'weight', label: 'Weight Progress', icon: Scale, color: 'text-indigo-500' }] : []),
  ] as const

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Nutrition & Weight Trajectory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize your daily intake levels against your personalized goals over time.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TrendTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Chart View */}
      <div className="pt-2">
        {activeTab === 'protein' && (
          <div className="space-y-2">
            <ProteinAdherenceChart data={dailyTrends} />
          </div>
        )}

        {activeTab === 'calories' && (
          <div className="space-y-2">
            <CalorieTrendChart data={dailyTrends} />
          </div>
        )}

        {activeTab === 'hydration' && (
          <div className="space-y-2">
            <HydrationChart data={dailyTrends} />
          </div>
        )}

        {activeTab === 'weight' && (
          <div className="space-y-2">
            <WeightTrendChart data={dailyTrends} weightUnit={weightUnit} />
          </div>
        )}
      </div>
    </div>
  )
}
