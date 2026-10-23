import { useState, useEffect, useId } from 'react'
import { X, Check, AlertCircle, Loader2 } from 'lucide-react'
import { foodLogService } from '../services/foodLogService'
import { Button } from '../../../components/ui/Button'
import type { MealType, FoodEntryResponse, UpdateFoodEntryRequest } from '../../../types/api'

interface EditFoodModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  entry: FoodEntryResponse | null
}

export function EditFoodModal({ isOpen, onClose, onSuccess, entry }: EditFoodModalProps) {
  const [mealType, setMealType] = useState<MealType>('BREAKFAST')
  const [foodName, setFoodName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('')
  const [quantityUnit, setQuantityUnit] = useState('g')
  const [proteinG, setProteinG] = useState('')
  const [caloriesKcal, setCaloriesKcal] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Accessibility IDs
  const foodNameId = useId()
  const mealTypeId = useId()
  const categoryId = useId()
  const quantityId = useId()
  const quantityUnitId = useId()
  const proteinId = useId()
  const caloriesId = useId()
  const carbsId = useId()
  const fatId = useId()
  const notesId = useId()

  useEffect(() => {
    if (entry) {
      setFoodName(entry.foodName)
      setMealType(entry.mealType)
      setCategory(entry.category || '')
      setQuantity(String(entry.quantity))
      setQuantityUnit(entry.quantityUnit)
      setProteinG(String(entry.proteinG))
      setCaloriesKcal(entry.caloriesKcal != null ? String(entry.caloriesKcal) : '')
      setCarbsG(entry.carbohydratesG != null ? String(entry.carbohydratesG) : '')
      setFatG(entry.fatG != null ? String(entry.fatG) : '')
      setNotes(entry.notes || '')
      setError(null)
      setFieldErrors({})
    }
  }, [entry])

  if (!isOpen || !entry) return null

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!foodName.trim()) {
      errors.foodName = 'Food name is required'
    }

    const qtyNum = parseFloat(quantity)
    if (isNaN(qtyNum) || qtyNum <= 0) {
      errors.quantity = 'Serving quantity must be greater than zero'
    }

    if (!quantityUnit.trim()) {
      errors.quantityUnit = 'Serving unit is required'
    }

    const pNum = parseFloat(proteinG)
    if (isNaN(pNum) || pNum < 0) {
      errors.proteinG = 'Protein must be a non-negative number'
    }

    if (caloriesKcal.trim() !== '') {
      const cNum = parseFloat(caloriesKcal)
      if (isNaN(cNum) || cNum < 0) {
        errors.caloriesKcal = 'Calories must be non-negative'
      }
    }

    if (carbsG.trim() !== '') {
      const cbNum = parseFloat(carbsG)
      if (isNaN(cbNum) || cbNum < 0) {
        errors.carbsG = 'Carbs must be non-negative'
      }
    }

    if (fatG.trim() !== '') {
      const fNum = parseFloat(fatG)
      if (isNaN(fNum) || fNum < 0) {
        errors.fatG = 'Fat must be non-negative'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const req: UpdateFoodEntryRequest = {
        foodName: foodName.trim(),
        mealType,
        category: category.trim() || undefined,
        quantity: parseFloat(quantity),
        quantityUnit: quantityUnit.trim(),
        proteinG: parseFloat(proteinG),
        caloriesKcal: caloriesKcal.trim() !== '' ? parseFloat(caloriesKcal) : null,
        carbohydratesG: carbsG.trim() !== '' ? parseFloat(carbsG) : null,
        fatG: fatG.trim() !== '' ? parseFloat(fatG) : null,
        notes: notes.trim() || undefined,
        consumedAt: entry.consumedAt || undefined,
      }

      await foodLogService.updateFoodEntry(entry.id, req)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update food entry.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-food-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg my-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="edit-food-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Edit Food Entry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Modify quantity, meal category, or nutrition values
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="edit-food-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Meal Category */}
            <div>
              <label htmlFor={mealTypeId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Meal Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      mealType === type
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Name */}
            <div>
              <label htmlFor={foodNameId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Food Name <span className="text-rose-500">*</span>
              </label>
              <input
                id={foodNameId}
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${
                  fieldErrors.foodName ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {fieldErrors.foodName && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.foodName}</p>
              )}
            </div>

            {/* Serving Amount & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={quantityId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Serving Amount <span className="text-rose-500">*</span>
                </label>
                <input
                  id={quantityId}
                  type="number"
                  step="any"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${
                    fieldErrors.quantity ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {fieldErrors.quantity && (
                  <p className="mt-1 text-xs text-rose-500">{fieldErrors.quantity}</p>
                )}
              </div>

              <div>
                <label htmlFor={quantityUnitId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unit <span className="text-rose-500">*</span>
                </label>
                <input
                  id={quantityUnitId}
                  type="text"
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Protein & Calories */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={proteinId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Protein (g) <span className="text-rose-500">*</span>
                </label>
                <input
                  id={proteinId}
                  type="number"
                  step="0.1"
                  min="0"
                  value={proteinG}
                  onChange={(e) => setProteinG(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${
                    fieldErrors.proteinG ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {fieldErrors.proteinG && (
                  <p className="mt-1 text-xs text-rose-500">{fieldErrors.proteinG}</p>
                )}
              </div>

              <div>
                <label htmlFor={caloriesId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Calories (kcal)
                </label>
                <input
                  id={caloriesId}
                  type="number"
                  step="1"
                  min="0"
                  value={caloriesKcal}
                  onChange={(e) => setCaloriesKcal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Carbs & Fat */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={carbsId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Carbohydrates (g)
                </label>
                <input
                  id={carbsId}
                  type="number"
                  step="0.1"
                  min="0"
                  value={carbsG}
                  onChange={(e) => setCarbsG(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor={fatId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fat (g)
                </label>
                <input
                  id={fatId}
                  type="number"
                  step="0.1"
                  min="0"
                  value={fatG}
                  onChange={(e) => setFatG(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Category & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={categoryId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brand / Category
                </label>
                <input
                  id={categoryId}
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor={notesId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  id={notesId}
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            form="edit-food-form"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
