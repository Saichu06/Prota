import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame,
  Target,
  Droplet,
  Scale,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  ShieldCheck,
  Utensils,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { CircularWatermark } from '../../components/ui/CircularWatermark'
import { CinematicVideoPlayer } from '../../components/ui/CinematicVideoPlayer'
import { useAuth } from '../../hooks/useAuth'
import logoImg from '../../assets/logo.png'

const CURRENT_YEAR = new Date().getFullYear()

/* ────────────────────────────────────────────────────────────
   Illustrative sample data (frontend-only, never user data)
   ──────────────────────────────────────────────────────────── */

interface SampleMeal {
  id: string
  label: string
  name: string
  protein: number // g
  calories: number // kcal
}

interface SampleDay {
  id: string
  tab: string
  title: string
  note: string
  proteinGoal: number
  calorieGoal: number
  waterGoal: number // ml
  water: number // ml
  meals: SampleMeal[]
}

const SAMPLE_DAYS: SampleDay[] = [
  {
    id: 'balanced',
    tab: 'Balanced day',
    title: 'A steady, everyday pattern',
    note: 'Three meals and a snack, close to every target.',
    proteinGoal: 150,
    calorieGoal: 2200,
    waterGoal: 3000,
    water: 2400,
    meals: [
      { id: 'b1', label: 'Breakfast', name: 'Greek yogurt with oats', protein: 32, calories: 420 },
      { id: 'b2', label: 'Lunch', name: 'Chicken and rice bowl', protein: 48, calories: 680 },
      { id: 'b3', label: 'Snack', name: 'Whey shake and banana', protein: 28, calories: 290 },
      { id: 'b4', label: 'Dinner', name: 'Lentils with paneer', protein: 22, calories: 560 },
    ],
  },
  {
    id: 'training',
    tab: 'Training day',
    title: 'Higher targets, more fuel',
    note: 'Higher goals on an active day, with meals timed around a workout.',
    proteinGoal: 165,
    calorieGoal: 2400,
    waterGoal: 3500,
    water: 3100,
    meals: [
      { id: 't1', label: 'Pre-workout', name: 'Oats with two eggs', protein: 38, calories: 520 },
      { id: 't2', label: 'Post-workout', name: 'Protein shake', protein: 30, calories: 260 },
      { id: 't3', label: 'Lunch', name: 'Fish with quinoa', protein: 52, calories: 710 },
      { id: 't4', label: 'Dinner', name: 'Chicken curry with roti', protein: 40, calories: 790 },
    ],
  },
  {
    id: 'light',
    tab: 'Light day',
    title: 'A quieter day, still counted',
    note: 'Fewer entries, lower totals. The picture is still useful.',
    proteinGoal: 120,
    calorieGoal: 1900,
    waterGoal: 2500,
    water: 1500,
    meals: [
      { id: 'l1', label: 'Breakfast', name: 'Toast with scrambled eggs', protein: 20, calories: 380 },
      { id: 'l2', label: 'Lunch', name: 'Lentil soup', protein: 24, calories: 450 },
      { id: 'l3', label: 'Dinner', name: 'Tofu vegetable stir fry', protein: 28, calories: 520 },
    ],
  },
]

function dayTotals(day: SampleDay) {
  return day.meals.reduce(
    (acc, m) => ({ protein: acc.protein + m.protein, calories: acc.calories + m.calories }),
    { protein: 0, calories: 0 },
  )
}

