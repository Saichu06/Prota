import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X, Maximize2, Loader2 } from 'lucide-react'
import { useAiChat } from '../hooks/useAiChat'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatMessageBubble } from './ChatMessageBubble'
import { ChatInput } from './ChatInput'

interface AssistantDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    suggestions,
    sendMessage,
    retryLastMessage,
    startNewChat,
  } = useAiChat()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleExpandToPage = () => {
    onClose()
    navigate('/assistant')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in-50 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-label="AI Nutrition Assistant Panel"
        aria-modal="true"
        className="absolute inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-250 ease-out"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                AI Nutrition Assistant
              </h2>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Grounded in your logs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExpandToPage}
              title="Open full page view"
              aria-label="Open full page view"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close assistant"
              aria-label="Close assistant"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
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

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-center gap-2.5 animate-in fade-in-50 duration-200">
              <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-800 text-emerald-400 border border-slate-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 animate-pulse" />
              </div>
              <div className="rounded-xl rounded-tl-xs px-3 py-2 bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                <span>Consulting your nutrition data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={() => sendMessage()}
          onNewChat={startNewChat}
          isLoading={isLoading}
          hasMessages={messages.length > 0}
        />
      </aside>
    </div>
  )
}
