import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import type { DetectedPatternDto } from '../../../types/api'

interface DetectedPatternsSectionProps {
  patterns: DetectedPatternDto[]
}

export function DetectedPatternsSection({ patterns }: DetectedPatternsSectionProps) {
  const positivePatterns = patterns.filter((p) => p.type === 'POSITIVE')
  const opportunityPatterns = patterns.filter((p) => p.type === 'OPPORTUNITY')
  const observationPatterns = patterns.filter((p) => p.type === 'OBSERVATION')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Evidence-Based Pattern Detection</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Verified Data
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic observations derived from your recorded meals, hydration, and weight logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── WHAT'S GOING WELL ─── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h3>What's Going Well ({positivePatterns.length})</h3>
          </div>

          {positivePatterns.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 text-center">
              No strong positive patterns detected yet. Log more days to evaluate adherence streaks.
            </div>
          ) : (
            <div className="space-y-3">
              {positivePatterns.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs space-y-2 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {p.title}
                    </h4>
                    <span className="shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      {p.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      Metric: {p.supportingMetric}
                    </span>
                    <span className="italic">{p.limitations}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── AREAS TO IMPROVE ─── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3>Areas to Improve ({opportunityPatterns.length})</h3>
          </div>

          {opportunityPatterns.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 text-center">
              No major deficits or gaps observed in the recorded period!
            </div>
          ) : (
            <div className="space-y-3">
              {opportunityPatterns.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 dark:border-amber-500/30 shadow-xs space-y-2 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {p.title}
                    </h4>
                    <span className="shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      {p.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      Metric: {p.supportingMetric}
                    </span>
                    <span className="italic">{p.limitations}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Observations (if any) */}
      {observationPatterns.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>Additional Observations</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {observationPatterns.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">{p.title}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{p.category}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">{p.description}</p>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>{p.supportingMetric}</span>
                  <span className="italic text-[10px]">{p.limitations}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