// Small illustrative series for feature visuals
const WEIGHT_TREND = [78.4, 78.1, 78.3, 77.8, 77.6, 77.7, 77.2, 77.0]
const WEEK_ADHERENCE = [72, 90, 64, 98, 84, 100, 78] // % of protein target (illustrative)
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/* ────────────────────────────────────────────────────────────
   Hooks and small primitives
   ──────────────────────────────────────────────────────────── */

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown && !reduced ? `${delay}ms` : undefined }}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        } ${className}`}
    >
      {children}
    </div>
  )
}

interface RingProps {
  value: number
  goal: number
  size?: number
  stroke?: number
  trackClass?: string
  arcClass?: string
  children?: ReactNode
  label: string
}

/** Circular progress ring: the visual motif of the page (echoes the P logo). */
function Ring({
  value,
  goal,
  size = 176,
  stroke = 9,
  trackClass = 'text-slate-700/60',
  arcClass = 'text-emerald-400',
  children,
  label,
}: RingProps) {
  const reduced = useReducedMotion()
  const radius = 50 - stroke / 2
  const circumference = 2 * Math.PI * radius
  const target = Math.min(Math.max(goal > 0 ? value / goal : 0, 0), 1)
  const [progress, setProgress] = useState(reduced ? target : 0)

  useEffect(() => {
    if (reduced) {
      setProgress(target)
      return
    }
    const id = requestAnimationFrame(() => setProgress(target))
    return () => cancelAnimationFrame(id)
  }, [target, reduced])

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={`${trackClass} stroke-current`}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={`${arcClass} stroke-current`}
          style={{
            transition: reduced ? 'none' : 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  )
}

function Bar({ value, goal, className }: { value: number; goal: number; className: string }) {
  const reduced = useReducedMotion()
  const pct = Math.min(Math.max(goal > 0 ? (value / goal) * 100 : 0, 0), 100)
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
      <div
        className={`h-full rounded-full ${className}`}
        style={{
          width: `${pct}%`,
          transition: reduced ? 'none' : 'width 700ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  )
}

const fmt = (n: number) => n.toLocaleString('en-US')

/* ────────────────────────────────────────────────────────────
   Dark navy nutrition panel (hero preview and interactive demo)
   ──────────────────────────────────────────────────────────── */

function NutritionPanel({
  day,
  showMeals = false,
  caption,
}: {
  day: SampleDay
  showMeals?: boolean
  caption: string
}) {
  const { protein, calories } = dayTotals(day)
  const proteinLeft = Math.max(day.proteinGoal - protein, 0)

  return (
    <div className="w-full rounded-3xl bg-[#0B1424] border border-slate-700/60 shadow-2xl shadow-slate-900/20 p-5 sm:p-7 text-white">
      <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Target className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Daily targets
            </p>
            <p className="text-sm font-semibold text-white truncate">{day.tab}</p>
          </div>
        </div>
        <span className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-600/70 text-slate-300">
          Sample data
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Ring
          value={protein}
          goal={day.proteinGoal}
          label={`Protein ${protein} of ${day.proteinGoal} grams`}
        >
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Protein
          </span>
          <span className="text-3xl font-semibold tracking-tight tabular-nums">
            {protein}
            <span className="ml-0.5 text-sm font-normal text-emerald-400">g</span>
          </span>
          <span className="text-[11px] text-slate-400">of {day.proteinGoal} g</span>
        </Ring>

        <div className="w-full grid grid-cols-1 gap-3">
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                Calories
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">
                Target {fmt(day.calorieGoal)}
              </span>
            </div>
            <p className="text-lg font-semibold leading-tight tabular-nums mb-2">
              {fmt(calories)} <span className="text-xs font-normal text-slate-400">kcal</span>
            </p>
            <Bar value={calories} goal={day.calorieGoal} className="bg-amber-400" />
          </div>

          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-teal-300">
                <Droplet className="w-3.5 h-3.5" aria-hidden="true" />
                Hydration
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">
                Target {fmt(day.waterGoal)} ml
              </span>
            </div>
            <p className="text-lg font-semibold leading-tight tabular-nums mb-2">
              {fmt(day.water)} <span className="text-xs font-normal text-slate-400">ml</span>
            </p>
            <Bar value={day.water} goal={day.waterGoal} className="bg-teal-300" />
          </div>
        </div>
      </div>

      {showMeals && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
              <Utensils className="w-3.5 h-3.5" aria-hidden="true" />
              Meal entries
            </h4>
            <span className="text-[11px] text-slate-400">
              {proteinLeft > 0 ? `${proteinLeft} g protein to go` : 'Protein target reached'}
            </span>
          </div>
          <ul className="divide-y divide-slate-700/50 rounded-2xl border border-slate-700/50 bg-slate-800/30">
            {day.meals.map((meal) => (
              <li key={meal.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">{meal.label}</p>
                  <p className="text-sm text-slate-100 truncate">{meal.name}</p>
                </div>
                <p className="shrink-0 text-right text-xs tabular-nums text-slate-300">
                  <span className="text-emerald-400 font-medium">{meal.protein} g</span>
                  <span className="mx-1.5 text-slate-600" aria-hidden="true">
                    /
                  </span>
                  {meal.calories} kcal
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-slate-400">{caption}</p>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Interactive demo (isolated: local state only, no API calls)
   ──────────────────────────────────────────────────────────── */

function NutritionDemo() {
  const [activeId, setActiveId] = useState(SAMPLE_DAYS[0].id)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const active = SAMPLE_DAYS.find((d) => d.id === activeId) ?? SAMPLE_DAYS[0]

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % SAMPLE_DAYS.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
      next = (index - 1 + SAMPLE_DAYS.length) % SAMPLE_DAYS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = SAMPLE_DAYS.length - 1
    else return
    e.preventDefault()
    setActiveId(SAMPLE_DAYS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
      <div className="lg:col-span-5">
        <div
          role="tablist"
          aria-label="Sample day scenarios"
          className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1"
        >
          {SAMPLE_DAYS.map((d, i) => {
            const selected = d.id === activeId
            return (
              <button
                key={d.id}
                ref={(el) => {
                  tabRefs.current[i] = el
                }}
                id={`demo-tab-${d.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="demo-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(d.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`min-h-11 shrink-0 lg:shrink text-left rounded-2xl border px-4 py-3 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBFAF7] dark:focus-visible:ring-offset-slate-950 ${selected
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-500/10 dark:border-emerald-500/50'
                  : 'bg-white/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                  }`}
              >
                <span className="block text-sm font-medium">{d.tab}</span>
                <span
                  className={`hidden lg:block mt-0.5 text-xs ${selected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                  {d.title}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
            Scenario Focus
          </p>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300" aria-live="polite">
            {active.note}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Protein</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{active.proteinGoal}g</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Calories</span>
              <span className="font-bold text-amber-500 dark:text-amber-400 tabular-nums">{active.calorieGoal}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Water</span>
              <span className="font-bold text-teal-600 dark:text-teal-400 tabular-nums">{active.waterGoal}ml</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          The video demonstration alongside illustrates the mobile experience of logging meals and following real-time progress.
        </p>
      </div>

      <div
        id="demo-panel"
        role="tabpanel"
        aria-labelledby={`demo-tab-${active.id}`}
        className="lg:col-span-7 flex justify-center items-start"
      >
        <div className="w-full max-w-[208px]">
          <CinematicVideoPlayer
            src="/videos/prota-product-demo.mp4"
            title="Prota mobile product journey demonstration"
            aspectRatio="9/16"
            badge="Walkthrough"
            caption="Mobile daily tracking demonstration"
            fallback={
              <NutritionPanel
                key={active.id}
                day={active}
                showMeals
                caption="Illustrative sample day. Totals are summed from the entries above."
              />
            }
          />
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Small feature visuals
   ──────────────────────────────────────────────────────────── */

function WeightSpark() {
  const w = 240
  const h = 72
  const min = Math.min(...WEIGHT_TREND)
  const max = Math.max(...WEIGHT_TREND)
  const pts = WEIGHT_TREND.map((v, i) => {
    const x = (i / (WEIGHT_TREND.length - 1)) * (w - 8) + 4
    const y = h - 8 - ((v - min) / (max - min || 1)) * (h - 16)
    return [x, y] as const
  })
  const last = pts[pts.length - 1]
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-auto text-indigo-500 dark:text-indigo-400"
      role="img"
      aria-label="Illustrative weight trend sloping gently downward"
    >
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="currentColor" />
    </svg>
  )
}

function WeekBars() {
  return (
    <div
      className="flex items-end gap-2 h-24"
      role="img"
      aria-label="Illustrative week of daily protein target adherence"
    >
      {WEEK_ADHERENCE.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
          <div
            className={`w-full rounded-md ${v >= 90 ? 'bg-emerald-500' : 'bg-emerald-500/35 dark:bg-emerald-400/30'
              }`}
            style={{ height: `${v}%` }}
          />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{WEEK_LABELS[i]}</span>
        </div>
      ))}
    </div>
  )
}

const featureCard =
  'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6 sm:p-8'

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export function HomePage() {
  const { isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeMenu = () => setMobileMenuOpen(false)

  const navLink =
    'text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors py-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded'

  const goHome = () => {
    closeMenu()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FBFAF7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500/20 scroll-smooth">
      {/* ─── NAVIGATION ─── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FBFAF7]/85 dark:bg-slate-950/85 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            onClick={goHome}
            className="flex items-center gap-3 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1 -m-1"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center p-1.5 border border-slate-800 group-hover:border-emerald-500/40 transition-colors">
              <img src={logoImg} alt="Prota logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none">PROTA</span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                Nutrition
              </span>
            </div>
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-8">
            <Link to="/" onClick={goHome} className={navLink}>
              Home
            </Link>
            <a href="#features" className={navLink}>
              Features
            </a>
            <a href="#how-it-works" className={navLink}>
              How It Works
            </a>
            <Link to="/blogs" className={navLink}>
              Blogs
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle compact />
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            id="mobile-nav"
            className="md:hidden px-4 pt-2 pb-5 border-t border-slate-200 dark:border-slate-800 bg-[#FBFAF7] dark:bg-slate-950"
          >
            <nav aria-label="Mobile" className="flex flex-col py-2 text-base font-medium">
              <Link
                to="/"
                onClick={goHome}
                className="px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Home
              </Link>
              <a
                href="#features"
                onClick={closeMenu}
                className="px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={closeMenu}
                className="px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                How It Works
              </a>
              <Link
                to="/blogs"
                onClick={closeMenu}
                className="px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Blogs
              </Link>
            </nav>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={closeMenu}>
                  <Button variant="primary" size="md" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu}>
                    <Button variant="outline" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={closeMenu}>
                    <Button variant="primary" size="md" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section id="hero" className="relative py-14 sm:py-20 lg:py-24 scroll-mt-20 overflow-hidden">
          {/* Subtle circular watermark motif in the upper-right hero background */}
          <CircularWatermark className="absolute -right-20 sm:-right-24 -top-16 sm:-top-20 w-[360px] sm:w-[480px] lg:w-[560px] opacity-75 dark:opacity-60 z-0" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
              <div className="lg:col-span-6 flex flex-col items-start">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 mb-5">
                  Your daily nutrition companion
                </p>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] mb-6">
                  Every choice adds up.
                  <span className="block mt-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    See the bigger picture.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
                  Track protein, calories, hydration, and weight in one place. Understand your daily
                  intake, work toward your goals, and build healthier habits over time.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-8">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto px-8"
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      Get Started Free
                    </Button>
                  </Link>
                  <a href="#demo" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                      Explore Prota
                    </Button>
                  </a>
                </div>

                <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    No credit card required
                  </li>
                  <li className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    Session-secure sign-in
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
                <div className="w-full max-w-lg">
                  <CinematicVideoPlayer
                    src="/videos/prota-hero.mp4"
                    title="Prota cinematic nutrition experience showcase"
                    aspectRatio="16/9"
                    badge="Product Showcase"
                    caption="Cinematic preview of the Prota daily tracking experience"
                    fallback={
                      <NutritionPanel
                        day={SAMPLE_DAYS[0]}
                        caption="Illustrative daily nutrition preview"
                      />
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── INTERACTIVE DEMO ─── */}
        <section
          id="demo"
          className="py-20 lg:py-28 border-y border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/30 scroll-mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl mb-12">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 mb-3">
                Try it
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                Your day, in perspective.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                See how individual choices come together to create a clearer picture of your daily
                nutrition.
              </p>
            </Reveal>
            <Reveal>
              <NutritionDemo />
            </Reveal>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="features" className="py-20 lg:py-28 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl mb-14">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 mb-3">
                Features
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Everything you need to understand your intake.
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
              {/* Protein and calories: wide, ring on the right */}
              <Reveal className="lg:col-span-7">
                <article className={`${featureCard} h-full flex flex-col sm:flex-row sm:items-center gap-6`}>
                  <div className="flex-1">
                    <Flame className="w-5 h-5 text-emerald-700 dark:text-emerald-400 mb-4" aria-hidden="true" />
                    <h3 className="text-xl font-semibold mb-2">Protein and calorie tracking</h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                      Record your meals and see how your protein and calorie intake add up across the
                      day, measured against your own targets.
                    </p>
                  </div>
                  <div className="self-center">
                    <Ring
                      value={112}
                      goal={150}
                      size={128}
                      stroke={10}
                      trackClass="text-slate-200 dark:text-slate-800"
                      arcClass="text-emerald-600 dark:text-emerald-400"
                      label="Illustrative protein ring at 75 percent"
                    >
                      <span className="text-xl font-semibold tabular-nums">75%</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        protein
                      </span>
                    </Ring>
                  </div>
                </article>
              </Reveal>

              {/* Goals: dark navy, contrasting */}
              <Reveal className="lg:col-span-5" delay={80}>
                <article className="h-full rounded-3xl bg-[#0B1424] border border-slate-700/60 p-6 sm:p-8 text-white">
                  <Target className="w-5 h-5 text-emerald-400 mb-4" aria-hidden="true" />
                  <h3 className="text-xl font-semibold mb-2">Personal nutrition goals</h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                    Set daily targets for protein, calories, hydration, and weight, then follow your
                    progress toward each one.
                  </p>
                  <ul className="space-y-3">
                    {[
                      ['Protein', 'text-emerald-400', 'bg-emerald-400', 75],
                      ['Calories', 'text-amber-400', 'bg-amber-400', 82],
                      ['Hydration', 'text-teal-300', 'bg-teal-300', 60],
                    ].map(([name, text, bg, pct]) => (
                      <li key={name as string}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`font-medium ${text}`}>{name}</span>
                          <span className="text-slate-400 tabular-nums">{pct}% of target</span>
                        </div>
                        <Bar value={pct as number} goal={100} className={bg as string} />
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>

              {/* Hydration */}
              <Reveal className="lg:col-span-4">
                <article className={`${featureCard} h-full`}>
                  <Droplet className="w-5 h-5 text-teal-600 dark:text-teal-300 mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-semibold mb-2">Hydration tracking</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    Log your water through the day and watch it fill toward your daily target.
                  </p>
                  <div
                    className="flex items-end gap-1.5 h-16"
                    role="img"
                    aria-label="Illustrative hydration segments, five of eight filled"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-md ${i < 5 ? 'bg-teal-500 dark:bg-teal-300' : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        style={{ height: `${40 + i * 7}%` }}
                      />
                    ))}
                  </div>
                </article>
              </Reveal>

              {/* Weight */}
              <Reveal className="lg:col-span-4" delay={80}>
                <article className={`${featureCard} h-full`}>
                  <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-semibold mb-2">Weight and history</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                    Record weight in kilograms or pounds and look back over your past entries.
                  </p>
                  <WeightSpark />
                </article>
              </Reveal>

              {/* Analytics */}
              <Reveal className="lg:col-span-4" delay={160}>
                <article className={`${featureCard} h-full`}>
                  <LineChart className="w-5 h-5 text-emerald-700 dark:text-emerald-400 mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-semibold mb-2">Progress analytics</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                    Your history helps you spot patterns in how consistently you meet your targets.
                  </p>
                  <WeekBars />
                </article>
              </Reveal>
            </div>
            <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
              Charts on this page are illustrations, not real data.
            </p>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section
          id="how-it-works"
          className="py-20 lg:py-28 border-y border-slate-200/70 dark:border-slate-800/70 bg-white/50 dark:bg-slate-900/30 scroll-mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl mb-14">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 mb-3">
                How it works
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Small entries. A clearer picture.
              </h2>
            </Reveal>

            <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {/* connecting line (desktop) */}
              <div
                aria-hidden="true"
                className="hidden md:block absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-emerald-500/60 via-emerald-500/30 to-emerald-500/60"
              />
              {[
                {
                  n: '01',
                  title: 'Set your goals',
                  body: 'Create an account and establish personal nutrition targets.',
                  pct: 33,
                },
                {
                  n: '02',
                  title: 'Track your day',
                  body: 'Record meals, protein, calories, water, and weight as you go.',
                  pct: 66,
                },
                {
                  n: '03',
                  title: 'Understand your progress',
                  body: 'Review daily summaries and historical trends.',
                  pct: 100,
                },
              ].map((step, i) => (
                <li key={step.n} className="relative">
                  <Reveal delay={i * 100}>
                    <div className="relative w-16 h-16 mb-5 rounded-full bg-[#FBFAF7] dark:bg-slate-950">
                      <Ring
                        value={step.pct}
                        goal={100}
                        size={64}
                        stroke={7}
                        trackClass="text-slate-200 dark:text-slate-800"
                        arcClass="text-emerald-600 dark:text-emerald-400"
                        label={`Step ${i + 1} of 3`}
                      >
                        <span className="text-sm font-semibold tabular-nums">{step.n}</span>
                      </Ring>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs">
                      {step.body}
                    </p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── PHILOSOPHY ─── */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          <CircularWatermark className="absolute -right-24 top-1/2 -translate-y-1/2 w-[420px] sm:w-[560px]" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.15] mb-6">
                Progress isn&apos;t one perfect day.{' '}
                <span className="text-emerald-700 dark:text-emerald-400">
                  It&apos;s the picture that builds over time.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Prota brings your daily nutrition into focus, helping you understand your intake and
                stay consistent with the goals that matter to you.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ─── CLOSING CTA ─── */}
        <section className="pb-20 lg:pb-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="rounded-3xl bg-[#0B1424] border border-slate-700/60 p-8 sm:p-12 lg:p-16 text-center text-white">
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                  Start with your next choice.
                </h2>
                <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed max-w-xl mx-auto">
                  Build a clearer picture of your nutrition, one day at a time.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <Link to="/register">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto px-8"
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      Create Your Account
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto px-8 border-slate-600 text-slate-100 hover:bg-slate-800"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200/70 dark:border-slate-800/70 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center p-1 border border-slate-800">
                <img src={logoImg} alt="Prota logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight">PROTA</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Know your intake. Own your progress.
                </p>
              </div>
            </div>

            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Home
              </Link>
              <a href="#features" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                How It Works
              </a>
              <Link to="/blogs" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Blogs
              </Link>
              <Link to="/login" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Create Account
              </Link>
            </nav>
          </div>

          <p className="pt-8 text-center sm:text-left text-xs text-slate-500">
            &copy; {CURRENT_YEAR} PROTA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}