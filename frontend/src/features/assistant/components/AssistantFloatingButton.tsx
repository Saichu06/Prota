import React from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAssistant } from '../context/AssistantContext'

export const AssistantFloatingButton: React.FC = () => {
  const { toggleAssistant } = useAssistant()
  const location = useLocation()

  // Hide floating launcher on the dedicated assistant page
  if (location.pathname === '/assistant') return null

  return (
    <button
      type="button"
      onClick={toggleAssistant}
      aria-label="Open Prota AI Nutrition Assistant"
      title="Ask AI Nutrition Assistant"
      className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white shadow-lg shadow-slate-900/20 dark:shadow-emerald-950/40 border border-slate-700/80 dark:border-emerald-500/50 transition-all hover:scale-105 active:scale-95 cursor-pointer group select-none"
    >
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 dark:bg-white/20 flex items-center justify-center text-emerald-400 dark:text-white group-hover:rotate-12 transition-transform">
        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
      </div>
      <span className="text-xs font-semibold tracking-tight pr-1">Ask AI</span>
    </button>
  )
}
