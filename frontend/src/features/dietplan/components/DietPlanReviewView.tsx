import { useState } from 'react'
import {
  Sparkles,
  Info,
  Clock,
  ShoppingCart,
  ChefHat,
  Droplet,
  Save,
  RotateCcw,
  X,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type {
  DietPlanDetailDto,
  DietPlanMealDto,
  DietPlanMealFoodDto,
} from '../../../types/api'

interface DietPlanReviewViewProps {
  plan: DietPlanDetailDto
  onSave: (reviewedPlan: DietPlanDetailDto) => Promise<void>
  onRegenerate: () => void
  onCancel: () => void
  isSaving: boolean
  saveError?: string | null
}

export function DietPlanReviewView({
  plan,
  onSave,
  onRegenerate,
  onCancel,
  isSaving,
  saveError,
}: DietPlanReviewViewProps) {
  // Allow editing plan title & meals locally before saving
  const [title, setTitle] = useState<string>(plan.title)
  const [meals, setMeals] = useState<DietPlanMealDto[]>(plan.meals || [])

  // Calculate live daily totals based on potentially edited meals
  const totalCalories = meals.reduce(
    (acc, m) => acc + (m.foods?.reduce((fAcc, f) => fAcc + (f.caloriesKcal || 0), 0) || 0),
    0
  )
  const totalProtein = meals.reduce(
    (acc, m) => acc + (m.foods?.reduce((fAcc, f) => fAcc + (f.proteinG || 0), 0) || 0),
    0
  )
  const totalCarbs = meals.reduce(
    (acc, m) => acc + (m.foods?.reduce((fAcc, f) => fAcc + (f.carbohydratesG || 0), 0) || 0),
    0
  )
  const totalFat = meals.reduce(
    (acc, m) => acc + (m.foods?.reduce((fAcc, f) => fAcc + (f.fatG || 0), 0) || 0),
    0
  )

  const handleUpdateFood = (
    mealIndex: number,
    foodIndex: number,
    field: keyof DietPlanMealFoodDto,
    value: string | number
  ) => {
    setMeals((prevMeals) => {
      const copy = [...prevMeals]
      const meal = { ...copy[mealIndex] }
      const foods = [...meal.foods]
      const food = { ...foods[foodIndex], [field]: value }
      foods[foodIndex] = food
      meal.foods = foods
      // Recalculate meal totals
      meal.totalCaloriesKcal = foods.reduce((acc, f) => acc + (f.caloriesKcal || 0), 0)
      meal.totalProteinG = foods.reduce((acc, f) => acc + (f.proteinG || 0), 0)
      meal.totalCarbohydratesG = foods.reduce((acc, f) => acc + (f.carbohydratesG || 0), 0)
      meal.totalFatG = foods.reduce((acc, f) => acc + (f.fatG || 0), 0)
      copy[mealIndex] = meal
      return copy
    })
  }

  const handleDeleteFood = (mealIndex: number, foodIndex: number) => {
    setMeals((prevMeals) => {
      const copy = [...prevMeals]
      const meal = { ...copy[mealIndex] }
      const foods = meal.foods.filter((_, idx) => idx !== foodIndex)
      meal.foods = foods
      meal.totalCaloriesKcal = foods.reduce((acc, f) => acc + (f.caloriesKcal || 0), 0)
      meal.totalProteinG = foods.reduce((acc, f) => acc + (f.proteinG || 0), 0)
      meal.totalCarbohydratesG = foods.reduce((acc, f) => acc + (f.carbohydratesG || 0), 0)
      meal.totalFatG = foods.reduce((acc, f) => acc + (f.fatG || 0), 0)
      copy[mealIndex] = meal
      return copy
    })
  }

  const handleAddFood = (mealIndex: number) => {
    setMeals((prevMeals) => {
      const copy = [...prevMeals]
      const meal = { ...copy[mealIndex] }
      const newFood: DietPlanMealFoodDto = {
        name: 'New Item',
        quantity: 1,
        quantityUnit: 'serving',
        proteinG: 10,
        caloriesKcal: 150,
        carbohydratesG: 15,
        fatG: 5,
      }
      const foods = [...meal.foods, newFood]
      meal.foods = foods
      meal.totalCaloriesKcal = foods.reduce((acc, f) => acc + (f.caloriesKcal || 0), 0)
      meal.totalProteinG = foods.reduce((acc, f) => acc + (f.proteinG || 0), 0)
      meal.totalCarbohydratesG = foods.reduce((acc, f) => acc + (f.carbohydratesG || 0), 0)
      meal.totalFatG = foods.reduce((acc, f) => acc + (f.fatG || 0), 0)
      copy[mealIndex] = meal
      return copy
    })
  }

  const handleSaveConfirmed = async () => {
    const updatedPlan: DietPlanDetailDto = {
      ...plan,
      title: title.trim() || plan.title,
      dailyCaloriesKcal: Math.round(totalCalories),
      dailyProteinG: Math.round(totalProtein),
      dailyCarbohydratesG: Math.round(totalCarbs),
      dailyFatG: Math.round(totalFat),
      meals,
    }
    await onSave(updatedPlan)
  }

  return (
    <div className="space-y-6">
      {/* ─── MANDATORY REVIEW BANNER ─── */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-bold">
            AI-estimated nutrition — review before saving
          </span>
        </div>
        <span className="text-[11px] font-medium text-amber-700/80 dark:text-amber-300/80 hidden sm:inline">
          Review meal items and targets below. You can adjust values before confirming.
        </span>
      </div>

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ─── PLAN HEADER & DAILY TOTALS ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {plan.goal.replace('_', ' ')}
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-hidden w-full transition-colors mt-0.5"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generated on {plan.creationDate} • Click title or meal inputs to edit
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isSaving}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Regenerate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
              className="text-xs text-slate-500"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveConfirmed}
              disabled={isSaving}
              className="text-xs shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Plan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Daily Macro Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Calories</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {Math.round(totalCalories)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">kcal daily total</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60 text-center">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Protein</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {Math.round(totalProtein)}g
            </span>
            <span className="text-[11px] text-slate-500 font-medium">muscle preservation</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Carbs</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {Math.round(totalCarbs)}g
            </span>
            <span className="text-[11px] text-slate-500 font-medium">energy & glycogen</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Fats</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {Math.round(totalFat)}g
            </span>
            <span className="text-[11px] text-slate-500 font-medium">hormone balance</span>
          </div>
        </div>

        {/* Safety Notes if present */}
        {plan.safetyNotes && plan.safetyNotes.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Safety & Timeline Advisories:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              {plan.safetyNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ─── MEALS SCHEDULE CARDS ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Daily Meal Schedule
          </h2>
          <span className="text-xs text-slate-400">{meals.length} meals planned</span>
        </div>

        {meals.map((meal, mIdx) => (
          <div
            key={mIdx}
            className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
          >
            {/* Meal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                  {mIdx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {meal.mealName}
                  </h3>
                  {meal.timing && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {meal.timing}
                    </span>
                  )}
                </div>
              </div>

              {/* Meal Summary Badges */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                  {Math.round(meal.totalProteinG)}g P
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                  {Math.round(meal.totalCaloriesKcal)} kcal
                </span>
              </div>
            </div>

            {/* Foods Table / Grid */}
            <div className="space-y-2">
              {meal.foods.map((food, fIdx) => (
                <div
                  key={fIdx}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={food.name}
                      onChange={(e) => handleUpdateFood(mIdx, fIdx, 'name', e.target.value)}
                      className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-hidden w-full text-xs"
                    />
                    {food.notes && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{food.notes}</p>
                    )}
                  </div>

                  {/* Quantity & Unit */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      step="0.5"
                      value={food.quantity}
                      onChange={(e) => handleUpdateFood(mIdx, fIdx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white text-center"
                    />
                    <input
                      type="text"
                      value={food.quantityUnit}
                      onChange={(e) => handleUpdateFood(mIdx, fIdx, 'quantityUnit', e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 text-center"
                    />
                  </div>

                  {/* Macros editable pills */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400">P</span>
                      <input
                        type="number"
                        step="0.5"
                        value={food.proteinG}
                        onChange={(e) => handleUpdateFood(mIdx, fIdx, 'proteinG', parseFloat(e.target.value) || 0)}
                        className="w-12 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-transparent text-right focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400">g</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400">Cal</span>
                      <input
                        type="number"
                        value={food.caloriesKcal || 0}
                        onChange={(e) => handleUpdateFood(mIdx, fIdx, 'caloriesKcal', parseFloat(e.target.value) || 0)}
                        className="w-14 text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent text-right focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFood(mIdx, fIdx)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Remove food item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddFood(mIdx)}
              className="text-xs w-full py-1.5 border-dashed text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Food Item
            </Button>
          </div>
        ))}
      </div>

      {/* ─── SUBSTITUTIONS & SHOPPING LIST ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Practical Substitutions */}
        {plan.practicalSubstitutions && plan.practicalSubstitutions.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-emerald-600" />
              Practical Food Substitutions
            </h3>
            <div className="space-y-2">
              {plan.practicalSubstitutions.map((sub, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{sub.originalFood}</span>
                    <span className="text-slate-400">swap with</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sub.alternativeFood}</span>
                  </div>
                  {sub.notes && (
                    <p className="text-[11px] text-slate-400 mt-1">{sub.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorized Shopping List */}
        {plan.shoppingList && plan.shoppingList.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              Categorized Shopping List
            </h3>
            <div className="space-y-3">
              {plan.shoppingList.map((cat, idx) => (
                <div key={idx} className="text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {cat.category}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((it, iIdx) => (
                      <span
                        key={iIdx}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── MEAL PREP & HYDRATION ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plan.mealPrepTips && plan.mealPrepTips.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-emerald-600" />
              Meal Prep Recommendations
            </h3>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
              {plan.mealPrepTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {plan.hydrationGuidance && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-500" />
              Hydration Guidance
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {plan.hydrationGuidance}
            </p>
          </div>
        )}
      </div>

      {/* ─── DISCLAIMER FOOTER ─── */}
      <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>{plan.disclaimer}</p>
      </div>

      {/* Bottom Floating/Sticky Save Action Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white block">
            Ready to save this plan?
          </span>
          <span className="text-[11px] text-slate-400">
            Confirmed plans are saved to your account and can be reviewed anytime.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="text-xs"
          >
            Cancel Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveConfirmed}
            disabled={isSaving}
            className="text-xs shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving to Database...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Confirm & Save Plan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
