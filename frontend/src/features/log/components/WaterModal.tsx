import { useState, useEffect, useId } from 'react'
import { X, Droplet, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { foodLogService } from '../services/foodLogService'
import { Button } from '../../../components/ui/Button'
import type { WaterEntryResponse } from '../../../types/api'

interface WaterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  date: string
  waterGoalMl?: number | null
}

export function WaterModal({
  isOpen,
  onClose,
  onSuccess,
  date,
  waterGoalMl = 2500,
}: WaterModalProps) {
  const [customAmount, setCustomAmount] = useState('250')
  const [entries, setEntries] = useState<WaterEntryResponse[]>([])
  const [isLoadingEntries, setIsLoadingEntries] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const customAmountId = useId()

  const loadEntries = async () => {
    setIsLoadingEntries(true)
    try {
      const data = await foodLogService.getDailyWater(date)
      setEntries(data)
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
    }
  }, [isOpen, date])

  if (!isOpen) return null

  const handleAddWater = async (amount: number) => {
    if (amount <= 0 || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    try {
      await foodLogService.addWater({
        amountMl: amount,
        entryDate: date,
        consumedAt: new Date().toISOString(),
      })
      await loadEntries()
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log water.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    try {
      await foodLogService.deleteWater(id)
      await loadEntries()
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete water entry.'
      setError(msg)
    }
  }

  const totalConsumed = entries.reduce((acc, curr) => acc + curr.amountMl, 0)
  const goal = waterGoalMl || 2500
  const progressPct = Math.min(100, Math.round((totalConsumed / goal) * 100))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="water-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="relative w-full max-w-md my-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="water-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Hydration Tracker
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {date} • Goal: {goal.toLocaleString()} ml
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

          {/* Progress Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Consumed Today
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {totalConsumed.toLocaleString()} <span className="text-sm font-medium text-slate-500">ml</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-200/70 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200">
                {progressPct}% of target
              </span>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Quick Add
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[250, 500, 750].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAddWater(amt)}
                  disabled={isSubmitting}
                  className="py-2.5 px-3 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 transition-colors text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  +{amt} ml
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label htmlFor={customAmountId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Amount (ml)
            </label>
            <div className="flex gap-2">
              <input
                id={customAmountId}
                type="number"
                min="10"
                max="5000"
                step="10"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAddWater(parseInt(customAmount, 10) || 0)}
                disabled={isSubmitting || !customAmount}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Today's log history */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Entries for this date
            </h3>
            {isLoadingEntries ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading...
              </div>
            ) : entries.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No water logged for this day yet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">
                      +{entry.amountMl} ml
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">
                        {new Date(entry.consumedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        aria-label="Delete water entry"
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
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
