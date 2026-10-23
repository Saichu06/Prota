import { useState, useEffect, useId } from 'react'
import { X, Scale, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { foodLogService } from '../services/foodLogService'
import { Button } from '../../../components/ui/Button'
import type { WeightEntryResponse, WeightUnit } from '../../../types/api'

interface WeightModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  date: string
  weightUnit?: WeightUnit
  currentWeightKg?: number | null
}

export function WeightModal({
  isOpen,
  onClose,
  onSuccess,
  date,
  weightUnit = 'KG',
  currentWeightKg,
}: WeightModalProps) {
  // If user prefers LB, display in LB: 1 kg = 2.20462 lb
  const toDisplay = (kg: number) =>
    weightUnit === 'LB' ? (kg * 2.20462).toFixed(1) : kg.toFixed(1)
  const toKg = (val: number) =>
    weightUnit === 'LB' ? val / 2.20462 : val

  const [weightInput, setWeightInput] = useState(
    currentWeightKg ? toDisplay(currentWeightKg) : ''
  )
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState<WeightEntryResponse[]>([])
  const [isLoadingEntries, setIsLoadingEntries] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weightInputId = useId()
  const notesId = useId()

  const loadEntries = async () => {
    setIsLoadingEntries(true)
    try {
      const data = await foodLogService.getDailyWeight(date)
      setEntries(data)
      if (data.length > 0 && !weightInput) {
        setWeightInput(toDisplay(data[0].weightKg))
      }
    } catch {
      setEntries([])
    } finally {
      setIsLoadingEntries(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadEntries()
      setError(null)
      if (currentWeightKg) {
        setWeightInput(toDisplay(currentWeightKg))
      }
    }
  }, [isOpen, date, currentWeightKg, weightUnit])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(weightInput)
    if (isNaN(val) || val <= 0 || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const kg = Math.round(toKg(val) * 1000) / 1000
      await foodLogService.addWeight({
        weightKg: kg,
        entryDate: date,
        notes: notes.trim() || undefined,
        recordedAt: new Date().toISOString(),
      })
      await loadEntries()
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save weight recording.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await foodLogService.deleteWeight(id)
      await loadEntries()
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete weight entry.'
      setError(msg)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="weight-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="relative w-full max-w-md my-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="weight-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Record Weight
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {date} • Unit: {weightUnit}
              </p>
            </div>
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="weight-form" onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor={weightInputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Body Weight ({weightUnit}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id={weightInputId}
                  type="number"
                  step="0.1"
                  min="1"
                  max="1500"
                  required
                  placeholder={weightUnit === 'LB' ? '165.0' : '75.0'}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                  {weightUnit}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor={notesId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional Notes
              </label>
              <input
                id={notesId}
                type="text"
                placeholder="e.g. Morning fasted weigh-in"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </form>

          {/* Past entries for this day */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Recordings for this date
            </h3>
            {isLoadingEntries ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </div>
            ) : entries.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">
                No weight logged for this date yet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {toDisplay(entry.weightKg)} {weightUnit}
                      </span>
                      {entry.notes && (
                        <span className="ml-2 text-slate-500 dark:text-slate-400 italic">
                          ({entry.notes})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">
                        {new Date(entry.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        aria-label="Delete weight recording"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            form="weight-form"
            disabled={isSubmitting || !weightInput}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Weight'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
