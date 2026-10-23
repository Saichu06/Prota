import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  LineChart,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Dumbbell,
  TrendingUp,
  FileText,
  X,
} from 'lucide-react'
import logoImg from '../../assets/logo.png'
import { useSidebar } from './SidebarContext'

export function Sidebar() {
  const {
    collapsed,
    toggleCollapsed,
    mobileDrawerOpen,
    closeMobileDrawer,
  } = useSidebar()
  const location = useLocation()

  // Track expandable Add Ons section
  const [addOnsExpanded, setAddOnsExpanded] = useState<boolean>(() =>
    location.pathname.startsWith('/addons')
  )

  // Expand if user navigates to an Add On route
  useEffect(() => {
    if (location.pathname.startsWith('/addons')) {
      setAddOnsExpanded(true)
    }
  }, [location.pathname])

  // Auto-close mobile drawer on route change
  useEffect(() => {
    closeMobileDrawer()
  }, [location.pathname, closeMobileDrawer])

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        closeMobileDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileDrawerOpen, closeMobileDrawer])

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/log', label: 'Food Log', icon: UtensilsCrossed },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/analytics', label: 'Analytics', icon: LineChart },
    { to: '/reports', label: 'Reports', icon: FileText },
  ]

  const addOnItems = [
    {
      to: '/addons/diet-plan',
      label: 'Diet Plan',
      icon: Sparkles,
      badge: 'AI',
      isNew: true,
    },
    {
      to: '/addons/workout-plan',
      label: 'Workout Plan',
      icon: Dumbbell,
      badge: 'AI',
      isNew: true,
    },
    {
      to: '/addons/improve-progress',
      label: 'Improve My Progress',
      icon: TrendingUp,
      badge: 'AI',
      isNew: true,
    },
  ]

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        aria-label="Application sidebar"
        className={`hidden md:flex flex-col shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 h-screen sticky top-0 z-30 transition-[width] duration-200 ease-in-out select-none ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header & Collapse Toggle */}
        <div
          className={`p-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center ${
            collapsed ? 'justify-center flex-col gap-2' : 'justify-between gap-3'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center p-1.5 border border-slate-800 shrink-0 shadow-xs">
              <img src={logoImg} alt="Prota logo" className="w-full h-full object-contain" />
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  PROTA
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    v2A
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Own your progress.
                </span>
              </div>
            )}
          </div>

          {/* Accessible Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Main Navigation Items */}
        <nav aria-label="Main Navigation" className="flex-1 px-2.5 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`}
                    aria-hidden="true"
                  />
                  {!collapsed ? (
                    <span className="flex-1 truncate">{label}</span>
                  ) : (
                    <>
                      <span className="sr-only">{label}</span>
                      {/* Floating tooltip on hover when collapsed */}
                      <span
                        role="tooltip"
                        className="absolute left-full ml-3 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap"
                      >
                        {label}
                      </span>
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* ─── ADD ONS SECTION ─── */}
          <div className="pt-3">
            {!collapsed ? (
              <>
                <button
                  type="button"
                  onClick={() => setAddOnsExpanded(prev => !prev)}
                  aria-expanded={addOnsExpanded}
                  aria-controls="desktop-addons-list"
                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Add Ons</span>
                  </span>
                  {addOnsExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>

                {addOnsExpanded && (
                  <div id="desktop-addons-list" className="mt-1 space-y-1">
                    {addOnItems.map(({ to, label, icon: Icon, badge, isNew }) => (
                      <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                          `group relative flex items-center justify-between rounded-xl text-sm font-medium transition-all duration-150 px-3.5 py-2.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                                  isActive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                                }`}
                                aria-hidden="true"
                              />
                              <span className="truncate">{label}</span>
                            </div>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                isNew
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                              }`}
                            >
                              {badge}
                            </span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Collapsed Add Ons Items */
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                {addOnItems.map(({ to, label, icon: Icon, badge }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={`${label} (${badge})`}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-center p-3 rounded-xl text-sm font-medium transition-all duration-150 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="sr-only">{label}</span>
                        {/* Floating tooltip on hover when collapsed */}
                        <span
                          role="tooltip"
                          className="absolute left-full ml-3 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap"
                        >
                          {label} ({badge})
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* ─── MOBILE RESPONSIVE DRAWER & OVERLAY ─── */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeMobileDrawer}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
            className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {/* Header with brand and close button */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center p-1 border border-slate-800 shadow-xs">
                  <img src={logoImg} alt="Prota logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                    PROTA
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Own your progress.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeMobileDrawer}
                aria-label="Close navigation drawer"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Navigation links */}
            <nav aria-label="Mobile Drawer Navigation" className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMobileDrawer}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              {/* Mobile Add Ons Section */}
              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setAddOnsExpanded(prev => !prev)}
                  aria-expanded={addOnsExpanded}
                  aria-controls="mobile-addons-list"
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                >
                  <span>Add Ons</span>
                  {addOnsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {addOnsExpanded && (
                  <div id="mobile-addons-list" className="mt-1 space-y-1">
                    {addOnItems.map(({ to, label, icon: Icon, badge, isNew }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={closeMobileDrawer}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isActive
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-400 dark:text-slate-500'
                                }`}
                                aria-hidden="true"
                              />
                              <span className="truncate">{label}</span>
                            </div>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                isNew
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {badge}
                            </span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
