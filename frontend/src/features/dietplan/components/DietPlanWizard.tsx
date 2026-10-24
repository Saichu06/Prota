import { useState, useEffect, Fragment } from 'react'
import {
  User,
  Target,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type { DietGoal, DietPlanGenerateRequest } from '../../../types/api'

interface DietPlanWizardProps {
  initialWeightUnit?: 'KG' | 'LB'
  onGenerate: (request: DietPlanGenerateRequest) => Promise<void>
  isGenerating: boolean
  error?: string | null
}

const COMMON_ALLERGIES = [
  'Dairy / Lactose',
  'Peanuts',
  'Tree Nuts',
  'Gluten / Wheat',
  'Shellfish',
  'Soy',
  'Eggs',
  'Fish',
]

const CUISINES = [
  'North Indian',
  'South Indian',
  'Mediterranean',
  'Continental / Western',
  'East Asian / Stir Fry',
  'Mexican / Latin',
  'Middle Eastern',
]

export function DietPlanWizard({
  initialWeightUnit = 'KG',
  onGenerate,
  isGenerating,
  error,
}: DietPlanWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Step 1: Personal Info
  const [age, setAge] = useState<string>('28')
  const [gender, setGender] = useState<string>('MALE')
  const [heightValue, setHeightValue] = useState<string>('175')
  const [heightUnit, setHeightUnit] = useState<'CM' | 'FT_IN'>('CM')
  const [heightFeet, setHeightFeet] = useState<string>('5')
  const [heightInches, setHeightInches] = useState<string>('9')
  const [weightValue, setWeightValue] = useState<string>('75')
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>(initialWeightUnit)

  useEffect(() => {
    if (initialWeightUnit) {
      setWeightUnit(initialWeightUnit)
    }
  }, [initialWeightUnit])
  const [targetWeightValue, setTargetWeightValue] = useState<string>('')
  const [activityLevel, setActivityLevel] = useState<string>('MODERATELY_ACTIVE')

  // Step 2: Goal selection
  const [goal, setGoal] = useState<DietGoal>('FAT_LOSS')
  const [timeframeWeeks, setTimeframeWeeks] = useState<string>('8')
  const [trainingFrequency, setTrainingFrequency] = useState<string>('4')
  const [mealFrequency, setMealFrequency] = useState<number>(3)

  // Step 3: Food preferences
  const [dietaryPreference, setDietaryPreference] = useState<string>('Omnivore')
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([])
  const [customAllergy, setCustomAllergy] = useState<string>('')
  const [dislikedFoods, setDislikedFoods] = useState<string>('')
  const [preferredCuisine, setPreferredCuisine] = useState<string>('North Indian')
  const [budget, setBudget] = useState<string>('MODERATE')
  const [cookingTime, setCookingTime] = useState<string>('MODERATE')
  const [medicalNotes, setMedicalNotes] = useState<string>('')

  // Validation errors
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})

  // Height conversion to cm
  const getHeightInCm = (): number => {
    if (heightUnit === 'CM') {
      return parseFloat(heightValue) || 175
    }
    const ft = parseFloat(heightFeet) || 0
    const inch = parseFloat(heightInches) || 0
    return Math.round((ft * 12 + inch) * 2.54)
  }

  // Weight conversion to kg
  const getWeightInKg = (): number => {
    const w = parseFloat(weightValue) || 75
    if (weightUnit === 'LB') {
      return Math.round((w * 0.45359237) * 10) / 10
    }
    return w
  }

  const getTargetWeightInKg = (): number | undefined => {
    if (!targetWeightValue.trim()) return undefined
    const w = parseFloat(targetWeightValue)
    if (isNaN(w) || w <= 0) return undefined
    if (weightUnit === 'LB') {
      return Math.round((w * 0.45359237) * 10) / 10
    }
    return w
  }

  // Approximate TDEE preview calculation for Step 4
  const computePreviewMetrics = () => {
    const wKg = getWeightInKg()
    const hCm = getHeightInCm()
    const a = parseInt(age, 10) || 28

    let bmr = 10 * wKg + 6.25 * hCm - 5 * a
    if (gender === 'MALE') bmr += 5
    else if (gender === 'FEMALE') bmr -= 161
    else bmr -= 78

    const multiplier = activityLevel === 'SEDENTARY' ? 1.2
      : activityLevel === 'LIGHTLY_ACTIVE' ? 1.375
      : activityLevel === 'MODERATELY_ACTIVE' ? 1.55
      : activityLevel === 'VERY_ACTIVE' ? 1.725 : 1.9

    const tdee = Math.round(bmr * multiplier)

    let cal = tdee
    if (goal === 'FAT_LOSS') {
      cal = Math.max(gender === 'MALE' ? 1500 : 1200, tdee - 400)
    } else if (goal === 'MUSCLE_GAIN') {
      cal = tdee + 300
    }

    const p = Math.round(wKg * (goal === 'FAT_LOSS' || goal === 'MUSCLE_GAIN' ? 2.0 : 1.6))
    return { bmr: Math.round(bmr), tdee, targetCalories: cal, targetProtein: p }
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      const ageNum = parseInt(age, 10)
      if (isNaN(ageNum) || ageNum < 14 || ageNum > 120) {
        errors.age = 'Age must be between 14 and 120'
      }

      if (heightUnit === 'CM') {
        const hNum = parseFloat(heightValue)
        if (isNaN(hNum) || hNum < 80 || hNum > 250) {
          errors.height = 'Height must be between 80 cm and 250 cm'
        }
      } else {
        const ft = parseFloat(heightFeet)
        if (isNaN(ft) || ft < 2 || ft > 8) {
          errors.height = 'Please enter valid feet (2-8)'
        }
      }

      const wNum = parseFloat(weightValue)
      if (isNaN(wNum) || wNum < 25 || wNum > 350) {
        errors.weight = 'Weight must be between 25 and 350'
      }
    }

    if (step === 2) {
      if (timeframeWeeks.trim()) {
        const tf = parseInt(timeframeWeeks, 10)
        if (isNaN(tf) || tf < 1 || tf > 52) {
          errors.timeframe = 'Timeframe should be between 1 and 52 weeks'
        }
      }
    }

    setStepErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1))
    }
  }

  const handleBack = () => {
    setStepErrors({})
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleToggleAllergy = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    )
  }

  const handleAddCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies((prev) => [...prev, customAllergy.trim()])
      setCustomAllergy('')
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      return
    }

    const payload: DietPlanGenerateRequest = {
      age: parseInt(age, 10),
      gender,
      heightCm: getHeightInCm(),
      currentWeightKg: getWeightInKg(),
      targetWeightKg: getTargetWeightInKg(),
      activityLevel,
      goal,
      timeframeWeeks: timeframeWeeks ? parseInt(timeframeWeeks, 10) : undefined,
      trainingFrequencyPerWeek: trainingFrequency ? parseInt(trainingFrequency, 10) : undefined,
      mealFrequency,
      dietaryPreference,
      allergies: selectedAllergies.length > 0 ? selectedAllergies : undefined,
      dislikedFoods: dislikedFoods.trim()
        ? dislikedFoods.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      preferredCuisine,
      budget,
      cookingTime,
      medicalConditionsOrNotes: medicalNotes.trim() || undefined,
    }

    await onGenerate(payload)
  }

  const preview = computePreviewMetrics()

  const steps = [
    { number: 1, label: 'Personal Info', icon: User },
    { number: 2, label: 'Goals & Timeline', icon: Target },
    { number: 3, label: 'Food & Cuisine', icon: Utensils },
    { number: 4, label: 'Review & Build', icon: CheckCircle2 },
  ]

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
      {/* Step Indicator Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((st, idx) => {
            const Icon = st.icon
            const isCompleted = currentStep > st.number
            const isCurrent = currentStep === st.number

            return (
              <Fragment key={st.number}>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (st.number < currentStep || validateStep(currentStep)) {
                        setCurrentStep(st.number)
                      }
                    }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-500/20'
                        : isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                  <span
                    className={`mt-2 text-[11px] font-semibold text-center hidden sm:block ${
                      isCurrent
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isCompleted
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${
                      currentStep > st.number
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </Fragment>
            )
          })}
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── STEP 1: PERSONAL INFORMATION ─── */}
      {currentStep === 1 && (
        <div className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 1: Your Biometrics & Activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Used for deterministic BMR and TDEE calorie calculations. These values won't overwrite your account profile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label htmlFor="wizard-age" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Age *
              </label>
              <input
                id="wizard-age"
                type="number"
                min="14"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  stepErrors.age ? 'border-rose-300 dark:border-rose-700' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {stepErrors.age && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{stepErrors.age}</p>}
            </div>

            {/* Sex / Gender */}
            <div>
              <label htmlFor="wizard-gender" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Biological Sex *
              </label>
              <select
                id="wizard-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="MALE">Male (+5 kcal/day offset)</option>
                <option value="FEMALE">Female (-161 kcal/day offset)</option>
                <option value="OTHER">Other / Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Height */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="wizard-height" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Height *
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setHeightUnit('CM')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    heightUnit === 'CM' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setHeightUnit('FT_IN')}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    heightUnit === 'FT_IN' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                  }`}
                >
                  ft / in
                </button>
              </div>
            </div>

            {heightUnit === 'CM' ? (
              <input
                id="wizard-height"
                type="number"
                value={heightValue}
                onChange={(e) => setHeightValue(e.target.value)}
                placeholder="175"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  stepErrors.height ? 'border-rose-300 dark:border-rose-700' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="wizard-height-ft"
                  type="number"
                  placeholder="Feet"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
                <input
                  id="wizard-height-in"
                  type="number"
                  placeholder="Inches"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>
            )}
            {stepErrors.height && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{stepErrors.height}</p>}
          </div>

          {/* Weight & Target Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="wizard-weight" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Current Weight *
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setWeightUnit('KG')}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      weightUnit === 'KG' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit('LB')}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      weightUnit === 'LB' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    lb
                  </button>
                </div>
              </div>
              <input
                id="wizard-weight"
                type="number"
                step="0.1"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  stepErrors.weight ? 'border-rose-300 dark:border-rose-700' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {stepErrors.weight && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{stepErrors.weight}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Weight ({weightUnit}) <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder={goal === 'FAT_LOSS' ? 'e.g. 70' : 'e.g. 80'}
                value={targetWeightValue}
                onChange={(e) => setTargetWeightValue(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Daily Physical Activity *
            </label>
            <div className="space-y-2">
              {[
                { id: 'SEDENTARY', label: 'Sedentary', desc: 'Desk job, little to no deliberate exercise (1.2x)' },
                { id: 'LIGHTLY_ACTIVE', label: 'Lightly Active', desc: 'Light workouts / walking 1-3 days/week (1.375x)' },
                { id: 'MODERATELY_ACTIVE', label: 'Moderately Active', desc: 'Moderate sports/gym 3-5 days/week (1.55x)' },
                { id: 'VERY_ACTIVE', label: 'Very Active', desc: 'Hard exercise or physical labor 6-7 days/week (1.725x)' },
              ].map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setActivityLevel(act.id)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    activityLevel === act.id
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-slate-900 dark:text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{act.label}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">{act.desc}</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                    activityLevel === act.id ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {activityLevel === act.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: GOALS & TIMELINE ─── */}
      {currentStep === 2 && (
        <div className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 2: Choose Your Target Outcome
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your primary fitness objective and desired structure.
            </p>
          </div>

          {/* Goal selection cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'FAT_LOSS', title: 'Fat Loss', desc: 'Healthy, preserved-muscle caloric deficit (~400 kcal reduction).' },
              { id: 'MUSCLE_GAIN', title: 'Muscle Gain', desc: 'Controlled lean surplus (+300 kcal) with high protein density.' },
              { id: 'WEIGHT_MAINTENANCE', title: 'Maintenance', desc: 'Fuel athletic performance and stabilize current bodyweight.' },
              { id: 'GENERAL_FITNESS', title: 'General Fitness', desc: 'Balanced wholesome nutrition, energy levels, and vital health.' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id as DietGoal)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  goal === g.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{g.title}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">{g.desc}</span>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    goal === g.id ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {goal === g.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Timeframe & Training */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wizard-timeframe" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Timeframe (Weeks)
              </label>
              <input
                id="wizard-timeframe"
                type="number"
                min="1"
                max="52"
                value={timeframeWeeks}
                onChange={(e) => setTimeframeWeeks(e.target.value)}
                placeholder="e.g. 8"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Planning preference, not a guaranteed date.
              </p>
            </div>

            <div>
              <label htmlFor="wizard-training" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Training Days / Week
              </label>
              <select
                id="wizard-training"
                value={trainingFrequency}
                onChange={(e) => setTrainingFrequency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              >
                <option value="0">0 days (No formal workouts)</option>
                <option value="2">2-3 days / week</option>
                <option value="4">4-5 days / week (Standard split)</option>
                <option value="6">6+ days / week (Athletic training)</option>
              </select>
            </div>
          </div>

          {/* Meal Frequency */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Preferred Meal Frequency
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setMealFrequency(cnt)}
                  className={`py-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                    mealFrequency === cnt
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {cnt} Meals
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: FOOD PREFERENCES ─── */}
      {currentStep === 3 && (
        <div className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 3: Food Preferences & Restrictions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Customize meal selections to align with your taste, budget, and culture.
            </p>
          </div>

          {/* Dietary Preference */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Dietary Pattern *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Omnivore', 'Vegetarian', 'Eggetarian', 'Vegan'].map((diet) => (
                <button
                  key={diet}
                  type="button"
                  onClick={() => setDietaryPreference(diet)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    dietaryPreference === diet
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies & Food Restrictions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Allergies & Restrictions <span className="text-slate-400 font-normal lowercase">(strictly excluded)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_ALLERGIES.map((allergy) => {
                const isSelected = selectedAllergies.includes(allergy)
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => handleToggleAllergy(allergy)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {allergy} {isSelected ? '✕' : '+'}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add other restriction (e.g. Sesame, Pork)..."
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomAllergy()
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddCustomAllergy}>
                Add
              </Button>
            </div>
          </div>

          {/* Preferred Cuisine & Dislikes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wizard-cuisine" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Preferred Cuisine
              </label>
              <select
                id="wizard-cuisine"
                value={preferredCuisine}
                onChange={(e) => setPreferredCuisine(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {CUISINES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="wizard-dislikes" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Foods You Dislike
              </label>
              <input
                id="wizard-dislikes"
                type="text"
                placeholder="e.g. Mushroom, Broccoli, Bitter Gourd"
                value={dislikedFoods}
                onChange={(e) => setDislikedFoods(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Budget & Cooking Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wizard-budget" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Budget
              </label>
              <select
                id="wizard-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="BUDGET">Budget-Friendly (Wholesome staples)</option>
                <option value="MODERATE">Moderate (Standard grocery cart)</option>
                <option value="PREMIUM">Flexible / Premium ingredients</option>
              </select>
            </div>

            <div>
              <label htmlFor="wizard-cooking" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Cooking Time Available
              </label>
              <select
                id="wizard-cooking"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="MINIMAL">Quick (&lt; 15 mins)</option>
                <option value="MODERATE">Moderate (~30 mins)</option>
                <option value="ELABORATE">Elaborate (45+ mins)</option>
              </select>
            </div>
          </div>

          {/* Medical Notes */}
          <div>
            <label htmlFor="wizard-medical" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Health Considerations / Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="wizard-medical"
              type="text"
              placeholder="e.g. Mild acid reflux, prefer high-fiber foods, avoid excess sodium"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* ─── STEP 4: REVIEW & BUILD ─── */}
      {currentStep === 4 && (
        <div className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 4: Review Your Inputs & Targets
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verify your setup before calling the Gemini AI nutrition model.
            </p>
          </div>

          {/* Target Preview Box */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Calculated Targets (Deterministic Baseline)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Daily Calories</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">{preview.targetCalories}</span>
                <span className="text-[10px] text-slate-500 block">kcal/day</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Daily Protein</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{preview.targetProtein}g</span>
                <span className="text-[10px] text-slate-500 block">preserve muscle</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Estimated BMR</span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-300">{preview.bmr}</span>
                <span className="text-[10px] text-slate-500 block">kcal basal</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Estimated TDEE</span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-300">{preview.tdee}</span>
                <span className="text-[10px] text-slate-500 block">kcal total</span>
              </div>
            </div>
          </div>

          {/* Summary Table of Inputs */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Parameter</span>
              <span className="font-semibold text-slate-900 dark:text-white">Selected Value</span>
            </div>
            <div className="px-4 py-2 flex justify-between">
              <span className="text-slate-500">Goal</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{goal.replace('_', ' ')}</span>
            </div>
            <div className="px-4 py-2 flex justify-between">
              <span className="text-slate-500">Current Weight & Height</span>
              <span className="text-slate-800 dark:text-slate-200">{weightValue} {weightUnit} • {getHeightInCm()} cm</span>
            </div>
            <div className="px-4 py-2 flex justify-between">
              <span className="text-slate-500">Dietary Pattern</span>
              <span className="text-slate-800 dark:text-slate-200">{dietaryPreference} ({mealFrequency} meals/day)</span>
            </div>
            <div className="px-4 py-2 flex justify-between">
              <span className="text-slate-500">Preferred Cuisine</span>
              <span className="text-slate-800 dark:text-slate-200">{preferredCuisine}</span>
            </div>
            <div className="px-4 py-2 flex justify-between">
              <span className="text-slate-500">Allergies Declared</span>
              <span className="text-slate-800 dark:text-slate-200">
                {selectedAllergies.length > 0 ? selectedAllergies.join(', ') : 'None'}
              </span>
            </div>
          </div>

          {/* Medical & Nutritional Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            <p>
              This generated plan is an automated wellness and nutrition estimation guide based on clinical formulas. It does not constitute medical treatment, therapy, or diagnosis. Always consult a physician or registered dietitian before beginning any significant dietary regimen.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between max-w-xl mx-auto">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isGenerating}
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNext}
            className="text-xs shadow-xs"
          >
            Continue
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isGenerating}
            className="text-xs shadow-sm bg-emerald-600 hover:bg-emerald-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Generating Plan with Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Generate AI Diet Plan
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
