import React from 'react'
import { Card } from '../../../components/ui/Card'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'

interface AuthCardProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors">
      {/* Top right theme toggle */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle compact />
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-600 flex items-center justify-center p-2.5 shadow-md shadow-emerald-500/10 mb-3">
            <img src="/logo.png" alt="Prota Logo" className="w-full h-full object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none'
            }} />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            PROTA
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Know your intake. Own your progress.
          </p>
        </div>

        {/* Card Form Container */}
        <Card variant="elevated" padding="lg" className="w-full backdrop-blur-xs">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          </div>

          {children}
        </Card>

        {/* Footer Notice */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-6">
          Phase 2A Verified Session Security &bull; RFC 9457 Standards
        </p>
      </div>
    </div>
  )
}
