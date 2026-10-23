import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { CircularWatermark } from '../../../components/ui/CircularWatermark'
import { AuthVisualJourney } from './AuthVisualJourney'
import logoImg from '../../../assets/logo.png'

interface AuthSplitLayoutProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
}

const CURRENT_YEAR = new Date().getFullYear()

export function AuthSplitLayout({ title, subtitle, children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* ─── DESKTOP/LAPTOP LEFT PANEL: EXACT 45% WIDTH JOURNEY MAP ─── */}
      <div className="hidden lg:block lg:w-[45%] lg:h-screen lg:h-[100dvh] lg:sticky lg:top-0 relative bg-slate-50 dark:bg-[#07141c] border-r border-slate-200/80 dark:border-slate-800/80 overflow-hidden select-none shrink-0 transition-colors">
        <AuthVisualJourney />
      </div>

      {/* ─── AUTHENTICATION SURFACE: EXACT 55% WIDTH ON DESKTOP ─── */}
      <div className="w-full lg:w-[55%] min-h-screen min-h-[100dvh] lg:h-screen lg:h-[100dvh] lg:overflow-y-auto flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-10 xl:p-14 relative overflow-hidden">
        {/* Subtle pale green circular watermark motif tucked into upper-right corner */}
        <CircularWatermark className="hidden sm:block absolute -right-10 -top-10 sm:-right-14 sm:-top-14 lg:-right-16 lg:-top-16 w-44 sm:w-52 lg:w-60 opacity-40 dark:opacity-25 z-0 pointer-events-none" />

        {/* Top Header Controls: Back to Home + Theme Toggle */}
        <div className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pt-1 pb-4 sm:pb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group py-1.5 px-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>
          <ThemeToggle compact />
        </div>

        {/* Center Main Form Area */}
        <div className="relative z-10 w-full max-w-md mx-auto my-auto py-2 sm:py-4">
          {/* Mobile-Only Compact Brand Header */}
          <div className="flex lg:hidden flex-col items-center text-center mb-6">
            <Link to="/" className="inline-block focus:outline-hidden rounded-2xl mb-2.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center p-2 shadow-md shadow-emerald-500/10 border border-slate-800">
                <img src={logoImg} alt="Prota Logo" className="w-full h-full object-contain" />
              </div>
            </Link>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white leading-none">
              PROTA
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Know your intake. Own your progress.
            </span>
          </div>

          {/* Optional Form Header (e.g. for LoginPage) */}
          {title && (
            <div className="mb-6 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Centered Authentication Card / Form Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-xs dark:shadow-md">
            {children}
          </div>
        </div>

        {/* Bottom Footer Notice */}
        <div className="relative z-10 w-full max-w-md mx-auto pt-6 pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
          &copy; {CURRENT_YEAR} PROTA &bull; Session-Secured Authentication
        </div>
      </div>
    </div>
  )
}
