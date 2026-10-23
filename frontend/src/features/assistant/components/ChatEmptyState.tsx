import React from 'react'
import { Sparkles, Utensils, TrendingUp, Droplets, ShieldCheck } from 'lucide-react'

interface ChatEmptyStateProps {
  onSelectSuggestion: (prompt: string) => void
  customSuggestions?: string[]
}

const DEFAULT_SUGGESTIONS = [
  {
    icon: Sparkles,
    label: 'How much protein have I consumed today?',
    prompt: 'How much protein have I consumed today?',
  },
  {
    icon: Utensils,
    label: 'What could I eat to reach my protein goal?',
    prompt: 'What could I eat to reach my protein goal?',
  },
  {
    icon: TrendingUp,
    label: 'Summarize my nutrition over the last seven days.',
    prompt: 'Summarize my nutrition over the last seven days.',
  },
  {
    icon: Droplets,
    label: 'What does my hydration history show?',
    prompt: 'What does my hydration history show?',
  },
]

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  onSelectSuggestion,
  customSuggestions,
}) => {
  const suggestions =
    customSuggestions && customSuggestions.length > 0
      ? customSuggestions.map((text, idx) => ({
          icon: idx === 0 ? Sparkles : idx === 1 ? Utensils : idx === 2 ? TrendingUp : Droplets,
          label: text,
          prompt: text,
        }))
      : DEFAULT_SUGGESTIONS

  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 max-w-xl mx-auto animate-in fade-in-50 duration-300">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 shadow-sm">
        <Sparkles className="w-7 h-7" aria-hidden="true" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
        Prota AI Nutrition Assistant
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
        Grounded directly in your personal daily logs and targets. Ask questions about your intake,
        get ideas for hitting your protein target, or analyze your trends.
      </p>

      {/* Suggested prompts */}
      <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
        {suggestions.map((item, index) => {
          const IconComponent = item.icon
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectSuggestion(item.prompt)}
              className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800/80 hover:border-emerald-500/40 hover:shadow-xs transition-all text-xs flex items-start gap-2.5 cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/60 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0">
                <IconComponent className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span className="leading-snug pt-0.5">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Trust & Privacy Notice */}
      <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>Grounded in PostgreSQL truth. General guidance only; not medical advice.</span>
      </div>
    </div>
  )
}
