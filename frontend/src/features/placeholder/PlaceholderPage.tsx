import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
  upcomingFeatures: string[]
  phase: string
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  upcomingFeatures,
  phase,
}: PlaceholderPageProps) {
  const { user, settings } = useAuth()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="blue">
            <Sparkles className="w-3 h-3" />
            {phase} Planned Module
          </Badge>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Backend Migration Ready
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          {description}
        </p>
      </div>

      {/* Hero Announcement Card */}
      <Card variant="elevated" padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <Icon className="w-7 h-7" />
          </div>

          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {title} Module Unlocks in {phase}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Phase 2A authentication and profile management are fully operational. Food logging, macronutrient breakdown, and interactive dashboard charts are scheduled for the next phase.
            </p>
          </div>
        </div>

        {/* Current Active Goals Summary */}
        {settings && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Protein Target
              </span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {settings.proteinGoalG}g / day
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Calorie Target
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {settings.calorieGoalKcal ? `${settings.calorieGoalKcal} kcal` : 'Not set'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Hydration Target
              </span>
              <p className="text-sm font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                {settings.waterGoalMl ? `${settings.waterGoalMl} ml` : 'Not set'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Unit / Zone
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                {settings.weightUnit} &bull; {settings.timezone}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Planned Feature Capabilities List */}
      <Card variant="default" padding="lg">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
          Upcoming {title} Capabilities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {upcomingFeatures.map((feat, index) => (
            <div
              key={index}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Authenticated as <strong>{user?.fullName}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/settings">
              <Button variant="outline" size="sm" leftIcon={<SettingsIcon className="w-3.5 h-3.5" />}>
                Adjust Goals
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
