import React, { createContext, useContext, useState, useEffect } from 'react'

const SIDEBAR_STORAGE_KEY = 'prota_sidebar_collapsed'

interface SidebarContextValue {
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  toggleCollapsed: () => void
  mobileDrawerOpen: boolean
  setMobileDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>
  openMobileDrawer: () => void
  closeMobileDrawer: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed))
    } catch {
      // ignore storage errors
    }
  }, [collapsed])

  const toggleCollapsed = () => setCollapsed((prev) => !prev)
  const openMobileDrawer = () => setMobileDrawerOpen(true)
  const closeMobileDrawer = () => setMobileDrawerOpen(false)

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        toggleCollapsed,
        mobileDrawerOpen,
        setMobileDrawerOpen,
        openMobileDrawer,
        closeMobileDrawer,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
