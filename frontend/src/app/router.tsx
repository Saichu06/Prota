import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from './guards/ProtectedRoute'
import { PublicOnlyRoute } from './guards/PublicOnlyRoute'
import { HomePage } from '../features/home/HomePage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { BlogsPage } from '../features/blogs/pages/BlogsPage'
import { BlogDetailPage } from '../features/blogs/pages/BlogDetailPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { CalendarPage } from '../features/calendar/pages/CalendarPage'
import { FoodLogPage } from '../features/log/pages/FoodLogPage'
import { HistoryPage } from '../features/history/pages/HistoryPage'
import { AnalyticsPage } from '../features/analytics/pages/AnalyticsPage'
import { ReportsPage } from '../features/reports/pages/ReportsPage'
import { AssistantPage } from '../features/assistant/pages/AssistantPage'
import { DietPlanPage } from '../features/dietplan/pages/DietPlanPage'
import { WorkoutPlanPage } from '../features/workoutplan/pages/WorkoutPlanPage'
import { ImproveProgressPage } from '../features/improveprogress/pages/ImproveProgressPage'

export const router = createBrowserRouter([
  // Public landing page
  {
    path: '/',
    element: <HomePage />,
  },

  // Public editorial blogs routes
  {
    path: '/blogs',
    element: <BlogsPage />,
  },
  {
    path: '/blogs/:slug',
    element: <BlogDetailPage />,
  },

  // Public auth routes
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },

  // Protected application routes
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'log',
        element: <FoodLogPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'assistant',
        element: <AssistantPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'addons/diet-plan',
        element: <DietPlanPage />,
      },
      {
        path: 'addons/workout-plan',
        element: <WorkoutPlanPage />,
      },
      {
        path: 'addons/improve-progress',
        element: <ImproveProgressPage />,
      },
    ],
  },

  // Fallback catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
