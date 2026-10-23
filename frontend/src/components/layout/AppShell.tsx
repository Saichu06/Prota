import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { BottomNav } from './BottomNav'
import { SidebarProvider } from './SidebarContext'
import { AssistantProvider } from '../../features/assistant/context/AssistantContext'
import { AssistantFloatingButton } from '../../features/assistant/components/AssistantFloatingButton'

export function AppShell() {
  return (
    <SidebarProvider>
      <AssistantProvider>
        <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          {/* Desktop Sidebar & Mobile Drawer */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <TopHeader />

            <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12">
              <Outlet />
            </main>

            {/* Floating AI Assistant Trigger */}
            <AssistantFloatingButton />

            {/* Mobile Bottom Navigation */}
            <BottomNav />
          </div>
        </div>
      </AssistantProvider>
    </SidebarProvider>
  )
}
