import React, { useRef, useEffect } from 'react'
import { Send, Loader2, RotateCcw } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onNewChat: () => void
  isLoading: boolean
  hasMessages: boolean
  disabled?: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onNewChat,
  isLoading,
  hasMessages,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea up to max-height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading && !disabled) {
        onSend()
      }
    }
  }

  return (
    <div className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 sm:p-2 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
          {hasMessages && (
            <button
              type="button"
              onClick={onNewChat}
              disabled={isLoading}
              title="Start a new conversation"
              aria-label="Start a new conversation"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? 'AI assistant is currently unavailable...'
                : 'Ask about your nutrition, protein goals, or recent logs...'
            }
            disabled={disabled || isLoading}
            className="flex-1 max-h-32 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none py-1.5 px-2 font-normal leading-relaxed"
          />

          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || isLoading || disabled}
            aria-label="Send message"
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors shrink-0 shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 select-none">
          <span>Press Enter to send, Shift + Enter for new line</span>
          <span>{value.length}/1000</span>
        </div>
      </div>
    </div>
  )
}
