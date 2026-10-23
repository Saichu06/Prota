import React, { useState } from 'react'
import {
  Target,
  Flame,
  Droplet,
  Scale,
  Globe,
  Palette,
  Check,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { useTheme } from '../../../hooks/useTheme'
import { COMMON_TIMEZONES } from '../../../lib/date-utils'
import { ApiError } from '../../../lib/api-client'
import { useFont } from '../../../hooks/useFont'
import { FONT_OPTIONS } from '../../../lib/fonts'
import type { WeightUnit, ThemePreference, UserSettings } from '../../../types/api'

interface SettingsFormProps {
  initialSettings: UserSettings | null
}

function SettingsForm({ initialSettings }: SettingsFormProps) {
  const { updateSettings } = useAuth()
  const { success } = useToast()
  const { setTheme } = useTheme()
  const { font, setFont } = useFont()

  const [proteinGoalG, setProteinGoalG] = useState<string>(
    initialSettings?.proteinGoalG ? String(initialSettings.proteinGoalG) : '140'
  )
  const [calorieGoalKcal, setCalorieGoalKcal] = useState<string>(
    initialSettings?.calorieGoalKcal ? String(initialSettings.calorieGoalKcal) : ''
  )
  const [waterGoalMl, setWaterGoalMl] = useState<string>(
    initialSettings?.waterGoalMl ? String(initialSettings.waterGoalMl) : ''
  )
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialSettings?.weightUnit || 'KG')
  const [timezone, setTimezone] = useState<string>(initialSettings?.timezone || 'UTC')
  const [theme, setLocalTheme] = useState<ThemePreference>(initialSettings?.theme || 'SYSTEM')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleReset = () => {
    if (initialSettings) {
      setProteinGoalG(initialSettings.proteinGoalG ? String(initialSettings.proteinGoalG) : '140')
      setCalorieGoalKcal(initialSettings.calorieGoalKcal ? String(initialSettings.calorieGoalKcal) : '')
      setWaterGoalMl(initialSettings.waterGoalMl ? String(initialSettings.waterGoalMl) : '')
      setWeightUnit(initialSettings.weightUnit || 'KG')
      setTimezone(initialSettings.timezone || 'UTC')
      setLocalTheme(initialSettings.theme || 'SYSTEM')
      setErrors({})
      setHasChanges(false)
    }
  }

  // Track whether form has unsaved edits
  const handleFieldChange = () => {
    setHasChanges(true)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    const proteinNum = parseFloat(proteinGoalG)
    if (isNaN(proteinNum) || proteinNum < 1) {
      newErrors.proteinGoalG = 'Protein goal must be at least 1.00 gram'
    } else if (proteinNum > 1000) {
      newErrors.proteinGoalG = 'Protein goal cannot exceed 1000 grams'
    }

    if (calorieGoalKcal && calorieGoalKcal.trim() !== '') {
      const calNum = parseFloat(calorieGoalKcal)
      if (isNaN(calNum) || calNum <= 0) {
        newErrors.calorieGoalKcal = 'Calorie goal must be a positive number'
      }
    }

    if (waterGoalMl && waterGoalMl.trim() !== '') {
      const waterNum = parseInt(waterGoalMl, 10)
      if (isNaN(waterNum) || waterNum <= 0) {
        newErrors.waterGoalMl = 'Water goal must be a positive integer in ml'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = {
        proteinGoalG: parseFloat(proteinGoalG),
        calorieGoalKcal: calorieGoalKcal.trim() ? parseFloat(calorieGoalKcal) : null,
        waterGoalMl: waterGoalMl.trim() ? parseInt(waterGoalMl, 10) : null,
        weightUnit,
        timezone: timezone.trim() || 'UTC',
        theme,
      }

      const updated = await updateSettings(payload)
      success('Goals and preferences updated successfully!')
      setHasChanges(false)

      // Ensure local theme state syncs immediately
      if (updated.theme) {
        setTheme(updated.theme === 'DARK' ? 'dark' : updated.theme === 'LIGHT' ? 'light' : 'system')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({
          general: err.message || 'Failed to update settings',
          proteinGoalG: err.getFieldError('proteinGoalG') || '',
          calorieGoalKcal: err.getFieldError('calorieGoalKcal') || '',
          waterGoalMl: err.getFieldError('waterGoalMl') || '',
          timezone: err.getFieldError('timezone') || '',
        })
      } else {
        setErrors({ general: 'Network error saving settings' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Goals & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure your daily intake targets, measurement units, and interface theme.
          </p>
        </div>

        {hasChanges && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
            Unsaved Changes
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Section 1: Daily Nutrition Targets */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Intake Targets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These goals power your daily completion progress bars and calculations.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Protein Goal */}
            <Input
              label="Daily Protein Goal (Grams)"
              type="number"
              step="0.5"
              min="1"
              max="1000"
              required
              value={proteinGoalG}
              onChange={(e) => {
                setProteinGoalG(e.target.value)
                handleFieldChange()
              }}
              error={errors.proteinGoalG}
              leftIcon={<Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              helperText="Recommended target based on your body composition goals (min 1g)."
              disabled={isSubmitting}
            />

            {/* Calorie Goal */}
            <Input
              label="Daily Calorie Goal (kcal) — Optional"
              type="number"
              step="10"
              min="0"
              placeholder="e.g. 2000"
              value={calorieGoalKcal}
              onChange={(e) => {
                setCalorieGoalKcal(e.target.value)
                handleFieldChange()
              }}
              error={errors.calorieGoalKcal}
              leftIcon={<Flame className="w-4 h-4 text-amber-500" />}
              helperText="Leave blank if you prefer tracking protein only."
              disabled={isSubmitting}
            />

            {/* Water Goal */}
            <Input
              label="Daily Water Intake Goal (ml) — Optional"
              type="number"
              step="50"
              min="0"
              placeholder="e.g. 2500"
              value={waterGoalMl}
              onChange={(e) => {
                setWaterGoalMl(e.target.value)
                handleFieldChange()
              }}
              error={errors.waterGoalMl}
              leftIcon={<Droplet className="w-4 h-4 text-sky-500" />}
              helperText="Track daily hydration in millilitres (e.g. 2500ml = 2.5 Litres)."
              disabled={isSubmitting}
            />

            {/* Immutability Note */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5 mt-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-800 dark:text-slate-200">Historical Integrity Guarantee:</strong> Changing current target goals updates future days only. Past logged dates keep their recorded snapshots to preserve accurate streaks.
              </p>
            </div>
          </div>
        </Card>

        {/* Section 2: Regional & Units Preferences */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Units & Regional Preferences
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Measurement system and local timezone for day boundaries.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight Unit */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Weight Measurement Unit
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(['KG', 'LB'] as WeightUnit[]).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => {
                      setWeightUnit(unit)
                      handleFieldChange()
                    }}
                    className={`py-2 px-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
                      weightUnit === unit
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>{unit === 'KG' ? 'Kilograms (kg)' : 'Pounds (lb)'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="timezone-select" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Active Timezone
              </label>
              <div className="relative mt-1">
                <select
                  id="timezone-select"
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value)
                    handleFieldChange()
                  }}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Determines midnight reset for food logs.
              </span>
            </div>
          </div>
        </Card>

        {/* Section 3: Appearance & Theme */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Appearance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Color scheme and typography for the whole application.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Interface Color Mode
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current preference will sync with your authenticated profile.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['LIGHT', 'DARK', 'SYSTEM'] as ThemePreference[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setLocalTheme(t)
                    setTheme(t === 'DARK' ? 'dark' : t === 'LIGHT' ? 'light' : 'system')
                    handleFieldChange()
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    theme === t
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family — applies instantly, stored on this device */}
          <fieldset className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <legend className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Font Family
            </legend>
            <p id="font-family-help" className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
              Applies immediately across the app. Saved on this device.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" aria-describedby="font-family-help">
              {FONT_OPTIONS.map((option) => {
                const selected = font === option.id
                return (
                  <label key={option.id} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="app-font"
                      id={`font-option-${option.id}`}
                      value={option.id}
                      checked={selected}
                      onChange={() => setFont(option.id)}
                      className="peer sr-only"
                    />
                    <span
                      data-font={option.id}
                      className={`font-preview flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/50 ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span>
                        {option.label}
                        {option.id === 'inter' && (
                          <span className="ml-1.5 text-[11px] text-slate-500 dark:text-slate-400">(default)</span>
                        )}
                      </span>
                      {selected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </Card>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleReset}
            disabled={!hasChanges || isSubmitting}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Revert Changes
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={!hasChanges}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  )
}

export function SettingsPage() {
  const { settings, isLoading } = useAuth()

  if (isLoading && !settings) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Loading preferences...
      </div>
    )
  }

  return <SettingsForm key={settings?.updatedAt || 'settings'} initialSettings={settings} />
}
