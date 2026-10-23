import { useState, useId } from 'react'
import {
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Calendar,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Info,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { foodLogService } from '../services/foodLogService'
import type { MealType, AiFoodItemDto, CreateFoodEntryRequest } from '../../../types/api'

export interface EditableDraftItem {
  id: string
  foodName: string
  mealType: MealType
  quantity: string
  quantityUnit: string
  proteinG: string
  caloriesKcal: string
  carbohydratesG: string
  fatG: string
  notes?: string | null
}

interface NutritionReviewDraftProps {
  estimateId?: string | null
  initialItems: AiFoodItemDto[]
  defaultDate: string
  defaultMealType?: MealType
  sourceLabel?: string
  onSaveSuccess: () => void
  onCancel: () => void
}

export function NutritionReviewDraft({
  estimateId,
  initialItems,
  defaultDate,
  defaultMealType = 'LUNCH',
  sourceLabel = 'AI Estimate',
  onSaveSuccess,
  onCancel,
}: NutritionReviewDraftProps) {
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [selectedMealType, setSelectedMealType] = useState<MealType>(
    initialItems.length > 0 && initialItems[0].mealType ? initialItems[0].mealType : defaultMealType
  )

  const [items, setItems] = useState<EditableDraftItem[]>(() =>
    initialItems.map((item, idx) => ({
      id: `item-${idx}-${Date.now()}`,
      foodName: item.foodName || 'Food Item',
      mealType: item.mealType || defaultMealType,
      quantity: item.quantity != null ? String(item.quantity) : '1',
      quantityUnit: item.quantityUnit || 'serving',
      proteinG: item.proteinG != null ? String(item.proteinG) : '0',
      caloriesKcal: item.caloriesKcal != null ? String(item.caloriesKcal) : '',
      carbohydratesG: item.carbohydratesG != null ? String(item.carbohydratesG) : '',
      fatG: item.fatG != null ? String(item.fatG) : '',
      notes: item.notes || null,
    }))
  )

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Unique IDs for accessibility
  const dateInputId = useId()

  const handleItemChange = (id: string, field: keyof EditableDraftItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[`${id}-${field}`]
      return next
    })
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAddItem = () => {
    const newItem: EditableDraftItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      foodName: '',
      mealType: selectedMealType,
      quantity: '100',
      quantityUnit: 'g',
      proteinG: '0',
      caloriesKcal: '',
      carbohydratesG: '',
      fatG: '',
      notes: null,
    }
    setItems((prev) => [...prev, newItem])
  }

  // Calculate live meal totals
  const totals = items.reduce(
    (acc, it) => {
      const p = parseFloat(it.proteinG)
      const c = parseFloat(it.caloriesKcal)
      const cb = parseFloat(it.carbohydratesG)
      const f = parseFloat(it.fatG)

      return {
        protein: acc.protein + (isNaN(p) || p < 0 ? 0 : p),
        calories: acc.calories + (isNaN(c) || c < 0 ? 0 : c),
        carbs: acc.carbs + (isNaN(cb) || cb < 0 ? 0 : cb),
        fat: acc.fat + (isNaN(f) || f < 0 ? 0 : f),
      }
    },
    { protein: 0, calories: 0, carbs: 0, fat: 0 }
  )

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (items.length === 0) {
      setErrorMessage('Please include at least one food item in the meal.')
      return false
    }

    if (!selectedDate || !selectedDate.trim()) {
      setErrorMessage('Please select a valid date for logging.')
      return false
    }

    items.forEach((item, index) => {
      if (!item.foodName.trim()) {
        errors[`${item.id}-foodName`] = `Item #${index + 1} requires a food name`
      }

      const q = parseFloat(item.quantity)
      if (isNaN(q) || q <= 0) {
        errors[`${item.id}-quantity`] = `Quantity must be greater than 0`
      }

      if (!item.quantityUnit.trim()) {
        errors[`${item.id}-quantityUnit`] = `Serving unit is required`
      }

      const p = parseFloat(item.proteinG)
      if (isNaN(p) || p < 0) {
        errors[`${item.id}-proteinG`] = `Protein must be non-negative`
      }

      if (item.caloriesKcal.trim() !== '') {
        const cal = parseFloat(item.caloriesKcal)
        if (isNaN(cal) || cal < 0) {
          errors[`${item.id}-caloriesKcal`] = `Calories must be non-negative`
        }
      }

      if (item.carbohydratesG.trim() !== '') {
        const cb = parseFloat(item.carbohydratesG)
        if (isNaN(cb) || cb < 0) {
          errors[`${item.id}-carbohydratesG`] = `Carbs must be non-negative`
        }
      }

      if (item.fatG.trim() !== '') {
        const ft = parseFloat(item.fatG)
        if (isNaN(ft) || ft < 0) {
          errors[`${item.id}-fatG`] = `Fat must be non-negative`
        }
      }
    })

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setErrorMessage('Please correct the highlighted fields before saving.')
      return false
    }

    setErrorMessage(null)
    return true
  }

  const handleConfirmSave = async () => {
    if (!validate() || isSaving) return

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const nowIso = new Date().toISOString()
      const requests: CreateFoodEntryRequest[] = items.map((item) => ({
        foodName: item.foodName.trim(),
        mealType: selectedMealType,
        quantity: parseFloat(item.quantity),
        quantityUnit: item.quantityUnit.trim(),
        proteinG: parseFloat(item.proteinG),
        caloriesKcal: item.caloriesKcal.trim() !== '' ? parseFloat(item.caloriesKcal) : null,
        carbohydratesG: item.carbohydratesG.trim() !== '' ? parseFloat(item.carbohydratesG) : null,
        fatG: item.fatG.trim() !== '' ? parseFloat(item.fatG) : null,
        nutritionSource: 'AI_CONFIRMED',
        notes: item.notes ? item.notes.trim() : `Reviewed from ${sourceLabel}`,
        consumedAt: nowIso,
        aiEstimateId: estimateId || null,
      }))

      await foodLogService.addBatchFoodEntries(selectedDate, requests)
      onSaveSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save confirmed food items.'
      setErrorMessage(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const mealOptions: { type: MealType; label: string; icon: typeof Coffee }[] = [
    { type: 'BREAKFAST', label: 'Breakfast', icon: Coffee },
    { type: 'LUNCH', label: 'Lunch', icon: Sun },
    { type: 'DINNER', label: 'Dinner', icon: Moon },
    { type: 'SNACK', label: 'Snack', icon: Cookie },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── REVIEW BANNER ─── */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                AI-estimated nutrition — review before saving
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-800/80 text-emerald-800 dark:text-emerald-200">
                Draft
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              Verify portion sizes and nutritional values below. You can adjust numbers, add missing ingredients, or remove items. Nothing is saved until you click Confirm.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ─── MEAL SETTINGS: DATE & CATEGORY ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
        {/* Meal Category */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Meal Category
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {mealOptions.map((opt) => {
              const Icon = opt.icon
              const isSelected = selectedMealType === opt.type
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedMealType(opt.type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label
            htmlFor={dateInputId}
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
          >
            Logging Date
          </label>
          <div className="relative">
            <input
              id={dateInputId}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Records will be linked to your daily nutrition log for this date.
          </p>
        </div>
      </div>

      {/* ─── LIVE ESTIMATED TOTALS ─── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Estimated Meal Totals
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {items.length} {items.length === 1 ? 'item' : 'items'} in draft
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 dark:text-emerald-300">
              Protein
            </span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {totals.protein.toFixed(1)}g
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 dark:text-amber-300">
              Calories
            </span>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">
              {Math.round(totals.calories)} kcal
            </div>
          </div>
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-800 dark:text-sky-300">
              Carbs
            </span>
            <div className="text-lg font-black text-sky-600 dark:text-sky-400">
              {totals.carbs.toFixed(1)}g
            </div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-800 dark:text-indigo-300">
              Fat
            </span>
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {totals.fat.toFixed(1)}g
            </div>
          </div>
        </div>
      </div>

      {/* ─── EDITABLE ITEMS LIST ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Identified Foods ({items.length})
          </h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Food</span>
          </button>
        </div>

        {items.map((item, idx) => {
          const nameError = fieldErrors[`${item.id}-foodName`]
          const qtyError = fieldErrors[`${item.id}-quantity`]
          const proteinError = fieldErrors[`${item.id}-proteinG`]

          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              {/* Row 1: Food Name + Remove */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.foodName}
                      onChange={(e) => handleItemChange(item.id, 'foodName', e.target.value)}
                      placeholder="e.g. Boiled Eggs"
                      className={`w-full px-3 py-1.5 rounded-xl text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border ${
                        nameError
                          ? 'border-rose-400 dark:border-rose-600'
                          : 'border-slate-200 dark:border-slate-700'
                      } focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20`}
                    />
                  </div>
                  {nameError && (
                    <p className="mt-1 ml-7 text-[11px] text-rose-500">{nameError}</p>
                  )}
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label={`Remove ${item.foodName || 'item'}`}
                    className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Row 2: Quantity & Unit */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Serving Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border ${
                      qtyError
                        ? 'border-rose-400 dark:border-rose-600'
                        : 'border-slate-200 dark:border-slate-700'
                    } focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20`}
                  />
                  {qtyError && (
                    <p className="mt-1 text-[11px] text-rose-500">{qtyError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={item.quantityUnit}
                    onChange={(e) => handleItemChange(item.id, 'quantityUnit', e.target.value)}
                    placeholder="g, cup, piece, oz"
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Row 3: Macronutrients Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                    Protein (g) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.proteinG}
                    onChange={(e) => handleItemChange(item.id, 'proteinG', e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 border ${
                      proteinError
                        ? 'border-rose-400 dark:border-rose-600'
                        : 'border-emerald-200/80 dark:border-emerald-800/60'
                    } focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20`}
                  />
                  {proteinError && (
                    <p className="mt-1 text-[10px] text-rose-500">{proteinError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={item.caloriesKcal}
                    onChange={(e) => handleItemChange(item.id, 'caloriesKcal', e.target.value)}
                    placeholder="optional"
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.carbohydratesG}
                    onChange={(e) => handleItemChange(item.id, 'carbohydratesG', e.target.value)}
                    placeholder="optional"
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.fatG}
                    onChange={(e) => handleItemChange(item.id, 'fatG', e.target.value)}
                    placeholder="optional"
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Notes or Assumption callout */}
              {item.notes && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-lg">
                  <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{item.notes}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── ACTION BUTTONS ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          Cancel Draft
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleConfirmSave}
          disabled={isSaving || items.length === 0}
          className="w-full sm:w-auto shadow-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Saving to Log...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Confirm & Save {items.length} {items.length === 1 ? 'Food' : 'Foods'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
