export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'

export interface UserResponse {
  id: string
  fullName: string
  email: string
  status: UserStatus
  emailVerifiedAt: string | null
  profilePictureUrl?: string | null
  createdAt: string
}

export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM'
export type WeightUnit = 'KG' | 'LB'

export interface SettingsResponse {
  userId: string
  proteinGoalG: number
  calorieGoalKcal: number | null
  waterGoalMl: number | null
  weightUnit: WeightUnit
  timezone: string
  theme: ThemePreference
  updatedAt: string
}

export type UserSettings = SettingsResponse

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  fullName: string
}

export interface UpdateSettingsRequest {
  proteinGoalG: number
  calorieGoalKcal?: number | null
  waterGoalMl?: number | null
  weightUnit: WeightUnit
  timezone?: string
  theme: ThemePreference
}

export interface CsrfResponse {
  token: string
  headerName: string
  parameterName: string
}

export interface FieldErrorDetail {
  field: string
  message: string
  rejectedValue?: unknown
}

export interface ErrorResponse {
  code: string
  message: string
  status: number
  timestamp: string
  fieldErrors?: FieldErrorDetail[]
  details?: Record<string, unknown>
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
export type NutritionSource = 'MANUAL' | 'VERIFIED_DATABASE' | 'AI_GEMINI_MULTIMODAL' | 'CUSTOM_RECIPE' | 'SAVED_FOOD' | 'AI_CONFIRMED' | 'EXTERNAL_DATABASE'

export interface FoodEntryResponse {
  id: string
  dailyLogId: string
  savedFoodId?: string | null
  aiEstimateId?: string | null
  foodName: string
  mealType: MealType
  category?: string | null
  quantity: number
  quantityUnit: string
  proteinG: number
  caloriesKcal?: number | null
  carbohydratesG?: number | null
  fatG?: number | null
  nutritionSource: NutritionSource
  notes?: string | null
  consumedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface DailyLogResponse {
  id?: string | null
  logDate: string
  timezone: string
  proteinGoalG: number
  calorieGoalKcal: number
  waterGoalMl: number
  consumedProteinG: number
  consumedCaloriesKcal: number
  consumedCarbohydratesG: number
  consumedFatG: number
  hasIncompleteCalories: boolean
  proteinRemainingG: number
  proteinCompletionPercentage: number
  consumedWaterMl?: number | null
  recordedWeightKg?: number | null
  foodEntries: FoodEntryResponse[]
}

export interface CreateFoodEntryRequest {
  foodName: string
  mealType: MealType
  category?: string
  quantity: number
  quantityUnit: string
  proteinG: number
  caloriesKcal?: number | null
  carbohydratesG?: number | null
  fatG?: number | null
  nutritionSource?: NutritionSource
  notes?: string
  consumedAt?: string
  savedFoodId?: string | null
  aiEstimateId?: string | null
}

export interface UpdateFoodEntryRequest {
  foodName: string
  mealType: MealType
  category?: string
  quantity: number
  quantityUnit: string
  proteinG: number
  caloriesKcal?: number | null
  carbohydratesG?: number | null
  fatG?: number | null
  notes?: string
  consumedAt?: string
}

export interface WaterEntryResponse {
  id: string
  entryDate: string
  amountMl: number
  consumedAt: string
  createdAt: string
}

export interface CreateWaterEntryRequest {
  amountMl: number
  entryDate: string
  consumedAt?: string
}

export interface WeightEntryResponse {
  id: string
  weightKg: number
  entryDate: string
  notes?: string | null
  recordedAt: string
  createdAt: string
}

export interface CreateWeightEntryRequest {
  weightKg: number
  entryDate: string
  notes?: string
  recordedAt?: string
}

export interface SavedFoodResponse {
  id: string
  name: string
  category?: string | null
  brand?: string | null
  servingQuantity: number
  servingUnit: string
  proteinG: number
  caloriesKcal?: number | null
  carbohydratesG?: number | null
  fatG?: number | null
  notes?: string | null
  externalSource?: string | null
  createdAt: string
}

export interface CreateSavedFoodRequest {
  name: string
  category?: string | null
  brand?: string
  servingQuantity: number
  servingUnit: string
  proteinG: number
  caloriesKcal?: number
  carbohydratesG?: number
  fatG?: number
  notes?: string | null
}

export interface AnalyticsDailyPoint {
  date: string
  proteinG: number | null
  proteinGoalG: number
  caloriesKcal: number | null
  calorieGoalKcal: number | null
  waterMl: number | null
  weightKg: number | null
  hasData: boolean
  foodEntriesCount: number
}

export interface AnalyticsSummaryResponse {
  fromDate: string
  toDate: string
  totalDaysInRange: number
  trackedDaysCount: number
  averageProteinG: number | null
  averageCaloriesKcal: number | null
  proteinGoalAdherencePercentage: number | null
  calorieGoalAdherencePercentage: number | null
  totalWaterMl: number
  averageWaterMl: number | null
  startWeightKg: number | null
  latestWeightKg: number | null
  weightChangeKg: number | null
  dailyData: AnalyticsDailyPoint[]
  insights: string[]
}

export interface AiFoodItemDto {
  foodName: string
  mealType: MealType
  quantity: number
  quantityUnit: string
  proteinG: number
  caloriesKcal?: number | null
  carbohydratesG?: number | null
  fatG?: number | null
  confidence?: number | null
  notes?: string | null
}

export interface AiTextEstimateRequest {
  description: string
  mealType?: MealType
  date?: string
}

export interface AiFoodEstimateResponse {
  estimateId?: string | null
  status: 'SUCCESS' | 'UNAVAILABLE' | 'FAILED'
  errorCode?: string | null
  message?: string | null
  items: AiFoodItemDto[]
}

export interface AiChatMessage {
  role: 'user' | 'model' | 'assistant'
  content: string
}

export interface GroundedNutritionSummaryDto {
  date: string
  proteinGoalG: number
  calorieGoalKcal: number
  waterGoalMl: number
  weightUnit: string
  consumedProteinG: number
  consumedCaloriesKcal: number
  consumedWaterMl?: number | null
  recordedWeightKg?: number | null
  proteinRemainingG: number
  proteinCompletionPercentage: number
  loggedFoodItems: string[]
  hasRecords: boolean
}

export interface AiChatRequest {
  message: string
  contextDate?: string
  conversationHistory?: AiChatMessage[]
}

export interface AiChatResponse {
  reply?: string | null
  status: 'SUCCESS' | 'UNAVAILABLE' | 'ERROR' | 'RATE_LIMITED'
  errorCode?: string | null
  message?: string | null
  groundedSummary?: GroundedNutritionSummaryDto | null
  suggestions?: string[]
  disclaimer?: string
  timestamp: string
}

// ─── PHASE 6A: AI DIET PLANNER TYPES ───
export type DietGoal = 'MUSCLE_GAIN' | 'FAT_LOSS' | 'WEIGHT_MAINTENANCE' | 'GENERAL_FITNESS'

export interface DietPlanMealFoodDto {
  name: string
  quantity: number
  quantityUnit: string
  proteinG: number
  caloriesKcal?: number | null
  carbohydratesG?: number | null
  fatG?: number | null
  notes?: string | null
}

export interface DietPlanMealDto {
  mealName: string
  timing?: string
  foods: DietPlanMealFoodDto[]
  totalCaloriesKcal: number
  totalProteinG: number
  totalCarbohydratesG?: number | null
  totalFatG?: number | null
}

export interface DietPlanSubstitutionDto {
  originalFood: string
  alternativeFood: string
  notes?: string
}

export interface DietPlanShoppingCategoryDto {
  category: string
  items: string[]
}

export interface DietPlanDetailDto {
  title: string
  goal: DietGoal
  creationDate: string
  userAssumptions: Record<string, unknown>
  dailyCaloriesKcal: number
  dailyProteinG: number
  dailyCarbohydratesG?: number | null
  dailyFatG?: number | null
  meals: DietPlanMealDto[]
  practicalSubstitutions?: DietPlanSubstitutionDto[]
  shoppingList?: DietPlanShoppingCategoryDto[]
  mealPrepTips?: string[]
  hydrationGuidance?: string
  safetyNotes?: string[]
  disclaimer?: string
}

export interface DietPlanGenerateRequest {
  age: number
  gender: string
  heightCm: number
  currentWeightKg: number
  targetWeightKg?: number
  activityLevel: string
  goal: DietGoal
  timeframeWeeks?: number
  trainingFrequencyPerWeek?: number
  mealFrequency?: number
  dietaryPreference?: string
  allergies?: string[]
  dislikedFoods?: string[]
  preferredCuisine?: string
  budget?: string
  cookingTime?: string
  medicalConditionsOrNotes?: string
}

export interface SaveDietPlanRequest {
  title: string
  goal: DietGoal
  dailyCaloriesKcal: number
  dailyProteinG: number
  dailyCarbohydratesG?: number | null
  dailyFatG?: number | null
  planDetail: DietPlanDetailDto
}

export interface DietPlanSummaryResponse {
  id: string
  title: string
  goal: DietGoal
  dailyCaloriesKcal: number
  dailyProteinG: number
  dailyCarbohydratesG?: number | null
  dailyFatG?: number | null
  createdAt: string
  updatedAt: string
}

export interface DietPlanResponse {
  id: string
  title: string
  goal: DietGoal
  dailyCaloriesKcal: number
  dailyProteinG: number
  dailyCarbohydratesG?: number | null
  dailyFatG?: number | null
  planDetail: DietPlanDetailDto
  createdAt: string
  updatedAt: string
}

// --- Phase 6B: Workout Planner Types ---

export type WorkoutGoal =
  | 'MUSCLE_HYPERTROPHY'
  | 'STRENGTH'
  | 'GENERAL_FITNESS'
  | 'ENDURANCE'
  | 'BODY_RECOMPOSITION'
  | 'BEGINNER_FITNESS'

export type TrainingLocation = 'HOME' | 'GYM'

export type SplitType =
  | 'FULL_BODY'
  | 'UPPER_LOWER'
  | 'PUSH_PULL_LEGS'
  | 'BODY_PART'
  | 'PRIORITY_SPLIT'
  | 'AI_CUSTOM'

export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export interface WorkoutExerciseDto {
  name: string
  primaryTarget: string
  secondaryTargets?: string[]
  sets: number
  repsOrDuration: string
  restSeconds: number
  equipment: string
  instructions: string
  alternativeExercise?: string
}

export interface WorkoutSessionDto {
  dayNumber: number
  dayName: string
  sessionTitle: string
  isRestDay: boolean
  muscleGroupsEmphasized: string[]
  warmupGuidance: string
  cooldownGuidance: string
  exercises: WorkoutExerciseDto[]
}

export interface WorkoutPlanDetailDto {
  title: string
  primaryGoal: WorkoutGoal
  trainingLocation: TrainingLocation
  experienceLevel: ExperienceLevel
  splitType: SplitType
  daysPerWeek: number
  sessionDurationMins: number
  creationDate?: string
  userAssumptions?: Record<string, unknown>
  sessions: WorkoutSessionDto[]
  progressionTips?: string[]
  recoveryAndDeloadTips?: string[]
  safetyNotes?: string[]
  disclaimer?: string
}

export interface WorkoutPlanGenerateRequest {
  age?: number
  heightCm?: number
  weightKg?: number
  experienceLevel: ExperienceLevel
  primaryGoal: WorkoutGoal
  secondaryGoal?: WorkoutGoal
  targetMuscleGroups?: string[]
  trainingLocation: TrainingLocation
  availableEquipment?: string[]
  equipmentRestrictions?: string
  daysPerWeek: number
  splitType: SplitType
  sessionDurationMins: number
  preferredTrainingDays?: string[]
  preferredExerciseTypes?: string[]
  exercisesToAvoid?: string[]
  injuriesOrLimitations?: string
  recoveryPreferences?: string
}

export interface SaveWorkoutPlanRequest {
  title: string
  primaryGoal: WorkoutGoal
  trainingLocation: TrainingLocation
  splitType: SplitType
  daysPerWeek: number
  sessionDurationMins: number
  experienceLevel: ExperienceLevel
  planDetail: WorkoutPlanDetailDto
}

export interface WorkoutPlanSummaryResponse {
  id: string
  title: string
  primaryGoal: WorkoutGoal
  trainingLocation: TrainingLocation
  splitType: SplitType
  daysPerWeek: number
  sessionDurationMins: number
  experienceLevel: ExperienceLevel
  createdAt: string
  updatedAt: string
}

export interface WorkoutPlanResponse {
  id: string
  title: string
  primaryGoal: WorkoutGoal
  trainingLocation: TrainingLocation
  splitType: SplitType
  daysPerWeek: number
  sessionDurationMins: number
  experienceLevel: ExperienceLevel
  planDetail: WorkoutPlanDetailDto
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────────
// Phase 6C: Improve My Progress Types
// ─────────────────────────────────────────────────────────────

export interface DataCoverageDto {
  totalCalendarDays: number
  foodTrackedDays: number
  waterTrackedDays: number
  weightRecordedDays: number
  trackingConsistencyPercentage: number
  hasSufficientData: boolean
  limitationsNote: string
}

export interface ProteinMetricsDto {
  averageIntakeG: number | null
  baselineGoalG: number
  isHistoricalGoal: boolean
  daysMeetingGoal: number
  daysBelowGoal: number
  daysAboveGoal: number
  goalAdherencePercentage: number | null
  trendDirection: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'INSUFFICIENT_DATA'
}

export interface CalorieMetricsDto {
  averageIntakeKcal: number | null
  baselineGoalKcal: number
  isHistoricalGoal: boolean
  daysOnTarget: number
  daysBelowGoal: number
  daysAboveGoal: number
  goalAdherencePercentage: number | null
  trendDirection: 'BALANCED' | 'DEFICIT' | 'SURPLUS' | 'INSUFFICIENT_DATA'
}

export interface HydrationMetricsDto {
  averageWaterMl: number | null
  baselineGoalMl: number
  isHistoricalGoal: boolean
  daysMeetingGoal: number
  daysTracked: number
  goalAdherencePercentage: number | null
  status: 'OPTIMAL' | 'DEFICIT' | 'INSUFFICIENT_DATA'
}

export interface WeightMetricsDto {
  measurementCount: number
  weightUnit: string
  startWeight: number | null
  latestWeight: number | null
  weightChange: number | null
  startDate: string | null
  latestDate: string | null
  hasSufficientMeasurements: boolean
  trendDirection: 'DECREASING' | 'INCREASING' | 'STABLE' | 'INCONCLUSIVE'
}

export interface VerifiedMetricsDto {
  protein: ProteinMetricsDto
  calories: CalorieMetricsDto
  hydration: HydrationMetricsDto
  weight: WeightMetricsDto
}

export interface DetectedPatternDto {
  id: string
  category: 'PROTEIN' | 'CALORIES' | 'HYDRATION' | 'WEIGHT' | 'CONSISTENCY'
  type: 'POSITIVE' | 'OPPORTUNITY' | 'OBSERVATION'
  title: string
  description: string
  dateRange: string
  supportingMetric: string
  recordedDaysCount: number
  limitations: string
}

export interface AiRecommendationDto {
  id: string
  title: string
  observation: string
  practicalAction: string
  expectedImprovement: string
  uncertaintyOrLimitation: string
  category: 'PROTEIN' | 'CALORIES' | 'HYDRATION' | 'HABITS'
}

export interface AiImprovementSummaryDto {
  status: 'SUCCESS' | 'UNAVAILABLE' | 'ERROR' | 'INSUFFICIENT_DATA'
  statusMessage: string
  executiveSummary: string
  doingWellHighlights: string[]
  recommendations: AiRecommendationDto[]
  fitnessContextNote?: string | null
  safetyDisclaimer: string
}

export interface ProgressImprovementResponse {
  fromDate: string
  toDate: string
  totalDaysInRange: number
  dataCoverage: DataCoverageDto
  verifiedMetrics: VerifiedMetricsDto
  dailyTrends: AnalyticsDailyPoint[]
  detectedPatterns: DetectedPatternDto[]
  aiSummary: AiImprovementSummaryDto
}


