import { useNavigate } from 'react-router-dom'
import { Dumbbell, TrendingUp, Sparkles, ArrowLeft, Clock } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

interface AddOnComingSoonPageProps {
  type: 'workout-plan' | 'improve-progress'
}

export function AddOnComingSoonPage({ type }: AddOnComingSoonPageProps) {
  const navigate = useNavigate()

  const config = {
    'workout-plan': {
      title: 'AI Workout Planner',
      subtitle: 'Personalized training regimens tailored to your physique and progression targets.',
      icon: Dumbbell,
      tag: 'Coming Soon — Phase 6B',
      plannedFeatures: [
        'Customized weekly split (Push/Pull/Legs, Upper/Lower, Full Body)',
        'Progressive overload tracking linked to your weight & nutrition trends',
        'Equipment-specific exercise substitutions (Gym, Home, Dumbbells only)',
        'Rest period & recovery suggestions tailored to your calorie intake',
      ],
    },
    'improve-progress': {
      title: 'Improve My Progress',
      subtitle: 'Actionable metabolic insights and adaptive coaching based on your actual logged trends.',
      icon: TrendingUp,
      tag: 'Coming Soon — Phase 6C',
      plannedFeatures: [
        'Automated plateau detection across weight and protein trends',
        'Caloric adjustment recommendations based on actual rate of progress',
        'Nutritional adherence score & weekly consistency breakdown',
        'Smart recovery warnings when sleep or hydration deviates',
      ],
    },
  }[type]

  const Icon = config.icon

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/addons/diet-plan')}
          className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Go to AI Diet Planner
        </Button>
      </div>

      {/* Main card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-12 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80 mb-5 shadow-xs">
          <Icon className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>{config.tag}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          {config.title}
        </h1>
        <p className="max-w-xl mx-auto text-sm text-slate-600 dark:text-slate-400">
          {config.subtitle}
        </p>

        {/* Planned roadmap features */}
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-left max-w-lg mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            What's in Development:
          </h2>
          <ul className="space-y-2.5">
            {config.plannedFeatures.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/addons/diet-plan')}
            className="w-full sm:w-auto shadow-xs"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Try AI Diet Planner Now
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
