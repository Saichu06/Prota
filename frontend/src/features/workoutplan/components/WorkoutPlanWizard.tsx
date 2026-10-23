import { useState, Fragment } from 'react'
import {
  User,
  Dumbbell,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  Info,
  Home,
  Building2,
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type {
  WorkoutGoal,
  TrainingLocation,
  SplitType,
  ExperienceLevel,
  WorkoutPlanGenerateRequest,
} from '../../../types/api'

interface WorkoutPlanWizardProps {
  onGenerate: (request: WorkoutPlanGenerateRequest) => Promise<void>
  isGenerating: boolean
  error?: string | null
}

const MUSCLE_GROUPS = [
  'Full Body',
  'Chest',
  'Back (Lats & Upper Back)',
  'Shoulders (Deltoids)',
  'Biceps',
  'Triceps',
  'Forearms',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core & Abs',
]

const HOME_EQUIPMENT = [
  'Bodyweight Only',
  'Dumbbells',
  'Resistance Bands',
  'Adjustable Bench',
  'Pull-Up Bar',
  'Kettlebell',
  'Suspension Trainer (TRX)',
]

const GYM_EQUIPMENT = [
  'Full Commercial Gym (All Equipment)',
  'Barbells & Weight Plates',
  'Dumbbells Rack',
  'Cable Crossover & Pulley Towers',
  'Pin-Loaded Resistance Machines',
  'Smith Machine',
  'Squat Racks & Power Cages',
  'Flat & Incline Benches',
  'Leg Press & Hack Squat',
]

export function WorkoutPlanWizard({
  onGenerate,
  isGenerating,
  error,
}: WorkoutPlanWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Step 1: Fitness Profile
  const [age, setAge] = useState<string>('28')
  const [heightValue, setHeightValue] = useState<string>('175')
  const [heightUnit, setHeightUnit] = useState<'CM' | 'FT_IN'>('CM')
  const [heightFeet, setHeightFeet] = useState<string>('5')
  const [heightInches, setHeightInches] = useState<string>('9')
  const [weightValue, setWeightValue] = useState<string>('75')
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>('KG')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('INTERMEDIATE')
  const [primaryGoal, setPrimaryGoal] = useState<WorkoutGoal>('MUSCLE_HYPERTROPHY')
  const [secondaryGoal, setSecondaryGoal] = useState<string>('NONE')
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([
    'Chest',
    'Back (Lats & Upper Back)',
    'Shoulders (Deltoids)',
    'Quadriceps',
    'Hamstrings',
  ])

  // Step 2: Setting & Equipment
  const [location, setLocation] = useState<TrainingLocation>('GYM')
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'Full Commercial Gym (All Equipment)',
  ])
  const [equipmentRestrictions, setEquipmentRestrictions] = useState<string>('')

  // Step 3: Training Schedule
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4)
  const [splitType, setSplitType] = useState<SplitType>('UPPER_LOWER')
  const [sessionDurationMins, setSessionDurationMins] = useState<number>(60)
  const [preferredDays, setPreferredDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Thursday',
    'Friday',
  ])
  const [exercisesToAvoid, setExercisesToAvoid] = useState<string>('')
  const [recoveryPreferences, setRecoveryPreferences] = useState<string>('')

  // Step 4: Safety & Limitations
  const [injuriesOrLimitations, setInjuriesOrLimitations] = useState<string>('')

  // Validation errors
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({})

  const getHeightInCm = (): number => {
    if (heightUnit === 'CM') {
      return parseFloat(heightValue) || 175
    }
    const ft = parseFloat(heightFeet) || 5
    const inches = parseFloat(heightInches) || 9
    return Math.round((ft * 12 + inches) * 2.54)
  }

  const getWeightInKg = (): number => {
    const val = parseFloat(weightValue) || 75
    return weightUnit === 'LB' ? Math.round(val * 0.453592 * 10) / 10 : val
  }

  const handleToggleMuscle = (muscle: string) => {
    if (muscle === 'Full Body') {
      if (selectedMuscles.includes('Full Body')) {
        setSelectedMuscles([])
      } else {
        setSelectedMuscles([...MUSCLE_GROUPS])
      }
      return
    }

    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter((m) => m !== muscle && m !== 'Full Body'))
    } else {
      setSelectedMuscles([...selectedMuscles, muscle])
    }
  }

  const handleToggleEquipment = (eq: string) => {
    if (eq === 'Full Commercial Gym (All Equipment)') {
      if (selectedEquipment.includes(eq)) {
        setSelectedEquipment([])
      } else {
        setSelectedEquipment(['Full Commercial Gym (All Equipment)'])
      }
      return
    }

    const withoutAll = selectedEquipment.filter((e) => e !== 'Full Commercial Gym (All Equipment)')
    if (withoutAll.includes(eq)) {
      setSelectedEquipment(withoutAll.filter((e) => e !== eq))
    } else {
      setSelectedEquipment([...withoutAll, eq])
    }
  }

  const handleToggleDay = (day: string) => {
    if (preferredDays.includes(day)) {
      setPreferredDays(preferredDays.filter((d) => d !== day))
    } else {
      setPreferredDays([...preferredDays, day])
    }
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      if (age.trim()) {
        const aNum = parseInt(age, 10)
        if (isNaN(aNum) || aNum < 14 || aNum > 120) {
          errors.age = 'Age must be between 14 and 120'
        }
      }
      if (heightUnit === 'CM') {
        const hNum = parseFloat(heightValue)
        if (isNaN(hNum) || hNum < 80 || hNum > 250) {
          errors.height = 'Height must be between 80 cm and 250 cm'
        }
      }
      const wNum = parseFloat(weightValue)
      if (isNaN(wNum) || wNum < 25 || wNum > 350) {
        errors.weight = 'Weight must be between 25 and 350'
      }
      if (selectedMuscles.length === 0) {
        errors.muscles = 'Please select at least one muscle group or Full Body'
      }
    }

    if (step === 2) {
      if (selectedEquipment.length === 0) {
        errors.equipment = 'Please select at least one available equipment option'
      }
    }

    if (step === 3) {
      if (daysPerWeek < 1 || daysPerWeek > 7) {
        errors.days = 'Days per week must be between 1 and 7'
      }
      if (sessionDurationMins < 15 || sessionDurationMins > 180) {
        errors.duration = 'Session duration must be between 15 and 180 minutes'
      }
    }

    setStepErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return
    }

    const avoidList = exercisesToAvoid
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const req: WorkoutPlanGenerateRequest = {
      age: age.trim() ? parseInt(age, 10) : undefined,
      heightCm: getHeightInCm(),
      weightKg: getWeightInKg(),
      experienceLevel,
      primaryGoal,
      secondaryGoal: secondaryGoal !== 'NONE' ? (secondaryGoal as WorkoutGoal) : undefined,
      targetMuscleGroups: selectedMuscles,
      trainingLocation: location,
      availableEquipment: selectedEquipment,
      equipmentRestrictions: equipmentRestrictions.trim() || undefined,
      daysPerWeek,
      splitType,
      sessionDurationMins,
      preferredTrainingDays: preferredDays.length > 0 ? preferredDays : undefined,
      exercisesToAvoid: avoidList.length > 0 ? avoidList : undefined,
      injuriesOrLimitations: injuriesOrLimitations.trim() || undefined,
      recoveryPreferences: recoveryPreferences.trim() || undefined,
    }

    await onGenerate(req)
  }

  const steps = [
    { number: 1, label: 'Profile & Goal', icon: User },
    { number: 2, label: 'Location & Gear', icon: Dumbbell },
    { number: 3, label: 'Schedule & Split', icon: Calendar },
    { number: 4, label: 'Safety & Limits', icon: ShieldAlert },
    { number: 5, label: 'Review & Build', icon: CheckCircle2 },
  ]

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
      {/* ─── STEP PROGRESS BAR ─── */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
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
                      currentStep > st.number ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
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
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── STEP 1: FITNESS PROFILE & GOALS ─── */}
      {currentStep === 1 && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 1: Fitness Profile & Target Goals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your primary progression focus and emphasized muscle groups. Adjustments here do not overwrite your account profile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Age */}
            <div>
              <label htmlFor="wizard-age" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Age
              </label>
              <input
                id="wizard-age"
                type="number"
                min="14"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
              {stepErrors.age && <p className="mt-1 text-xs text-rose-600">{stepErrors.age}</p>}
            </div>

            {/* Height */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="wizard-height" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Height *
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setHeightUnit('CM')}
                    className={`px-1.5 py-0.5 rounded font-semibold ${
                      heightUnit === 'CM' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit('FT_IN')}
                    className={`px-1.5 py-0.5 rounded font-semibold ${
                      heightUnit === 'FT_IN' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    ft/in
                  </button>
                </div>
              </div>
              {heightUnit === 'CM' ? (
                <input
                  id="wizard-height"
                  type="number"
                  value={heightValue}
                  onChange={(e) => setHeightValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    placeholder="ft"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value)}
                    className="w-full px-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="in"
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value)}
                    className="w-full px-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Weight */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="wizard-weight" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Current Weight *
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setWeightUnit('KG')}
                    className={`px-1.5 py-0.5 rounded font-semibold ${
                      weightUnit === 'KG' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit('LB')}
                    className={`px-1.5 py-0.5 rounded font-semibold ${
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Training Experience *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'BEGINNER', title: 'Beginner', desc: '< 1 year regular lifting' },
                { id: 'INTERMEDIATE', title: 'Intermediate', desc: '1–3 years disciplined training' },
                { id: 'ADVANCED', title: 'Advanced', desc: '3+ years structured progression' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setExperienceLevel(lvl.id as ExperienceLevel)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    experienceLevel === lvl.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block">{lvl.title}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">{lvl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Goal */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Primary Progression Goal *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'MUSCLE_HYPERTROPHY', title: 'Muscle Hypertrophy', desc: 'Maximize muscular size, definition, and aesthetic proportion' },
                { id: 'STRENGTH', title: 'Strength Development', desc: 'Peak neuromuscular power on compound barbell and dumbbell lifts' },
                { id: 'BODY_RECOMPOSITION', title: 'Body Recomposition', desc: 'Simultaneous muscle retention/growth with moderate fat burn' },
                { id: 'GENERAL_FITNESS', title: 'General Fitness & Longevity', desc: 'Well-rounded functional stamina, posture, and cardiovascular health' },
                { id: 'ENDURANCE', title: 'Muscular Endurance', desc: 'High-rep stamina, work capacity, and fatigue resistance' },
                { id: 'BEGINNER_FITNESS', title: 'Beginner Foundations', desc: 'Safe motor learning, joint preparation, and movement habit building' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setPrimaryGoal(g.id as WorkoutGoal)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    primaryGoal === g.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block">{g.title}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">{g.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Secondary Goal */}
          <div>
            <label htmlFor="wizard-sec-goal" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Secondary Goal <span className="text-slate-400 font-normal lowercase">(optional complementary target)</span>
            </label>
            <select
              id="wizard-sec-goal"
              value={secondaryGoal}
              onChange={(e) => setSecondaryGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            >
              <option value="NONE">None / Single Focus</option>
              <option value="MUSCLE_HYPERTROPHY">Muscle Hypertrophy</option>
              <option value="STRENGTH">Strength Development</option>
              <option value="BODY_RECOMPOSITION">Body Recomposition</option>
              <option value="GENERAL_FITNESS">General Fitness & Mobility</option>
              <option value="ENDURANCE">Muscular Endurance</option>
            </select>
          </div>

          {/* Target Muscle Groups Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Target Muscle Groups (Select all you want to emphasize) *
              </label>
              <button
                type="button"
                onClick={() => setSelectedMuscles([...MUSCLE_GROUPS])}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Select All
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MUSCLE_GROUPS.map((m) => {
                const active = selectedMuscles.includes(m)
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleToggleMuscle(m)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
            {stepErrors.muscles && <p className="mt-1 text-xs text-rose-600">{stepErrors.muscles}</p>}

            {/* Disclaimer box */}
            <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Selecting target muscle groups guides training volume and exercise selection. It does not promise isolated fat loss in that specific body area.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: HOME OR GYM & EQUIPMENT ─── */}
      {currentStep === 2 && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 2: Training Location & Available Equipment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Workouts are strictly generated using only the equipment you select. No barbell exercises will be assigned if you only have dumbbells.
            </p>
          </div>

          {/* Location Toggle */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setLocation('GYM')
                setSelectedEquipment(['Full Commercial Gym (All Equipment)'])
              }}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                location === 'GYM'
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Building2 className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-sm">Commercial Gym</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Access to barbells, racks, and specialized machines
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLocation('HOME')
                setSelectedEquipment(['Dumbbells', 'Adjustable Bench'])
              }}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                location === 'HOME'
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Home className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-sm">Home Workout</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Bodyweight, dumbbells, or resistance bands setup
              </span>
            </button>
          </div>

          {/* Equipment Checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Select Your Available Equipment *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(location === 'GYM' ? GYM_EQUIPMENT : HOME_EQUIPMENT).map((eq) => {
                const active = selectedEquipment.includes(eq)
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => handleToggleEquipment(eq)}
                    className={`p-3 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>{eq}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </button>
                )
              })}
            </div>
            {stepErrors.equipment && <p className="mt-1 text-xs text-rose-600">{stepErrors.equipment}</p>}
          </div>

          {/* Equipment Restrictions */}
          <div>
            <label htmlFor="wizard-eq-notes" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Specific Equipment Restrictions or Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="wizard-eq-notes"
              type="text"
              value={equipmentRestrictions}
              onChange={(e) => setEquipmentRestrictions(e.target.value)}
              placeholder="e.g. Max dumbbells are 20kg each, no squat rack available"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* ─── STEP 3: TRAINING SCHEDULE & SPLIT ─── */}
      {currentStep === 3 && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 3: Training Schedule & Split Structure
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose how many days you can commit and your preferred training split.
            </p>
          </div>

          {/* Days Per Week */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Days Per Week: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{daysPerWeek} days</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {daysPerWeek <= 3 ? 'Full-Body Recommended' : daysPerWeek === 4 ? 'Upper/Lower Recommended' : 'PPL / Split Recommended'}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setDaysPerWeek(num)
                    if (num <= 3) setSplitType('FULL_BODY')
                    else if (num === 4) setSplitType('UPPER_LOWER')
                    else setSplitType('PUSH_PULL_LEGS')
                  }}
                  className={`py-3 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                    daysPerWeek === num
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {num}d
                </button>
              ))}
            </div>
            {stepErrors.days && <p className="mt-1 text-xs text-rose-600">{stepErrors.days}</p>}
          </div>

          {/* Split Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Split Structure *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'FULL_BODY', title: 'Full Body', desc: 'Each session stimulates major muscle groups with 48h rest between sessions' },
                { id: 'UPPER_LOWER', title: 'Upper / Lower', desc: 'Alternates upper body torso days with lower body and core days' },
                { id: 'PUSH_PULL_LEGS', title: 'Push / Pull / Legs (PPL)', desc: 'Chest/shoulders/triceps, then back/biceps, then legs & abs' },
                { id: 'BODY_PART', title: 'Body-Part Split (Bro Split)', desc: '1-2 muscle groups targeted intensely per individual session' },
                { id: 'PRIORITY_SPLIT', title: 'Muscle Priority Split', desc: 'Higher frequency on lagging muscles with maintenance volume on others' },
                { id: 'AI_CUSTOM', title: 'AI-Recommended Split', desc: 'Let Gemini optimize split distribution for your frequency and goals' },
              ].map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setSplitType(sp.id as SplitType)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    splitType === sp.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs block">{sp.title}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">{sp.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Session Duration */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Target Session Duration *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[30, 45, 60, 75, 90].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSessionDurationMins(dur)}
                  className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                    sessionDurationMins === dur
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {dur}m
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Weekdays */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Preferred Training Days <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const active = preferredDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Exercises to Avoid */}
          <div>
            <label htmlFor="wizard-avoid" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Exercises to Avoid / Disliked Movements <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="wizard-avoid"
              type="text"
              value={exercisesToAvoid}
              onChange={(e) => setExercisesToAvoid(e.target.value)}
              placeholder="e.g. Barbell Deadlifts, Behind-the-neck Press, Burpees"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* ─── STEP 4: SAFETY, LIMITATIONS & MEDICAL ADVISORY ─── */}
      {currentStep === 4 && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 4: Safety Considerations & Restrictions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Help the AI avoid movements that stress vulnerable joints or exacerbate previous injuries.
            </p>
          </div>

          <div>
            <label htmlFor="wizard-injuries" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Joint Issues, Pain, or Physical Restrictions <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="wizard-injuries"
              rows={4}
              value={injuriesOrLimitations}
              onChange={(e) => setInjuriesOrLimitations(e.target.value)}
              placeholder="e.g. Mild rotator cuff sensitivity with wide grip pressing; prefer neutral dumbbell grip. Left knee clicks during deep squats."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="wizard-recovery" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Recovery Habits / Preferences <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="wizard-recovery"
              type="text"
              value={recoveryPreferences}
              onChange={(e) => setRecoveryPreferences(e.target.value)}
              placeholder="e.g. Prefer foam rolling and dynamic stretches, need at least 2 full rest days"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Strict Medical Disclaimer Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Medical Safety Advisory</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
              Prota AI Workout Planner generates fitness programs based on generalized exercise physiology principles. It never diagnoses injuries, prescribes orthopedic rehabilitation, or advises exercising through pain. If you have an active joint injury or chronic condition, consult a licensed physical therapist or physician before initiating this routine.
            </p>
          </div>
        </div>
      )}

      {/* ─── STEP 5: REVIEW & GENERATE ─── */}
      {currentStep === 5 && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 5: Review Selections & Generate Plan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Confirm your training variables before invoking Gemini to build your structured program.
            </p>
          </div>

          {/* Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Goal</span>
                <span className="font-semibold text-slate-900 dark:text-white">{primaryGoal}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                <span className="font-semibold text-slate-900 dark:text-white">{location}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience</span>
                <span className="font-semibold text-slate-900 dark:text-white">{experienceLevel}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Split Type</span>
                <span className="font-semibold text-slate-900 dark:text-white">{splitType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Frequency</span>
                <span className="font-semibold text-slate-900 dark:text-white">{daysPerWeek} days / week</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                <span className="font-semibold text-slate-900 dark:text-white">{sessionDurationMins} minutes</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Target Muscle Groups</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedMuscles.map((m) => (
                  <span key={m} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[11px]">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Available Equipment</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedEquipment.map((eq) => (
                  <span key={eq} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[11px]">
                    {eq}
                  </span>
                ))}
              </div>
            </div>

            {injuriesOrLimitations.trim() && (
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Reported Restrictions</span>
                <p className="text-amber-700 dark:text-amber-400 text-xs">{injuriesOrLimitations}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between max-w-2xl mx-auto">
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

        {currentStep < 5 ? (
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
                Generate AI Workout Plan
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
