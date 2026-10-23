import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { useAuth } from '../../hooks/useAuth'
import { useSidebar } from './SidebarContext'
import { useAssistant } from '../../features/assistant/context/AssistantContext'
import logoImg from '../../assets/logo.png'

export function TopHeader() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { collapsed, toggleCollapsed, openMobileDrawer } = useSidebar()
  const { toggleAssistant } = useAssistant()

  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/log':
        return 'Food Log'
      case '/calendar':
        return 'Calendar'
      case '/analytics':
        return 'Analytics'
      case '/reports':
        return 'Reports'
      case '/assistant':
        return 'AI Assistant'
      case '/profile':
        return 'View Profile'
      case '/settings':
        return 'View Settings'
      case '/addons/diet-plan':
        return 'AI Diet Planner'
      case '/addons/workout-plan':
        return 'AI Workout Planner'
      case '/addons/improve-progress':
        return 'Improve My Progress'
      default:
        return 'Prota'
    }
  }

  const title = getPageTitle(location.pathname)

  // Outside click & escape key handler for profile menu and notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setProfileMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotificationsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
        setNotificationsOpen(false)
      }
    }

    if (profileMenuOpen || notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [profileMenuOpen, notificationsOpen])

  // Close menus on route change
  useEffect(() => {
    setProfileMenuOpen(false)
    setNotificationsOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    setProfileMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const userInitial = user?.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'U'
  // Real notifications count: currently 0 as in-app inbox endpoints are not yet deployed in backend
  const unreadCount = 0

  return (
    <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 md:px-8 transition-colors select-none">
      {/* ─── LEFT: Sidebar Toggle & Page Title / Breadcrumb ─── */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={openMobileDrawer}
          aria-label="Open navigation drawer"
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Desktop Sidebar Collapse / Expand Quick Toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {/* Mobile Logo Branding */}
        <Link to="/dashboard" className="md:hidden flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center p-1 border border-slate-800 shadow-xs">
            <img src={logoImg} alt="Prota" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-white">
            PROTA
          </span>
        </Link>

        {/* Desktop Breadcrumb & Title */}
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            Prota
          </span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h1>
        </div>

        {/* Mobile Compact Title */}
        <span className="sm:hidden text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
          {title}
        </span>
      </div>

      {/* ─── RIGHT: Theme Toggle, Notifications, Profile Dropdown ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* 1. Theme Control: Compact Button Cycling Light -> Dark -> System */}
        <ThemeToggle compact />

        {/* 2. AI Nutrition Assistant Entry Point */}
        <button
          type="button"
          onClick={toggleAssistant}
          aria-label="Open Prota AI Nutrition Assistant"
          title="AI Nutrition Assistant"
          className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
        </button>

        {/* 3. Notifications Bell & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((prev) => !prev)
              setProfileMenuOpen(false)
            }}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            title="Notifications"
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          >
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Notifications Popover Panel */}
          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="Notification panel"
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-3 px-4 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Notifications
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  0 unread
                </span>
              </div>

              {/* Honest Empty State */}
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    You're all caught up!
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px] mt-1 leading-relaxed">
                    Personalized meal reminders and hydration alerts will appear here. No unread messages exist right now.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Backend Reminders</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Active
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. User Profile Picture / Initials & Dropdown */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen((prev) => !prev)
                setNotificationsOpen(false)
              }}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              aria-label={`User menu for ${user.fullName}`}
              className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pr-2 rounded-full border border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-500/50 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
            >
              {/* Profile Picture or Initials Fallback */}
              {user.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={`${user.fullName} profile picture`}
                  className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/30"
                  onError={(e) => {
                    // Fallback to initials if image load fails
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {userInitial}
                </div>
              )}

              <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                {user.fullName}
              </span>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  profileMenuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-950/10 py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100"
              >
                {/* User Summary Info */}
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>

                {/* Navigation Actions */}
                <div className="py-1">
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span>View Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span>View Settings</span>
                  </Link>

                  <Link
                    to="/calendar"
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors sm:hidden"
                  >
                    <Calendar className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span>Calendar</span>
                  </Link>
                </div>

                {/* Sign Out Action */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
