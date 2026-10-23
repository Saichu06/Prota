import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useAuth } from '../../hooks/useAuth'
import logoImg from '../../assets/logo.png'

interface PublicHeaderProps {
  currentSection?: string
}

export function PublicHeader({ currentSection }: PublicHeaderProps) {
  const { isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isBlogs = location.pathname.startsWith('/blogs')

  const closeMenu = () => setMobileMenuOpen(false)

  const navLinkBase =
    'text-sm font-medium transition-colors py-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded'

  const getNavLinkClass = (active: boolean) =>
    `${navLinkBase} ${
      active
        ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400'
    }`

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FBFAF7]/85 dark:bg-slate-950/85 border-b border-slate-200/70 dark:border-slate-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={closeMenu}
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

        {/* Desktop Primary Navigation */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            onClick={() => {
              closeMenu()
              if (isHome) window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className={getNavLinkClass(isHome && !currentSection)}
          >
            Home
          </Link>
          <a
            href={isHome ? '#features' : '/#features'}
            className={getNavLinkClass(currentSection === 'features')}
          >
            Features
          </a>
          <a
            href={isHome ? '#how-it-works' : '/#how-it-works'}
            className={getNavLinkClass(currentSection === 'how-it-works')}
          >
            How It Works
          </a>
          <Link to="/blogs" onClick={closeMenu} className={getNavLinkClass(isBlogs)}>
            Blogs
          </Link>
        </nav>

        {/* Action Controls & Auth */}
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

        {/* Mobile Navigation Toggle */}
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav"
          className="md:hidden px-4 pt-2 pb-5 border-t border-slate-200 dark:border-slate-800 bg-[#FBFAF7] dark:bg-slate-950"
        >
          <nav aria-label="Mobile" className="flex flex-col py-2 text-base font-medium">
            <Link
              to="/"
              onClick={() => {
                closeMenu()
                if (isHome) window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Home
            </Link>
            <a
              href={isHome ? '#features' : '/#features'}
              onClick={closeMenu}
              className="px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Features
            </a>
            <a
              href={isHome ? '#how-it-works' : '/#how-it-works'}
              onClick={closeMenu}
              className="px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              How It Works
            </a>
            <Link
              to="/blogs"
              onClick={closeMenu}
              className="px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold"
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
  )
}
