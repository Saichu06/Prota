import { Link } from 'react-router-dom'
import { CircularWatermark } from '../ui/CircularWatermark'
import logoImg from '../../assets/logo.png'

const CURRENT_YEAR = new Date().getFullYear()

export function PublicFooter() {
  return (
    <footer className="relative border-t border-slate-200/80 dark:border-slate-800/80 py-12 sm:py-16 overflow-hidden bg-[#FBFAF7] dark:bg-slate-950">
      {/* Subtle Prota watermark in the footer */}
      <CircularWatermark className="absolute -right-24 -bottom-24 w-80 sm:w-96 opacity-60 dark:opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center p-1.5 border border-slate-800">
              <img src={logoImg} alt="Prota logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">PROTA</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Know your intake. Own your progress.
              </p>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
            >
              Home
            </Link>
            <a href="/#features" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="/#how-it-works" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
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
  )
}
