import React, { useState } from 'react'
import {
  Sparkles,
  User as UserIcon,
  AlertCircle,
  RotateCcw,
  Check,
  Copy,
  Database,
} from 'lucide-react'
import type { GroundedNutritionSummaryDto } from '../../../types/api'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  status?: 'SUCCESS' | 'UNAVAILABLE' | 'ERROR' | 'RATE_LIMITED'
  groundedSummary?: GroundedNutritionSummaryDto | null
  disclaimer?: string
}

interface ChatMessageBubbleProps {
  message: ChatMessage
  onRetry?: () => void
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, onRetry }) => {
  const isUser = message.role === 'user'
  const isError = message.status === 'ERROR' || message.status === 'UNAVAILABLE' || message.status === 'RATE_LIMITED'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Basic formatted text renderer (paragraphs, bullet points, bold tags)
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n')
    return (
      <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />
          }
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{renderInlineFormatting(line.trim().substring(2))}</span>
              </div>
            )
          }
          if (/^\d+\.\s/.test(line.trim())) {
            const num = line.trim().match(/^(\d+)\.\s/)?.[1]
            const rest = line.trim().replace(/^\d+\.\s/, '')
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs shrink-0 pt-0.5">
                  {num}.
                </span>
                <span>{renderInlineFormatting(rest)}</span>
              </div>
            )
          }
          return <p key={idx}>{renderInlineFormatting(line)}</p>
        })}
      </div>
    )
  }

  const renderInlineFormatting = (text: string) => {
    // Splits on **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <div
      className={`flex items-start gap-3 w-full animate-in fade-in-50 duration-200 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
          isUser
            ? 'bg-emerald-600 text-white'
            : isError
            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
            : 'bg-slate-900 dark:bg-slate-800 text-emerald-400 border border-slate-800'
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4" aria-hidden="true" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Sparkles className="w-4 h-4" aria-hidden="true" />
        )}
      </div>

      {/* Message Content Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 sm:px-4.5 sm:py-3.5 shadow-xs ${
            isUser
              ? 'bg-emerald-600 text-white rounded-tr-xs'
              : isError
              ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 rounded-tl-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs'
          }`}
        >
          {renderFormattedContent(message.content)}

          {/* Grounded Nutrition Summary Pill Card */}
          {!isUser && message.groundedSummary && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified PostgreSQL Nutrition Context ({message.groundedSummary.date})</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px]">Protein Target</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {message.groundedSummary.consumedProteinG}g / {message.groundedSummary.proteinGoalG}g
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px]">Protein Left</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {message.groundedSummary.proteinRemainingG}g remaining
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px]">Calories</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {message.groundedSummary.consumedCaloriesKcal} kcal
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px]">Hydration</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {message.groundedSummary.consumedWaterMl ?? 0} ml
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Retry Button */}
          {isError && onRetry && (
            <div className="mt-3 pt-2.5 border-t border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
              <span className="text-[11px] text-rose-600 dark:text-rose-400">
                {message.status === 'UNAVAILABLE'
                  ? 'Service unconfigured'
                  : message.status === 'RATE_LIMITED'
                  ? 'Rate limited'
                  : 'Provider error'}
              </span>
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-medium hover:bg-rose-500 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}
        </div>

        {/* Message Meta: Disclaimer & Copy */}
        <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

          {!isUser && !isError && (
            <>
              <span>•</span>
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy message"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </>
          )}

          {!isUser && message.disclaimer && (
            <>
              <span>•</span>
              <span className="truncate max-w-[220px]" title={message.disclaimer}>
                General nutrition guidance only
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
