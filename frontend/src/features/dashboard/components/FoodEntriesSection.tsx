import { Link } from 'react-router-dom'
import { UtensilsCrossed, Plus, Clock, Sparkles } from 'lucide-react'
import type { FoodEntryResponse, MealType } from '../../../types/api'
import { Button } from '../../../components/ui/Button'

interface FoodEntriesSectionProps {
  entries: FoodEntryResponse[]
  selectedDate: string
  timezone?: string
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
}

export function FoodEntriesSection({
  entries,
  selectedDate = new Date().toISOString().split('T')[0],
  timezone = 'UTC',
}: FoodEntriesSectionProps) {
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return null
    try {
      const d = new Date(isoString)
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone || undefined,
      }).format(d)
    } catch {
      return null
    }
  }

  return (
    <section
      aria-labelledby="food-entries-heading"
      className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xs shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <h2
              id="food-entries-heading"
              className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100"
            >
              Today’s Meals & Food Entries
            </h2>
            {entries.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                {entries.length} {entries.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Chronological log of verified foods and meals recorded today.
          </p>
        </div>

        <Link to={`/log?date=${selectedDate}`}>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Add Food Entry
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {entries.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200/50 dark:border-emerald-500/20">
            <UtensilsCrossed className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
            No food entries recorded for this day
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Log your breakfast, lunch, dinner, or snacks to track real-time progress toward your
            daily protein and calorie goals.
          </p>
          <div className="mt-5">
            <Link to={`/log?date=${selectedDate}`}>
              <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Record First Meal
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Populated Entries List */
        <ul className="divide-y divide-slate-100 dark:divide-slate-800/80 -my-2" role="list">
          {entries.map((entry) => {
            const timeStr = formatTime(entry.consumedAt)
            return (
              <li
                key={entry.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-3 -mx-3 rounded-xl transition-colors"
              >
                <div className="min-w-0 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {entry.foodName}
                      </p>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {MEAL_TYPE_LABELS[entry.mealType] || entry.mealType}
                      </span>
                      {entry.nutritionSource === 'AI_GEMINI_MULTIMODAL' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {entry.quantity} {entry.quantityUnit}
                      </span>
                      {entry.category && <span>· {entry.category}</span>}
                      {timeStr && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {timeStr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Macro values for this entry */}
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {entry.proteinG}g
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      Protein
                    </span>
                  </div>

                  {entry.caloriesKcal != null && (
                    <div className="pl-3 border-l border-slate-200 dark:border-slate-800">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {entry.caloriesKcal}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                        kcal
                      </span>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
