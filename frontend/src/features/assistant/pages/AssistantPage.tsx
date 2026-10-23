import React, { useRef, useEffect } from 'react'
import { Sparkles, Calendar, RotateCcw, Loader2 } from 'lucide-react'
import { useAiChat } from '../hooks/useAiChat'
import { ChatEmptyState } from '../components/ChatEmptyState'
import { ChatMessageBubble } from '../components/ChatMessageBubble'
import { ChatInput } from '../components/ChatInput'

export const AssistantPage: React.FC = () => {
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    contextDate,
    setContextDate,
    suggestions,
    sendMessage,
    retryLastMessage,
    startNewChat,
  } = useAiChat()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-9.5rem)] max-w-4xl mx-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-xl overflow-hidden">
      {/* ─── Top Header Bar ─── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              AI Nutrition Assistant
            </h2>
            <p className="text-[11px] text-slate-400">Grounded in your real PostgreSQL logs</p>
          </div>
        </div>

        {/* Date Selector & New Chat */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={contextDate}
              onChange={(e) => setContextDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              title="Target log date for nutrition context"
            />
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={startNewChat}
              disabled={isLoading}
              title="Reset conversation"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Message Timeline Container ─── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <ChatEmptyState
            onSelectSuggestion={(prompt) => sendMessage(prompt)}
            customSuggestions={suggestions}
          />
        ) : (
          messages.map((msg, idx) => (
            <ChatMessageBubble
              key={msg.id || idx}
              message={msg}
              onRetry={idx === messages.length - 1 ? retryLastMessage : undefined}
            />
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 animate-in fade-in-50 duration-200">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-emerald-400 border border-slate-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              <span>Analyzing verified nutrition records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input Bar ─── */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={() => sendMessage()}
        onNewChat={startNewChat}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
      />
    </div>
  )
}
