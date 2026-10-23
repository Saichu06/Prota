import { Sparkles, ArrowRight, ShieldAlert, AlertCircle, RefreshCw, CheckCircle, Info, Dumbbell } from 'lucide-react'
import type { AiImprovementSummaryDto } from '../../../types/api'
import { Button } from '../../../components/ui/Button'

interface AiRecommendationsSectionProps {
  aiSummary: AiImprovementSummaryDto
  onRetry: () => void
  isLoading?: boolean
}

export function AiRecommendationsSection({
  aiSummary,
  onRetry,
  isLoading = false,
}: AiRecommendationsSectionProps) {
  const {
    status,
    statusMessage,
    executiveSummary,
    doingWellHighlights,
    recommendations,
    fitnessContextNote,
    safetyDisclaimer,
  } = aiSummary

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'PROTEIN':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
      case 'CALORIES':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
      case 'HYDRATION':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20'
      default:
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
    }
  }

  return (
    <div className="space-y-6 pt-4 border-t border-slate-200/80 dark:border-slate-800">
      {/* ─── SECTION HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Personalized Recommendations
            </h2>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Grounded AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Synthesized recommendations formulated from your verified metrics and detected patterns.
          </p>
        </div>

        {fitnessContextNote && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
            <span>{fitnessContextNote}</span>
          </div>
        )}
      </div>

      {/* ─── STATUS: INSUFFICIENT DATA ─── */}
      {status === 'INSUFFICIENT_DATA' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Insufficient Data for Reliable AI Advice
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {statusMessage || 'Personalized AI recommendations require at least 2 to 3 days of recorded meals to synthesize actionable improvements.'}
            </p>
          </div>
        </div>
      )}

      {/* ─── STATUS: UNAVAILABLE OR ERROR ─── */}
      {(status === 'UNAVAILABLE' || status === 'ERROR') && (
        <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-500/30 text-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Personalized AI Recommendations Unavailable
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {statusMessage || 'AI synthesis could not be generated at this time. Your verified metrics, calculations, and detected patterns remain fully accurate above.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isLoading}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Retry AI Generation
            </Button>
          </div>
        </div>
      )}

      {/* ─── STATUS: SUCCESS ─── */}
      {status === 'SUCCESS' && (
        <div className="space-y-5">
          {/* Executive Summary */}
          {executiveSummary && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Executive Trajectory Summary</span>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {executiveSummary}
              </p>

              {doingWellHighlights && doingWellHighlights.length > 0 && (
                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Recognized Strengths:
                  </span>
                  {doingWellHighlights.map((highlight, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      {highlight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actionable Recommendations List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Priority Action Steps</span>
              <span className="text-xs font-normal text-slate-500">
                ({recommendations.length} actionable suggestions)
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryColor(rec.category)}`}>
                        {rec.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{rec.id}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {rec.title}
                    </h4>

                    {/* Data Observation */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                        Observed from Data:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {rec.observation}
                      </p>
                    </div>

                    {/* Practical Action */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                        <ArrowRight className="w-3 h-3" />
                        Practical Action:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {rec.practicalAction}
                      </p>
                    </div>

                    {/* Expected Improvement */}
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Expected Benefit:
                      </span>
                      <p>{rec.expectedImprovement}</p>
                    </div>
                  </div>

                  {/* Caveat / Limitation */}
                  {rec.uncertaintyOrLimitation && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 italic">
                      Note: {rec.uncertaintyOrLimitation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── SAFETY DISCLAIMER ─── */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-500">
        <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
        <p>
          {safetyDisclaimer || 'General wellness and nutrition guidance only. Not medical diagnosis or treatment. Consult a licensed healthcare provider before making substantial dietary changes.'}
        </p>
      </div>
    </div>
  )
}
