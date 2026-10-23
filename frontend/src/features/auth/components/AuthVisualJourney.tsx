import {
  Target,
  Utensils,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import logoImg from '../../../assets/logo.png'
import { CircularWatermark } from '../../../components/ui/CircularWatermark'

export function AuthVisualJourney() {
  return (
    <div className="relative w-full h-full min-h-screen lg:min-h-full flex flex-col justify-between p-6 sm:p-8 xl:p-10 select-none overflow-hidden transition-colors bg-slate-50/90 dark:bg-[#07141C] text-slate-900 dark:text-slate-100">
      {/* Background ambient lighting and subtle circular watermark motif */}
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-3xl pointer-events-none" />
      <CircularWatermark className="absolute -right-20 -top-20 w-[300px] lg:w-[360px] opacity-25 dark:opacity-20 pointer-events-none" />

      {/* ─── BRAND HEADER ─── */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-950 p-1.5 border border-slate-800 shadow-sm shadow-emerald-500/10 flex items-center justify-center shrink-0">
            <img src={logoImg} alt="Prota Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight leading-none text-slate-900 dark:text-white block">
              PROTA
            </span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
              Nutrition
            </span>
          </div>
        </div>

        <div className="mt-5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Your nutrition journey
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            From daily choices to a clearer picture.
          </p>
        </div>
      </div>

      {/* ─── COMPACT DIAGONAL JOURNEY MAP ─── */}
      <div className="relative z-10 my-auto py-4">
        {/* SVG Connecting Diagonal Ribbon/Curved Path */}
        <svg
          viewBox="0 0 380 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="journeyPathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#14B8A6" stopOpacity="0.7" />
              <stop offset="75%" stopColor="#0EA5E9" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Smooth diagonal connecting curve threading from top-left (01) to bottom-right (04) */}
          <path
            d="M 28 32 C 85 45, 75 95, 120 102 C 165 109, 155 160, 205 168 C 255 176, 245 220, 290 226"
            stroke="url(#journeyPathGradient)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="opacity-60 dark:opacity-75"
          />
        </svg>

        {/* 4 Milestones Arranged Diagonally (Top-Left to Bottom-Right) */}
        <div className="relative space-y-4 sm:space-y-5">
          {/* Milestone 01: START (Top-Left) */}
          <div className="flex items-center gap-3 sm:gap-3.5 max-w-xs transition-transform">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 block leading-tight">
                01 &bull; START
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block leading-snug">
                Set your nutrition goals.
              </span>
            </div>
          </div>

          {/* Milestone 02: TRACK (Step 2 - Slightly Indented) */}
          <div className="flex items-center gap-3 sm:gap-3.5 max-w-xs ml-6 sm:ml-10 transition-transform">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/90 dark:border-teal-800/80 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-teal-600 dark:text-teal-400 block leading-tight">
                02 &bull; TRACK
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block leading-snug">
                Log meals and hydration.
              </span>
            </div>
          </div>

          {/* Milestone 03: BUILD (Step 3 - Further Indented) */}
          <div className="flex items-center gap-3 sm:gap-3.5 max-w-xs ml-12 sm:ml-20 transition-transform">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 block leading-tight">
                03 &bull; BUILD
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block leading-snug">
                See your days add up.
              </span>
            </div>
          </div>

          {/* Milestone 04: UNDERSTAND (Step 4 - Toward Bottom-Right) */}
          <div className="flex items-center gap-3 sm:gap-3.5 max-w-xs ml-18 sm:ml-28 transition-transform">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/90 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-sky-600 dark:text-sky-400 block leading-tight">
                04 &bull; UNDERSTAND
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block leading-snug">
                Explore your nutrition trends.
              </span>
            </div>
          </div>

          {/* ─── OUTCOME PREVIEW: COMPACT & SECONDARY (Bottom-Right) ─── */}
          <div className="pt-2 flex justify-end">
            <div className="w-full max-w-[260px] p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/90 dark:border-slate-800/90 shadow-sm backdrop-blur-xs flex items-center gap-3">
              {/* Mini Circular Protein Progress Ring */}
              <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    strokeWidth="9"
                    className="stroke-slate-200 dark:stroke-slate-800"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray="251.3"
                    strokeDashoffset="30.1"
                    className="stroke-emerald-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
                    88%
                  </span>
                </div>
              </div>

              {/* Mini Sparkline & Metric Note */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight">
                  <span>Weekly Target</span>
                  <span className="text-[10px] text-slate-400 font-normal">7-Day</span>
                </div>
                {/* Tiny sparkline */}
                <svg viewBox="0 0 100 18" className="w-full h-3 my-0.5 overflow-visible" aria-hidden="true">
                  <path
                    d="M 2 14 Q 25 16 45 9 T 75 5 T 98 2"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="98" cy="2" r="2.5" className="fill-emerald-500" />
                </svg>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-none">
                  142g protein &bull; 2.4L water
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM FOOTER ─── */}
      <div className="relative z-10 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <p className="font-medium text-slate-700 dark:text-slate-300">
          Every day adds to the picture.
        </p>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Illustrative preview
        </span>
      </div>
    </div>
  )
}
