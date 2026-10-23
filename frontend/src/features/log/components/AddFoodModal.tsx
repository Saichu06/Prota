import { useState, useEffect, useId } from 'react'
import {
  X,
  Search,
  Plus,
  Bookmark,
  AlertCircle,
  Loader2,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Calendar,
} from 'lucide-react'
import { foodLogService } from '../services/foodLogService'
import { Button } from '../../../components/ui/Button'
import { NutritionReviewDraft } from './NutritionReviewDraft'
import type {
  MealType,
  CreateFoodEntryRequest,
  SavedFoodResponse,
  AiFoodEstimateResponse,
} from '../../../types/api'

interface AddFoodModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultDate: string
  defaultMealType?: MealType
}

export function AddFoodModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  defaultMealType = 'BREAKFAST',
}: AddFoodModalProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'saved'>('manual')

  // Natural Language AI state
  const [aiDescription, setAiDescription] = useState('')
  const [aiMealType, setAiMealType] = useState<MealType>(defaultMealType)
  const [aiDate, setAiDate] = useState(defaultDate)
  const [isEstimating, setIsEstimating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiEstimate, setAiEstimate] = useState<AiFoodEstimateResponse | null>(null)

  // Manual Form state
  const [mealType, setMealType] = useState<MealType>(defaultMealType)
  const [foodName, setFoodName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('100')
  const [quantityUnit, setQuantityUnit] = useState('g')
  const [proteinG, setProteinG] = useState('')
  const [caloriesKcal, setCaloriesKcal] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [notes, setNotes] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [selectedSavedFoodId, setSelectedSavedFoodId] = useState<string | null>(null)

  // Saved food search
  const [searchQuery, setSearchQuery] = useState('')
  const [savedFoods, setSavedFoods] = useState<SavedFoodResponse[]>([])
  const [isSearchingSaved, setIsSearchingSaved] = useState(false)

  // Status
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
  const saveTemplateId = useId()
  const aiDescriptionId = useId()
  const aiDateId = useId()

  useEffect(() => {
    if (isOpen) {
      setMealType(defaultMealType)
      setAiMealType(defaultMealType)
      setAiDate(defaultDate)
      setError(null)
      setAiError(null)
      setFieldErrors({})
    }
  }, [isOpen, defaultMealType, defaultDate])

  // Debounced search for saved foods
  useEffect(() => {
    if (activeTab !== 'saved') return

    const timer = setTimeout(async () => {
      setIsSearchingSaved(true)
      try {
        const results = await foodLogService.searchSavedFoods(searchQuery)
        setSavedFoods(results)
      } catch {
        setSavedFoods([])
      } finally {
        setIsSearchingSaved(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [activeTab, searchQuery])

  if (!isOpen) return null

  const handleSelectSavedFood = (food: SavedFoodResponse) => {
    setFoodName(food.name)
    setQuantity(String(food.servingQuantity))
    setQuantityUnit(food.servingUnit)
    setProteinG(String(food.proteinG))
    setCaloriesKcal(food.caloriesKcal != null ? String(food.caloriesKcal) : '')
    setCarbsG(food.carbohydratesG != null ? String(food.carbohydratesG) : '')
    setFatG(food.fatG != null ? String(food.fatG) : '')
    setSelectedSavedFoodId(food.id)
    setActiveTab('manual')
  }

  const handleEstimateText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiDescription.trim() || isEstimating) return

    setIsEstimating(true)
    setAiError(null)

    try {
      const response = await foodLogService.estimateFromText({
        description: aiDescription.trim(),
        mealType: aiMealType,
        date: aiDate,
      })

      if (response.status === 'SUCCESS' && response.items && response.items.length > 0) {
        setAiEstimate(response)
      } else if (response.status === 'UNAVAILABLE') {
        setAiError(response.message || 'AI nutrition estimation is currently unavailable. Please log meals manually.')
      } else {
        setAiError(response.message || 'Could not recognize identifiable food items. Please check your description or log manually.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI estimation request failed.'
      setAiError(msg)
    } finally {
      setIsEstimating(false)
    }
  }

  const validateManual = (): boolean => {
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateManual() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (saveAsTemplate && !selectedSavedFoodId) {
        await foodLogService.createSavedFood({
          name: foodName.trim(),
          category: category.trim() || undefined,
          servingQuantity: parseFloat(quantity),
          servingUnit: quantityUnit.trim(),
          proteinG: parseFloat(proteinG),
          caloriesKcal: caloriesKcal.trim() !== '' ? parseFloat(caloriesKcal) : undefined,
          carbohydratesG: carbsG.trim() !== '' ? parseFloat(carbsG) : undefined,
          fatG: fatG.trim() !== '' ? parseFloat(fatG) : undefined,
          notes: notes.trim() || undefined,
        })
      }

      const req: CreateFoodEntryRequest = {
        foodName: foodName.trim(),
        mealType,
        category: category.trim() || undefined,
        quantity: parseFloat(quantity),
        quantityUnit: quantityUnit.trim(),
        proteinG: parseFloat(proteinG),
        caloriesKcal: caloriesKcal.trim() !== '' ? parseFloat(caloriesKcal) : null,
        carbohydratesG: carbsG.trim() !== '' ? parseFloat(carbsG) : null,
        fatG: fatG.trim() !== '' ? parseFloat(fatG) : null,
        nutritionSource: selectedSavedFoodId ? 'SAVED_FOOD' : 'MANUAL',
        savedFoodId: selectedSavedFoodId,
        notes: notes.trim() || undefined,
        consumedAt: new Date().toISOString(),
      }

      await foodLogService.addFoodEntry(defaultDate, req)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add food entry. Please try again.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const samplePrompts = [
    'Two boiled eggs and two slices of toast.',
    'One cup of rice with 150 grams of cooked chicken.',
    'A paneer dosa and a glass of milk.',
    'A bowl of oats with milk and a banana.',
  ]

  const mealOptions: { type: MealType; label: string; icon: typeof Coffee }[] = [
    { type: 'BREAKFAST', label: 'Breakfast', icon: Coffee },
    { type: 'LUNCH', label: 'Lunch', icon: Sun },
    { type: 'DINNER', label: 'Dinner', icon: Moon },
    { type: 'SNACK', label: 'Snack', icon: Cookie },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-food-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        className={`relative w-full ${
          aiEstimate && aiEstimate.items.length > 0 ? 'max-w-2xl' : 'max-w-lg'
        } my-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="add-food-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Add Food Entry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Logging for {defaultDate}
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

        {/* Tab switch (only shown when not in review draft mode) */}
        {(!aiEstimate || aiEstimate.items.length === 0) && (
          <div className="flex p-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200/50 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              AI Quick Log
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Saved Foods
            </button>
          </div>
        )}

        {/* Modal body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ─── DRAFT REVIEW STATE ─── */}
          {aiEstimate && aiEstimate.items.length > 0 ? (
            <NutritionReviewDraft
              estimateId={aiEstimate.estimateId}
              initialItems={aiEstimate.items}
              defaultDate={aiDate}
              defaultMealType={aiMealType}
              sourceLabel="Natural Language AI"
              onSaveSuccess={() => {
                setAiEstimate(null)
                setAiDescription('')
                onSuccess()
                onClose()
              }}
              onCancel={() => {
                setAiEstimate(null)
              }}
            />
          ) : (
            <>
              {/* ─── TAB 1: NATURAL LANGUAGE AI LOG ─── */}
              {activeTab === 'ai' && (
                <form onSubmit={handleEstimateText} className="space-y-5">
                  {aiError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {/* Meal Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Meal Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {mealOptions.map((opt) => {
                        const Icon = opt.icon
                        const isSelected = aiMealType === opt.type
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setAiMealType(opt.type)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{opt.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label
                      htmlFor={aiDateId}
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Logging Date
                    </label>
                    <div className="relative">
                      <input
                        id={aiDateId}
                        type="date"
                        value={aiDate}
                        onChange={(e) => setAiDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Meal Description Textarea */}
                  <div>
                    <label
                      htmlFor={aiDescriptionId}
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Describe What You Ate
                    </label>
                    <textarea
                      id={aiDescriptionId}
                      rows={4}
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      placeholder="e.g. Two boiled eggs and two slices of toast with a cup of black coffee..."
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Sample suggestion chips */}
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                      Try quick meal examples:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {samplePrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiDescription(prompt)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isEstimating || !aiDescription.trim()}
                      className="w-full sm:w-auto shadow-xs"
                    >
                      {isEstimating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Estimating Nutrition...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1.5" />
                          Estimate Nutrition
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* ─── TAB 2: MANUAL ENTRY ─── */}
              {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Food Name */}
                  <div>
                    <label
                      htmlFor={foodNameId}
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Food Name *
                    </label>
                    <input
                      id={foodNameId}
                      type="text"
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      placeholder="e.g., Grilled Chicken Breast"
                      className={`w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${
                        fieldErrors.foodName
                          ? 'border-rose-300 dark:border-rose-700'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {fieldErrors.foodName && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                        {fieldErrors.foodName}
                      </p>
                    )}
                  </div>

                  {/* Meal Type & Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={mealTypeId}
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Meal Type *
                      </label>
                      <select
                        id={mealTypeId}
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value as MealType)}
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      >
                        <option value="BREAKFAST">Breakfast</option>
                        <option value="LUNCH">Lunch</option>
                        <option value="DINNER">Dinner</option>
                        <option value="SNACK">Snack</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={categoryId}
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Category
                      </label>
                      <input
                        id={categoryId}
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Poultry, Dairy"
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Quantity & Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={quantityId}
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Serving Amount *
                      </label>
                      <input
                        id={quantityId}
                        type="number"
                        step="any"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={`w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${
                          fieldErrors.quantity
                            ? 'border-rose-300 dark:border-rose-700'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {fieldErrors.quantity && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                          {fieldErrors.quantity}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={quantityUnitId}
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Unit *
                      </label>
                      <input
                        id={quantityUnitId}
                        type="text"
                        value={quantityUnit}
                        onChange={(e) => setQuantityUnit(e.target.value)}
                        placeholder="g, cup, piece, oz"
                        className={`w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white ${
                          fieldErrors.quantityUnit
                            ? 'border-rose-300 dark:border-rose-700'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {fieldErrors.quantityUnit && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                          {fieldErrors.quantityUnit}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Macronutrients */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label
                        htmlFor={proteinId}
                        className="block text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5"
                      >
                        Protein (g) *
                      </label>
                      <input
                        id={proteinId}
                        type="number"
                        step="0.1"
                        value={proteinG}
                        onChange={(e) => setProteinG(e.target.value)}
                        placeholder="0.0"
                        className={`w-full px-3 py-2 text-sm bg-emerald-50/40 dark:bg-emerald-950/20 border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-900 dark:text-emerald-100 ${
                          fieldErrors.proteinG
                            ? 'border-rose-400 dark:border-rose-600'
                            : 'border-emerald-200 dark:border-emerald-800'
                        }`}
                      />
                      {fieldErrors.proteinG && (
                        <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                          {fieldErrors.proteinG}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={caloriesId}
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Calories
                      </label>
                      <input
                        id={caloriesId}
                        type="number"
                        step="1"
                        value={caloriesKcal}
                        onChange={(e) => setCaloriesKcal(e.target.value)}
                        placeholder="kcal"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={carbsId}
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Carbs (g)
                      </label>
                      <input
                        id={carbsId}
                        type="number"
                        step="0.1"
                        value={carbsG}
                        onChange={(e) => setCarbsG(e.target.value)}
                        placeholder="0.0"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={fatId}
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Fat (g)
                      </label>
                      <input
                        id={fatId}
                        type="number"
                        step="0.1"
                        value={fatG}
                        onChange={(e) => setFatG(e.target.value)}
                        placeholder="0.0"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label
                      htmlFor={notesId}
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Notes
                    </label>
                    <input
                      id={notesId}
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Post-workout meal"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Save as Template Checkbox */}
                  {!selectedSavedFoodId && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={saveTemplateId}
                        checked={saveAsTemplate}
                        onChange={(e) => setSaveAsTemplate(e.target.checked)}
                        className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                      />
                      <label
                        htmlFor={saveTemplateId}
                        className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer"
                      >
                        Save to my foods for quick logging in the future
                      </label>
                    </div>
                  )}

                  {/* Submit buttons */}
                  <div className="flex justify-end gap-3 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      className="shadow-xs"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Log Food'
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* ─── TAB 3: SAVED FOODS ─── */}
              {activeTab === 'saved' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search your saved foods..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  {isSearchingSaved ? (
                    <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      Loading saved foods...
                    </div>
                  ) : savedFoods.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      {searchQuery
                        ? 'No matching saved foods found.'
                        : 'You have no saved foods yet. Log a food with "Save to my foods" checked to see it here.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedFoods.map((food) => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => handleSelectSavedFood(food)}
                          className="w-full text-left p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {food.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {food.servingQuantity} {food.servingUnit}
                              {food.category ? ` • ${food.category}` : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {food.proteinG}g P
                            </span>
                            {food.caloriesKcal != null && (
                              <span className="block text-xs text-slate-400">
                                {Math.round(food.caloriesKcal)} kcal
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
